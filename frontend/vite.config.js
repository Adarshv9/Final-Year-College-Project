// Vite configuration for the frontend dev server and build pipeline.
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
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      // Prefer an explicit rule for `/api/v1` endpoints.
      // This avoids edge cases where the matched-prefix behavior differs between setups.
      '/api/v1': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        rewrite: (path) =>
          path.startsWith('/api/v1')
            ? path
            : `/api/v1${path.startsWith('/') ? path : `/${path}`}`,
      },
      // Keep health route available (if you use it from the frontend).
      '/api/health': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
});
