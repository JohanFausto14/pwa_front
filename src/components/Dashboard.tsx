import { useState, useEffect } from 'react';
import './Dashboard.css'; // Importa tus estilos CSS
import PushNotificationButton from './PushNotificationButton';


// Define el tag de sincronización y la URL base de la API
const SW_SYNC_TAG = 'sync-cart';
// Usando la URL base de la API que definiste en tu backend
const API_BASE_URL = 'http://localhost:5000'; 

interface User {
    id: string;
    username: string;
    name: string;
    role: string;
    email?: string;
}

interface DashboardProps {
    user: User;
    onLogout: () => void;
}

type TabType = 'drake' | 'eminem' | 'jcole' | 'kendrick' | 'tyler' | 'settings';

interface CartItem {
    id: string;
    songName: string;
    albumName: string;
    artist: string;
    albumCover: string;
    year: number;
    price: number;
}

interface Song {
    name: string;
    album: string;
    year: number;
    duration: string;
    genre: string;
    producer: string;
    label: string;
    peakPosition: number;
    certifications: string;
    albumCover: string;
}

interface Rapper {
    name: string;
    realName: string;
    birthYear: number;
    origin: string;
    genre: string;
    label: string;
    photo: string;
    songs: Song[];
}

export default function Dashboard({ user, onLogout }: DashboardProps) {
    const [activeTab, setActiveTab] = useState<TabType>('drake');
    const [cart, setCart] = useState<CartItem[]>([]);
    const [showCart, setShowCart] = useState(false);
    const [notification, setNotification] = useState<{message: string, type: 'success' | 'error' | 'info'} | null>(null);
    const [swRegistration, setSwRegistration] = useState<ServiceWorkerRegistration | null>(null);
    const [isSyncing, setIsSyncing] = useState(false);


    const showNotification = (message: string, type: 'success' | 'error' | 'info', duration = 5000) => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), duration);
    };

    // --- SERVICE WORKER Y SINCRONIZACIÓN SETUP ---
    useEffect(() => {
        // 1. Configuración del Service Worker y Listener
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.ready
                .then(reg => {
                    setSwRegistration(reg);
                    console.log('SW listo para Background Sync.');

                    // Asegúrate de enviar la URL base de la API al SW para que construya el endpoint de sync
                    if (navigator.serviceWorker.controller) {
                        navigator.serviceWorker.controller.postMessage({
                            type: 'SET_API_BASE_URL',
                            baseUrl: API_BASE_URL
                        });
                    }
                })
                .catch(err => {
                    console.error('SW no pudo ser registrado o listo:', err);
                });

            // 2. Listener para mensajes del SW (ej. cuando la cola offline se sincroniza)
            const handleMessage = (event: MessageEvent) => {
                if (event.data && event.data.type === 'CART_SYNCED') {
                    // El SW confirma que la cola ha sido enviada con éxito
                    showNotification(`✅ ${event.data.message || `Cola OFFLINE sincronizada: ${event.data.count || ''} ítems enviados.`}`, 'success');
                    setIsSyncing(false); // Detener el indicador de sincronización
                } else if (event.data && event.data.type === 'CART_SYNC_ERROR') {
                    // El SW reporta un error de sincronización
                    showNotification(`⚠️ Error de sincronización: ${event.data.error}. ${event.data.willRetry ? 'Se reintentará automáticamente.' : ''}`, 'error');
                    setIsSyncing(false); // Detener el indicador de sincronización
                }
            };

            navigator.serviceWorker.addEventListener('message', handleMessage);

            // 3. Chequear si hay ítems pendientes en IndexedDB al cargar para mostrar el indicador
            // (Esta parte es opcional ya que el SW gestiona la cola, pero ayuda al UX)
            navigator.serviceWorker.controller?.postMessage({
                type: 'PROCESS_CART_QUEUE'
            });


            return () => {
                navigator.serviceWorker.removeEventListener('message', handleMessage);
            };
        }
    }, []);

    // Cargar carrito desde localStorage al iniciar
    useEffect(() => {
        const savedCart = localStorage.getItem('cart');
        if (savedCart) {
            try {
                setCart(JSON.parse(savedCart));
            } catch (e) {
                console.error('Error parsing cart from localStorage', e);
            }
        }
    }, []);

    // Guardar carrito en localStorage cuando cambie
    useEffect(() => {
        localStorage.setItem('cart', JSON.stringify(cart));
        // Aquí podrías agregar lógica para chequear si el carrito tiene ítems y si hay SW,
        // para mostrar el indicador de sync, pero confiamos en el SW para eso.
    }, [cart]);

    // --- FUNCIONES DEL CARRITO ---

    const addToCart = async (song: Song, artist: string) => {
        const cartItem: CartItem = {
            id: `${artist}-${song.name}-${Date.now()}`,
            songName: song.name,
            albumName: song.album,
            artist: artist,
            albumCover: song.albumCover,
            year: song.year,
            price: 9.99
        };

        // Agregar al carrito local
        setCart(prev => [...prev, cartItem]);
        
        // Guardar inmediatamente en IndexedDB para sincronización offline
        if (navigator.serviceWorker.controller) {
            try {
                navigator.serviceWorker.controller.postMessage({
                    type: 'QUEUE_CART_ITEM',
                    payload: {
                        action: 'add',
                        product: cartItem,
                        quantity: 1,
                        userId: user.username,
                        timestamp: new Date().toISOString()
                    }
                });
                console.log('[Frontend] ✅ Ítem agregado a IndexedDB para sincronización');
            } catch (error) {
                console.warn('[Frontend] ⚠️ Error guardando en IndexedDB:', error);
            }
        }
        
        // 🔔 ENVIAR NOTIFICACIÓN PUSH AL BACKEND
        try {
            const response = await fetch(`${API_BASE_URL}/api/notifications/send`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Origin': window.location.origin
                },
                body: JSON.stringify({
                    title: '🛒 Canción agregada al carrito',
                    body: `"${song.name}" de ${artist} fue agregada a tu carrito`,
                    icon: song.albumCover,
                    data: {
                        type: 'cart-add',
                        songName: song.name,
                        artist: artist,
                        timestamp: new Date().toISOString()
                    }
                })
            });

            if (response.ok) {
                console.log('[Frontend] 🔔 Notificación push enviada');
            }
        } catch (error) {
            console.warn('[Frontend] ⚠️ Error enviando notificación push:', error);
        }
        
        showNotification(`"${song.name}" agregado al carrito`, 'success', 3000);
    };

    const removeFromCart = (itemId: string) => {
        const itemToRemove = cart.find(item => item.id === itemId);
        
        // Remover del carrito local
        setCart(prev => prev.filter(item => item.id !== itemId));
        
        // También remover de IndexedDB si existe
        if (navigator.serviceWorker.controller && itemToRemove) {
            try {
                navigator.serviceWorker.controller.postMessage({
                    type: 'QUEUE_CART_ITEM',
                    payload: {
                        action: 'remove',
                        product: itemToRemove,
                        quantity: 1,
                        userId: user.username,
                        timestamp: new Date().toISOString()
                    }
                });
                console.log('[Frontend] ✅ Ítem removido de IndexedDB');
            } catch (error) {
                console.warn('[Frontend] ⚠️ Error removiendo de IndexedDB:', error);
            }
        }
        
        showNotification('Álbum eliminado del carrito', 'info', 3000);
    };

    const clearCart = () => {
        setCart([]);
        showNotification('Carrito vaciado', 'info', 3000);
    };

    /**
     * Envía la compra al Service Worker para guardarla en la cola offline (IndexedDB)
     * y registra la tarea de Background Sync.
     */
    const savePurchaseOffline = async (purchaseData: any) => {
        if (!swRegistration || !navigator.serviceWorker.controller) {
            console.error('Service Worker no está listo. No se pudo guardar offline.');
            showNotification('❌ Error: El modo offline no está listo para guardar la compra.', 'error');
            return;
        }

        setIsSyncing(true); // Mostrar indicador de sync

        // 1. Enviar el objeto de la compra (que contiene los ítems) a la cola del SW
        navigator.serviceWorker.controller.postMessage({
            type: 'QUEUE_CART_ITEM',
            payload: {
                ...purchaseData,
                // El SW usará este payload para enviar a /api/cart/sync
                queueId: Date.now() 
            }
        });

        // 2. Registrar la tarea Background Sync
        if ((swRegistration as any).sync) {
            try {
                // Registrar el tag 'sync-cart' (debe coincidir con el SW)
                await (swRegistration as any).sync.register(SW_SYNC_TAG);
                console.log('Background Sync registrado con tag:', SW_SYNC_TAG);
            } catch (err) {
                console.error('Error al registrar background sync:', err);
                setIsSyncing(false); 
            }
        } else {
            console.warn('Background Sync no disponible. El SW usará el evento "online" si está disponible.');
        }
    };

    /**
     * Fuerza la sincronización manual de la cola offline
     */
    const forceSync = async () => {
        if (!navigator.serviceWorker.controller) {
            showNotification('❌ Service Worker no disponible', 'error');
            return;
        }

        setIsSyncing(true);
        navigator.serviceWorker.controller.postMessage({
            type: 'PROCESS_CART_QUEUE'
        });
    };

    /**
     * Verifica el estado de la conexión y la cola offline
     */
    const checkSyncStatus = async () => {
        if (!navigator.serviceWorker.controller) {
            showNotification('❌ Service Worker no disponible', 'error');
            return;
        }

        navigator.serviceWorker.controller.postMessage({
            type: 'PROCESS_CART_QUEUE'
        });
    };

    const checkout = async () => {
        if (cart.length === 0) {
            showNotification('El carrito está vacío', 'error');
            return;
        }

        const purchaseData = {
            items: cart,
            userId: user.username,
            timestamp: new Date().toISOString(),
            total: cart.reduce((sum, item) => sum + item.price, 0)
        };

        try {
            // Intento de compra ONLINE a la ruta de compra real
            const response = await fetch(`${API_BASE_URL}/api/purchases`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(purchaseData)
            });

            if (!response.ok) {
                // Si hay un error del servidor (ej. 400, 500) pero hay conexión, manejamos el error
                throw new Error('Error en la compra (Respuesta del servidor no OK)');
            }

            showNotification('¡Compra realizada con éxito!', 'success');
            clearCart();
            setShowCart(false);

        } catch (error) {
            // Este catch se ejecuta si: 1) Error de red (offline), 2) fetch falla, o 3) se lanza un error porque response.ok es false.
            console.error('Error al procesar compra, guardando offline...', error);
            
            // Si el error es de red (comprueba si hay conexión)
            if (!navigator.onLine || String(error).includes("Failed to fetch")) {
                 await savePurchaseOffline(purchaseData);
                 showNotification('Compra guardada. Se procesará cuando haya conexión.', 'info');
                 clearCart(); // Vaciamos el carrito local
                 setShowCart(false);
            } else {
                // Error del servidor con conexión
                showNotification('Error al finalizar la compra. Inténtalo más tarde.', 'error');
            }
        }
    };

    // --- DATOS DE RAPPERS Y RENDERIZADO ---
    const tabs = [
        { id: 'drake' as TabType, label: 'Drake', icon: '🎤' },
        { id: 'eminem' as TabType, label: 'Eminem', icon: '🎵' },
        { id: 'jcole' as TabType, label: 'J. Cole', icon: '🎶' },
        { id: 'kendrick' as TabType, label: 'Kendrick Lamar', icon: '🎧' },
        { id: 'tyler' as TabType, label: 'Tyler The Creator', icon: '🎸' },
        { id: 'settings' as TabType, label: 'Configuración', icon: '⚙️' }
    ];

    const rappersData: Record<TabType, Rapper> = {
        drake: {
            name: 'Drake',
            realName: 'Aubrey Drake Graham',
            birthYear: 1986,
            origin: 'Toronto, Canada',
            genre: 'Hip-Hop/R&B',
            label: 'OVO Sound',
            photo: 'https://s1.ticketm.net/dam/a/825/5a19e70e-3f4d-4162-983f-1f1c11f34825_TABLET_LANDSCAPE_LARGE_16_9.jpg',
            songs: [
                {
                    name: 'God\'s Plan',
                    album: 'Scorpion',
                    year: 2018,
                    duration: '3:19',
                    genre: 'Hip-Hop',
                    producer: 'Cardo, Yung Exclusive, Boi-1da',
                    label: 'OVO Sound',
                    peakPosition: 1,
                    certifications: 'Diamond (US)',
                    albumCover: 'https://shop.islandrecords.co.uk/cdn/shop/files/SharedImage-116390.png?v=1747820658'
                },
                {
                    name: 'One Dance',
                    album: 'Views',
                    year: 2016,
                    duration: '2:54',
                    genre: 'Dancehall',
                    producer: 'Nineteen85, Wizkid, Kyla',
                    label: 'OVO Sound',
                    peakPosition: 1,
                    certifications: '6x Platinum (US)',
                    albumCover: 'https://media.gq.com/photos/5728d775655ba1b13f3b86aa/1:1/w_1024,h_1024,c_limit/views-on-views--gen-01.jpg'
                },
                {
                    name: 'Hotline Bling',
                    album: 'Views',
                    year: 2015,
                    duration: '4:27',
                    genre: 'R&B',
                    producer: 'Nineteen85',
                    label: 'OVO Sound',
                    peakPosition: 2,
                    certifications: '8x Platinum (US)',
                    albumCover: 'https://www.turntablelab.com/cdn/shop/products/drake-views-blackvinyl-1_1000x1000.jpg?v=1653509309'
                },
                {
                    name: 'In My Feelings',
                    album: 'Scorpion',
                    year: 2018,
                    duration: '3:37',
                    genre: 'Hip-Hop',
                    producer: 'BlocBoy JB, Tay Keith',
                    label: 'OVO Sound',
                    peakPosition: 1,
                    certifications: '6x Platinum (US)',
                    albumCover: 'https://shop.islandrecords.co.uk/cdn/shop/files/SharedImage-116390.png?v=1747820658'
                },
                {
                    name: "Passionfruit",
                    album: "More Life",
                    year: 2017,
                    duration: "4:58",
                    genre: "Dancehall / R&B",
                    producer: "Nana Rogues",
                    label: "Young Money Entertainment / Cash Money Records",
                    peakPosition: 8,
                    certifications: "5x Platinum (US)",
                    albumCover: "https://cdn-images.dzcdn.net/images/cover/8f0187ad83cdd1f47f1c55420f9df227/1900x1900-000000-81-0-0.jpg"
                }
            ]
        },
        eminem: {
            name: 'Eminem',
            realName: 'Marshall Bruce Mathers III',
            birthYear: 1972,
            origin: 'Detroit, Michigan',
            genre: 'Hip-Hop',
            label: 'Shady Records',
            photo: 'https://www.billboard.com/wp-content/uploads/2024/06/Eminem-press-credit-Travis-Shinn-2024-billboard-1548.jpg?w=1024',
            songs: [
                {
                    name: 'Lose Yourself',
                    album: '8 Mile Soundtrack',
                    year: 2002,
                    duration: '5:26',
                    genre: 'Hip-Hop',
                    producer: 'Eminem, Jeff Bass',
                    label: 'Shady Records',
                    peakPosition: 1,
                    certifications: 'Diamond (US)',
                    albumCover: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQtwDyq51Yj7-A-vffKBORMRKC7LzBPuPo-ww&s'
                },
                {
                    name: 'Rap God',
                    album: 'The Marshall Mathers LP 2',
                    year: 2013,
                    duration: '6:03',
                    genre: 'Hip-Hop',
                    producer: 'DVLP',
                    label: 'Shady Records',
                    peakPosition: 7,
                    certifications: '6x Platinum (US)',
                    albumCover: 'https://m.media-amazon.com/images/I/91E0tsoLNrL._UF1000,1000_QL80_.jpg'
                },
                {
                    name: 'Not Afraid',
                    album: 'Recovery',
                    year: 2010,
                    duration: '4:10',
                    genre: 'Hip-Hop',
                    producer: 'Boi-1da, Jordan Evans',
                    label: 'Shady Records',
                    peakPosition: 1,
                    certifications: '6x Platinum (US)',
                    albumCover: 'https://m.media-amazon.com/images/I/61fXEwg-lAL.jpg'
                },
                {
                    name: 'The Real Slim Shady',
                    album: 'The Marshall Mathers LP',
                    year: 2000,
                    duration: '4:44',
                    genre: 'Hip-Hop',
                    producer: 'Dr. Dre, Mel-Man',
                    label: 'Shady Records',
                    peakPosition: 4,
                    certifications: '4x Platinum (US)',
                    albumCover: 'https://2.bp.blogspot.com/-dwno-8V-R34/Vo3xPS0KW1I/AAAAAAAABos/aNieyFRR17M/s1600/The%2BMarshall%2BMathers%2BL.P..jpg'
                },
                {
                    name: 'Without Me',
                    album: 'The Eminem Show',
                    year: 2002,
                    duration: '4:50',
                    genre: 'Hip-Hop',
                    producer: 'Eminem, Jeff Bass',
                    label: 'Shady Records',
                    peakPosition: 2,
                    certifications: '4x Platinum (US)',
                    albumCover: 'https://m.media-amazon.com/images/I/410VJKV78VL._UF1000,1000_QL80_.jpg'
                }
            ]
        },
        jcole: {
            name: 'J. Cole',
            realName: 'Jermaine Lamarr Cole',
            birthYear: 1985,
            origin: 'Fayetteville, North Carolina',
            genre: 'Hip-Hop',
            label: 'Dreamville Records',
            photo: 'https://substackcdn.com/image/fetch/$s_!xx-z!,f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fbucketeer-e05bbc84-baa3-437e-9518-adb32be77984.s3.amazonaws.com%2Fpublic%2Fimages%2F118059c5-5e6f-46b5-869a-470a6e21af4b_1008x1108.png',
            songs: [
                {
                    name: 'No Role Modelz',
                    album: '2014 Forest Hills Drive',
                    year: 2014,
                    duration: '4:52',
                    genre: 'Hip-Hop',
                    producer: 'J. Cole, Phonix Beats',
                    label: 'Dreamville Records',
                    peakPosition: 36,
                    certifications: '3x Platinum (US)',
                    albumCover: 'https://i.scdn.co/image/ab67616d0000b273c6e0948bbb0681ff29cdbae8'
                },
                {
                    name: 'Middle Child',
                    album: 'Revenge of the Dreamers III',
                    year: 2019,
                    duration: '3:33',
                    genre: 'Hip-Hop',
                    producer: 'J. Cole, T-Minus',
                    label: 'Dreamville Records',
                    peakPosition: 4,
                    certifications: '2x Platinum (US)',
                    albumCover: 'https://m.media-amazon.com/images/I/61Lr47PKo8L._UF1000,1000_QL80_.jpg'
                },
                {
                    name: 'Work Out',
                    album: 'Cole World: The Sideline Story',
                    year: 2011,
                    duration: '3:43',
                    genre: 'Hip-Hop',
                    producer: 'J. Cole',
                    label: 'Dreamville Records',
                    peakPosition: 13,
                    certifications: '2x Platinum (US)',
                    albumCover: 'https://m.media-amazon.com/images/I/81Sgbb14OWL._UF1000,1000_QL80_.jpg'
                },
                {
                    name: 'Power Trip',
                    album: 'Born Sinner',
                    year: 2013,
                    duration: '4:00',
                    genre: 'Hip-Hop',
                    producer: 'J. Cole, Elite',
                    label: 'Dreamville Records',
                    peakPosition: 19,
                    certifications: '2x Platinum (US)',
                    albumCover: 'https://m.media-amazon.com/images/I/71P+5PcNfdL._UF1000,1000_QL80_.jpg'
                },
                {
                    name: 'ATM',
                    album: 'KOD',
                    year: 2018,
                    duration: '3:36',
                    genre: 'Hip-Hop',
                    producer: 'J. Cole',
                    label: 'Dreamville Records',
                    peakPosition: 6,
                    certifications: 'Platinum (US)',
                    albumCover: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRdLNgNYh33iOBF9_NOHT8ZvMaDTNJ-P8rKmw&s'
                }
            ]
        },
        kendrick: {
            name: 'Kendrick Lamar',
            realName: 'Kendrick Lamar Duckworth',
            birthYear: 1987,
            origin: 'Compton, California',
            genre: 'Hip-Hop',
            label: 'Top Dawg Entertainment',
            photo: 'https://i.pinimg.com/736x/17/71/34/17713418eb8d9624d4762da3510c83b0.jpg',
            songs: [
                {
                    name: 'HUMBLE.',
                    album: 'DAMN.',
                    year: 2017,
                    duration: '2:57',
                    genre: 'Hip-Hop',
                    producer: 'Mike Will Made It',
                    label: 'Top Dawg Entertainment',
                    peakPosition: 1,
                    certifications: '8x Platinum (US)',
                    albumCover: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSqQ0dV2DnTSfggszEZVOWx1dGnTfFDCqpvZA&s'
                },
                {
                    name: 'DNA.',
                    album: 'DAMN.',
                    year: 2017,
                    duration: '3:06',
                    genre: 'Hip-Hop',
                    producer: 'Mike Will Made It',
                    label: 'Top Dawg Entertainment',
                    peakPosition: 4,
                    certifications: '4x Platinum (US)',
                    albumCover: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSqQ0dV2DnTSfggszEZVOWx1dGnTfFDCqpvZA&s'
                },
                {
                    name: 'All the Stars',
                    album: 'Black Panther The Album Music From and Inspired By',
                    year: 2018,
                    duration: '3:52',
                    genre: 'Hip-Hop, R&B',
                    producer: 'Sounwave, Al Shux',
                    label: 'Top Dawg Entertainment, Aftermath Entertainment, Interscope Records',
                    peakPosition: 7,
                    certifications: '3x Platinum (US)',
                    albumCover: 'https://m.media-amazon.com/images/I/51XlJbrUjML._UF1000,1000_QL80_.jpg'
                },
                {
                    name: 'Swimming Pools (Drank)',
                    album: 'good kid, m.A.A.d city',
                    year: 2012,
                    duration: '5:13',
                    genre: 'Hip-Hop',
                    producer: 'T-Minus',
                    label: 'Top Dawg Entertainment',
                    peakPosition: 17,
                    certifications: '3x Platinum (US)',
                    albumCover: 'https://m.media-amazon.com/images/I/81EYtj8oi3L.jpg'
                },
                {
                    name: 'Alright',
                    album: 'To Pimp a Butterfly',
                    year: 2015,
                    duration: '3:39',
                    genre: 'Hip-Hop',
                    producer: 'Pharrell Williams',
                    label: 'Top Dawg Entertainment',
                    peakPosition: 81,
                    certifications: '2x Platinum (US)',
                    albumCover: 'https://m.media-amazon.com/images/I/81015y0a1hL._UF1000,1000_QL80_.jpg'
                }
            ]
        },
        tyler: {
            name: 'Tyler The Creator',
            realName: 'Tyler Gregory Okonma',
            birthYear: 1991,
            origin: 'Ladera Heights, California',
            genre: 'Hip-Hop/Alternative',
            label: 'Columbia Records',
            photo: 'https://i.pinimg.com/564x/6c/d5/e8/6cd5e88f5f35b4a39d85573d6276421d.jpg',
            songs: [
                {
                    name: 'EARFQUAKE',
                    album: 'IGOR',
                    year: 2019,
                    duration: '3:10',
                    genre: 'Alternative R&B',
                    producer: 'Tyler, The Creator',
                    label: 'Columbia Records',
                    peakPosition: 13,
                    certifications: '2x Platinum (US)',
                    albumCover: 'https://m.media-amazon.com/images/I/71UzjXRiGHL._UF1000,1000_QL80_.jpg'
                },
                {
                    name: 'See You Again',
                    album: 'Flower Boy',
                    year: 2017,
                    duration: '3:00',
                    genre: 'Alternative R&B',
                    producer: 'Tyler, The Creator',
                    label: 'Columbia Records',
                    peakPosition: 28,
                    certifications: 'Platinum (US)',
                    albumCover: 'https://cdn-images.dzcdn.net/images/cover/a7a16b8f63b1ec0e9fbd327619966737/0x1900-000000-80-0-0.jpg'
                },
                {
                    name: 'Yonkers',
                    album: 'Goblin',
                    year: 2011,
                    duration: '4:09',
                    genre: 'Hip-Hop',
                    producer: 'Tyler, The Creator',
                    label: 'XL Recordings',
                    peakPosition: 91,
                    certifications: 'Gold (US)',
                    albumCover: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQHz3-QN6pA5AMMux2SVGFwRziqaXndLteR2g&s'
                },
                {
                    name: 'ARE WE STILL FRIENDS?',
                    album: 'IGOR',
                    year: 2019,
                    duration: '4:25',
                    genre: 'Alternative R&B, Neo-Soul',
                    producer: 'Tyler, The Creator',
                    label: 'Columbia Records',
                    peakPosition: 68,
                    certifications: 'Platinum (US)',
                    albumCover: 'https://m.media-amazon.com/images/I/71UzjXRiGHL._UF1000,1000_QL80_.jpg'
                },
                {
                    name: "WUSYANAME",
                    album: "CALL ME IF YOU GET LOST",
                    year: 2021,
                    duration: "2:01",
                    genre: "R&B / Hip-Hop",
                    producer: "Tyler, The Creator",
                    label: "Columbia Records",
                    peakPosition: 12,
                    certifications: "2x Platinum (US)",
                    albumCover: "https://cdn.themedizine.com/2021/06/Tyler-The-Creator-Call-Me.jpg"
                }
            ]
        },
        settings: {
            name: 'Settings',
            realName: '',
            birthYear: 0,
            origin: '',
            genre: '',
            label: '',
            photo: '',
            songs: []
        }
    };
    // --- FIN DE DATOS DE RAPPERS Y RENDERIZADO ---

    const renderTabContent = () => {
        switch (activeTab) {
            case 'drake':
                return <RapperTab rapper={rappersData.drake} onAddToCart={addToCart} />;
            case 'eminem':
                return <RapperTab rapper={rappersData.eminem} onAddToCart={addToCart} />;
            case 'jcole':
                return <RapperTab rapper={rappersData.jcole} onAddToCart={addToCart} />;
            case 'kendrick':
                return <RapperTab rapper={rappersData.kendrick} onAddToCart={addToCart} />;
            case 'tyler':
                return <RapperTab rapper={rappersData.tyler} onAddToCart={addToCart} />;
            case 'settings':
                return <SettingsTab onLogout={onLogout} onForceSync={forceSync} onCheckSync={checkSyncStatus} isSyncing={isSyncing} />;
            default:
                return <RapperTab rapper={rappersData.drake} onAddToCart={addToCart} />;
        }
    };

    return (
        <div className="dashboard">
            {notification && (
                <div className={`notification notification-${notification.type}`}>
                    {notification.message}
                </div>
            )}
            
            {/* Indicador de Sincronización Pendiente */}
            {isSyncing && (
                <div className="pending-sync-indicator">
                    <span className="sync-icon">🔄</span>
                    Sincronizando compras pendientes...
                </div>
            )}

            <header className="dashboard-header">
                <div className="header-content">
                    <div className="header-left">
                        <h1>Rapper Dashboard</h1>
                        <p className="header-subtitle">Mi PWA Alvarado Fausto Ari Johan</p>
                                        <h3>Notificaciones Push</h3>
<PushNotificationButton userId={user.id} />
                    </div>
                    <div className="header-right">
                        <button className="cart-button" onClick={() => setShowCart(!showCart)}>
                            <span className="cart-icon">🛒</span>
                            {cart.length > 0 && (
                                <span className="cart-badge">{cart.length}</span>
                            )}
                        </button>
                        <div className="user-info">
                            <div className="user-avatar">
                                {user.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="user-details">
                                <span className="user-name">{user.name}</span>
                                <span className="user-role">{user.role}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {showCart && (
                <div className="cart-modal-overlay" onClick={() => setShowCart(false)}>
                    <div className="cart-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="cart-modal-header">
                            <h2>Carrito de Compras</h2>
                            <button className="close-button" onClick={() => setShowCart(false)}>✕</button>
                        </div>

                        <div className="cart-modal-content">
                            {cart.length === 0 ? (
                                <div className="empty-cart">
                                    <span className="empty-cart-icon">🛒</span>
                                    <p>Tu carrito está vacío</p>
                                </div>
                            ) : (
                                <>
                                    <div className="cart-items">
                                        {cart.map((item) => (
                                            <div key={item.id} className="cart-item">
                                                <img src={item.albumCover} alt={item.albumName} className="cart-item-image" />
                                                <div className="cart-item-info">
                                                    <h4>{item.songName}</h4>
                                                    <p className="cart-item-album">{item.albumName}</p>
                                                    <p className="cart-item-artist">{item.artist} • {item.year}</p>
                                                </div>
                                                <div className="cart-item-price">
                                                    <span>${item.price.toFixed(2)}</span>
                                                    <button
                                                        className="remove-button"
                                                        onClick={() => removeFromCart(item.id)}
                                                    >
                                                        🗑️
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="cart-summary">
                                        <div className="cart-total">
                                            <span>Total:</span>
                                            <span className="total-amount">
                                                ${cart.reduce((sum, item) => sum + item.price, 0).toFixed(2)}
                                            </span>
                                        </div>
                                        <div className="cart-actions">
                                            <button className="clear-cart-button" onClick={clearCart}>
                                                Vaciar Carrito
                                            </button>
                                            <button className="checkout-button" onClick={checkout}>
                                                Finalizar Compra
                                            </button>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <nav className="dashboard-nav">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        className={`nav-tab ${activeTab === tab.id ? 'active' : ''}`}
                        onClick={() => setActiveTab(tab.id)}
                    >
                        <span className="tab-icon">{tab.icon}</span>
                        <span className="tab-label">{tab.label}</span>
                    </button>
                ))}
            </nav>

            <main className="dashboard-content">
                {renderTabContent()}
            </main>
        </div>
    );
}

function RapperTab({ rapper, onAddToCart }: { rapper: Rapper; onAddToCart: (song: Song, artist: string) => void }) {
    if (rapper.name === 'Settings') return null;

    return (
        <div className="tab-content">
            <div className="tab-header">
                <div className="rapper-header">
                    <div className="rapper-photo">
                        <img src={rapper.photo} alt={rapper.name} />
                    </div>
                    <div className="rapper-info">
                        <h2>{rapper.name}</h2>
                        <p className="rapper-real-name">{rapper.realName}</p>
                        <div className="rapper-details">
                            <div className="detail-item">
                                <span className="detail-label">Origen:</span>
                                <span className="detail-value">{rapper.origin}</span>
                            </div>
                            <div className="detail-item">
                                <span className="detail-label">Género:</span>
                                <span className="detail-value">{rapper.genre}</span>
                            </div>
                            <div className="detail-item">
                                <span className="detail-label">Sello:</span>
                                <span className="detail-value">{rapper.label}</span>
                            </div>
                            <div className="detail-item">
                                <span className="detail-label">Año de Nacimiento:</span>
                                <span className="detail-value">{rapper.birthYear}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="songs-section">
                <h3>Top 5 Canciones Más Famosas</h3>
                <div className="songs-grid">
                    {rapper.songs.map((song, index) => (
                        <div key={index} className="song-card">
                            <div className="song-album-cover">
                                <img src={song.albumCover} alt={`${song.album} cover`} />
                            </div>
                            <div className="song-info">
                                <h4 className="song-name">{song.name}</h4>
                                <div className="song-details">
                                    <div className="song-detail">
                                        <span className="detail-label">Álbum:</span>
                                        <span className="detail-value">{song.album}</span>
                                    </div>
                                    <div className="song-detail">
                                        <span className="detail-label">Año:</span>
                                        <span className="detail-value">{song.year}</span>
                                    </div>
                                    <div className="song-detail">
                                        <span className="detail-label">Duración:</span>
                                        <span className="detail-value">{song.duration}</span>
                                    </div>
                                    <div className="song-detail">
                                        <span className="detail-label">Género:</span>
                                        <span className="detail-value">{song.genre}</span>
                                    </div>
                                    <div className="song-detail">
                                        <span className="detail-label">Productor:</span>
                                        <span className="detail-value">{song.producer}</span>
                                    </div>
                                    <div className="song-detail">
                                        <span className="detail-label">Sello:</span>
                                        <span className="detail-value">{song.label}</span>
                                    </div>
                                    <div className="song-detail">
                                        <span className="detail-label">Posición Máxima:</span>
                                        <span className="detail-value">#{song.peakPosition}</span>
                                    </div>
                                    <div className="song-detail">
                                        <span className="detail-label">Certificaciones:</span>
                                        <span className="detail-value">{song.certifications}</span>
                                    </div>
                                </div>
                                <button
                                    className="add-to-cart-button"
                                    onClick={() => onAddToCart(song, rapper.name)}
                                >
                                    🛒 Agregar al Carrito - $9.99
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

interface SettingsTabProps {
    onLogout: () => void;
    onForceSync: () => void;
    onCheckSync: () => void;
    isSyncing: boolean;
}

function SettingsTab({ onLogout, onForceSync, onCheckSync, isSyncing }: SettingsTabProps) {
    return (
        <div className="tab-content">
            <div className="tab-header">
                <h2>Configuración del Sistema</h2>
                <p>Gestiona la configuración de tu cuenta y preferencias</p>
            </div>

            <div className="settings-sections">
                <div className="settings-section">
                    <h3>Sincronización Offline</h3>
                    <div className="setting-item">
                        <label>Estado de sincronización</label>
                        <div className="sync-status">
                            {isSyncing ? (
                                <span className="sync-indicator syncing">🔄 Sincronizando...</span>
                            ) : (
                                <span className="sync-indicator ready">✅ Listo para sincronizar</span>
                            )}
                        </div>
                    </div>
                    <div className="setting-item">
                        <label>Acciones de sincronización</label>
                        <div className="sync-actions">
                            <button 
                                className="sync-button" 
                                onClick={onCheckSync}
                                disabled={isSyncing}
                            >
                                🔍 Verificar Estado
                            </button>
                            <button 
                                className="sync-button primary" 
                                onClick={onForceSync}
                                disabled={isSyncing}
                            >
                                🔄 Forzar Sincronización
                            </button>
                        </div>
                    </div>
                    <div className="setting-item">
                        <label>Auto-guardado offline</label>
                        <input type="checkbox" defaultChecked />
                    </div>
                    <div className="setting-item">
                        <label>Sincronización automática</label>
                        <input type="checkbox" defaultChecked />
                    </div>
                </div>

                <div className="settings-section">
                    <h3>Configuración de Cuenta</h3>
                    <div className="setting-item">
                        <label>Notificaciones por email</label>
                        <input type="checkbox" defaultChecked />
                    </div>
                    <div className="setting-item">
                        <label>Notificaciones push</label>
                        <input type="checkbox" defaultChecked />
                    </div>
                    <div className="setting-item">
                        <label>Modo oscuro</label>
                        <input type="checkbox" />
                    </div>
                    <div className="setting-item">
                        <label>Idioma</label>
                        <select>
                            <option>Español</option>
                            <option>English</option>
                        </select>
                    </div>
                </div>

                <div className="settings-section">
                    <h3>Configuración del Sistema</h3>
                    <div className="setting-item">
                        <label>Modo offline</label>
                        <input type="checkbox" defaultChecked />
                    </div>
                    <div className="setting-item">
                        <label>Cache de recursos</label>
                        <input type="checkbox" defaultChecked />
                    </div>
                </div>

                <div className="settings-section">
                    <h3>Seguridad</h3>
                    <div className="setting-item">
                        <label>Autenticación de dos factores</label>
                        <input type="checkbox" />
                    </div>
                    <div className="setting-item">
                        <label>Historial de sesiones</label>
                        <input type="checkbox" defaultChecked />
                    </div>
                </div>

                <div className="settings-section">
                    <h3>Acciones</h3>
                    <button className="logout-button" onClick={onLogout}>
                        Cerrar Sesión
                    </button>
                </div>
            </div>
        </div>
    );
}
