import { supabase, isSupabaseConfigured } from './supabaseClient'

// Multi-device sync. The server is the source of truth; the local cache is
// only there to paint the first frame and to keep the app usable offline.
//
// This used to be the other way round — localStorage was authoritative and
// the cloud copy was pulled exactly once, on a device whose storage was
// completely empty. Two devices that had each been used once therefore never
// read each other's writes again: they just took turns overwriting the same
// row, and each kept showing its own chapters and its own due dates. Pulling
// on every load is what actually fixes that, so it's the rule here.
//
// Still one JSON blob per user in `cadence_data` (RLS-scoped to auth.uid())
// rather than a normalized schema — the data is small, one person's, and
// always read all at once.

/** Reads this user's server copy and keeps missing rows distinct from errors. */
export async function pullCloudData(userId) {
  if (!isSupabaseConfigured || !userId) return { ok: false, reason: 'not-configured' }
  const { data, error } = await supabase
    .from('cadence_data')
    .select('data, updated_at')
    .eq('user_id', userId)
    .maybeSingle()
  if (error) return { ok: false, error }
  return {
    ok: true,
    found: Boolean(data),
    snapshot: data?.data ? { ...data.data, updatedAt: data.updated_at } : null,
    updatedAt: data?.updated_at || null,
  }
}

const syncListeners = new Map()
const syncStatuses = new Map()

export function setCloudSyncStatus(userId, status) {
  if (!userId) return
  syncStatuses.set(userId, status)
  syncListeners.get(userId)?.forEach((listener) => listener(status))
}

export function subscribeCloudSyncStatus(userId, listener) {
  if (!userId || !listener) return () => {}
  const listeners = syncListeners.get(userId) || new Set()
  listeners.add(listener)
  syncListeners.set(userId, listeners)
  listener(syncStatuses.get(userId) || 'idle')
  return () => {
    listeners.delete(listener)
    if (listeners.size === 0) syncListeners.delete(userId)
  }
}

/** Listen for this account's row updates so signed-in devices stay in step. */
export function subscribeCloudData(userId, onSnapshot, onStatus) {
  if (!isSupabaseConfigured || !userId) return () => {}
  const channel = supabase
    .channel('cadence-data-' + userId)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'cadence_data',
        filter: 'user_id=eq.' + userId,
      },
      (payload) => {
        const row = payload.new
        if (row?.data) onSnapshot({ ...row.data, updatedAt: row.updated_at })
      }
    )
    .subscribe(onStatus)
  return () => {
    supabase.removeChannel(channel)
  }
}

/**
 * Merge two snapshots without losing anything either side has.
 *
 * Records are matched by id and the newer copy of a matched pair wins;
 * anything present on only one side is kept. This is a union, not
 * last-write-wins over the whole blob — a device that had been offline for a
 * week must not delete work done elsewhere just because it uploaded last.
 *
 * `pickNewer` decides a matched pair. Chapters carry `lastActionDate`, blocks
 * and events carry `createdAt`/`completedDate`; where there's nothing to
 * compare, the server copy stands, since it's the shared one.
 */
function mergeById(localList, remoteList, pickNewer) {
  const byId = new Map()
  ;(remoteList || []).forEach((r) => r?.id && byId.set(r.id, r))
  ;(localList || []).forEach((l) => {
    if (!l?.id) return
    const remote = byId.get(l.id)
    byId.set(l.id, remote ? pickNewer(l, remote) : l)
  })
  return [...byId.values()]
}

const stamp = (v) => (v ? Date.parse(v) || 0 : 0)

// A chapter's freshness is when it was last acted on, falling back to when it
// was created. Ties go to whichever has completed more reviews, so a review
// ticked off on a phone is never undone by a stale desktop copy saved the
// same day.
function newerChapter(a, b) {
  const ta = Math.max(stamp(a.lastActionDate), stamp(a.createdAt))
  const tb = Math.max(stamp(b.lastActionDate), stamp(b.createdAt))
  if (ta !== tb) return ta > tb ? a : b
  return (a.currentReviewIndex ?? 0) >= (b.currentReviewIndex ?? 0) ? a : b
}

const newerByCreatedAt = (a, b) => (stamp(a.createdAt) >= stamp(b.createdAt) ? a : b)

/**
 * Fold a local snapshot into the server's. Used on first load after the
 * sync fix, when a Mac and a phone hold genuinely different sets, and on
 * every subsequent pull so an offline edit survives the next sync.
 */
export function mergeSnapshots(local, remote) {
  const left = local || {}
  const right = remote || {}
  const tombstones = Object.fromEntries(
    ['subjects', 'chapters', 'events', 'blocks'].map((collection) => [
      collection,
      [...new Set([...(left.tombstones?.[collection] || []), ...(right.tombstones?.[collection] || [])])],
    ])
  )
  const filterDeleted = (collection, records) =>
    records.filter((record) => !tombstones[collection].includes(record.id))

  return {
    subjects: filterDeleted('subjects', mergeById(left.subjects, right.subjects, newerByCreatedAt)),
    chapters: filterDeleted('chapters', mergeById(left.chapters, right.chapters, newerChapter)),
    // Events are an append-only log, so a union by id is exactly right.
    events: filterDeleted('events', mergeById(left.events, right.events, (a) => a)),
    blocks: filterDeleted('blocks', mergeById(left.blocks, right.blocks, newerByCreatedAt)),
    pomodoroLog: mergePomodoroLogs(left.pomodoroLog, right.pomodoroLog),
    // Completed focus sessions are immutable events; unioning by id keeps
    // sessions logged independently on two offline devices.
    focusSessions: mergeById(left.focusSessions, right.focusSessions, (a) => a),
    tombstones,
    // Settings and streak aren't collections — take the server's, since
    // that's the copy every device agrees on.
    prefs: { ...left.prefs, ...right.prefs },
    streak: (() => {
      const preferred = (left.streak?.count ?? 0) > (right.streak?.count ?? 0)
        ? left.streak
        : right.streak || left.streak || { count: 0, lastCompletedDay: null }
      const completedDays = [...new Set([...(left.streak?.completedDays || []), ...(right.streak?.completedDays || [])])]
        .sort()
        .slice(-365)
      return { ...preferred, completedDays }
    })(),
  }
}

function mergePomodoroLogs(local = {}, remote = {}) {
  const merged = { ...remote }
  Object.entries(local || {}).forEach(([date, entry]) => {
    const other = merged[date]
    if (!other) {
      merged[date] = entry
      return
    }
    merged[date] = {
      sessions: Math.max(entry.sessions || 0, other.sessions || 0),
      minutes: Math.max(entry.minutes || 0, other.minutes || 0),
    }
  })
  return merged
}

// One queue per signed-in user. Writes coalesce, serialize, and retry in the
// background so an offline edit stays queued until the connection returns.
const queues = new Map()

function getQueue(userId) {
  let queue = queues.get(userId)
  if (!queue) {
    queue = { pending: null, timer: null, retryTimer: null, retryCount: 0, flushing: null }
    queues.set(userId, queue)
  }
  return queue
}

function scheduleRetry(userId, queue) {
  if (queue.retryTimer) return
  const delay = Math.min(30000, 1000 * 2 ** queue.retryCount)
  queue.retryCount = Math.min(queue.retryCount + 1, 5)
  queue.retryTimer = setTimeout(() => {
    queue.retryTimer = null
    flushUserQueue(userId)
  }, delay)
}

export function pushCloudData(userId, payload, { immediate = false, delayMs = 350 } = {}) {
  if (!isSupabaseConfigured || !userId) {
    if (userId) setCloudSyncStatus(userId, 'offline')
    return Promise.resolve({ ok: false, reason: 'not-configured' })
  }
  const queue = getQueue(userId)
  queue.pending = payload
  clearTimeout(queue.timer)
  setCloudSyncStatus(userId, 'syncing')
  if (immediate) return flushUserQueue(userId)
  queue.timer = setTimeout(() => flushUserQueue(userId), delayMs)
  return Promise.resolve({ ok: true, queued: true })
}

async function flushUserQueue(userId) {
  const queue = queues.get(userId)
  if (!queue) return { ok: true }
  clearTimeout(queue.timer)
  queue.timer = null

  if (queue.flushing) {
    await queue.flushing
    return queue.pending ? flushUserQueue(userId) : { ok: true }
  }
  if (!queue.pending) return { ok: true }

  const payload = queue.pending
  queue.pending = null
  queue.flushing = (async () => {
    try {
      const { error } = await supabase
        .from('cadence_data')
        .upsert({ user_id: userId, data: payload, updated_at: new Date().toISOString() })
      return error ? { ok: false, error } : { ok: true }
    } catch (error) {
      return { ok: false, error }
    }
  })()

  const result = await queue.flushing
  queue.flushing = null
  if (!result.ok) {
    // Keep the newest snapshot if another edit arrived while this write ran.
    if (!queue.pending) queue.pending = payload
    setCloudSyncStatus(userId, 'offline')
    scheduleRetry(userId, queue)
    console.warn('Cloud sync failed; will retry automatically.')
    return result
  }

  queue.retryCount = 0
  clearTimeout(queue.retryTimer)
  queue.retryTimer = null
  if (queue.pending) return flushUserQueue(userId)
  setCloudSyncStatus(userId, 'synced')
  return { ok: true }
}

export async function flushCloudData(userId) {
  // pagehide passes an Event object as the first argument; treat non-string
  // values as a request to flush every account queue.
  if (typeof userId !== 'string') {
    return Promise.all([...queues.keys()].map((id) => flushUserQueue(id)))
  }
  return flushUserQueue(userId)
}

export function hasPendingPush(userId) {
  const pendingFor = (queue) => Boolean(queue?.pending || queue?.flushing)
  if (userId) return pendingFor(queues.get(userId))
  return [...queues.values()].some(pendingFor)
}
