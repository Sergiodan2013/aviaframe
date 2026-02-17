import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3002,
    proxy: {
      // Proxy для локального n8n (если используется)
      '/webhook': {
        target: 'http://localhost:5678',
        changeOrigin: true,
        secure: false,
      },
      // Proxy для локального n8n
      '/api/n8n': {
        target: 'http://localhost:5678',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/n8n/, ''),
      },
      // Stage 0 backend compatibility API
      '/api/backend': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/backend/, '/api'),
      }
    }
  }
})
