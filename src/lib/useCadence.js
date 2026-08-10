import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import * as store from './storage'
import { pullCloudData, pushCloudData, flushCloudData, mergeSnapshots } from './cloudSync'
import {
  deriveStatus,
  isDueOrOverdue,
  markRevised,
  snoozeChapter,
  markStruggled,
  masterEarly,
  nextReviewDateForIndex,
  toISODate,
  MAX_REVIEW_INDEX,
} from './srs'
import { MIN_BLOCK_MINUTES, DEFAULT_BLOCK_MINUTES } from './timeGrid'

export function useCadence(userId) {
  // The cache is scoped to the user before the first read, so a second
  // account signing in on this browser never sees the first account's data.
  const scopeReady = useRef(false)
  if (!scopeReady.current) {
    store.setStorageScope(userId)
    scopeReady.current = true
  }

  const [subjects, setSubjects] = useState(() => store.getSubjects())
  const [chapters, setChapters] = useState(() => store.migrateSchedule(store.getChapters()))
  const [events, setEvents] = useState(() => store.getEvents())
  const [blocks, setBlocks] = useState(() => store.getStudyBlocks())
  const [prefs, setPrefs] = useState(() => store.getPrefs())
  const [streak, setStreak] = useState(() => store.getStreakData())
  const [justMastered, setJustMastered] = useState(null) // chapter id, for celebration
  // 'idle' before sign-in, 'syncing' while a pull is in flight, 'synced' once
  // the server copy has landed, 'offline' if it couldn't be reached.
  const [syncState, setSyncState] = useState('idle')

  useEffect(() => { store.saveSubjects(subjects) }, [subjects])
  useEffect(() => { store.saveChapters(chapters) }, [chapters])
  useEffect(() => { store.saveEvents(events) }, [events])
  useEffect(() => { store.saveStudyBlocks(blocks) }, [blocks])
  useEffect(() => { store.savePrefs(prefs) }, [prefs])
  useEffect(() => { store.saveStreakData(streak) }, [streak])

  // ---- cloud sync (multi-device) ----
  // The server is the source of truth. This pulls on sign-in, on tab focus,
  // and on reconnect — not once per empty browser, which is what let a Mac
  // and a phone drift apart indefinitely. What's in the cache only survives
  // a pull if the server doesn't have a newer copy of that same record.
  const applySnapshot = useCallback((snap) => {
    if (!snap) return
    setSubjects(snap.subjects || [])
    setChapters(store.migrateSchedule(snap.chapters || []))
    setEvents(snap.events || [])
    setBlocks(store.normalizeBlocks(snap.blocks ?? snap.plans ?? []))
    if (snap.prefs) setPrefs((p) => ({ ...p, ...snap.prefs }))
    if (snap.streak) setStreak(snap.streak)
  }, [])

  const syncedUser = useRef(null)
  const syncNow = useCallback(
    async (userIdArg, { merge = false } = {}) => {
      if (!userIdArg) return
      setSyncState('syncing')
      const remote = await pullCloudData(userIdArg)
      if (!remote) {
        // No server copy yet (first sign-in) or unreachable. Seed the server
        // from whatever this device holds so the next device has something
        // to pull, rather than leaving the account empty.
        const local = store.readSnapshot()
        const hasLocal = local.subjects.length > 0 || local.chapters.length > 0
        if (hasLocal) pushCloudData(userIdArg, local, { immediate: true })
        setSyncState(hasLocal ? 'synced' : 'offline')
        return
      }
      // `merge` is the first pull after sign-in, where this device may hold
      // work that never reached the server. Later pulls take the server as
      // given, so a delete on another device isn't resurrected from cache.
      applySnapshot(merge ? mergeSnapshots(store.readSnapshot(), remote) : remote)
      setSyncState('synced')
    },
    [applySnapshot]
  )

  useEffect(() => {
    if (!userId) {
      setSyncState('idle')
      return
    }
    if (syncedUser.current === userId) return
    const isFirstSyncForUser = syncedUser.current !== userId
    syncedUser.current = userId

    // Re-scope the cache, then adopt any pre-namespacing data so an existing
    // user's chapters aren't stranded in the old global keys.
    const scopeChanged = store.setStorageScope(userId)
    const legacy = store.claimLegacyData()
    if (legacy) store.writeSnapshot(mergeSnapshots(legacy, store.readSnapshot()))
    if (scopeChanged) {
      setSubjects(store.getSubjects())
      setChapters(store.migrateSchedule(store.getChapters()))
      setEvents(store.getEvents())
      setBlocks(store.getStudyBlocks())
      setPrefs(store.getPrefs())
      setStreak(store.getStreakData())
    }
    syncNow(userId, { merge: isFirstSyncForUser })
  }, [userId, syncNow])

  // Re-pull whenever the user comes back to the tab or the network returns.
  // This is what makes a review ticked off on a phone show up on a laptop
  // that was left open, without a refresh.
  useEffect(() => {
    if (!userId) return
    function onFocus() {
      if (document.visibilityState === 'visible') syncNow(userId)
    }
    // A pending write must not die with the tab.
    function onHide() {
      if (document.visibilityState === 'hidden') flushCloudData()
    }
    document.addEventListener('visibilitychange', onFocus)
    document.addEventListener('visibilitychange', onHide)
    window.addEventListener('online', onFocus)
    window.addEventListener('pagehide', flushCloudData)
    return () => {
      document.removeEventListener('visibilitychange', onFocus)
      document.removeEventListener('visibilitychange', onHide)
      window.removeEventListener('online', onFocus)
      window.removeEventListener('pagehide', flushCloudData)
    }
  }, [userId, syncNow])

  // Every local change goes up. Skipped until the first pull has landed, so
  // an empty initial render can't overwrite the server copy with nothing.
  useEffect(() => {
    if (!userId || syncState === 'syncing' || syncState === 'idle') return
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
    pushCloudData(userId, { subjects, chapters, events, blocks, streak, prefs, timezone })
  }, [userId, subjects, chapters, events, blocks, streak, prefs, syncState])

  const refreshAll = useCallback(() => {
    setSubjects(store.getSubjects())
    setChapters(store.getChapters())
    setEvents(store.getEvents())
    setBlocks(store.getStudyBlocks())
    setPrefs(store.getPrefs())
    setStreak(store.getStreakData())
  }, [])

  // ---- derived ----
  const chaptersWithStatus = useMemo(
    () => chapters.map((c) => ({ ...c, derivedStatus: deriveStatus(c) })),
    [chapters]
  )

  const dueAndOverdue = useMemo(
    () =>
      chaptersWithStatus
        .filter((c) => c.derivedStatus === 'overdue' || c.derivedStatus === 'due')
        .sort((a, b) => (a.nextReviewDate < b.nextReviewDate ? -1 : 1)),
    [chaptersWithStatus]
  )

  const overdue = useMemo(() => dueAndOverdue.filter((c) => c.derivedStatus === 'overdue'), [dueAndOverdue])
  const dueToday = useMemo(() => dueAndOverdue.filter((c) => c.derivedStatus === 'due'), [dueAndOverdue])
  const struggling = useMemo(() => chaptersWithStatus.filter((c) => c.struggleFlag && c.status !== 'mastered'), [chaptersWithStatus])

  const subjectMap = useMemo(() => {
    const m = new Map()
    subjects.forEach((s) => m.set(s.id, s))
    return m
  }, [subjects])

  // ---- streak maintenance ----
  const bumpStreakIfDone = useCallback(() => {
    const today = toISODate(new Date())
    const stillDue = store.getChapters().some((c) => isDueOrOverdue(c))
    setStreak((prev) => {
      if (stillDue) return prev
      if (prev.lastCompletedDay === today) return prev
      const yesterday = toISODate(new Date(Date.now() - 86400000))
      const count = prev.lastCompletedDay === yesterday ? prev.count + 1 : 1
      return { count, lastCompletedDay: today }
    })
  }, [])

  // ---- subject actions ----
  const createSubject = useCallback((payload) => {
    const s = store.addSubject(payload)
    setSubjects(store.getSubjects())
    return s
  }, [])

  const removeSubject = useCallback((id) => {
    store.deleteSubject(id)
    refreshAll()
  }, [refreshAll])

  // ---- chapter actions ----
  const createChapter = useCallback(({ subjectId, title, notes, studiedDate }) => {
    const sd = studiedDate || toISODate(new Date())
    const chapter = {
      id: store.uid(),
      subjectId,
      title,
      notes: notes || '',
      studiedDate: sd,
      currentReviewIndex: 0,
      nextReviewDate: nextReviewDateForIndex(sd, 0),
      status: 'active',
      struggleFlag: false,
      snoozeStreak: 0,
      createdAt: new Date().toISOString(),
    }
    store.upsertChapter(chapter)
    setChapters(store.getChapters())
    return chapter
  }, [])

  const updateChapter = useCallback((chapter) => {
    store.upsertChapter(chapter)
    setChapters(store.getChapters())
  }, [])

  // Title only — the subject a chapter was filed under is deliberately not
  // editable here. Blocks store chapter ids, not titles, so every block
  // labelled by this chapter re-reads the new name on the next render.
  const renameChapter = useCallback((id, title) => {
    const trimmed = String(title || '').trim()
    if (!trimmed) return
    const chapter = store.getChapter(id)
    if (!chapter || chapter.title === trimmed) return
    store.upsertChapter({ ...chapter, title: trimmed })
    setChapters(store.getChapters())
  }, [])

  const removeChapter = useCallback((id) => {
    store.deleteChapter(id)
    refreshAll()
  }, [refreshAll])

  const reviseChapter = useCallback((chapter) => {
    // Guard: a review can only be completed once it's actually due or overdue.
    // This is enforced here (not just hidden in the UI) so a chapter can never
    // skip ahead of its own schedule — e.g. completing the day-7 review while
    // the day-3 review hasn't happened yet.
    if (!isDueOrOverdue(chapter)) return { blocked: true }
    const wasLast = chapter.currentReviewIndex === MAX_REVIEW_INDEX - 1
    const updated = markRevised(chapter)
    store.upsertChapter(updated)
    store.logEvent({ chapterId: chapter.id, scheduledDate: chapter.nextReviewDate, action: 'completed' })
    setChapters(store.getChapters())
    setEvents(store.getEvents())
    bumpStreakIfDone()
    if (wasLast) setJustMastered(chapter.id)
    return { blocked: false, chapter: updated }
  }, [bumpStreakIfDone])

  const snoozeChapterAction = useCallback((chapter) => {
    if (!isDueOrOverdue(chapter)) return { blocked: true, reason: 'not-due' }
    const { chapter: updated, blocked } = snoozeChapter(chapter)
    if (blocked) return { blocked: true, reason: 'snooze-cap' }
    store.upsertChapter(updated)
    store.logEvent({ chapterId: chapter.id, scheduledDate: chapter.nextReviewDate, action: 'snoozed' })
    setChapters(store.getChapters())
    setEvents(store.getEvents())
    return { blocked: false }
  }, [])

  const struggleChapterAction = useCallback((chapter) => {
    if (!isDueOrOverdue(chapter)) return { blocked: true }
    const updated = markStruggled(chapter)
    store.upsertChapter(updated)
    store.logEvent({ chapterId: chapter.id, scheduledDate: chapter.nextReviewDate, action: 'struggled' })
    setChapters(store.getChapters())
    setEvents(store.getEvents())
    return { blocked: false }
  }, [])

  const masterEarlyAction = useCallback((chapter) => {
    if (!isDueOrOverdue(chapter)) return { blocked: true }
    const updated = masterEarly(chapter)
    store.upsertChapter(updated)
    store.logEvent({ chapterId: chapter.id, scheduledDate: chapter.nextReviewDate, action: 'skipped_ahead' })
    setChapters(store.getChapters())
    setEvents(store.getEvents())
    bumpStreakIfDone()
    setJustMastered(chapter.id)
    return { blocked: false }
  }, [bumpStreakIfDone])

  const clearJustMastered = useCallback(() => setJustMastered(null), [])

  // ---- study block actions ----
  // Takes the rows the plan sheet previewed — one per sitting, each already
  // carrying the chapters assigned to that day. The sheet owns the split
  // (and lets the user edit it), so this only persists what was shown.
  // Rows created in one go share a seriesId, which is what makes
  // "edit/delete the whole series" possible afterwards.
  const createStudyBlocks = useCallback(({ rows, startMinute = null, endMinute = null }) => {
    const usable = (rows || []).filter((r) => r?.date && r.chapterIds?.length > 0)
    if (usable.length === 0) return []
    const seriesId = usable.length > 1 ? store.uid() : null
    const createdAt = new Date().toISOString()
    const timed = Number.isFinite(startMinute) && Number.isFinite(endMinute)
    const created = usable.map((row) => ({
      id: store.uid(),
      chapterIds: [...row.chapterIds],
      date: row.date,
      startMinute: timed ? startMinute : null,
      endMinute: timed ? endMinute : null,
      done: false,
      seriesId,
      // New blocks inherit their chapter's title and their subject's
      // colour; both can be overridden per block from the edit sheet.
      title: null,
      color: null,
      createdAt,
    }))
    setBlocks((prev) => [...prev, ...created])
    return created
  }, [])

  // `scope: 'series'` applies the time-of-day, chapters, label and colour to
  // every block sharing the seriesId, but never the date — the whole point
  // of a series is that its blocks sit on different days.
  const updateStudyBlock = useCallback(({ id, chapterIds, date, startMinute, endMinute, title, color, scope = 'single' }) => {
    setBlocks((prev) => {
      const target = prev.find((b) => b.id === id)
      if (!target) return prev
      const timed = Number.isFinite(startMinute) && Number.isFinite(endMinute)
      const trimmed = typeof title === 'string' && title.trim() ? title.trim() : null
      // An empty selection is ignored rather than applied — a block with no
      // chapters has nothing to render, so it would silently disappear.
      const nextIds = chapterIds?.length > 0 ? chapterIds : null
      const inScope = (b) =>
        b.id === id || (scope === 'series' && target.seriesId && b.seriesId === target.seriesId)
      return prev.map((b) => {
        if (!inScope(b)) return b
        return {
          ...b,
          chapterIds: nextIds ? [...nextIds] : b.chapterIds,
          date: b.id === id && date ? date : b.date,
          startMinute: timed ? startMinute : null,
          endMinute: timed ? endMinute : null,
          // Both are cleared by passing an empty value, so "reset to the
          // chapter's own title / subject colour" is reachable.
          title: title === undefined ? b.title : trimmed,
          color: color === undefined ? b.color : color || null,
        }
      })
    })
  }, [])

  // Move keeps the duration and only re-anchors the start, so dragging a
  // 90-minute block never silently changes its length. Passing
  // startMinute: null drops it into the all-day strip.
  const moveStudyBlock = useCallback((id, { date, startMinute }) => {
    setBlocks((prev) =>
      prev.map((b) => {
        if (b.id !== id) return b
        const nextDate = date || b.date
        if (startMinute === null) return { ...b, date: nextDate, startMinute: null, endMinute: null }
        if (!Number.isFinite(startMinute)) return { ...b, date: nextDate }
        const duration =
          Number.isFinite(b.startMinute) && Number.isFinite(b.endMinute)
            ? b.endMinute - b.startMinute
            : DEFAULT_BLOCK_MINUTES
        return { ...b, date: nextDate, startMinute, endMinute: startMinute + duration }
      })
    )
  }, [])

  const resizeStudyBlock = useCallback((id, endMinute) => {
    setBlocks((prev) =>
      prev.map((b) => {
        if (b.id !== id || !Number.isFinite(b.startMinute)) return b
        return { ...b, endMinute: Math.max(b.startMinute + MIN_BLOCK_MINUTES, endMinute) }
      })
    )
  }, [])

  const removeStudyBlock = useCallback((id) => {
    setBlocks((prev) => prev.filter((b) => b.id !== id))
  }, [])

  const removeStudySeries = useCallback((id) => {
    setBlocks((prev) => {
      const target = prev.find((b) => b.id === id)
      if (!target) return prev
      if (!target.seriesId) return prev.filter((b) => b.id !== id)
      return prev.filter((b) => b.seriesId !== target.seriesId)
    })
  }, [])

  const toggleStudyBlockDone = useCallback((id) => {
    setBlocks((prev) => prev.map((b) => (b.id === id ? { ...b, done: !b.done } : b)))
  }, [])

  // ---- prefs ----
  const updatePrefs = useCallback((p) => setPrefs((prev) => ({ ...prev, ...p })), [])

  return {
    subjects,
    chapters: chaptersWithStatus,
    events,
    blocks,
    prefs,
    streak,
    syncState,
    syncNow: useCallback(() => syncNow(userId), [syncNow, userId]),
    overdue,
    dueToday,
    struggling,
    subjectMap,
    justMastered,
    clearJustMastered,
    refreshAll,
    createSubject,
    removeSubject,
    createChapter,
    updateChapter,
    renameChapter,
    removeChapter,
    reviseChapter,
    snoozeChapterAction,
    struggleChapterAction,
    masterEarlyAction,
    createStudyBlocks,
    updateStudyBlock,
    moveStudyBlock,
    resizeStudyBlock,
    removeStudyBlock,
    removeStudySeries,
    toggleStudyBlockDone,
    updatePrefs,
  }
}
