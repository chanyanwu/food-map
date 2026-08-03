import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/food-map/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['apple-touch-icon.svg'],
      manifest: {
        name: 'Food Map',
        short_name: 'Food Map',
        description: '你的私人美食地圖',
        theme_color: '#c96246',
        background_color: '#fff9ef',
        display: 'standalone',
        start_url: '/food-map/#/',
        scope: '/food-map/',
        icons: [
          {
            src: 'pwa-192x192.svg',
            sizes: '192x192',
            type: 'image/svg+xml',
            purpose: 'any'
          },
          {
            src: 'pwa-512x512.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        navigateFallback: '/food-map/index.html',
        globPatterns: ['**/*.{js,css,html,svg,ico,png}']
      }
    })
  ]
})