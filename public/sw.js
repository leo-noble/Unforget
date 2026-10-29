const CACHE_NAME = 'unforget-shell-v1'

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      caches.keys().then((keys) =>
        Promise.all(keys.filter((key) => key.startsWith('unforget-') && key !== CACHE_NAME).map((key) => caches.delete(key)))
      ),
    ])
  )
})

self.addEventListener('fetch', (event) => {
  const request = event.request
  const url = new URL(request.url)
  if (request.method !== 'GET' || url.origin !== self.location.origin) return

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(async (response) => {
          if (response.ok) {
            const copy = response.clone()
            await caches.open(CACHE_NAME).then((cache) => cache.put('/index.html', copy))
          }
          return response
        })
        .catch(() => caches.match('/index.html'))
    )
    return
  }

  if (/\.(?:css|js|jsx|png|svg|webmanifest|ico|woff2?)$/i.test(url.pathname)) {
    event.respondWith(
      fetch(request)
        .then(async (response) => {
          if (response.ok) {
            const copy = response.clone()
            await caches.open(CACHE_NAME).then((cache) => cache.put(request, copy))
          }
          return response
        })
        .catch(() => caches.match(request))
    )
  }
})

self.addEventListener('push', (event) => {
  let payload = { title: 'Unforget', body: 'You have chapters to review.' }
  try {
    if (event.data) payload = event.data.json()
  } catch {
    // Keep the default reminder if the payload is not JSON.
  }

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      tag: 'unforget-due-reminder',
    })
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      const existing = clients.find((client) => client.url.includes('/dashboard') || client.url.includes('/app'))
      if (existing) return existing.focus()
      return self.clients.openWindow('/dashboard')
    })
  )
})
