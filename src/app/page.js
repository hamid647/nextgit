'use client';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext'; // Adjusted path

export default function Home() {
  const { user, logout, loading } = useAuth();

  if (loading) {
    return <p>Loading...</p>
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      gap: '20px'
    }}>
      <h1>Welcome to the Car Wash Management System</h1>
      {user ? (
        <>
          <p>Hello, {user.username} ({user.role})</p>
          {user.role === 'owner' && <Link href="/owner-dashboard" style={{ color: '#0070f3' }}>Go to Owner Dashboard</Link>}
          {user.role === 'staff' && <Link href="/staff-dashboard" style={{ color: '#0070f3' }}>Go to Staff Dashboard</Link>}
          <button onClick={logout} style={{ padding: '10px' }}>Logout</button>
        </>
      ) : (
        <>
          <Link href="/login" style={{ color: '#0070f3' }}>Login</Link>
          <Link href="/register" style={{ color: '#0070f3' }}>Register</Link>
        </>
      )}
    </div>
  );
}
