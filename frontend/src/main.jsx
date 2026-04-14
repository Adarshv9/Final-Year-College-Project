// Frontend entry point that mounts React, routing, auth, and data providers.
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
        {/* Toasts live once at the root so feature pages can trigger
            notifications without mounting their own containers. */}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#ffffff',
              color: '#0f172a',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              fontSize: '0.875rem',
            },
            success: { iconTheme: { primary: '#10b981', secondary: '#ffffff' } },
            error: { iconTheme: { primary: '#f43f5e', secondary: '#ffffff' } },
          }}
        />
      </AuthProvider>
    </QueryClientProvider>
  </StrictMode>
);
