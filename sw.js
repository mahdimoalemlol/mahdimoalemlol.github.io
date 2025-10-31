// Service Worker for Fitness Planner PWA
const CACHE_NAME = 'fitness-planner-v1.0.0';
const urlsToCache = [
  '/',
  '/index.html',
  '/styles/main.css',
  '/styles/components.css',
  '/scripts/app.js',
  '/scripts/workout-planner.js',
  '/scripts/exercises-database.js',
  '/scripts/pdf-generator.js',
  '/scripts/charts.js',
  '/manifest.json',
  'https://fonts.googleapis.com/css2?family=Vazirmatn:wght@300;400;500;700&display=swap'
];

// Install Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
      .catch((error) => {
        console.error('Failed to cache resources:', error);
      })
  );
});

// Fetch Event - Cache First Strategy
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        if (response) {
          return response;
        }

        return fetch(event.request)
          .then((response) => {
            // Check if we received a valid response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone the response
            const responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return response;
          })
          .catch(() => {
            // Return offline page for navigation requests
            if (event.request.destination === 'document') {
              return caches.match('/index.html');
            }
          });
      })
  );
});

// Activate Service Worker
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Handle background sync for progress data
self.addEventListener('sync', (event) => {
  if (event.tag === 'progress-sync') {
    event.waitUntil(syncProgressData());
  }
});

async function syncProgressData() {
  try {
    // Sync progress data with server (if available)
    const storedData = localStorage.getItem('fitnessProgressData');
    if (storedData) {
      // Here you would sync with your backend server
      console.log('Syncing progress data:', storedData);
    }
  } catch (error) {
    console.error('Failed to sync progress data:', error);
  }
}

// Handle push notifications (for future features)
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'زمان تمرین شماست!',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: '1'
    },
    actions: [
      {
        action: 'start-workout',
        title: 'شروع تمرین',
        icon: '/icons/icon-96.png'
      },
      {
        action: 'view-plan',
        title: 'مشاهده برنامه',
        icon: '/icons/icon-96.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('برنامه‌ریز تناسب اندام', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'start-workout') {
    event.waitUntil(
      clients.openWindow('/?section=plan')
    );
  } else if (event.action === 'view-plan') {
    event.waitUntil(
      clients.openWindow('/?section=exercises')
    );
  } else {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Handle share target (for sharing workout plans)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SHARE_WORKOUT') {
    // Handle workout sharing
    console.log('Sharing workout plan:', event.data.payload);
  }
});

// Periodic background sync (for future features)
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'progress-sync') {
    event.waitUntil(syncProgressData());
  }
});

// Message handling for communication with main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});