'use client'; // Required for ThemeProvider and createTheme
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '../context/AuthContext';

import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

// Define a basic theme (can be customized further)
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2', // Example primary color (MUI default blue)
    },
    secondary: {
      main: '#dc004e', // Example secondary color (MUI default pink)
    },
  },
  typography: {
    fontFamily: [
      'var(--font-geist-sans)', // Use Geist Sans from existing setup
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
      '"Apple Color Emoji"',
      '"Segoe UI Emoji"',
      '"Segoe UI Symbol"',
    ].join(','),
  }
});

export default function RootLayout({ children }) {
  // metadata export cannot be in a 'use client' file.
  // We'll keep it simple for now. If title/description needs to be dynamic,
  // it would require a different approach or moving metadata to a server component parent.
  // For this step, focusing on MUI integration.

  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <ThemeProvider theme={theme}>
          <CssBaseline /> {/* Normalize CSS and apply baseline styles */}
          <AuthProvider>
            {children}
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

// It's good practice to keep metadata export separate if RootLayout becomes 'use client'.
// However, Next.js 13+ app router handles this. We'll assume this structure is fine for now.
// If build errors occur due to metadata in 'use client', it would need refactoring.
// For now, let's add a separate metadata export if possible, or acknowledge it.
// The `export const metadata` should ideally be in a server component.
// Since layout.js is now 'use client', we'd typically handle metadata in page.js files
// or a higher-order server component layout if global metadata is needed.
// For this subtask, the primary goal is MUI setup.
