import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base: './' so that the production build loads correctly from file:// inside Electron.
export default defineConfig({
  base: './',
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
    host: '127.0.0.1',
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
})
