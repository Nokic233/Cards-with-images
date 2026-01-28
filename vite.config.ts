import { reactRouter } from '@react-router/dev/vite'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [tailwindcss(), reactRouter(), tsconfigPaths()],
  server: {
    // 启动时自动在浏览器打开正确的路径
    open: '/Cards-with-images/'
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Three.js 核心库
          if (id.includes('node_modules/three/')) {
            return 'three-core'
          }
          // React Three Fiber 相关
          if (id.includes('node_modules/@react-three/')) {
            return 'react-three'
          }
          // maath 数学库
          if (id.includes('node_modules/maath/')) {
            return 'three-utils'
          }
          // React 核心库
          if (id.includes('node_modules/react-dom/') || id.includes('node_modules/react/')) {
            return 'react-vendor'
          }
        }
      }
    }
  }
})
