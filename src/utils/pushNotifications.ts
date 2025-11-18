// src/utils/pushNotifications.ts

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

/**
 * Convierte una clave pública VAPID base64 a Uint8Array
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Verifica si las notificaciones push están soportadas
 */
export function isPushNotificationSupported(): boolean {
  return 'serviceWorker' in navigator && 
         'PushManager' in window && 
         'Notification' in window;
}

/**
 * Obtiene el estado actual del permiso de notificaciones
 */
export function getNotificationPermission(): NotificationPermission {
  if (!('Notification' in window)) {
    return 'denied';
  }
  return Notification.permission;
}

/**
 * Solicita permiso para mostrar notificaciones
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    console.warn('Este navegador no soporta notificaciones');
    return 'denied';
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  if (Notification.permission === 'default') {
    const permission = await Notification.requestPermission();
    return permission;
  }

  return Notification.permission;
}

/**
 * Obtiene la clave pública VAPID del servidor
 */
async function getVapidPublicKey(): Promise<string> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/notifications/vapid-public-key`);
    const data = await response.json();
    
    if (!data.success || !data.publicKey) {
      throw new Error('No se pudo obtener la clave pública VAPID');
    }
    
    return data.publicKey;
  } catch (error) {
    console.error('Error obteniendo clave VAPID:', error);
    throw error;
  }
}

/**
 * Suscribe al usuario a notificaciones push
 */
export async function subscribeToPushNotifications(userId?: string): Promise<PushSubscription | null> {
  try {
    // 1. Verificar soporte
    if (!isPushNotificationSupported()) {
      throw new Error('Push notifications no soportadas');
    }

    // 2. Solicitar permiso
    const permission = await requestNotificationPermission();
    if (permission !== 'granted') {
      console.warn('Permiso de notificaciones denegado');
      return null;
    }

    // 3. Obtener Service Worker registration
    const registration = await navigator.serviceWorker.ready;

    // 4. Verificar si ya existe una suscripción
    let subscription = await registration.pushManager.getSubscription();
    
    if (subscription) {
      console.log('✅ Ya existe una suscripción push');
      return subscription;
    }

    // 5. Obtener clave pública VAPID
    const vapidPublicKey = await getVapidPublicKey();
    const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);

    // 6. Crear nueva suscripción
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: convertedVapidKey as BufferSource
    });

    console.log('🔔 Suscripción push creada:', subscription);

    // 7. Enviar suscripción al servidor
    await savePushSubscription(subscription, userId);

    return subscription;
  } catch (error) {
    console.error('Error suscribiéndose a push notifications:', error);
    throw error;
  }
}

/**
 * Guarda la suscripción push en el servidor
 */
async function savePushSubscription(
  subscription: PushSubscription, 
  userId?: string
): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/notifications/subscribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        subscription: subscription.toJSON(),
        userId: userId || null
      })
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message || 'Error guardando suscripción');
    }

    console.log('✅ Suscripción guardada en el servidor');
  } catch (error) {
    console.error('Error guardando suscripción:', error);
    throw error;
  }
}

/**
 * Cancela la suscripción a notificaciones push
 */
export async function unsubscribeFromPushNotifications(): Promise<boolean> {
  try {
    if (!isPushNotificationSupported()) {
      return false;
    }

    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      console.log('No hay suscripción activa');
      return true;
    }

    // Desuscribir en el navegador
    const successful = await subscription.unsubscribe();

    if (successful) {
      // Notificar al servidor
      await fetch(`${API_BASE_URL}/api/notifications/unsubscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          endpoint: subscription.endpoint
        })
      });

      console.log('✅ Desuscripción exitosa');
    }

    return successful;
  } catch (error) {
    console.error('Error desuscribiéndose:', error);
    return false;
  }
}

/**
 * Muestra una notificación local (sin push)
 */
export async function showLocalNotification(
  title: string, 
  options?: NotificationOptions
): Promise<void> {
  try {
    const permission = await requestNotificationPermission();
    
    if (permission !== 'granted') {
      console.warn('Permiso de notificaciones denegado');
      return;
    }

    const registration = await navigator.serviceWorker.ready;
    
    await registration.showNotification(title, {
      icon: '/icon-192x192.png',
      badge: '/icon-72x72.png',
      ...options
    });

    console.log('✅ Notificación local mostrada');
  } catch (error) {
    console.error('Error mostrando notificación local:', error);
  }
}

/**
 * Verifica si el usuario está suscrito a push notifications
 */
export async function isSubscribedToPush(): Promise<boolean> {
  try {
    if (!isPushNotificationSupported()) {
      return false;
    }

    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    return subscription !== null;
  } catch (error) {
    console.error('Error verificando suscripción:', error);
    return false;
  }
}