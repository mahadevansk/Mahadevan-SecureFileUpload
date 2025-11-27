import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/files': {
        target: 'http://localhost:5056',
        changeOrigin: true,
        rewrite: (path) => path,
      },
      '/auth': {
        target: 'http://localhost:5056',
        changeOrigin: true,
        rewrite: (path) => path,
      },
    },
  },
})
