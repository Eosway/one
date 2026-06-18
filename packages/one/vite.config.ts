import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'

export default defineConfig({
  plugins: [
    dts({
      entryRoot: 'src',
      include: ['src'],
      exclude: ['**/*.test.ts', 'vite.config.ts'],
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
        'seamless-scroll': 'src/seamless-scroll.ts',
      },
      formats: ['es'],
    },
    rolldownOptions: {
      external: ['@eosway/one-chat', '@eosway/one-chart', '@eosway/one-chart/plugins', '@eosway/one-seamless-scroll'],
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: 'chunks/[name]-[hash].js',
        assetFileNames: 'assets/[name][extname]',
      },
    },
  },
})
