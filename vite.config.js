import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    // Impede o navegador de servir uma versão antiga em cache durante o dev
    headers: {
      'Cache-Control': 'no-store',
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
})
