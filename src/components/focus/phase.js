// Focus time is the screen's main data, so it takes the one data hue; breaks
// are grey, so a glance at the dial says whether to work or rest.
export const PHASE_COLOR = {
  work: 'var(--data)',
  short_break: 'var(--label-3)',
  long_break: 'var(--label-3)',
}

// Foreground for anything filled with the phase colour.
export const PHASE_FG = {
  work: '#ffffff',
  short_break: 'var(--tint-fg)',
  long_break: 'var(--tint-fg)',
}
