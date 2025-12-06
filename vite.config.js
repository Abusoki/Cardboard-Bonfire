import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        // 1. The Main Page (Your portfolio or landing page)
        main: resolve(__dirname, 'index.html'),
        
        // 2. Your Sub-Projects (CHANGE 'folder-name' to your actual folder names)
        projectOne: resolve(__dirname, 'TCG/tcg.html'),
      },
    },
  },
})
