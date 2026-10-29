import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

window.__unforgetInstallPrompt = null
window.addEventListener('beforeinstallprompt', (event) => {
  event.preventDefault()
  window.__unforgetInstallPrompt = event
})
window.addEventListener('appinstalled', () => {
  window.__unforgetInstallPrompt = null
})

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {})
  })
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
