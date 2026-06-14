import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: "Evelyn's Ice Cream Van",
        short_name: 'Ice Cream Van',
        description: 'Serve ice creams from your van!',
        theme_color: '#f9a8d4',
        background_color: '#fef9c3',
        display: 'fullscreen',
        orientation: 'landscape',
        icons: [
          {
            src: 'icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
    }),
  ],
})
