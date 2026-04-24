'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [role, setRole] = useState<'member' | 'admin'>('member');
  const [email, setEmail] = useState('jean.dupont@email.com');
  const [password, setPassword] = useState('adhérent123');
  const [error, setError] = useState('');
  
  const { login } = useAuth();
  const router = useRouter();

  const handleRoleToggle = (newRole: 'member' | 'admin') => {
    setRole(newRole);
    setError('');
    if (newRole === 'member') {
      setEmail('jean.dupont@email.com');
      setPassword('adhérent123');
    } else {
      setEmail('admin@asso.fr');
      setPassword('admin2026');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    const res = await login(email, password);
    if (res.ok) {
      if (role === 'admin') {
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

        {error && <div className="login-error">{error}</div>}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label>Adresse e-mail</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Ex: jean.dupont@email.com"
              required 
            />
          </div>
          <div className="form-group">
            <label>Mot de passe</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Votre mot de passe"
              required 
            />
          </div>
          <button type="submit" className="btn btn-primary btn-full" style={{ marginTop: '10px' }}>
            Se connecter
          </button>
        </form>

        <div className="login-demo-info">
          <p><strong>Comptes de démo ({role}) :</strong></p>
          <p>Email : {role === 'member' ? 'jean.dupont@email.com' : 'admin@asso.fr'}</p>
          <p>Mot de passe : {role === 'member' ? 'adhérent123' : 'admin2026'}</p>
        </div>
      </div>
    </div>
  );
}
