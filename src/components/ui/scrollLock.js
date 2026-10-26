// Counted body scroll lock, so a sheet opened over a sheet (or an alert over
// a sheet) doesn't release the page underneath when the top one closes.
let count = 0
let saved = null

export function lockScroll() {
  if (typeof document === 'undefined') return () => {}
  if (count === 0) {
    const { body, documentElement: html } = document
    saved = { body: body.style.overflow, html: html.style.overflow, pr: body.style.paddingRight }
    // Keep the layout from shifting by the scrollbar's width on desktop.
    const gap = window.innerWidth - html.clientWidth
    if (gap > 0) body.style.paddingRight = `${gap}px`
    body.style.overflow = 'hidden'
    html.style.overflow = 'hidden'
  }
  count += 1
  let released = false
  return () => {
    if (released) return
    released = true
    count = Math.max(0, count - 1)
    if (count === 0 && saved) {
      document.body.style.overflow = saved.body
      document.documentElement.style.overflow = saved.html
      document.body.style.paddingRight = saved.pr
      saved = null
    }
  }
}
