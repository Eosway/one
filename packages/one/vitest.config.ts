import { fileURLToPath, URL } from 'node:url'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: [
      {
        find: '@eosway/one-chat',
        replacement: fileURLToPath(new URL('../one-chat/src/index.ts', import.meta.url)),
      },
      {
        find: '@eosway/one-chart/plugins',
        replacement: fileURLToPath(new URL('../one-chart/src/plugins.ts', import.meta.url)),
      },
      {
        find: '@eosway/one-chart',
        replacement: fileURLToPath(new URL('../one-chart/src/index.ts', import.meta.url)),
      },
    ],
  },
})
