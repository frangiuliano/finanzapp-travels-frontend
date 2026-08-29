import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
import basicSsl from '@vitejs/plugin-basic-ssl';

export default defineConfig(({ mode }) => {
  if (mode === 'production' && !process.env.VITE_API_URL) {
    throw new Error('VITE_API_URL must be set for production builds');
  }

  return {
    server: {
      proxy: {
        '/api': {
          target: 'http://localhost:8080',
          changeOrigin: true,
        },
      },
    },
    plugins: [
      react(),
      tailwindcss(),
      ...(process.env.NODE_ENV === 'development' &&
      process.env.VITE_USE_HTTPS === 'true'
        ? [basicSsl()]
        : []),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'apple-touch-icon.png'],
        devOptions: {
          enabled: true,
          type: 'module',
        },
        manifest: {
          name: 'FinanzApp',
          short_name: 'FinanzApp',
          description: 'Finanzas cotidianas y tableros de viaje',
          theme_color: '#1F7A6C',
          background_color: '#F7FAF9',
          display: 'standalone',
          orientation: 'portrait',
          scope: '/',
          start_url: '/home',
          icons: [
            {
              src: 'web-app-manifest-192x192.png',
              sizes: '192x192',
              type: 'image/png',
            },
            {
              src: 'web-app-manifest-512x512.png',
              sizes: '512x512',
              type: 'image/png',
            },
            {
              src: 'web-app-manifest-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any maskable',
            },
          ],
        },
        workbox: {
          globPatterns:
            process.env.NODE_ENV === 'development'
              ? []
              : ['**/*.{js,css,html,ico,png,svg,woff2}'],
          skipWaiting: true,
          clientsClaim: true,
          // Do not cache API responses: auth tokens and user data must stay fresh.
          navigateFallback: 'index.html',
          navigateFallbackDenylist: [/^\/api\//],
        },
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
  };
});
