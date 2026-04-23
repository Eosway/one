import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@eosway/one-chart/plugins': fileURLToPath(new URL('../../packages/one-chart/src/plugins.ts', import.meta.url)),
      '@eosway/one-chart': fileURLToPath(new URL('../../packages/one-chart/src/index.ts', import.meta.url)),
    },
  },
})
