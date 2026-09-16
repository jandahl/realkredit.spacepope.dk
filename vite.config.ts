import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api/proxy': {
        target: 'https://72ylpd13k2.execute-api.eu-north-1.amazonaws.com/v1/api',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/proxy/, ''),
        headers: {
          Origin: 'https://realkred.it',
          Referer: 'https://realkred.it/',
        },
      },
    },
  },
})
