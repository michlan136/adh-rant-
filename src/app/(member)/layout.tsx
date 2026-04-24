'use client';

import { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

export default function MemberLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
      } else if (user.role === 'admin') {
        router.push('/admin');
      }
    }
  }, [user, loading, router]);

  if (loading || !user || user.role !== 'member') {
    return <div className="loading-screen" style={{height: "100vh", display: "grid", placeItems: "center"}}>Chargement...</div>;
  }

  return <>{children}</>;
}
