import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'
import { mockApiPlugin, snImportPlugin } from './vite-plugins'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), mockApiPlugin(), snImportPlugin()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
