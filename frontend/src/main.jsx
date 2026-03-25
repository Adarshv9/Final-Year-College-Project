import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import queryClient from './lib/queryClient';
import { AuthProvider } from './context/AuthContext';
import AppRouter from './router/index';
import './index.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppRouter />
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#131929',
              color: '#e2e8f0',
              border: '1px solid #1e2a3d',
              borderRadius: '12px',
              fontSize: '0.875rem',
            },
            success: { iconTheme: { primary: '#10b981', secondary: '#131929' } },
            error: { iconTheme: { primary: '#f43f5e', secondary: '#131929' } },
          }}
        />
      </AuthProvider>
    </QueryClientProvider>
  </StrictMode>
);
