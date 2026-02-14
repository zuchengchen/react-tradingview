import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000
  },
  esbuild: {
    jsx: 'automatic'
  },
  optimizeDeps: {
    entries: ['index.html'],
    exclude: ['public/scripts/charting_library']
  }
})
