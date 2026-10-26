// One motion vocabulary for the whole app, tuned to feel like UIKit/SwiftUI
// springs: quick to respond, settling without a visible wobble.

// SwiftUI's default `.spring()` — the workhorse for anything that moves.
export const spring = { type: 'spring', stiffness: 420, damping: 38, mass: 1 }

// `.snappy` — selection pills, toggles, small things that should feel instant.
export const snappy = { type: 'spring', stiffness: 620, damping: 42, mass: 0.8 }

// `.bouncy` — reserved for moments of delight (completing a review).
export const bouncy = { type: 'spring', stiffness: 520, damping: 22, mass: 0.9 }

// Sheet presentation: iOS's sheet curve is a heavily damped spring.
export const sheetSpring = { type: 'spring', stiffness: 360, damping: 40, mass: 1 }

export const easeOut = [0.32, 0.72, 0, 1]

// The press response every tappable surface shares.
export const press = { scale: 0.96 }
export const pressSoft = { scale: 0.98 }

export const fadeUp = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.32, ease: easeOut },
}
