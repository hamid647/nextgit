'use client';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function Dashboard() {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    } else if (!loading && user) {
      if (user.role === 'owner') router.replace('/owner-dashboard');
      else if (user.role === 'staff') router.replace('/staff-dashboard');
    }
  }, [user, loading, isAuthenticated, router]);

  if (loading || !isAuthenticated) {
    return <p>Loading...</p>;
  }

  return (
    <div style={{ padding: '20px' }}>
      <h1>Generic Dashboard</h1>
      <p>Welcome, {user?.username}!</p>
      <p>Your role is: {user?.role}</p>
      <button onClick={logout} style={{ padding: '10px', marginTop: '20px' }}>Logout</button>
    </div>
  );
}
