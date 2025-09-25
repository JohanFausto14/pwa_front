import { useState } from 'react';
import './Login.css';

interface User {
  username: string;
  password: string;
  name: string;
  role: string;
}

const PRECARGED_USERS: User[] = [
  {
    username: 'admin',
    password: 'admin123',
    name: 'Administrador',
    role: 'admin'
  },
  {
    username: 'usuario',
    password: 'usuario123',
    name: 'Usuario Normal',
    role: 'user'
  },
  {
    username: 'demo',
    password: 'demo123',
    name: 'Usuario Demo',
    role: 'user'
  }
];

interface LoginProps {
  onLogin: (user: User) => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const user = PRECARGED_USERS.find(
      u => u.username === username && u.password === password
    );

    if (user) {
      onLogin(user);
    } else {
      setError('Credenciales incorrectas');
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h1>PWA Dashboard</h1>
        <p className="login-subtitle">Inicia sesión para continuar</p>
        
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="username">Usuario:</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Ingresa tu usuario"
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Contraseña:</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Ingresa tu contraseña"
              required
            />
          </div>
          
          {error && <div className="error-message">{error}</div>}
          
          <button type="submit" className="login-button">
            Iniciar Sesión
          </button>
        </form>
        

      </div>
    </div>
  );
}
