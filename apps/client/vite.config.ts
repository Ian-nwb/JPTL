import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    host: '0.0.0.0',
    strictPort: true,
    hmr: {
      host: 'localhost',
      port: 5173,
      clientPort: 5173,
    },
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
  build: {
    target: 'esnext',
    minify: true,
    cssMinify: true,
    cssCodeSplit: true,
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom')) {
              return 'vendor-react';
            }
            if (id.includes('lucide-react')) {
              return 'vendor-lucide';
            }
            if (id.includes('framer-motion')) {
              return 'vendor-framer';
            }
            return 'vendor-utils';
          }
        },
      },
    },
  },
})