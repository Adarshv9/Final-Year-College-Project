// Configures the Vite build and development server.

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  server: {
    port: 5173,
    proxy: {


      '/api/v1': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        rewrite: (path) =>
        path.startsWith('/api/v1') ?
        path :
        `/api/v1${path.startsWith('/') ? path : `/${path}`}`
      },

      '/api/health': {
        target: 'http://localhost:5000',
        changeOrigin: true
      }
    }
  }
});