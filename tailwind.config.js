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
        ...Object.fromEntries(SYSTEM.map((c) => [c, token(c)])),
      },
      fontFamily: {
        sans: [
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          '"SF Pro Text"',
          '"Segoe UI"',
          'Roboto',
          '"Helvetica Neue"',
          'Arial',
          'sans-serif',
        ],
        // SF Pro Rounded on Apple devices — what Clock and Fitness use for
        // their big numerals. Falls back to the regular system face elsewhere.
        rounded: ['ui-rounded', '"SF Pro Rounded"', 'system-ui', '-apple-system', 'sans-serif'],
      },
      // Apple's Dynamic Type scale at the default size, named by role.
      fontSize: {
        'large-title': ['34px', { lineHeight: '41px', letterSpacing: '-0.022em', fontWeight: '700' }],
        'title-1': ['28px', { lineHeight: '34px', letterSpacing: '-0.02em' }],
        'title-2': ['22px', { lineHeight: '28px', letterSpacing: '-0.016em' }],
        'title-3': ['20px', { lineHeight: '25px', letterSpacing: '-0.012em' }],
        headline: ['17px', { lineHeight: '22px', letterSpacing: '-0.01em' }],
        body: ['17px', { lineHeight: '22px', letterSpacing: '-0.01em' }],
        callout: ['16px', { lineHeight: '21px', letterSpacing: '-0.008em' }],
        subhead: ['15px', { lineHeight: '20px', letterSpacing: '-0.006em' }],
        footnote: ['13px', { lineHeight: '18px', letterSpacing: '-0.002em' }],
        caption: ['12px', { lineHeight: '16px' }],
        'caption-2': ['11px', { lineHeight: '13px', letterSpacing: '0.01em' }],
      },
      borderRadius: {
        cell: '22px',
        sheet: '34px',
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
