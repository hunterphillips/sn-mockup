import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'
import { mockApiPlugin } from './vite-plugin-mock-api'
import { snImportPlugin } from './vite-plugin-sn-import'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), mockApiPlugin(), snImportPlugin()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
