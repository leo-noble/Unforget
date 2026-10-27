import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.js',
      includeAssets: ['icons/favicon.svg', 'icons/apple-touch-icon.png'],
      manifest: {
        // Same identity the app had before it was renamed, so existing
        // installs update in place instead of becoming a second app.
        id: '/app',
        name: 'Unforget — Remember what you study',
        short_name: 'Unforget',
        description: 'Spaced-repetition study planner. Know exactly what to revise today.',
        // Opening the installed app goes straight to Today. Signed-out users
        // are bounced to sign-in from there, never to the marketing page.
        start_url: '/app',
        scope: '/',
        display: 'standalone',
        display_override: ['standalone'],
        theme_color: '#0B0A14',
        background_color: '#0B0A14',
        categories: ['education', 'productivity'],
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
        shortcuts: [
          { name: 'Today', url: '/app', icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }] },
          { name: 'Focus', url: '/app/focus', icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }] },
        ],
      },
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
      },
    }),
  ],
})
