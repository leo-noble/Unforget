import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Check, Clock, AlertCircle, Lock, Pencil, Award, BookOpen } from 'lucide-react'
import Sheet from '../ui/Sheet'
import { Section, Row } from '../ui/List'
import { Button } from '../ui/Button'
import { buildTimeline, isDueOrOverdue, daysBetween, MAX_REVIEW_INDEX } from '../../lib/srs'
import { formatDay, relativeDay, plural } from '../../lib/format'
import { subjectColor } from '../../lib/colors'
import { reviewLabel, whenLabel, STATUS_TONE } from './meta'
import { spring } from '../ui/motion'

function StateDot({ state }) {
  if (state === 'done') {
    return (
      <span className="h-6 w-6 rounded-full bg-green text-tint-fg flex items-center justify-center shrink-0">
        <Check size={14} strokeWidth={3} />
      </span>
    )
  }
  if (state === 'next') {
    return (
      <span className="h-6 w-6 rounded-full flex items-center justify-center shrink-0" style={{ boxShadow: 'inset 0 0 0 2px var(--tint)' }}>
        <span className="h-2.5 w-2.5 rounded-full bg-tint" />
      </span>
    )
  }
  return <span className="h-6 w-6 rounded-full shrink-0" style={{ boxShadow: 'inset 0 0 0 1.5px var(--label-3)' }} />
}

export default function ChapterDetailSheet({ chapter, subject, actions, onRename, onClose }) {
  const [renaming, setRenaming] = useState(false)
  const [draft, setDraft] = useState(chapter?.title || '')
  const inputRef = useRef(null)

  useEffect(() => {
    if (renaming) inputRef.current?.select()
  }, [renaming])

  if (!chapter) return null

  const timeline = buildTimeline(chapter)
  const mastered = chapter.status === 'mastered'
  const canAct = isDueOrOverdue(chapter)
  const daysUntil = chapter.nextReviewDate ? daysBetween(new Date(), chapter.nextReviewDate) : null
  const done = mastered ? MAX_REVIEW_INDEX : chapter.currentReviewIndex
  const tone = STATUS_TONE[chapter.derivedStatus]

  function commitRename() {
    setRenaming(false)
    const t = draft.trim()
    // An empty box means "never mind", not "call it nothing".
    if (t && t !== chapter.title) onRename(chapter.id, t)
  }

  return (
    <Sheet onClose={onClose} size="lg" ariaLabel={chapter.title}>
      {/* Identity */}
      <div className="px-1">
        <p className="text-subhead text-label-2 flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ background: subjectColor(subject?.colorTag) }} />
          {subject?.name || 'No subject'}
        </p>
        {renaming ? (
          <input
            ref={inputRef}
            value={draft}
            maxLength={120}
            aria-label="Chapter title"
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commitRename}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                commitRename()
              } else if (e.key === 'Escape') {
                e.preventDefault()
                e.stopPropagation()
                setRenaming(false)
              }
            }}
            className="mt-1 w-full bg-card rounded-[14px] px-3 py-1.5 text-title-1 font-medium outline-none ring-1 ring-accent"
          />
        ) : (
          <button
            type="button"
            onClick={() => {
              setDraft(chapter.title)
              setRenaming(true)
            }}
            className="group mt-1 w-full flex items-start gap-2 text-left"
            title="Rename"
          >
            <h2 className="text-title-1 font-medium break-words min-w-0">{chapter.title}</h2>
            <Pencil size={16} className="mt-2.5 shrink-0 text-label-3 group-hover:text-tint" />
          </button>
        )}

        <div className="flex flex-wrap items-center gap-2 mt-3">
          <span
            className="inline-flex items-center gap-1.5 h-7 px-3 rounded-[9px] text-footnote font-medium"
            style={{ color: tone, background: `color-mix(in srgb, ${tone} 14%, transparent)` }}
          >
            {mastered ? <Award size={14} /> : <span className="h-1.5 w-1.5 rounded-full" style={{ background: tone }} />}
            {mastered ? 'Mastered' : whenLabel(chapter)}
          </span>
          {chapter.struggleFlag && !mastered && (
            <span className="inline-flex items-center gap-1.5 h-7 px-3 rounded-[9px] text-footnote font-medium text-orange bg-orange/15">
              <AlertCircle size={14} /> Needs attention
            </span>
          )}
        </div>
      </div>

      {/* Progress through the five reviews */}
      <div className="mt-5 bg-card rounded-cell p-4">
        <div className="flex items-baseline justify-between mb-4">
          <span className="eyebrow text-label">{reviewLabel(chapter)}</span>
          <span className="eyebrow text-label-2 tabular">
            {done}/{MAX_REVIEW_INDEX} done
          </span>
        </div>
        <div className="flex items-center justify-between px-1">
          {Array.from({ length: MAX_REVIEW_INDEX }).map((_, i) => {
            const isDone = i < done
            const isNext = i === done && !mastered
            return (
              <motion.span
                key={i}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ ...spring, delay: 0.08 + i * 0.05 }}
                className="h-[22px] w-[22px] rounded-full"
                style={{
                  background: isDone ? 'var(--label)' : 'transparent',
                  boxShadow: isDone ? 'none' : `inset 0 0 0 1.5px ${isNext ? 'var(--accent)' : 'var(--label-3)'}`,
                }}
              />
            )
          })}
        </div>
      </div>

      {/* What you can do right now */}
      <div className="mt-4">
        {mastered ? (
          <div className="rounded-cell bg-card p-4 flex items-center gap-3">
            <span className="h-10 w-10 rounded-full bg-green text-tint-fg flex items-center justify-center shrink-0">
              <Award size={20} />
            </span>
            <p className="text-subhead">
              <span className="font-medium block">Fully retained.</span>
              <span className="text-label-2">All five reviews are done — this one's yours.</span>
            </p>
          </div>
        ) : canAct ? (
          <div className="space-y-2.5">
            <Button
              size="lg"
              block
              onClick={() => {
                actions.revise(chapter)
                onClose()
              }}
            >
              <Check size={20} strokeWidth={2.8} /> Mark as Revised
            </Button>
            <div className="grid grid-cols-2 gap-2.5">
              <Button variant="gray" onClick={() => actions.snooze(chapter)}>
                <Clock size={17} /> Snooze 1 Day
              </Button>
              <Button variant="gray" onClick={() => actions.struggle(chapter)} disabled={chapter.struggleFlag}>
                <AlertCircle size={17} /> {chapter.struggleFlag ? 'Flagged' : 'Struggled'}
              </Button>
            </div>
            <button
              type="button"
              onClick={async () => {
                const res = await actions.masterEarly(chapter)
                if (!res?.blocked) onClose()
              }}
              className="w-full py-2 text-footnote text-label-2 active:text-tint"
            >
              I know this cold — end the cycle early
            </button>
          </div>
        ) : (
          <div className="rounded-cell bg-card p-4 flex items-center gap-3">
            <span className="h-10 w-10 rounded-full bg-fill text-label-2 flex items-center justify-center shrink-0">
              <Lock size={18} />
            </span>
            <p className="text-subhead">
              <span className="font-medium block">
                Unlocks {daysUntil === 1 ? 'tomorrow' : `in ${plural(daysUntil, 'day')}`}
              </span>
              <span className="text-label-2">
                {formatDay(chapter.nextReviewDate)}. Reviewing early doesn't stick as well, so it stays locked.
              </span>
            </p>
          </div>
        )}
      </div>

      {/* The whole schedule */}
      <Section title="Schedule" className="mt-6">
        <Row
          leading={
            <span className="h-6 w-6 rounded-full bg-fill text-label-2 flex items-center justify-center shrink-0">
              <BookOpen size={13} strokeWidth={2.4} />
            </span>
          }
          inset={52}
          title="Studied"
          detail={formatDay(chapter.studiedDate)}
        />
        {timeline.map((t) => (
          <Row
            key={t.reviewNumber}
            leading={<StateDot state={t.state} />}
            inset={52}
            title={
              <span className={t.state === 'next' ? 'font-medium' : t.state === 'done' ? 'text-label-2' : ''}>
                Review {t.reviewNumber}
              </span>
            }
            trailing={
              <span className="text-right shrink-0">
                <span className="block text-subhead tabular">{formatDay(t.date)}</span>
                {t.state !== 'done' && relativeDay(t.date) !== formatDay(t.date) && (
                  <span className="block text-caption text-label-2">{relativeDay(t.date)}</span>
                )}
              </span>
            }
          />
        ))}
      </Section>

      {chapter.notes && (
        <Section title="Notes" className="mt-6">
          <p className="px-4 py-3.5 text-body whitespace-pre-wrap break-words">{chapter.notes}</p>
        </Section>
      )}

      <Section className="mt-6">
        <Row
          center
          destructive
          title="Delete Chapter"
          onClick={async () => {
            if (await actions.remove(chapter)) onClose()
          }}
          className="!text-accent"
        >
          <span className="text-body text-accent">Delete Chapter</span>
        </Row>
      </Section>
    </Sheet>
  )
}
