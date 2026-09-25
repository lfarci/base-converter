import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vitest/config'

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
  test: {
    // Only the pure core modules are unit tested. Playwright's `testDir: './tests'`
    // would otherwise pick these up, and vitest would otherwise try to run the
    // Playwright specs.
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
