import { useState, useEffect } from 'react';

// ==========================================
// UTILIDADES PUSH NOTIFICATIONS
// ==========================================

const API_BASE_URL = 'http://localhost:5000';

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

function isPushNotificationSupported(): boolean {
  return 'serviceWorker' in navigator &&
         'PushManager' in window &&
         'Notification' in window;
}

function getNotificationPermission(): NotificationPermission {
  if (!('Notification' in window)) {
    return 'denied';
  }
  return Notification.permission;
}

async function requestNotificationPermission(): Promise<NotificationPermission> {
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

async function subscribeToPushNotifications(userId?: string): Promise<PushSubscription | null> {
  try {
    if (!isPushNotificationSupported()) {
      throw new Error('Push notifications no soportadas');
    }

    const permission = await requestNotificationPermission();
    if (permission !== 'granted') {
      console.warn('Permiso de notificaciones denegado');
      return null;
    }

    const registration = await navigator.serviceWorker.ready;
    let subscription = await registration.pushManager.getSubscription();
    
    if (subscription) {
      console.log('✅ Ya existe una suscripción push');
      return subscription;
    }

    const vapidPublicKey = await getVapidPublicKey();
    const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);

    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: convertedVapidKey as BufferSource
    });

    console.log('🔔 Suscripción push creada:', subscription);

    await savePushSubscription(subscription, userId);

    return subscription;
  } catch (error) {
    console.error('Error suscribiéndose a push notifications:', error);
    throw error;
  }
}

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

async function unsubscribeFromPushNotifications(): Promise<boolean> {
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

    const successful = await subscription.unsubscribe();

    if (successful) {
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

async function isSubscribedToPush(): Promise<boolean> {
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

// ==========================================
// COMPONENTE PRINCIPAL (DISEÑO MEJORADO)
// ==========================================

export default function PushNotificationButton() {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSupported, setIsSupported] = useState(true);

  useEffect(() => {
    checkSubscriptionStatus();
  }, []);

  const checkSubscriptionStatus = async () => {
    const supported = isPushNotificationSupported();
    setIsSupported(supported);

    if (!supported) return;

    const subscribed = await isSubscribedToPush();
    setIsSubscribed(subscribed);

    const currentPermission = getNotificationPermission();
    setPermission(currentPermission);
  };

  const handleSubscribe = async () => {
    setIsLoading(true);
    try {
      const subscription = await subscribeToPushNotifications(); 
      
      if (subscription) {
        setIsSubscribed(true);
        setPermission('granted');
        alert('✅ ¡Suscripción exitosa! Ahora recibirás notificaciones push.');
      } else {
        alert('⚠️ No se pudo completar la suscripción. Por favor, verifica los permisos.');
      }
    } catch (error) {
      console.error('Error en suscripción:', error);
      alert('❌ Error al suscribirse a notificaciones push');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnsubscribe = async () => {
    setIsLoading(true);
    try {
      const success = await unsubscribeFromPushNotifications();
      
      if (success) {
        setIsSubscribed(false);
        alert('✅ Desuscripción exitosa');
      } else {
        alert('⚠️ No se pudo completar la desuscripción');
      }
    } catch (error) {
      console.error('Error en desuscripción:', error);
      alert('❌ Error al desuscribirse');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isSupported) {
    return null;
  }

  if (permission === 'denied') {
    return null;
  }

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0',
      gap: '1rem'
    }}>
      {/* Label con emoji */}
      <label style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        fontSize: '0.95rem',
        color: '#2d3748',
        margin: 0,
        cursor: 'pointer'
      }}>
        <span style={{ fontSize: '1.2rem' }}>🔔</span>
        Notificaciones push
      </label>

      {/* Toggle Switch estilo iOS */}
      <div style={{ position: 'relative' }}>
        <input
          type="checkbox"
          checked={isSubscribed}
          onChange={isSubscribed ? handleUnsubscribe : handleSubscribe}
          disabled={isLoading}
          id="push-toggle"
          style={{
            position: 'absolute',
            opacity: 0,
            width: 0,
            height: 0
          }}
        />
        <label
          htmlFor="push-toggle"
          style={{
            display: 'block',
            width: '50px',
            height: '26px',
            backgroundColor: isSubscribed ? '#48bb78' : '#cbd5e0',
            borderRadius: '13px',
            position: 'relative',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            transition: 'background-color 0.3s ease',
            opacity: isLoading ? 0.5 : 1
          }}
        >
          <span style={{
            content: '""',
            position: 'absolute',
            top: '2px',
            left: isSubscribed ? '26px' : '2px',
            width: '22px',
            height: '22px',
            backgroundColor: '#ffffff',
            borderRadius: '50%',
            transition: 'left 0.3s ease',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {isLoading && (
              <svg
                style={{
                  width: '12px',
                  height: '12px',
                  animation: 'spin 1s linear infinite'
                }}
                viewBox="0 0 24 24"
              >
                <circle
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="#718096"
                  strokeWidth="3"
                  fill="none"
                  strokeDasharray="31.4 31.4"
                />
              </svg>
            )}
          </span>
        </label>

        <style>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  );
}