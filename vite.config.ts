import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import { contestCatalog } from './build/contestCatalog.ts'

export default defineConfig({
  base: process.env.VITE_BASE || '/',
  plugins: [vue(), tailwindcss(), contestCatalog()],
  test: {
    environment: 'happy-dom',
    include: ['tests/**/*.test.ts'],
  },
})
