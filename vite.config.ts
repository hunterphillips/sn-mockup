import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'
import { mockApiPlugin, snImportPlugin, aiGeneratePlugin } from './vite-plugins'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), mockApiPlugin(), snImportPlugin(), aiGeneratePlugin()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
