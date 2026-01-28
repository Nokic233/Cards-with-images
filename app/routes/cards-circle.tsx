import * as THREE from 'three'
import { memo, useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, ThreeEvent } from '@react-three/fiber'
import { Image, ScrollControls, useScroll, Billboard, Text } from '@react-three/drei'
import { suspend } from 'suspend-react'
import { easing } from 'maath'
const inter = import('@pmndrs/assets/fonts/inter_regular.woff')

// 从 app/assets 动态加载所有图片
const imageModules = import.meta.glob('../assets/*.{jpg,png}', { eager: true, query: '?url', import: 'default' })
const images = Object.values(imageModules)

// 提取常量到模块级别，避免每次渲染创建新对象
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

// 提取静态样式常量
const overlayStyle = {
  position: 'absolute' as const,
  pointerEvents: 'none' as const,
  top: 0,
  left: 0,
  width: '100vw',
  height: '100vh'
}

const dateStyle = { position: 'absolute' as const, bottom: 40, right: 40, fontSize: '13px' }
const logoStyle = { position: 'absolute' as const, bottom: 40, left: 40, width: 30 }
const hintStyle = { position: 'absolute' as const, top: 40, left: 40, fontSize: '13px' }

export default function CardsCircle() {
  return (
    <>
      <Canvas dpr={[1, 1.5]}>
        <ScrollControls pages={4} infinite>
          <Scene position={SCENE_POSITION} />
        </ScrollControls>
      </Canvas>
      <div style={overlayStyle}>
        <div style={dateStyle}>27/01/2026</div>
        <a style={hintStyle} href="#">
          上下滚动试试看
        </a>
      </div>
    </>
  )
}

function Scene({ ...props }) {
  const ref = useRef<THREE.Group>(null!)
  const scroll = useScroll()
  const [hovered, setHovered] = useState<string | null>(null)

  const handlePointerOver = useCallback((imageFile: string) => {
    setHovered(imageFile)
  }, [])

  const handlePointerOut = useCallback(() => {
    setHovered(null)
  }, [])

  useFrame((state, delta) => {
    ref.current.rotation.y = -scroll.offset * (Math.PI * 2)
    state.events.update?.()
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

interface CardsProps {
  category: string
  from?: number
  len?: number
  radius?: number
  position?: [number, number, number]
  onPointerOver: (imageFile: string) => void
  onPointerOut: () => void
}

function Cards({ category, from = 0, len = Math.PI * 2, radius = 5.25, onPointerOver, onPointerOut, ...props }: CardsProps) {
  const [hovered, setHovered] = useState<number | null>(null)
  const amount = Math.round(len * 22)
  const textPosition = from + (amount / 2 / amount) * len

  const handleHover = useCallback((i: number) => setHovered(i), [])
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
        const imageFile = images[i % images.length] as string
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

interface CardProps {
  url: string
  active: boolean
  hovered: boolean
  onPointerOver: (e: ThreeEvent<PointerEvent>) => void
  onPointerOut: () => void
  position: [number, number, number]
  rotation: [number, number, number]
}

const Card = memo(function Card({ url, active, hovered, ...props }: CardProps) {
  const ref = useRef<THREE.Mesh>(null!)

  useFrame((state, delta) => {
    const f = hovered ? 1.4 : active ? 1.25 : 1
    easing.damp3(ref.current.position, [0, hovered ? 0.25 : 0, 0], 0.1, delta)
    easing.damp3(ref.current.scale, [1.618 * f, 1 * f, 1], 0.15, delta)
  })

  return (
    <group {...props}>
      <Image ref={ref} transparent radius={0.075} url={url} scale={CARD_SCALE as any} side={THREE.DoubleSide} />
    </group>
  )
})

interface ActiveCardProps {
  hovered: string | null
}

const ActiveCard = memo(function ActiveCard({ hovered, ...props }: ActiveCardProps) {
  const ref = useRef<any>(null!)
  const imageUrl = hovered ?? (images[0] as string)

  useLayoutEffect(() => {
    ref.current.material.zoom = 0.8
  }, [hovered])

  useFrame((state, delta) => {
    easing.damp(ref.current.material, 'zoom', 1, 0.5, delta)
    easing.damp(ref.current.material, 'opacity', hovered !== null ? 1 : 0, 0.3, delta)
  })

  return (
    <Billboard {...props}>
      <Image ref={ref} transparent radius={0.3} position={ACTIVE_CARD_POSITION as any} scale={ACTIVE_CARD_SCALE as any} url={imageUrl} />
    </Billboard>
  )
})
