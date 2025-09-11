// vite.config.js
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: { alias: { '@': path.resolve(__dirname, 'src') } },
  server: {
    proxy: {
      // Frontend calls /api/v6/*, Vite forwards to http://47.190.103.180:5001/api/v6/*
      '/api': {
        target: 'http://47.190.103.180:5001',
        changeOrigin: true,
        // IMPORTANT: do NOT rewrite, because the real API paths start with /api
        // rewrite: (p) => p.replace(/^\/api/, '')  // <-- leave this commented out
      }
    }
  }
})
