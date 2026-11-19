import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';

export default defineConfig({
  root: '.',
  plugins: [react()],
  resolve: {
    alias: {
      '@shared': resolve(process.cwd(), '../shared'),
    },
  },
  server: {
    port: 5173,
    fs: { allow: ['..'] },
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
});
