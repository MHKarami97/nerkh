import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'

// Repo is served from https://nerkh.mhkarami97.ir (custom domain -> GitHub Pages root),
// so the base path is '/'. If you ever drop the custom domain and use the default
// https://<user>.github.io/nerkh/ URL instead, change base to '/nerkh/'.
export default defineConfig({
  base: '/',
  plugins: [
    vue(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['favicon.svg', 'robots.txt'],
      manifest: {
        name: 'نرخ | قیمت لحظه‌ای دلار، طلا، سکه و رمزارز',
        short_name: 'نرخ',
        description: 'قیمت لحظه‌ای دلار، یورو، پوند، طلا، سکه و رمزارز',
        lang: 'fa',
        dir: 'rtl',
        theme_color: '#0f172a',
        background_color: '#0f172a',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        icons: [
          { src: '/icons/icon.svg', sizes: '192x192', type: 'image/svg+xml', purpose: 'any' },
          { src: '/icons/icon.svg', sizes: '512x512', type: 'image/svg+xml', purpose: 'any' },
          { src: '/icons/icon-maskable.svg', sizes: '512x512', type: 'image/svg+xml', purpose: 'maskable' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,json}'],
        runtimeCaching: [
          {
            urlPattern: /\/data\/latest\.json$/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'nerkh-data-cache',
              networkTimeoutSeconds: 4,
              expiration: { maxEntries: 4, maxAgeSeconds: 60 * 60 * 24 }
            }
          }
        ]
      },
      devOptions: { enabled: false }
    })
  ],
  server: { port: 5173 },
  build: { target: 'es2019', sourcemap: false }
})
