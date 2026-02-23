import { defineConfig } from 'vite';

export default defineConfig({
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
