import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

// Deliberately separate from vite.config.ts: that config throws if
// VITE_API_URL is unset in production mode and always loads the PWA plugin —
// neither is relevant (or safe) for a fast, isolated test run.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
  },
});
