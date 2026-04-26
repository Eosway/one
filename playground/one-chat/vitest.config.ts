import { defineConfig } from 'vitest/config'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  resolve: {
    alias: {
      '@eosway/one-chat': fileURLToPath(new URL('../../packages/one-chat/src/index.ts', import.meta.url)),
    },
  },
  test: {
    environment: 'happy-dom',
    restoreMocks: true,
    clearMocks: true,
  },
})
