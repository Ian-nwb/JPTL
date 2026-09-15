import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5174,
    host: '0.0.0.0',
    proxy: {
      '/api': {
        target: (process.env.VITE_PROXY_TARGET && process.env.VITE_PROXY_TARGET !== 'http://localhost:8000')
          ? process.env.VITE_PROXY_TARGET
          : (process.env.CHOKIDAR_USEPOLLING ? 'http://server:8000' : (process.env.VITE_PROXY_TARGET || 'http://localhost:8000')),
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
