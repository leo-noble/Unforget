import { useCallback } from 'react'
import { Check, Clock, AlarmClockOff, Award, AlertCircle, Lock, Trash2 } from 'lucide-react'
import { useToast } from '../ui/Toast'
import { useConfirm } from '../ui/Alert'
import { relativeDayInline, formatDay } from '../../lib/format'

// The engine's chapter actions, each followed by the confirmation a user
// actually sees. The engine still decides everything (including refusing an
// action on a review that isn't due); this only reports what happened.
export function useChapterActions(cadence) {
  const toast = useToast()
  const confirm = useConfirm()
  const { reviseChapter, snoozeChapterAction, struggleChapterAction, masterEarlyAction, removeChapter } = cadence

  const revise = useCallback(
    (chapter) => {
      const res = reviseChapter(chapter)
      if (res?.blocked) return res
      if (res.chapter?.status === 'mastered') {
        toast({ title: 'Mastered', message: chapter.title, icon: Award, tone: 'green' })
      } else {
        toast({
          title: 'Marked as revised',
          message: `Next review ${relativeDayInline(res.chapter.nextReviewDate)}`,
          icon: Check,
          tone: 'green',
        })
      }
      return res
    },
    [reviseChapter, toast]
  )

  const snooze = useCallback(
    (chapter) => {
      const res = snoozeChapterAction(chapter)
      if (res?.blocked && res.reason === 'snooze-cap') {
        toast({
          title: 'Already snoozed twice',
          message: 'Better to knock this one out today.',
          icon: AlarmClockOff,
          tone: 'orange',
          duration: 3400,
        })
      } else if (!res?.blocked) {
        toast({ title: 'Snoozed until tomorrow', message: chapter.title, icon: Clock, tone: 'orange' })
      }
      return res
    },
    [snoozeChapterAction, toast]
  )

  const struggle = useCallback(
    (chapter) => {
      const res = struggleChapterAction(chapter)
      if (!res?.blocked) {
        toast({ title: 'Flagged for extra attention', message: chapter.title, icon: AlertCircle, tone: 'orange' })
      }
      return res
    },
    [struggleChapterAction, toast]
  )

  const masterEarly = useCallback(
    async (chapter) => {
      const ok = await confirm({
        title: 'End this cycle early?',
        message: 'The remaining reviews are skipped and the chapter is marked mastered.',
        confirmLabel: 'Mark Mastered',
      })
      if (!ok) return { blocked: true }
      const res = masterEarlyAction(chapter)
      if (!res?.blocked) toast({ title: 'Mastered', message: chapter.title, icon: Award, tone: 'green' })
      return res
    },
    [confirm, masterEarlyAction, toast]
  )

  const remove = useCallback(
    async (chapter) => {
      const ok = await confirm({
        title: `Delete “${chapter.title}”?`,
        message: 'Its review history and any planned sessions for it are removed too.',
        confirmLabel: 'Delete',
        destructive: true,
      })
      if (!ok) return false
      removeChapter(chapter.id)
      toast({ title: 'Chapter deleted', message: chapter.title, icon: Trash2, tone: 'red' })
      return true
    },
    [confirm, removeChapter, toast]
  )

  const locked = useCallback(
    (chapter) => {
      if (!chapter.nextReviewDate) return
      toast({
        title: `Unlocks ${relativeDayInline(chapter.nextReviewDate)}`,
        message: `Review it on ${formatDay(chapter.nextReviewDate)} — earlier won't stick as well.`,
        icon: Lock,
        tone: 'indigo',
        duration: 3400,
      })
    },
    [toast]
  )

  return { revise, snooze, struggle, masterEarly, remove, locked }
}
