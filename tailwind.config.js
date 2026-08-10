/** @type {import('tailwindcss').Config} */

// Every theme color is a CSS variable defined per theme+mode pair in index.css
// (see [data-theme="..."][data-mode="..."] blocks) — one class works unchanged
// across every combination, since the variable itself is what changes.
//
// The color-mix wrapper is what makes opacity modifiers work. Tailwind can only
// inject an alpha into a color it can parse, and it cannot see through a bare
// var() to the hex behind it — so with a plain `var(--color-x)` value it emits
// `bg-surface-2` but silently drops `bg-surface-2/30` from the stylesheet
// entirely, leaving the element transparent with no error anywhere. Tailwind
// substitutes <alpha-value> with the modifier (or 1 when there is none), and
// color-mix against `transparent` scales the color's alpha by that much:
// `bg-surface-2` stays exactly the variable's color, `bg-surface-2/30` is it at
// 30%. Going through color-mix rather than the more usual channel-triple
// variables keeps the variables themselves as ordinary colors, so hover/
// selected can carry their own baked-in alpha and anything reading
// var(--color-x) directly from CSS still works.
const themeColor = (name) =>
  `color-mix(in srgb, var(--color-${name}) calc(<alpha-value> * 100%), transparent)`

export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        paper: themeColor('paper'),
        surface: themeColor('surface'),
        'surface-2': themeColor('surface-2'),
        ink: themeColor('ink'),
        'ink-soft': themeColor('ink-soft'),
        brand: themeColor('brand'),
        'brand-soft': themeColor('brand-soft'),
        accent: themeColor('accent'),
        divider: themeColor('divider'),
        // Per-theme hover/selection tints — e.g. hover:bg-hover, bg-selected —
        // so interactive states pick up each theme's accent hue rather than a
        // flat gray overlay that would look identical everywhere.
        hover: themeColor('hover'),
        selected: themeColor('selected'),

        // Status colors stay constant across themes — they're semantic
        // (overdue/due/upcoming/mastered), not part of the aesthetic skin,
        // and were tuned to read clearly on both light and dark surfaces.
        status: {
          overdue: '#A5342A',
          due: '#8F3D49',
          upcoming: '#A8A3A6',
          mastered: '#4A4448',
        },
      },
      fontFamily: {
        // A characterful serif for headlines paired with a clean grotesk
        // for everything functional — set up once in index.html.
        display: ['"Fraunces"', 'ui-serif', 'Georgia', 'serif'],
        body: ['"Inter"', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      borderRadius: {
        card: '20px',
        control: '10px',
        // The dense end of the scale: calendar blocks, all-day capsules and
        // the checkboxes inside them, which a 10px control radius rounds
        // into a pill at 16–20px tall.
        chip: '6px',
        capsule: '9999px',
      },
      boxShadow: {
        soft: '0 1px 2px rgba(0,0,0,0.08)',
        elevated: 'var(--shadow-elevated)',
        sheet: 'var(--shadow-sheet)',
        fab: 'var(--shadow-fab)',
      },
      backgroundImage: {
        panel: 'var(--gradient-panel)',
      },
      // One type scale for the whole product. Before this, 33 distinct
      // arbitrary `text-[Npx]` values were in use and 14/14.5/15/15.5/16/16.5/17
      // all coexisted as "body" — differences too small to read as intentional
      // but enough to stop anything from lining up. These are named by role
      // rather than by size so a component asks for "lede" and cannot invent a
      // 16.5px one-off. Deliberately additive: Tailwind's own text-sm/text-2xl
      // still resolve, so existing app code keeps working during migration.
      fontSize: {
        eyebrow: ['11px', { lineHeight: '1.45', letterSpacing: '0.06em' }],
        meta: ['12px', { lineHeight: '1.5' }],
        ui: ['13px', { lineHeight: '1.5' }],
        // The workhorse. Everything that was 13.5/14/14.5 collapses here.
        body: ['15px', { lineHeight: '1.6' }],
        // Body copy that carries an argument and needs the extra air.
        prose: ['16px', { lineHeight: '1.7' }],
        lede: ['17px', { lineHeight: '1.65' }],
        // Display steps ~1.3x apart, so each is unmistakably a different level.
        'display-xs': ['20px', { lineHeight: '1.3', letterSpacing: '-0.02em' }],
        'display-sm': ['24px', { lineHeight: '1.25', letterSpacing: '-0.02em' }],
        'display-md': ['30px', { lineHeight: '1.2', letterSpacing: '-0.025em' }],
        'display-lg': ['40px', { lineHeight: '1.1', letterSpacing: '-0.03em' }],
        'display-xl': ['56px', { lineHeight: '1.03', letterSpacing: '-0.03em' }],
      },
      letterSpacing: {
        tightest: '-0.03em',
        wideish: '0.06em',
      },
      spacing: {
        18: '4.5rem',
        // The vertical rhythm every section band pays. Named so a section
        // can't quietly pick 160px when its neighbour picked 128px.
        band: '6rem',
        'band-lg': '7.5rem',
      },
      transitionDuration: {
        180: '180ms',
      },
    },
  },
  plugins: [],
}
