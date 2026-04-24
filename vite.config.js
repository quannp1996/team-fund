import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  base: '/team-fund/',
  plugins: [vue()],
  define: {
    'process.env': process.env
  },
  server: {
    host: '0.0.0.0',
    port: 3000
  }
})