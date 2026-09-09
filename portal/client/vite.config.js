import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@aviaframe/tokens': path.resolve(import.meta.dirname, '../../packages/tokens/src'),
      '@aviaframe/ui': path.resolve(import.meta.dirname, '../../packages/ui/src'),
      react: path.resolve(import.meta.dirname, 'node_modules/react'),
      'react/jsx-runtime': path.resolve(import.meta.dirname, 'node_modules/react/jsx-runtime.js'),
      'react/jsx-dev-runtime': path.resolve(import.meta.dirname, 'node_modules/react/jsx-dev-runtime.js'),
    },
  },
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
