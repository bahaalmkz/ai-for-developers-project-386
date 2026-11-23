import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Запросы к API в режиме разработки уходят на бэкенд Spring Boot
      '/api': 'http://localhost:8080',
    },
  },
})
