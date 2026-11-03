// Todoist-style quick add: one line of text becomes a chapter.
//
//   "Alkenes #chem yesterday"   → "Alkenes", Organic chemistry, studied yesterday
//   "Integration by parts #calc" → today, under Calculus II
//   "Preterite #"Spanish B1" 3 days ago"
//
// `#word` picks the subject whose name starts with (or contains) that word;
// one that matches nothing becomes a new subject. A date can be today,
// yesterday, "N days ago" / "Nd ago", or a weekday (the most recent one).
// Whatever is left is the title.
import { addDays, startOfDay, toISODate } from './srs'

const WEEKDAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']

function matchSubject(word, subjects) {
  const q = word.toLowerCase().replace(/[_-]+/g, ' ').trim()
  if (!q) return null
  const exact = subjects.find((s) => s.name.toLowerCase() === q)
  if (exact) return exact
  const prefix = subjects.find((s) => s.name.toLowerCase().startsWith(q))
  if (prefix) return prefix
  const word0 = subjects.find((s) => s.name.toLowerCase().split(/\s+/).some((w) => w.startsWith(q)))
  if (word0) return word0
  return subjects.find((s) => s.name.toLowerCase().includes(q)) || null
}

function parseDate(text, today) {
  const t = startOfDay(today)
  const rules = [
    [/\btoday\b/i, () => t],
    [/\byesterday\b/i, () => addDays(t, -1)],
    [/\b(\d{1,2})\s*(?:d|days?)\s+ago\b/i, (m) => addDays(t, -Number(m[1]))],
    [/\b(?:last\s+)?(sun|mon|tue|tues|wed|thu|thur|thurs|fri|sat)(?:day|nesday|rsday|urday)?\b/i, (m) => {
      const want = WEEKDAYS.findIndex((d) => d.startsWith(m[1].toLowerCase().slice(0, 3)))
      const back = (t.getDay() - want + 7) % 7 || 7
      return addDays(t, -back)
    }],
  ]
  for (const [re, fn] of rules) {
    const m = text.match(re)
    if (m) return { date: fn(m), rest: text.replace(m[0], ' ') }
  }
  return { date: null, rest: text }
}

/**
 * Returns { title, subject, newSubjectName, studiedDate, dateWasSet }.
 * `subject` is an existing subject or null; `newSubjectName` is set when the
 * #tag matched nothing and should become a subject.
 */
export function parseQuickAdd(input, subjects, fallbackSubjectId, today = new Date()) {
  let text = ` ${input} `
  let subject = null
  let newSubjectName = null

  const tag = text.match(/\s#"([^"]+)"|\s#([^\s#]+)/)
  if (tag) {
    const word = tag[1] || tag[2]
    subject = matchSubject(word, subjects)
    if (!subject) newSubjectName = word.replace(/[_-]+/g, ' ').trim()
    text = text.replace(tag[0], ' ')
  }

  const { date, rest } = parseDate(text, today)
  const todayISO = toISODate(today)
  let studiedDate = date ? toISODate(date) : todayISO
  if (studiedDate > todayISO) studiedDate = todayISO

  if (!subject && !newSubjectName) subject = subjects.find((s) => s.id === fallbackSubjectId) || subjects[0] || null

  const title = rest.replace(/\s+/g, ' ').trim()
  return { title, subject, newSubjectName, studiedDate, dateWasSet: !!date }
}
