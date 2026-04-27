'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [role, setRole] = useState<'member' | 'admin'>('member');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const { login } = useAuth();
  const router = useRouter();

  const handleRoleToggle = (newRole: 'member' | 'admin') => {
    setRole(newRole);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const res = await login(email, password);
    if (res.ok) {
      // Utiliser le rôle retourné par l'API, pas le bouton toggle
      if (res.role === 'admin') {
        router.push('/admin');
      } else {
        router.push('/');
      }
    } else {
      setError(res.error || 'Erreur de connexion');
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <div className="brand-icon" style={{ margin: '0 auto 16px' }}>GA</div>
          <h2>Connexion</h2>
          <p>Accédez à votre espace Gestion Adhérents</p>
        </div>

        <div className="role-toggle">
          <button
            type="button"
            className={`toggle-btn ${role === 'member' ? 'active' : ''}`}
            onClick={() => handleRoleToggle('member')}
          >
            Espace Adhérent
          </button>
          <button
            type="button"
            className={`toggle-btn ${role === 'admin' ? 'active' : ''}`}
            onClick={() => handleRoleToggle('admin')}
          >
            Espace Administrateur
          </button>
        </div>

        {error && <div className="login-error" style={{ color: 'red', fontWeight: 'bold' }}>{error}</div>}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label>Adresse e-mail</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Ex: jean.dupont@email.com"
            /* J'ai retiré le "required" pour le test */
            />
          </div>
          <div className="form-group">
            <label>Mot de passe</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Votre mot de passe"
            /* J'ai retiré le "required" pour le test */
            />
          </div>
          <button type="submit" className="btn btn-primary btn-full" style={{ marginTop: '10px' }}>
            Se connecter
          </button>
        </form>
      </div>
    </div>
  );
}