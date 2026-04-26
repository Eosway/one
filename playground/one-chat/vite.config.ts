import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@eosway/one-chat': fileURLToPath(new URL('../../packages/one-chat/src/index.ts', import.meta.url)),
    },
  },
})
