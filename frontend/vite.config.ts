import { defineConfig } from 'vite'
import preact from '@preact/preset-vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [preact()],
  server: {
    host: '0.0.0.0',
    port: 5175,
    allowedHosts: ['.replit.dev', '.repl.co'],
    hmr: false,
  },
})
