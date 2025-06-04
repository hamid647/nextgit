'use client';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import Button from '@mui/material/Button'; // Import MUI Button
import Box from '@mui/material/Box'; // Import MUI Box for layout
import Typography from '@mui/material/Typography'; // Import MUI Typography
import Container from '@mui/material/Container'; // Import MUI Container

export default function Home() {
  const { user, logout, loading } = useAuth();

  if (loading && !user) { // Show loading only if user state isn't determined yet
    return (
      <Container component="main" maxWidth="xs" sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <Typography component="h1" variant="h5">Loading...</Typography>
      </Container>
    );
  }

  return (
    <Container component="main" maxWidth="sm">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 2, // Add some gap between elements
        }}
      >
        <Typography component="h1" variant="h4" gutterBottom>
          Welcome to the Car Wash Management System
        </Typography>
        {user ? (
          <>
            <Typography variant="h6">Hello, {user.username} ({user.role})</Typography>
            {user.role === 'owner' &&
              <Button component={Link} href="/owner-dashboard" variant="contained" color="primary">
                Go to Owner Dashboard
              </Button>
            }
            {user.role === 'staff' &&
              <Button component={Link} href="/staff-dashboard" variant="contained" color="secondary">
                Go to Staff Dashboard
              </Button>
            }
            <Button variant="outlined" onClick={logout}>
              Logout
            </Button>
          </>
        ) : (
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button component={Link} href="/login" variant="contained">
              Login
            </Button>
            <Button component={Link} href="/register" variant="outlined">
              Register
            </Button>
          </Box>
        )}
      </Box>
    </Container>
  );
}
