import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  base: '/base-converter/',
  plugins: [react(), tailwindcss()],
  server: {
    watch: {
      // WSL does not receive file change events for edits made on the Windows side of /mnt/c.
      usePolling: true,
      interval: 300,
    },
  },
})
