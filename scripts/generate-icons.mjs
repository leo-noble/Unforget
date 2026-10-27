// Renders the Unforget mark into every icon file the app ships:
//
//   favicon.svg            rounded, for browser tabs
//   icon-192/512.png       rounded with transparent corners ("any" purpose)
//   icon-maskable-512.png  full-bleed, glyph inside the 80% safe zone, so
//                          Android can crop it to any shape
//   apple-touch-icon.png   full-bleed 180px — iOS applies its own corner mask
//                          and renders transparency as black, so no rounding
//
// Run with `npm run icons` after changing src/components/ui/iconArt.js.
import { writeFile, mkdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'
import { appIconSVG } from '../src/components/ui/iconArt.js'

const out = fileURLToPath(new URL('../public/icons/', import.meta.url))
await mkdir(out, { recursive: true })

const squircle = appIconSVG({ id: 'fav', shape: 'squircle' })
const square = appIconSVG({ id: 'sq', shape: 'square' })
const maskable = appIconSVG({ id: 'mask', shape: 'square', glyphScale: 0.86 })

const render = (svg, size) =>
  sharp(Buffer.from(svg.replace('width="100%" height="100%"', `width="${size}" height="${size}"`)))
    .resize(size, size)
    .png()

await writeFile(new URL('favicon.svg', `file://${out}`), squircle)
await render(squircle, 192).toFile(`${out}icon-192.png`)
await render(squircle, 512).toFile(`${out}icon-512.png`)
await render(maskable, 512).toFile(`${out}icon-maskable-512.png`)
await render(square, 180).flatten({ background: '#1A0F3D' }).toFile(`${out}apple-touch-icon.png`)

console.log('Icons written to public/icons/')
