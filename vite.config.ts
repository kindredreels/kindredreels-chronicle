import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  base: '/kindredreels-chronicle/',
  plugins: [react(), tailwindcss()],
  server: {
    port: 3002,
  },
})
