import { useState, useEffect } from 'react';
import './AdminPanel.css';

const API_BASE_URL = 'https://pwa-back-rgyn.onrender.com';

interface User {
  id: string;
  username: string;
  name: string;
  email: string;
  role: string;
  subscriptionCount: number;
}

interface AdminPanelProps {
  onLogout: () => void;
}

// 🔔 NOTIFICACIONES PREDEFINIDAS
const PREDEFINED_NOTIFICATIONS = [
  {
    id: 'custom',
    label: '✏️ Personalizada',
    title: '',
    body: '',
    icon: '/icon-192x192.png'
  },
  {
    id: 'welcome',
    label: '👋 Bienvenida',
    title: '¡Bienvenido a Rapper Dashboard!',
    body: 'Gracias por unirte a nuestra comunidad musical. Explora las mejores canciones de tus artistas favoritos.',
    icon: '/icon-192x192.png'
  },
  {
    id: 'discount',
    label: '💰 Descuento',
    title: '¡Oferta especial del 50%!',
    body: 'Por tiempo limitado: 50% de descuento en todas las canciones. ¡No te lo pierdas!',
    icon: '/icon-192x192.png'
  },
  {
    id: 'new_music',
    label: '🎵 Nueva música',
    title: '¡Nueva música disponible!',
    body: 'Se han agregado nuevas canciones de tus artistas favoritos. ¡Descúbrelas ahora!',
    icon: '/icon-192x192.png'
  },
  {
    id: 'cart_reminder',
    label: '🛒 Recordatorio de carrito',
    title: 'Tienes canciones en tu carrito',
    body: 'No olvides completar tu compra. Las canciones en tu carrito te están esperando.',
    icon: '/icon-192x192.png'
  },
  {
    id: 'exclusive',
    label: '⭐ Contenido exclusivo',
    title: 'Contenido exclusivo para ti',
    body: 'Accede a canciones exclusivas y lanzamientos anticipados. ¡Solo para miembros premium!',
    icon: '/icon-192x192.png'
  },
  {
    id: 'limited',
    label: '⏰ Oferta limitada',
    title: '¡Última oportunidad!',
    body: 'La oferta especial termina pronto. Aprovecha los descuentos antes de que sea demasiado tarde.',
    icon: '/icon-192x192.png'
  }
];

export default function AdminPanel({ onLogout }: AdminPanelProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('custom');
  const [notificationData, setNotificationData] = useState({
    title: '',
    body: '',
    icon: '/icon-192x192.png'
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const getAuthToken = () => {
    return localStorage.getItem('auth-token');
  };

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const token = getAuthToken();
      const response = await fetch(`${API_BASE_URL}/api/admin/users/subscribed`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Error al cargar usuarios');
      }

      const data = await response.json();
      setUsers(data.users);
    } catch (error) {
      console.error('Error cargando usuarios:', error);
      showMessage('error', 'Error al cargar usuarios');
    } finally {
      setIsLoading(false);
    }
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  // Manejar cambio de template
  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplate(templateId);
    const template = PREDEFINED_NOTIFICATIONS.find(t => t.id === templateId);
    
    if (template) {
      setNotificationData({
        title: template.title,
        body: template.body,
        icon: template.icon
      });
    }
  };

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedUser) {
      showMessage('error', 'Por favor selecciona un usuario');
      return;
    }

    if (!notificationData.title || !notificationData.body) {
      showMessage('error', 'Por favor completa todos los campos');
      return;
    }

    setIsSending(true);

    try {
      const token = getAuthToken();
      const response = await fetch(`${API_BASE_URL}/api/admin/send-notification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          userId: selectedUser,
          title: notificationData.title,
          body: notificationData.body,
          icon: notificationData.icon
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error al enviar notificación');
      }

      showMessage('success', `✅ Notificación enviada a ${data.recipient.username}`);
      
      // Limpiar formulario
      setNotificationData({
        title: '',
        body: '',
        icon: '/icon-192x192.png'
      });
      setSelectedUser('');
      setSelectedTemplate('custom');
    } catch (error) {
      console.error('Error enviando notificación:', error);
      showMessage('error', error instanceof Error ? error.message : 'Error al enviar notificación');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="admin-panel">
      <div className="admin-header">
        <div className="admin-header-content">
          <div>
            <h1>👨‍💼 Panel de Administrador</h1>
            <p>Gestión de notificaciones push</p>
          </div>
          <button className="logout-btn" onClick={onLogout}>
            Cerrar Sesión
          </button>
        </div>
      </div>

      {message && (
        <div className={`admin-message ${message.type}`}>
          {message.type === 'success' ? '✅' : '❌'} {message.text}
        </div>
      )}

      <div className="admin-content">
        <div className="admin-section">
          <h2>📤 Enviar Notificación Push</h2>
          
          {isLoading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Cargando usuarios...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="empty-state">
              <span className="empty-icon">📭</span>
              <p>No hay usuarios suscritos a notificaciones</p>
            </div>
          ) : (
            <form onSubmit={handleSendNotification} className="notification-form">
              {/* SELECTOR DE USUARIO */}
              <div className="form-group">
                <label htmlFor="user-select">
                  Seleccionar Usuario ({users.length} suscritos)
                </label>
                <select
                  id="user-select"
                  value={selectedUser}
                  onChange={(e) => setSelectedUser(e.target.value)}
                  disabled={isSending}
                  required
                >
                  <option value="">-- Selecciona un usuario --</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name} (@{user.username}) - {user.subscriptionCount} dispositivo(s)
                    </option>
                  ))}
                </select>
              </div>

              {/* SELECTOR DE PLANTILLA */}
              <div className="form-group">
                <label htmlFor="template-select">
                  🎯 Tipo de Notificación
                </label>
                <select
                  id="template-select"
                  value={selectedTemplate}
                  onChange={(e) => handleTemplateChange(e.target.value)}
                  disabled={isSending}
                  className="template-select"
                >
                  {PREDEFINED_NOTIFICATIONS.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* PREVIEW DE LA PLANTILLA */}
              {selectedTemplate !== 'custom' && (
                <div className="notification-preview">
                  <div className="preview-header">
                    <span className="preview-icon">👁️</span>
                    <span>Vista previa</span>
                  </div>
                  <div className="preview-notification">
                    <div className="preview-title">{notificationData.title}</div>
                    <div className="preview-body">{notificationData.body}</div>
                  </div>
                </div>
              )}

              {/* CAMPOS EDITABLES */}
              <div className="form-group">
                <label htmlFor="notification-title">
                  Título {selectedTemplate === 'custom' && '(obligatorio)'}
                </label>
                <input
                  type="text"
                  id="notification-title"
                  value={notificationData.title}
                  onChange={(e) => setNotificationData({ ...notificationData, title: e.target.value })}
                  placeholder="Escribe el título de la notificación"
                  disabled={isSending || selectedTemplate !== 'custom'}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="notification-body">
                  Mensaje {selectedTemplate === 'custom' && '(obligatorio)'}
                </label>
                <textarea
                  id="notification-body"
                  value={notificationData.body}
                  onChange={(e) => setNotificationData({ ...notificationData, body: e.target.value })}
                  placeholder="Escribe el mensaje completo..."
                  rows={4}
                  disabled={isSending || selectedTemplate !== 'custom'}
                  required
                />
              </div>

              <button
                type="submit"
                className="send-button"
                disabled={isSending || !selectedUser}
              >
                {isSending ? '📤 Enviando...' : '📤 Enviar Notificación'}
              </button>
            </form>
          )}
        </div>

        <div className="admin-section">
          <h2>👥 Usuarios Suscritos ({users.length})</h2>
          
          {isLoading ? (
            <div className="loading-state">
              <div className="spinner"></div>
            </div>
          ) : (
            <div className="users-list">
              {users.map((user) => (
                <div key={user.id} className="user-card">
                  <div className="user-avatar">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="user-info">
                    <h3>{user.name}</h3>
                    <p>@{user.username}</p>
                    <span className="device-count">
                      🔔 {user.subscriptionCount} dispositivo(s)
                    </span>
                  </div>
                </div>
              ))}

              {users.length === 0 && (
                <div className="empty-state">
                  <p>No hay usuarios suscritos</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}