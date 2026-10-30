import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  GUTTER_WIDTH,
  MIN_BLOCK_MINUTES,
  DEFAULT_BLOCK_MINUTES,
  gridHeight,
  hourMarks,
  minutesToLabel,
  minutesToY,
  yToMinutes,
  snapMinutes,
  clampMinute,
  blockChapters,
  layoutOverlaps,
} from '../../lib/timeGrid'
import { toISODate } from '../../lib/srs'
import StudyBlock from './StudyBlock'

// Touch needs a different grammar from a mouse. With a mouse, pressing on the
// grid can start a drag straight away. With a finger, pressing on the grid is
// how you scroll it — so on touch a block moves (and empty space creates) only
// after a press-and-hold, the way iOS Calendar does it, and a plain tap on a
// block opens it.
const LONG_PRESS_MS = 380
const TOUCH_SLOP = 9

function useNowMinute() {
  const get = () => {
    const d = new Date()
    return { iso: toISODate(d), minute: d.getHours() * 60 + d.getMinutes() }
  }
  const [now, setNow] = useState(get)
  useEffect(() => {
    const id = setInterval(() => setNow(get()), 60000)
    return () => clearInterval(id)
  }, [])
  return now
}

// The hour canvas — gutter down the left, one column per visible day, and
// every drag gesture the calendar supports. It owns the drag state machine
// because only it knows the grid's geometry; the page hears about committed
// results. Nothing is written until the pointer comes up.
export default function TimeGrid({
  dates,
  blocksByDate,
  chapterMap,
  subjectMap,
  window: win,
  onMoveBlock,
  onResizeBlock,
  onCreateAt,
  onToggleDone,
  onOpenBlock,
  scrollParentRef,
}) {
  const scrollRef = scrollParentRef
  const columnsRef = useRef(null)
  const didScrollRef = useRef(false)
  const [drag, setDrag] = useState(null)
  const dragRef = useRef(null)
  const pendingRef = useRef(null)
  const [hover, setHover] = useState(null)
  const now = useNowMinute()

  const marks = useMemo(() => hourMarks(win), [win])
  const height = gridHeight(win)

  const commitDrag = useCallback((next) => {
    dragRef.current = next
    setDrag(next)
  }, [])

  // Open on the morning rather than at whatever hour the window begins.
  useEffect(() => {
    const el = scrollRef?.current
    if (didScrollRef.current || !el) return
    didScrollRef.current = true
    const target = dates.includes(now.iso) ? Math.max(now.minute - 90, 8 * 60) : 8 * 60
    el.scrollTop = Math.max(0, minutesToY(Math.min(target, win.endMinute - 60), win))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // While a touch drag is live, stop the browser from scrolling underneath it.
  // touchmove has to be non-passive for preventDefault to count, which React's
  // synthetic handlers can't express — hence the manual listener.
  useEffect(() => {
    const el = columnsRef.current
    if (!el) return
    const onTouchMove = (e) => {
      if (dragRef.current) e.preventDefault()
    }
    el.addEventListener('touchmove', onTouchMove, { passive: false })
    return () => el.removeEventListener('touchmove', onTouchMove)
  }, [])

  useEffect(() => () => clearTimeout(pendingRef.current?.timer), [])

  /** Pointer position → the (date, minute) it's over, clamped to the grid. */
  const pointToSlot = useCallback(
    (pt) => {
      const el = columnsRef.current
      if (!el) return null
      const rect = el.getBoundingClientRect()
      const colWidth = rect.width / dates.length
      const col = Math.max(0, Math.min(dates.length - 1, Math.floor((pt.clientX - rect.left) / colWidth)))
      const minute = clampMinute(snapMinutes(yToMinutes(pt.clientY - rect.top, win)), win)
      return { date: dates[col], minute }
    },
    [dates, win]
  )

  // Capturing on the columns wrapper means every later move/up for this
  // pointer arrives here even when it leaves the block or the window.
  const capture = useCallback((pointerId) => {
    try {
      columnsRef.current?.setPointerCapture?.(pointerId)
    } catch {
      // the pointer may already be gone (lifted mid-timer); harmless
    }
  }, [])

  const beginMove = useCallback(
    (pt, pointerId, block) => {
      const slot = pointToSlot(pt)
      commitDrag({
        mode: 'move',
        blockId: block.id,
        block,
        pointerId,
        grabOffset: slot ? slot.minute - block.startMinute : 0,
        duration: block.endMinute - block.startMinute,
        moved: false,
        preview: { date: block.date, startMinute: block.startMinute, endMinute: block.endMinute },
      })
    },
    [pointToSlot, commitDrag]
  )

  const beginCreate = useCallback(
    (pt, pointerId, date) => {
      const slot = pointToSlot(pt)
      if (!slot) return
      commitDrag({
        mode: 'create',
        pointerId,
        anchor: slot.minute,
        moved: false,
        preview: { date, startMinute: slot.minute, endMinute: slot.minute },
      })
    },
    [pointToSlot, commitDrag]
  )

  const cancelPending = useCallback(() => {
    clearTimeout(pendingRef.current?.timer)
    pendingRef.current = null
  }, [])

  // A touch press that becomes a drag only if the finger stays put.
  const startPending = useCallback(
    (kind, e, payload) => {
      cancelPending()
      const p = { kind, pointerId: e.pointerId, x: e.clientX, y: e.clientY, lastX: e.clientX, lastY: e.clientY, ...payload }
      p.timer = setTimeout(() => {
        if (pendingRef.current !== p) return
        pendingRef.current = null
        if (navigator.vibrate) navigator.vibrate(10)
        capture(p.pointerId)
        const pt = { clientX: p.lastX, clientY: p.lastY }
        if (kind === 'block') beginMove(pt, p.pointerId, p.block)
        else beginCreate(pt, p.pointerId, p.date)
      }, LONG_PRESS_MS)
      pendingRef.current = p
    },
    [beginMove, beginCreate, capture, cancelPending]
  )

  const handleDownMove = useCallback(
    (e, block) => {
      if (e.button != null && e.button !== 0) return
      e.stopPropagation()
      setHover(null)
      if (e.pointerType === 'touch') {
        startPending('block', e, { block })
        return
      }
      e.preventDefault()
      capture(e.pointerId)
      beginMove(e, e.pointerId, block)
    },
    [capture, beginMove, startPending]
  )

  // The resize handle has touch-action: none, so it drags at once on any input.
  const handleDownResize = useCallback(
    (e, block) => {
      if (e.button != null && e.button !== 0) return
      e.preventDefault()
      e.stopPropagation()
      cancelPending()
      capture(e.pointerId)
      setHover(null)
      commitDrag({
        mode: 'resize',
        blockId: block.id,
        block,
        pointerId: e.pointerId,
        moved: false,
        preview: { date: block.date, startMinute: block.startMinute, endMinute: block.endMinute },
      })
    },
    [capture, cancelPending, commitDrag]
  )

  const handleDownCanvas = useCallback(
    (e, date) => {
      if (e.button != null && e.button !== 0) return
      setHover(null)
      if (e.pointerType === 'touch') {
        startPending('canvas', e, { date })
        return
      }
      e.preventDefault()
      capture(e.pointerId)
      beginCreate(e, e.pointerId, date)
    },
    [capture, beginCreate, startPending]
  )

  const handlePointerMove = useCallback(
    (e) => {
      const p = pendingRef.current
      if (p && e.pointerId === p.pointerId) {
        // Moved before the hold completed: that's a scroll, not a drag.
        if (Math.hypot(e.clientX - p.x, e.clientY - p.y) > TOUCH_SLOP) cancelPending()
        else {
          p.lastX = e.clientX
          p.lastY = e.clientY
        }
        return
      }

      if (!drag) {
        // Only a mouse gets the "click here to add" ghost.
        if (e.pointerType !== 'mouse' || e.target?.dataset?.canvas !== 'true') {
          setHover((prev) => (prev ? null : prev))
          return
        }
        const slot = pointToSlot(e)
        setHover((prev) => (prev && prev.date === slot?.date && prev.minute === slot?.minute ? prev : slot))
        return
      }
      if (e.pointerId !== drag.pointerId) return
      const slot = pointToSlot(e)
      if (!slot) return

      const update = (prev) => {
        if (!prev) return prev
        if (prev.mode === 'move') {
          // Keep the whole block inside the window, and keep its length.
          const start = Math.min(Math.max(win.startMinute, slot.minute - prev.grabOffset), win.endMinute - prev.duration)
          const next = { date: slot.date, startMinute: start, endMinute: start + prev.duration }
          const moved = prev.moved || next.date !== prev.preview.date || next.startMinute !== prev.preview.startMinute
          return { ...prev, moved, preview: next }
        }
        if (prev.mode === 'resize') {
          const end = Math.max(prev.preview.startMinute + MIN_BLOCK_MINUTES, slot.minute)
          return {
            ...prev,
            moved: prev.moved || end !== prev.preview.endMinute,
            preview: { ...prev.preview, endMinute: Math.min(end, win.endMinute) },
          }
        }
        // create — the anchor stays put and the other edge follows the pointer
        const start = Math.min(prev.anchor, slot.minute)
        const end = Math.max(prev.anchor, slot.minute)
        return {
          ...prev,
          moved: prev.moved || end - start >= MIN_BLOCK_MINUTES,
          preview: { ...prev.preview, startMinute: start, endMinute: end },
        }
      }
      const next = update(dragRef.current)
      dragRef.current = next
      setDrag(next)
    },
    [drag, pointToSlot, win, cancelPending]
  )

  const handlePointerUp = useCallback(
    (e) => {
      const p = pendingRef.current
      if (p && e.pointerId === p.pointerId) {
        // Lifted before the hold completed and without scrolling: a tap.
        cancelPending()
        if (p.kind === 'block') onOpenBlock(p.block)
        return
      }
      const current = dragRef.current
      if (!current || e.pointerId !== current.pointerId) return
      const { mode, blockId, block, preview, moved } = current
      commitDrag(null)

      if (mode === 'create') {
        // A plain click (or hold) without a drag still creates, at the default
        // length from where it landed.
        const start = preview.startMinute
        const end = moved ? preview.endMinute : Math.min(start + DEFAULT_BLOCK_MINUTES, win.endMinute)
        if (end - start < MIN_BLOCK_MINUTES) return
        onCreateAt({ date: preview.date, startMinute: start, endMinute: end })
        return
      }

      if (!moved) {
        // A click that didn't move opens the block; a resize grab that didn't
        // move does nothing.
        if (mode === 'move' && block) onOpenBlock(block)
        return
      }
      if (mode === 'move') onMoveBlock(blockId, { date: preview.date, startMinute: preview.startMinute })
      else onResizeBlock(blockId, preview.endMinute)
    },
    [cancelPending, commitDrag, onCreateAt, onMoveBlock, onOpenBlock, onResizeBlock, win]
  )

  // The browser took the gesture (it became a scroll) — drop everything.
  const handlePointerCancel = useCallback(() => {
    cancelPending()
    commitDrag(null)
  }, [cancelPending, commitDrag])

  // Blocks per column, with the in-flight drag applied so the block follows
  // the pointer before anything is committed.
  const columns = useMemo(() => {
    return dates.map((iso) => {
      let items = (blocksByDate.get(iso) || []).filter((b) => Number.isFinite(b.startMinute) && Number.isFinite(b.endMinute))
      if (drag?.blockId) {
        items = items.filter((b) => b.id !== drag.blockId)
        if (drag.preview.date === iso) {
          const source = dates.flatMap((d) => blocksByDate.get(d) || []).find((b) => b.id === drag.blockId)
          if (source) items = [...items, { ...source, ...drag.preview }]
        }
      }
      const laid = layoutOverlaps(items).map((b) => ({
        ...b,
        top: minutesToY(b.startMinute, win),
        height: minutesToY(b.endMinute, win) - minutesToY(b.startMinute, win),
      }))
      return { iso, laid }
    })
  }, [dates, blocksByDate, drag, win])

  const nowVisible = now.minute >= win.startMinute && now.minute <= win.endMinute

  return (
    <div className="flex" style={{ height }}>
      {/* Hour gutter — pinned while a narrow week pans sideways. */}
      <div style={{ width: GUTTER_WIDTH }} className="relative shrink-0 select-none sticky left-0 z-40 bg-card">
        {marks.slice(1, -1).map((m) => (
          <span
            key={m}
            style={{ top: minutesToY(m, win) }}
            className="absolute right-2.5 -translate-y-1/2 text-[11px] font-medium text-label-3 tabular whitespace-nowrap"
          >
            {minutesToLabel(m, { omitMinutes: true })}
          </span>
        ))}
      </div>

      {/* Day columns */}
      <div
        ref={columnsRef}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        onPointerLeave={(e) => {
          if (e.pointerType === 'mouse') setHover(null)
        }}
        onContextMenu={(e) => {
          // A long press on touch would otherwise also open the callout menu.
          if (pendingRef.current || dragRef.current) e.preventDefault()
        }}
        className="flex-1 flex relative"
        style={{ WebkitTouchCallout: 'none' }}
      >
        {marks.map((m) => (
          <span
            key={m}
            style={{ top: minutesToY(m, win) }}
            className="absolute inset-x-0 h-px bg-separator/60 pointer-events-none"
          />
        ))}

        {columns.map(({ iso, laid }) => (
          <div key={iso} className="flex-1 min-w-0 relative border-l border-separator/60 first:border-l-0">
            <div
              data-canvas="true"
              onPointerDown={(e) => handleDownCanvas(e, iso)}
              className="absolute inset-0"
              style={{ touchAction: 'pan-x pan-y' }}
              aria-hidden="true"
            />

            {!drag && hover?.date === iso && (
              <div
                style={{
                  top: minutesToY(hover.minute, win),
                  height:
                    minutesToY(Math.min(hover.minute + DEFAULT_BLOCK_MINUTES, win.endMinute), win) - minutesToY(hover.minute, win),
                }}
                className="absolute inset-x-[3px] rounded-[8px] bg-tint/[0.07] pointer-events-none z-[5]"
              />
            )}

            {drag?.mode === 'create' && drag.preview.date === iso && (
              <div
                style={{
                  top: minutesToY(drag.preview.startMinute, win),
                  height: Math.max(
                    minutesToY(drag.preview.endMinute, win) - minutesToY(drag.preview.startMinute, win),
                    minutesToY(win.startMinute + 15, win)
                  ),
                }}
                className="absolute inset-x-[3px] rounded-[8px] bg-tint/20 ring-1 ring-tint/40 pointer-events-none z-10"
              />
            )}

            {/* Now — iOS Calendar's red line. */}
            {nowVisible && iso === now.iso && (
              <div
                aria-hidden="true"
                style={{ top: minutesToY(now.minute, win) }}
                className="absolute inset-x-0 z-30 pointer-events-none"
              >
                <span className="absolute -left-[4px] -top-[4px] h-[9px] w-[9px] rounded-full bg-accent" />
                <span className="absolute inset-x-0 -top-px h-[2px] bg-accent" />
              </div>
            )}

            {laid.map((b) => {
              const chapters = blockChapters(b, chapterMap)
              if (chapters.length === 0) return null
              return (
                <StudyBlock
                  key={b.id}
                  block={b}
                  chapters={chapters}
                  subject={subjectMap.get(chapters[0].subjectId)}
                  layout={{ top: b.top, height: b.height, column: b.column, columns: b.columns }}
                  dragging={drag?.blockId === b.id}
                  onPointerDownMove={(e) => handleDownMove(e, b)}
                  onPointerDownResize={(e) => handleDownResize(e, b)}
                  onToggleDone={() => onToggleDone(b.id)}
                  onOpen={() => onOpenBlock(b)}
                />
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}
