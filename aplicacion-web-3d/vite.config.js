import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    assetsInlineLimit: 0,      // nunca inlinea assets al bundle
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor:   ["react", "react-dom", "react-router-dom"],
          firebase: ["firebase/app", "firebase/auth", "firebase/firestore"],
          three:    ["three", "@react-three/fiber", "@react-three/drei"],
        },
      },
    },
  },
  server: {
    warmup: {
      clientFiles: ["./src/pages/Login.jsx"],
    },
  },
})