import * as THREE from 'three'
import { memo, useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Canvas, extend, useFrame } from '@react-three/fiber'
import { Image, ScrollControls, useScroll, Billboard, Text } from '@react-three/drei'
import { suspend } from 'suspend-react'
import { generate } from 'random-words'
import { easing, geometry } from 'maath'

extend(geometry)
const inter = import('@pmndrs/assets/fonts/inter_regular.woff')

// 从 src/assets 动态加载所有图片
const imageModules = import.meta.glob('./assets/*.{jpg,png}', { eager: true, query: '?url', import: 'default' })
const images = Object.values(imageModules)

// 提取常量到模块级别，避免每次渲染创建新对象 (rerender-memo-with-default-value)
const CARD_SCALE = [1.618, 1, 1]
const ACTIVE_CARD_POSITION = [0, 1.5, 0]
const ACTIVE_CARD_SCALE = [3.5, 1.618 * 3.5, 0.2, 1]
const SCENE_POSITION = [0, 1.5, 0]

// 季节配置常量
const SEASONS = [
  { category: 'spring', from: 0, len: Math.PI / 4 },
  { category: 'summer', from: Math.PI / 4, len: Math.PI / 2, position: [0, 0.4, 0] },
  { category: 'autumn', from: Math.PI / 4 + Math.PI / 2, len: Math.PI / 2 },
  { category: 'winter', from: Math.PI * 1.25, len: Math.PI * 2 - Math.PI * 1.25, position: [0, -0.4, 0] }
]

export const App = () => (
  <Canvas dpr={[1, 1.5]}>
    <ScrollControls pages={4} infinite>
      <Scene position={SCENE_POSITION} />
    </ScrollControls>
  </Canvas>
)

function Scene({ children, ...props }) {
  const ref = useRef()
  const scroll = useScroll()
  const [hovered, setHovered] = useState(null)

  // 使用 useCallback 优化回调函数 (rerender-functional-setstate)
  const handlePointerOver = useCallback((imageFile) => {
    setHovered(imageFile)
  }, [])

  const handlePointerOut = useCallback(() => {
    setHovered(null)
  }, [])

  useFrame((state, delta) => {
    ref.current.rotation.y = -scroll.offset * (Math.PI * 2)
    state.events.update()
    easing.damp3(state.camera.position, [-state.pointer.x * 2, state.pointer.y * 2 + 4.5, 9], 0.3, delta)
    state.camera.lookAt(0, 0, 0)
  })

  return (
    <group ref={ref} {...props}>
      {SEASONS.map((season) => (
        <Cards
          key={season.category}
          category={season.category}
          from={season.from}
          len={season.len}
          position={season.position}
          onPointerOver={handlePointerOver}
          onPointerOut={handlePointerOut}
        />
      ))}
      <ActiveCard hovered={hovered} />
    </group>
  )
}

function Cards({ category, from = 0, len = Math.PI * 2, radius = 5.25, onPointerOver, onPointerOut, ...props }) {
  const [hovered, setHovered] = useState(null)
  const amount = Math.round(len * 22)
  const textPosition = from + (amount / 2 / amount) * len

  // 使用 useCallback 避免每次渲染创建新函数
  const handleHover = useCallback((i) => setHovered(i), [])
  const handleHoverOut = useCallback(() => setHovered(null), [])

  return (
    <group {...props}>
      <Billboard position={[Math.sin(textPosition) * radius * 1.4, 0.5, Math.cos(textPosition) * radius * 1.4]}>
        <Text font={suspend(inter).default} fontSize={0.25} anchorX="center" color="black">
          {category}
        </Text>
      </Billboard>
      {Array.from({ length: amount - 3 }, (_, i) => {
        const angle = from + (i / amount) * len
        const imageFile = images[i % images.length]
        return (
          <Card
            key={angle}
            onPointerOver={(e) => {
              e.stopPropagation()
              handleHover(i)
              onPointerOver(imageFile)
            }}
            onPointerOut={() => {
              handleHoverOut()
              onPointerOut()
            }}
            position={[Math.sin(angle) * radius, 0, Math.cos(angle) * radius]}
            rotation={[0, Math.PI / 2 + angle, 0]}
            active={hovered !== null}
            hovered={hovered === i}
            url={imageFile}
          />
        )
      })}
    </group>
  )
}

// 使用 memo 包装 Card 组件，避免不必要的重渲染 (rerender-memo)
const Card = memo(function Card({ url, active, hovered, ...props }) {
  const ref = useRef()

  useFrame((state, delta) => {
    // 使用三元运算符替代 && (rendering-conditional-render)
    const f = hovered ? 1.4 : active ? 1.25 : 1
    easing.damp3(ref.current.position, [0, hovered ? 0.25 : 0, 0], 0.1, delta)
    easing.damp3(ref.current.scale, [1.618 * f, 1 * f, 1], 0.15, delta)
  })

  return (
    <group {...props}>
      <Image ref={ref} transparent radius={0.075} url={url} scale={CARD_SCALE} side={THREE.DoubleSide} />
    </group>
  )
})

// 使用 memo 包装 ActiveCard 组件 (rerender-memo)
const ActiveCard = memo(function ActiveCard({ hovered, ...props }) {
  const ref = useRef()
  // 优化 useMemo 依赖，使用布尔值而非完整对象 (rerender-derived-state)
  const name = useMemo(() => generate({ exactly: 2 }).join(' '), [hovered !== null])
  // 使用默认图片避免 null 错误
  const imageUrl = hovered ?? images[0]

  useLayoutEffect(() => {
    ref.current.material.zoom = 0.8
  }, [hovered])

  useFrame((state, delta) => {
    easing.damp(ref.current.material, 'zoom', 1, 0.5, delta)
    // 使用三元运算符 (rendering-conditional-render)
    easing.damp(ref.current.material, 'opacity', hovered !== null ? 1 : 0, 0.3, delta)
  })

  return (
    <Billboard {...props}>
      <Image ref={ref} transparent radius={0.3} position={ACTIVE_CARD_POSITION} scale={ACTIVE_CARD_SCALE} url={imageUrl} />
    </Billboard>
  )
})
