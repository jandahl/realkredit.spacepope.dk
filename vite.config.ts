import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  test: {
    environment: 'node',
  },
  base: './',
  plugins: [react(), tailwindcss()],
  // Live kurser fetch Totalkredit directly (CORS *); no AWS proxy needed.
})
