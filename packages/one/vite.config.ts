import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'

export default defineConfig({
  plugins: [
    vue(),
    dts({
      entryRoot: 'src',
      include: ['src'],
      exclude: ['tests', '**/*.test.ts', 'vite.config.ts', 'vitest.config.ts'],
      tsconfigPath: './tsconfig.json',
    }),
  ],
  build: {
    target: 'es2020',
    lib: {
      entry: {
        index: 'src/index.ts',
        chat: 'src/chat.ts',
        chart: 'src/chart.ts',
        'chart/plugins': 'src/chart/plugins.ts',
      },
      formats: ['es'],
    },
    rolldownOptions: {
      external: (source) => source === '@eosway/one-chat' || source === '@eosway/one-chart' || source === '@eosway/one-chart/plugins',
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: 'chunks/[name]-[hash].js',
        assetFileNames: 'assets/[name][extname]',
      },
    },
  },
})
