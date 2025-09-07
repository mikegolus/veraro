import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
export default defineConfig({
  plugins: [react()],
  server: { allowedHosts: ['76799338f582.ngrok-free.app'] },
})
