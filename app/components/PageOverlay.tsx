import { useMatches } from 'react-router'

// 定义 handle 类型
interface RouteHandle {
  hint?: string
}

// 提取静态样式常量
const overlayStyle = {
  position: 'absolute' as const,
  pointerEvents: 'none' as const,
  top: 0,
  left: 0,
  width: '100vw',
  height: '100vh'
}

const dateStyle = { 
  position: 'absolute' as const, 
  bottom: 40, 
  right: 40, 
  fontSize: '13px' 
}

const hintStyle = { 
  position: 'absolute' as const, 
  top: 40, 
  left: 40, 
  fontSize: '13px' 
}

interface PageOverlayProps {
  /** 可选的日期显示，默认显示当前日期 */
  date?: string
}

export default function PageOverlay({ date }: PageOverlayProps) {
  const matches = useMatches()
  
  // 获取当前路由的 handle 配置
  const currentMatch = matches[matches.length - 1]
  const handle = currentMatch?.handle as RouteHandle | undefined
  const hint = handle?.hint
  
  // 默认日期格式
  const displayDate = date ?? new Date().toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).replace(/\//g, '/')

  return (
    <div style={overlayStyle}>
      <div style={dateStyle}>{displayDate}</div>
      {hint && (
        <a style={hintStyle} href="#">
          {hint}
        </a>
      )}
    </div>
  )
}
