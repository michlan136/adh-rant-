'use client';

import { useState, useEffect } from 'react';

interface DBNotification {
  id: number;
  titre: string;
  message: string;
  type_notif: string;
  date: string;
  lu: boolean;
}

const preferences = [
  'Nouveaux événements disponibles',
  "Rappels d'expiration de carte",
  "Confirmations d'inscription",
  'Nouveaux documents',
  'Newsletters mensuelles',
];

const CalIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="11" height="11">
    <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const ClockIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="11" height="11">
    <circle cx="12" cy="12" r="10" /><polyline points="12,6 12,12 16,14" />
  </svg>
);

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await fetch('/api/adherents/me/notifications', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('ga_auth_token')}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          const mapped = data.map((n: DBNotification) => {
            let color = 'blue';
            let icon = <circle cx="12" cy="12" r="10" />;
            
            if (n.type_notif === 'alerte') {
              color = 'orange';
              icon = <><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></>;
            } else if (n.type_notif === 'succes') {
              color = 'green';
              icon = <polyline points="20,6 9,17 4,12" />;
            } else if (n.type_notif === 'rappel') {
              color = 'purple';
              icon = <><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></>;
            }
            
            // Extrait la date et l'heure de la chaîne "13 mai 2026 à 14:30"
            const parts = n.date.split(' à ');
            
            return {
              color,
              icon,
              title: n.titre,
              desc: n.message,
              date: parts[0] || n.date,
              time: parts[1] || '',
              unread: !n.lu,
            };
          });
          setNotifications(mapped);
        }
      } catch (err) {
        console.error("Erreur fetch notifications:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  const unreadCount = notifications.filter(n => n.unread).length;

  return (
    <div className="page-enter">
      <div className="page-header">
        <h2>Notifications</h2>
        <p>Restez informé de toutes vos activités</p>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{unreadCount} notification{unreadCount > 1 ? 's' : ''} non lue{unreadCount > 1 ? 's' : ''}</span>
        <button className="btn btn-secondary" style={{ padding: '7px 14px', fontSize: 12 }}>Tout marquer comme lu</button>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-body">
          {loading ? (
            <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>Chargement...</div>
          ) : notifications.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>Aucune notification.</div>
          ) : (
            <div className="notif-list">
              {notifications.map((notif, i) => (
                <div key={i} className={`notif-item ${notif.unread ? 'unread' : ''}`}>
                  <div className={`notif-dot ${notif.color}`}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="15" height="15">
                      {notif.icon}
                    </svg>
                  </div>
                  <div className="notif-content">
                    <h4>{notif.title}</h4>
                    <p>{notif.desc}</p>
                    <div className="meta">
                      <CalIcon /> {notif.date}
                      {notif.time && <><ClockIcon /> {notif.time}</>}
                    </div>
                  </div>
                  {notif.unread && <div className="unread-dot"></div>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="prefs-card">
        <div className="prefs-title">
          <svg viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="15" height="15">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
            <polyline points="22,6 12,13 2,6" />
          </svg>
          Préférences de notification
        </div>
        {preferences.map((pref, i) => (
          <div key={i} className="pref-row" style={i === preferences.length - 1 ? { marginBottom: 0 } : {}}>
            <span>{pref}</span>
            <div className="pref-check">
              <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" width="10" height="10">
                <polyline points="20,6 9,17 4,12" />
              </svg>
            </div>
          </div>
        ))}
        <button className="btn btn-primary" style={{ marginTop: 14 }}>Enregistrer les préférences</button>
      </div>
    </div>
  );
}
