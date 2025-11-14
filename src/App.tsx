import { useState, useEffect } from 'react';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import AdminPanel from './components/AdminPanel';
import './App.css';

interface User {
  id: string;
  username: string;
  name: string;
  role: string;
  email: string;
}

type ViewType = 'login' | 'register';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<ViewType>('login');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Verificar si hay un usuario guardado y token válido
    const savedUser = localStorage.getItem('pwa-user');
    const savedToken = localStorage.getItem('auth-token');
    
    if (savedUser && savedToken) {
      try {
        const userData = JSON.parse(savedUser);
        setUser(userData);
        setAuthToken(savedToken);
      } catch (error) {
        console.error('Error parsing saved user:', error);
        localStorage.removeItem('pwa-user');
        localStorage.removeItem('auth-token');
      }
    }
    
    setIsLoading(false);
  }, []);

  const handleLogin = (userData: User, token: string) => {
    setUser(userData);
    setAuthToken(token);
    localStorage.setItem('pwa-user', JSON.stringify(userData));
    localStorage.setItem('auth-token', token);
    console.log('✅ Usuario autenticado:', userData.username, '- Rol:', userData.role);
  };

  const handleRegister = (userData: User, token: string) => {
    setUser(userData);
    setAuthToken(token);
    localStorage.setItem('pwa-user', JSON.stringify(userData));
    localStorage.setItem('auth-token', token);
    console.log('✅ Usuario registrado:', userData.username);
  };

  const handleLogout = () => {
    setUser(null);
    setAuthToken(null);
    localStorage.removeItem('pwa-user');
    localStorage.removeItem('auth-token');
    console.log('👋 Sesión cerrada');
  };

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Cargando aplicación...</p>
      </div>
    );
  }

  // Si el usuario está autenticado
  if (user && authToken) {
    // Si es admin, mostrar el panel de admin
    if (user.role === 'admin') {
      return <AdminPanel onLogout={handleLogout} />;
    }
    
    // Usuario normal - mostrar dashboard
    return <Dashboard user={user} onLogout={handleLogout} />;
  }

  // Usuario no autenticado - mostrar login o registro
  return (
    <div className="app">
      {currentView === 'login' ? (
        <Login
          onLogin={handleLogin}
          onSwitchToRegister={() => setCurrentView('register')}
        />
      ) : (
        <Register
          onRegisterSuccess={handleRegister}
          onSwitchToLogin={() => setCurrentView('login')}
        />
      )}
    </div>
  );
}

export default App;