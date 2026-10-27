/** @type {import('tailwindcss').Config} */

// Every colour is a CSS variable from index.css, redefined per light/dark mode
// and per accent — so one class works across every combination.
//
// The color-mix wrapper is what makes opacity modifiers work: Tailwind can't
// see through a bare var() to inject an alpha, and silently drops classes like
// `bg-tint/15` if the value is a plain var(). color-mix against transparent
// scales the variable's own alpha by the modifier instead.
const token = (name) => `color-mix(in srgb, var(--${name}) calc(<alpha-value> * 100%), transparent)`

const SYSTEM = ['red', 'orange', 'yellow', 'green', 'mint', 'teal', 'cyan', 'blue', 'indigo', 'purple', 'pink']

export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // iOS semantic colours: grouped background, cells, labels, fills.
        canvas: token('canvas'),
        card: token('card'),
        'card-2': token('card-2'),
        label: token('label'),
        'label-2': token('label-2'),
        'label-3': token('label-3'),
        separator: token('separator'),
        fill: token('fill'),
        'fill-2': token('fill-2'),
        tint: token('tint'),
        'tint-2': token('tint-2'),
        // Text and icons placed on a tint-filled surface.
        'tint-fg': token('tint-fg'),
        accent: token('accent'),
        ...Object.fromEntries(SYSTEM.map((c) => [c, token(c)])),
      },
      fontFamily: {
        // Native system typography gives iOS its familiar SF rendering and
        // avoids loading a separate web font on every device.
        sans: ['-apple-system', 'BlinkMacSystemFont', '"SF Pro Text"', '"SF Pro Display"', 'system-ui', '"Segoe UI"', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
        rounded: ['-apple-system', 'BlinkMacSystemFont', 'system-ui', 'sans-serif'],
      },
      // Type scale, named by role.
      fontSize: {
        'large-title': ['28px', { lineHeight: '34px', letterSpacing: '-0.025em', fontWeight: '600' }],
        'title-1': ['24px', { lineHeight: '30px', letterSpacing: '-0.02em' }],
        'title-2': ['20px', { lineHeight: '26px', letterSpacing: '-0.015em' }],
        'title-3': ['17px', { lineHeight: '22px', letterSpacing: '-0.01em' }],
        headline: ['15px', { lineHeight: '20px', letterSpacing: '-0.006em' }],
        body: ['15px', { lineHeight: '21px', letterSpacing: '-0.006em' }],
        callout: ['15px', { lineHeight: '20px' }],
        subhead: ['13px', { lineHeight: '18px' }],
        footnote: ['12px', { lineHeight: '16px' }],
        caption: ['11px', { lineHeight: '14px' }],
        'caption-2': ['10px', { lineHeight: '12px' }],
      },
      borderRadius: {
        cell: '12px',
        sheet: '16px',
        control: '12px',
        capsule: '9999px',
      },
      boxShadow: {
        card: 'var(--shadow-card)',
        float: 'var(--shadow-float)',
        sheet: 'var(--shadow-sheet)',
        tint: '0 10px 24px -8px color-mix(in srgb, var(--tint) 55%, transparent)',
      },
      transitionTimingFunction: {
        ios: 'cubic-bezier(0.32, 0.72, 0, 1)',
      },
      screens: {
        xs: '390px',
      },
    },
  },
  plugins: [],
}
