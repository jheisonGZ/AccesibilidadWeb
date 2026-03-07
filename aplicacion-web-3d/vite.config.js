import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    assetsInlineLimit: 0,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes("firebase"))           return "firebase";
          if (id.includes("three") || id.includes("@react-three")) return "three";
          if (id.includes("node_modules"))       return "vendor";
        },
      },
    },
  },
})