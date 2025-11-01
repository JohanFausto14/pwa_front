const CACHE_NAME = 'pwa-Johan-v7'; // Incrementado para forzar actualización
const RUNTIME_CACHE = 'runtime-cache-v7';

// Base de la API
let API_BASE_URL = 'https://pwa-back-rgyn.onrender.com';

// IndexedDB  
const IDB_NAME = 'pwa-cart-db';
const IDB_VERSION = 1;
const IDB_STORE = 'cartQueue';

// ==========================================
// FUNCIONES DE INDEXEDDB (EXISTENTES)
// ==========================================
function openCartDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(IDB_NAME, IDB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        db.createObjectStore(IDB_STORE, { keyPath: 'id', autoIncrement: true });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function idbAddCartRecord(record) {
  const db = await openCartDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, 'readwrite');
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.objectStore(IDB_STORE).add({ ...record, createdAt: Date.now() });
  });
}

async function idbGetAllCartRecords() {
  const db = await openCartDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, 'readonly');
    const req = tx.objectStore(IDB_STORE).getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

async function idbClearCartStore() {
  const db = await openCartDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, 'readwrite');
    const req = tx.objectStore(IDB_STORE).clear();
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

async function removeFromCartQueue(productId) {
  const db = await openCartDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, 'readwrite');
    const store = tx.objectStore(IDB_STORE);
    const getAllReq = store.getAll();
    getAllReq.onsuccess = () => {
      const records = getAllReq.result;
      const recordToRemove = records.find(record => 
        record.product && record.product.id === productId
      );
      if (recordToRemove) {
        const deleteReq = store.delete(recordToRemove.id);
        deleteReq.onsuccess = () => resolve();
        deleteReq.onerror = () => reject(deleteReq.error);
      } else {
        resolve();
      }
    };
    getAllReq.onerror = () => reject(getAllReq.error);
  });
}

async function processCartQueue() {
  try {
    const items = await idbGetAllCartRecords();
    if (!items.length) {
      console.log('[SW] 🧺 Cola vacía, nada que sincronizar');
      return;
    }
    if (self.navigator && self.navigator.onLine === false) {
      console.log('[SW] 📡 Sin conexión, no se procesa la cola');
      return;
    }
    const itemsToSync = items.filter(item => item.action === 'add');
    if (!itemsToSync.length) {
      console.log('[SW] 🧺 No hay items para sincronizar');
      await idbClearCartStore();
      return;
    }
    let endpoint = '/api/cart/sync';
    try {
      endpoint = new URL('/api/cart/sync', API_BASE_URL).toString();
    } catch (_) {
      endpoint = `${API_BASE_URL.replace(/\/$/, '')}/api/cart/sync`;
    }
    console.log('[SW] 🔄 Enviando cola del carrito:', itemsToSync.length, 'elementos');
    const syncData = itemsToSync.map(item => ({
      userId: item.userId,
      timestamp: item.timestamp,
      total: item.product ? item.product.price * item.quantity : 0,
      items: item.product ? [item.product] : [],
      createdAt: item.createdAt
    }));
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: syncData })
    });
    if (!res.ok) {
      throw new Error('Respuesta no OK al sincronizar: ' + res.status);
    }
    await idbClearCartStore();
    console.log('[SW] ✅ Cola sincronizada y limpiada');
    const allClients = await self.clients.matchAll({ includeUncontrolled: true });
    allClients.forEach((client) => {
      client.postMessage({ type: 'CART_SYNCED', count: itemsToSync.length });
    });
  } catch (err) {
    console.warn('[SW] ⚠️ No se pudo sincronizar la cola:', err && err.message);
  }
}

// ==========================================
// 🔔 MANEJO DE NOTIFICACIONES PUSH (NUEVO)
// ==========================================

// Evento: Push recibido
self.addEventListener('push', (event) => {
  console.log('[SW] 🔔 Push notification recibida');

  let notificationData = {
    title: 'Nueva notificación',
    body: 'Tienes una nueva actualización',
    icon: '/icon-192x192.png',
    badge: '/icon-72x72.png',
    tag: 'default-notification',
    data: {}
  };

  if (event.data) {
    try {
      const payload = event.data.json();
      notificationData = {
        title: payload.title || notificationData.title,
        body: payload.body || notificationData.body,
        icon: payload.icon || notificationData.icon,
        badge: payload.badge || notificationData.badge,
        tag: payload.tag || notificationData.tag,
        data: payload.data || notificationData.data
      };
    } catch (error) {
      console.error('[SW] ❌ Error parseando payload:', error);
      notificationData.body = event.data.text();
    }
  }

  const options = {
    body: notificationData.body,
    icon: notificationData.icon,
    badge: notificationData.badge,
    tag: notificationData.tag,
    data: notificationData.data,
    vibrate: [200, 100, 200],
    requireInteraction: false,
    actions: [
      { action: 'open', title: 'Abrir' },
      { action: 'close', title: 'Cerrar' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(notificationData.title, options)
      .then(() => {
        console.log('[SW] ✅ Notificación mostrada:', notificationData.title);
      })
      .catch((error) => {
        console.error('[SW] ❌ Error mostrando notificación:', error);
      })
  );
});

// Evento: Click en notificación
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] 👆 Click en notificación:', event.action);

  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  // Abrir o enfocar la aplicación
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Si hay una ventana abierta, enfocarla
        for (const client of clientList) {
          if ('focus' in client) {
            return client.focus();
          }
        }
        // Si no hay ventana abierta, abrir una nueva
        if (self.clients.openWindow) {
          return self.clients.openWindow('/');
        }
      })
      .catch((error) => {
        console.error('[SW] ❌ Error manejando click:', error);
      })
  );
});

// Evento: Notificación cerrada
self.addEventListener('notificationclose', (event) => {
  console.log('[SW] 🔕 Notificación cerrada');
});

// ==========================================
// CACHE Y PRECACHE (EXISTENTE)
// ==========================================

const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  '/assets/index.js',
  '/assets/index.css',
];

const CACHE_PATTERNS = [
  /\/assets\/.*\.(js|css)$/,
  /\.(png|jpg|jpeg|gif|webp|svg|ico)$/,
  /\/manifest\.json$/
];

function shouldAutoCache(url) {
  return CACHE_PATTERNS.some(pattern => pattern.test(url.pathname));
}

// Instalar
self.addEventListener('install', (event) => {
  console.log('[SW] 🔧 Instalando Service Worker...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] 📦 Abriendo cache:', CACHE_NAME);
        const cachePromises = PRECACHE_URLS.map(url => {
          return fetch(url)
            .then(response => {
              if (response.ok) {
                console.log('[SW] ✅ Cacheado:', url);
                return cache.put(url, response);
              } else {
                console.warn('[SW] ⚠️ No se pudo cachear:', url);
                return null;
              }
            })
            .catch(err => {
              console.warn('[SW] ⚠️ Error cacheando:', url);
              return null;
            });
        });
        return Promise.all(cachePromises);
      })
      .then(() => {
        console.log('[SW] ⚡ Activando inmediatamente...');
        return self.skipWaiting();
      })
  );
});

// Activar
self.addEventListener('activate', (event) => {
  console.log('[SW] 🚀 Activando Service Worker...');
  event.waitUntil(
    Promise.all([
      caches.keys().then((cacheNames) => {
        const deletePromises = cacheNames
          .filter(cacheName => cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE)
          .map(cacheName => {
            console.log('[SW] 🗑️ Eliminando cache viejo:', cacheName);
            return caches.delete(cacheName);
          });
        return Promise.all(deletePromises);
      }),
      self.clients.claim().then(() => {
        console.log('[SW] 👍 Tomando control de las páginas');
      })
    ]).then(() => {
      console.log('[SW] ✨ Service Worker activado y listo');
    })
  );
});

// Fetch
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (url.origin !== location.origin || request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          if (navigator.onLine !== false) {
            fetch(request).then((networkResponse) => {
              if (networkResponse && networkResponse.ok) {
                caches.open(RUNTIME_CACHE).then((cache) => {
                  cache.put(request, networkResponse);
                });
              }
            }).catch(() => {});
          }
          return cachedResponse;
        }

        if (navigator.onLine === false) {
          if (url.pathname === '/' || request.headers.get('accept')?.includes('text/html')) {
            return caches.match('/index.html');
          }
          return new Response('Recurso no disponible sin conexión', {
            status: 503,
            statusText: 'Service Unavailable'
          });
        }

        return fetch(request)
          .then((networkResponse) => {
            if (!networkResponse || networkResponse.status !== 200) {
              return networkResponse;
            }
            if (shouldAutoCache(url)) {
              const responseToCache = networkResponse.clone();
              caches.open(RUNTIME_CACHE).then((cache) => {
                cache.put(request, responseToCache);
              });
            }
            return networkResponse;
          });
      })
  );
});

// Mensajes
self.addEventListener('message', (event) => {
  console.log('[SW] 📨 Mensaje recibido:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CACHE_URLS') {
    const urls = event.data.urls || [];
    caches.open(RUNTIME_CACHE).then(cache => {
      urls.forEach(url => {
        fetch(url).then(response => {
          if (response.ok) cache.put(url, response);
        });
      });
    });
  }

  if (event.data && event.data.type === 'QUEUE_CART_ITEM') {
    const payload = event.data.payload || {};
    const record = {
      action: payload.action || 'add',
      product: payload.product || null,
      quantity: payload.quantity || 1,
      userId: payload.userId || 'unknown',
      timestamp: payload.timestamp || new Date().toISOString(),
      createdAt: Date.now()
    };
    
    if (payload.action === 'remove') {
      removeFromCartQueue(record.product.id).catch(() => {});
    } else {
      idbAddCartRecord(record).catch(() => {});
    }
  }

  if (event.data && event.data.type === 'SET_API_BASE_URL') {
    const base = event.data.baseUrl;
    if (typeof base === 'string' && base.length > 0) {
      API_BASE_URL = base;
      console.log('[SW] 🔧 API_BASE_URL:', API_BASE_URL);
    }
  }

  if (event.data && event.data.type === 'PROCESS_CART_QUEUE') {
    event.waitUntil(processCartQueue());
  }
});

// Online/Offline
self.addEventListener('online', () => {
  console.log('[SW] 🌐 Conexión restaurada');
  processCartQueue();
});

self.addEventListener('offline', () => {
  console.log('[SW] 📡 Sin conexión');
});

// Background Sync
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-cart') {
    console.log('[SW] 🔄 Background Sync: sync-cart');
    event.waitUntil(processCartQueue());
  }
});

console.log('[SW] 🎬 Service Worker cargado con soporte para Push Notifications');
