// Variables globales de la PWA
const CACHE_NAME = 'pwa-v1';
const RUNTIME_CACHE = 'runtime-v1';
let API_BASE_URL = 'http://localhost:5000'; // Se ajusta al puerto 5000 de tu Express

// --- Configuración de IndexedDB para la cola offline ---
const IDB_NAME = 'pwa-cart-db'; // Nombre de la BD
const IDB_VERSION = 1;
const IDB_STORE = 'cartQueue'; // Nombre del almacén de objetos

/**
 * Abre la conexión a IndexedDB y crea el almacén si es necesario.
 */
function openCartDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(IDB_NAME, IDB_VERSION);

        request.onupgradeneeded = () => {
            const db = request.result;
            if (!db.objectStoreNames.contains(IDB_STORE)) {
                // keyPath: 'id' es crucial para asegurar que cada registro es único.
                db.createObjectStore(IDB_STORE, { keyPath: 'id' }); // Eliminado autoIncrement ya que generamos un 'queueId'
            }
        };

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => {
            console.error('[SW] Error abriendo IndexedDB:', request.error);
            reject(request.error);
        };
    });
}

/**
 * Añade un registro a la cola del carrito en IndexedDB.
 * El 'record' es el objeto de compra completo enviado desde el cliente.
 */
async function idbAddCartRecord(record) {
    try {
        const db = await openCartDB();
        return new Promise((resolve, reject) => {
            // Utilizamos 'readwrite' para modificar la base de datos
            const tx = db.transaction(IDB_STORE, 'readwrite');
            const store = tx.objectStore(IDB_STORE);
            
            // Crea un ID único para el registro de la cola
            const queueId = 'queue-' + Date.now() + Math.random().toString(36).substring(2, 9);

            const req = store.add({ 
                ...record, 
                id: queueId, // Usamos el ID único para keyPath
                createdAt: Date.now() 
            });

            req.onsuccess = () => {
                console.log(`[SW] ✅ Ítem encolado en IndexedDB. ID: ${queueId}`);
                resolve();
            };
            req.onerror = () => {
                console.error('[SW] ❌ Error añadiendo ítem a IndexedDB:', req.error);
                reject(req.error);
            };
        });
    } catch (err) {
        console.error('[SW] Error al procesar IndexedDB add:', err);
    }
}

/**
 * Obtiene todos los registros de la cola.
 */
async function idbGetAllCartRecords() {
    const db = await openCartDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(IDB_STORE, 'readonly');
        const req = tx.objectStore(IDB_STORE).getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => reject(req.error);
    });
}

/**
 * Limpia todo el almacén de la cola.
 */
async function idbClearCartStore() {
    const db = await openCartDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(IDB_STORE, 'readwrite');
        const req = tx.objectStore(IDB_STORE).clear();
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
    });
}

// --- Lógica de Sincronización ---

/**
 * Procesa la cola del carrito y la envía al backend.
 */
async function processCartQueue() {
    try {
        const items = await idbGetAllCartRecords();
        if (!items.length) return console.log('[SW] 🧺 Cola vacía. No se requiere sincronización.');

        // ❌ MEJORA: Eliminamos la comprobación de navigator.onLine ya que no es fiable en el SW.
        // El fetch fallará si no hay conexión y el catch manejará la persistencia.

        const endpoint = `${API_BASE_URL.replace(/\/$/, '')}/api/cart/sync`;

        console.log('[SW] 🔄 Intentando enviar cola del carrito:', items.length, 'elementos');
        
        // ✅ CORRECCIÓN CRÍTICA: Asumimos que el backend espera un array plano
        // de *todos* los objetos de compra encolados. 
        const res = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            // Enviamos todo el array de objetos que recuperamos de IndexedDB
            body: JSON.stringify({ transactions: items }) 
            // NOTA: Ajusta el nombre 'transactions' si tu backend espera otro nombre (ej: 'items', 'queue')
        });

        if (!res.ok) throw new Error(`Respuesta no OK: ${res.status} ${res.statusText}`);

        await idbClearCartStore();
        console.log('[SW] ✅ Cola sincronizada y IndexedDB limpiada.');

        // Enviar mensaje al cliente para que muestre la notificación de éxito
        const allClients = await self.clients.matchAll({ includeUncontrolled: true });
        allClients.forEach(client => client.postMessage({ type: 'CART_SYNCED', count: items.length }));

    } catch (err) {
        // La compra se mantiene en IndexedDB para el próximo evento 'sync' o 'online'
        console.warn('[SW] ⚠ No se pudo sincronizar la cola. Se reintentará más tarde:', err.message);
    }
}


// --- URLs y patterns para cache ---
const PRECACHE_URLS = [
    '/', '/index.html', '/manifest.json', '/favicon.ico',
    'index.css', 'index.js'
];
const CACHE_PATTERNS = [
    /\/assets\/.*\.(js|css)$/, /\.(png|jpg|jpeg|gif|webp|svg|ico)$/, /\/manifest\.json$/
];
function shouldAutoCache(url) {
    return CACHE_PATTERNS.some(pattern => pattern.test(url.pathname));
}

// --- Instalación ---
self.addEventListener('install', event => {
    console.log('[SW] 🔧 Instalando Service Worker...');
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache =>
            Promise.all(PRECACHE_URLS.map(url => fetch(url)
                .then(resp => resp.ok ? cache.put(url, resp) : null)
                .catch(() => null)
            ))
        ).then(() => self.skipWaiting())
    );
});

// --- Activación ---
self.addEventListener('activate', event => {
    console.log('[SW] 🚀 Activando Service Worker...');
    event.waitUntil(
        caches.keys().then(keys =>
            // ✅ CORRECCIÓN: Quitamos IDB_NAME del filtro, ya que no es un cache de la API CacheStorage.
            Promise.all(keys.filter(k => k !== CACHE_NAME && k !== RUNTIME_CACHE)
                .map(k => caches.delete(k))
            )
        ).then(() => self.clients.claim())
    );
});

// --- Fetch handler ---
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Solo manejar requests del mismo origen y GET (ignorando POST/PUT/DELETE)
    if (url.origin !== location.origin || request.method !== 'GET') {
        return;
    }

    // Estrategia: Cache-First for precached, Stale-While-Revalidate for runtime
    event.respondWith(
        // 1. Primero intentar desde cache
        caches.match(request)
            .then((cachedResponse) => {
                const networkFetch = fetch(request)
                    .then((networkResponse) => {
                        // Actualizar cache en background (Stale-While-Revalidate)
                        if (networkResponse && networkResponse.ok && shouldAutoCache(url)) {
                            caches.open(RUNTIME_CACHE).then((cache) => {
                                cache.put(request, networkResponse.clone());
                            });
                        }
                        return networkResponse;
                    })
                    .catch(() => {
                        // Fallback si la red falla y no había cache
                        if (request.headers.get('accept')?.includes('text/html')) {
                            // Devolver index.html para rutas que maneja la aplicación (App Shell)
                            return caches.match('/index.html') || new Response('Offline', { status: 503 });
                        }
                        return new Response('Recurso no disponible', { status: 503 });
                    });

                return cachedResponse || networkFetch;
            })
    );
});


// --- Mensajes desde el cliente ---
self.addEventListener('message', event => {
    const data = event.data;
    if (!data) return;

    if (data.type === 'SKIP_WAITING') self.skipWaiting();
    
    // Función CRUCIAL: Añadir ítem a IndexedDB
    if (data.type === 'QUEUE_CART_ITEM') {
        // El payload es el objeto de compra completo. Lo guardamos en IndexedDB.
        event.waitUntil(idbAddCartRecord(data.payload));
    }
    
    if (data.type === 'SET_API_BASE_URL') API_BASE_URL = data.baseUrl || API_BASE_URL;
    
    // Forzar sincronización o revisar la cola (útil al iniciar el app)
    if (data.type === 'PROCESS_CART_QUEUE') event.waitUntil(processCartQueue());
    
    if (data.type === 'CACHE_URLS') {
        const urls = data.urls || [];
        caches.open(RUNTIME_CACHE).then(cache => {
            urls.forEach(url => {
                fetch(url).then(resp => resp.ok && cache.put(url, resp));
            });
        });
    }
});

// --- Online / Offline (Fallback) ---
// El evento 'online' no es un evento nativo del Service Worker, pero muchos navegadores
// lo implementan o se puede simular a través de la comunicación con el cliente.
// Si esto se ejecuta, es una buena oportunidad para reintentar.
self.addEventListener('online', event => {
    console.log('[SW] 🌐 Conexión restaurada. Intentando sincronizar...');
    event.waitUntil(processCartQueue());
});

// --- Background Sync (Prioridad) ---
self.addEventListener('sync', event => {
    // Debe coincidir con el tag 'sync-cart' registrado en el Frontend
    if (event.tag === 'sync-cart') {
        console.log('[SW] ⏳ Evento Background Sync activado. Procesando cola...');
        event.waitUntil(processCartQueue());
    }
});

console.log('[SW] 🎬 Service Worker cargado');