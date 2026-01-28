import { type RouteConfig, route } from '@react-router/dev/routes'

export default [
  // 使用 redirect 替代 index 路由，避免空路径问题
  route('', 'routes/home.tsx'),
  route('Cards-Circle', 'routes/cards-circle.tsx'),
  route('Horizontal-Tiles', 'routes/horizontal-tiles.tsx')
] satisfies RouteConfig
