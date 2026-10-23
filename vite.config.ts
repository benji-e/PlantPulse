import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { viteStaticCopy } from 'vite-plugin-static-copy';

export default defineConfig({
  plugins: [
    react(),
    viteStaticCopy({
      targets: [{ src: 'node_modules/@tensorflow/tfjs-backend-wasm/dist/*.wasm', dest: 'tfjs-wasm' }]
    }),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'fonts/*.woff2'],
      manifest: {
        name: 'PlantPulse — Cassava leaf guide',
        short_name: 'PlantPulse',
        description: 'Private, offline-ready cassava leaf diagnosis and guidance.',
        theme_color: '#1F4D2B',
        background_color: '#F7F3EE',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          { src: '/icon-192.svg', sizes: '192x192', type: 'image/svg+xml', purpose: 'any maskable' },
          { src: '/icon-512.svg', sizes: '512x512', type: 'image/svg+xml', purpose: 'any maskable' }
        ]
      },
      workbox: {
        navigateFallback: 'index.html',
        globPatterns: ['**/*.{js,css,html,svg,woff2,json,wasm}'],
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/model/'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'plantpulse-model-v2',
              expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 }
            }
          }
        ]
      },
      devOptions: { enabled: true }
    })
  ],
  server: { host: '0.0.0.0' }
});
