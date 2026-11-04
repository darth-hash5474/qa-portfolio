import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// base './' keeps the build portable (GitHub Pages, any static host).
export default defineConfig({
  base: './',
  plugins: [react()],
  server: { port: 5173 },
  preview: { port: 4173 },
})
