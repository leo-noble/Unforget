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

/** Reads this user's server copy. Returns null if absent or unreachable. */
export async function pullCloudData(userId) {
  if (!isSupabaseConfigured || !userId) return null
  const { data, error } = await supabase
    .from('cadence_data')
    .select('data, updated_at')
    .eq('user_id', userId)
    .maybeSingle()
  if (error || !data) return null
  return data.data ? { ...data.data, updatedAt: data.updated_at } : null
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
  if (!remote) return local
  if (!local) return remote
  return {
    subjects: mergeById(local.subjects, remote.subjects, newerByCreatedAt),
    chapters: mergeById(local.chapters, remote.chapters, newerChapter),
    // Events are an append-only log, so a union by id is exactly right.
    events: mergeById(local.events, remote.events, (a) => a),
    blocks: mergeById(local.blocks, remote.blocks, newerByCreatedAt),
    // Settings and streak aren't collections — take the server's, since
    // that's the copy every device agrees on.
    prefs: { ...local.prefs, ...remote.prefs },
    streak:
      (local.streak?.count ?? 0) > (remote.streak?.count ?? 0) ? local.streak : remote.streak,
  }
}

// Pushes coalesce: rapid edits (dragging a block, stepping a duration) would
// otherwise fire a request per keystroke. The pending payload is always the
// latest one, and a flush can be forced when the tab is about to go away.
let pushTimer = null
let pending = null

export function pushCloudData(userId, payload, { immediate = false, delayMs = 900 } = {}) {
  if (!isSupabaseConfigured || !userId) return
  pending = { userId, payload }
  clearTimeout(pushTimer)
  if (immediate) return flushCloudData()
  pushTimer = setTimeout(flushCloudData, delayMs)
}

export async function flushCloudData() {
  if (!pending) return
  const { userId, payload } = pending
  pending = null
  clearTimeout(pushTimer)
  const { error } = await supabase
    .from('cadence_data')
    .upsert({ user_id: userId, data: payload, updated_at: new Date().toISOString() })
  if (error) {
    // Keep the payload so the next push (or the next flush) retries it
    // rather than silently dropping the user's work.
    pending = { userId, payload }
    console.warn('Cadence cloud sync failed:', error.message)
    return { ok: false, error }
  }
  return { ok: true }
}

export const hasPendingPush = () => pending !== null
