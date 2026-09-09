import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    proxy: {
      // Keep the demo endpoint stable locally while the backend owns DRCT routing.
      '/api/drct': {
        target: process.env.WIDGET_BACKEND_URL || 'https://peaceful-amazement-production-629f.up.railway.app',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/drct/, '/webhook/drct'),
      },
    },
  },
  build: {
    lib: {
      entry: './src/widget.js',
      name: 'AviaframeWidget',
      fileName: 'aviaframe-widget',
      formats: ['iife']
    },
    rollupOptions: {
      output: {
        assetFileNames: 'aviaframe-widget.[ext]'
      }
    }
  }
});
