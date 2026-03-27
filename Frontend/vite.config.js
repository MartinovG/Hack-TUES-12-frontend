import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/auth': {
        target: process.env.VITE_API_PROXY_TARGET || 'http://127.0.0.1:3000',
        changeOrigin: true,
      },
      '/vms': {
        target: process.env.VITE_API_PROXY_TARGET || 'http://127.0.0.1:3000',
        changeOrigin: true,
      },
      '/rentals': {
        target: process.env.VITE_API_PROXY_TARGET || 'http://127.0.0.1:3000',
        changeOrigin: true,
      },
    },
  },
})
