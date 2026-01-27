import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate', // Se actualiza sola cuando hay cambios
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
      manifest: {
        name: 'Portal de Horas CIPSA',
        short_name: 'Horas CIPSA',
        description: 'Gestión de horas extras y compensaciones',
        theme_color: '#193b48', // Tu azul corporativo
        background_color: '#f4f7f6', // Tu fondo
        display: 'standalone', // Esto hace que se vea como app nativa (sin barra de navegador)
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ]
})