import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(() => {
  return {
    plugins: [
      react(), 
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        injectRegister: 'auto',
        includeAssets: ['logo.jpg', 'icon-192x192.png', 'icon-512x512.png', 'apple-touch-icon.png', 'maskable-icon-192.png', 'maskable-icon-512.png'],
        manifest: {
          name: "Zaka+",
          short_name: "Zaka+",
          id: "/",
          description: "La plateforme pour vos sorties (Maquis, Resto, Boîte de nuit).",
          start_url: "/",
          scope: "/",
          display: "standalone",
          orientation: "portrait",
          background_color: "#000000",
          theme_color: "#ea580c",
          lang: "fr",
          prefer_related_applications: false,
          icons: [
            {
              src: "/icon-192x192.png",
              sizes: "192x192",
              type: "image/png",
              purpose: "any"
            },
            {
              src: "/maskable-icon-192.png",
              sizes: "192x192",
              type: "image/png",
              purpose: "maskable"
            },
            {
              src: "/icon-512x512.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "any"
            },
            {
              src: "/maskable-icon-512.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "maskable"
            }
          ]
        },
        workbox: {
          maximumFileSizeToCacheInBytes: 5000000,
          globPatterns: ['**/*.{js,css,html,ico,png,svg,jpg,jpeg}'],
          navigateFallback: '/index.html',
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/firestore\.googleapis\.com\/.*/i,
              handler: 'NetworkOnly',
            },
            {
              urlPattern: /^https:\/\/identitytoolkit\.googleapis\.com\/.*/i,
              handler: 'NetworkOnly',
            },
            {
              urlPattern: /^https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts',
                expiration: {
                  maxEntries: 20,
                  maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
                }
              }
            },
            {
              urlPattern: /^https:\/\/images\.unsplash\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'unsplash-images',
                expiration: {
                  maxEntries: 50,
                  maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            },
            {
              urlPattern: /^https:\/\/firebasestorage\.googleapis\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'firebase-profile-images',
                expiration: {
                  maxEntries: 100,
                  maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            },
            {
              urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/i,
              handler: 'StaleWhileRevalidate',
              options: {
                cacheName: 'static-images',
                expiration: {
                  maxEntries: 100,
                  maxAgeSeconds: 60 * 60 * 24 * 15 // 15 days
                }
              }
            }
          ]
        }
      })
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
