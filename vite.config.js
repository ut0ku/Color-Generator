import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  base: '/Color-Generator/',
  build: {
    rollupOptions: {
      output: {
        format: 'iife'
      }
    }
  }
})