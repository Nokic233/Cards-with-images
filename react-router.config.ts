import type { Config } from '@react-router/dev/config'

export default {
  // 使用 SPA 模式，禁用 SSR
  ssr: false,
  // 本地和生产都使用同一个 basename
  basename: '/Cards-with-images/'
} satisfies Config
