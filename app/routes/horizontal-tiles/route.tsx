import './route.css'
import * as THREE from 'three'
import { useRef, useState, useMemo } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Image, ScrollControls, Scroll, useScroll, Line } from '@react-three/drei'
import { proxy, useSnapshot } from 'valtio'
import { easing } from 'maath'
import PageOverlay from '../../components/PageOverlay'

// 从 app/assets 动态加载所有图片
const imageModules = import.meta.glob('../../assets/*.{jpg,png}', { eager: true, query: '?url', import: 'default' })
const images = Object.values(imageModules) as string[]

const state = proxy({
  clicked: null as number | null,
  urls: images
})

// 路由 handle 配置，用于传递提示文案
export const handle = {
  hint: '左右滚动试试看'
}

function Minimap() {
  const ref = useRef<THREE.Group>(null)
  const scroll = useScroll()
  const { urls } = useSnapshot(state)
  const { height } = useThree((state) => state.viewport)
  useFrame((state, delta) => {
    ref.current?.children.forEach((child, index) => {
      // Give me a value between 0 and 1
      //   starting at the position of my item
      //   ranging across 4 / total length
      //   make it a sine, so the value goes from 0 to 1 to 0.
      const y = scroll.curve(index / urls.length - 1.5 / urls.length, 4 / urls.length)
      easing.damp(child.scale, 'y', 0.15 + y / 6, 0.15, delta)
    })
  })
  return (
    <group ref={ref}>
      {urls.map((_, i) => (
        <Line key={i} points={[[0, -0.5, 0], [0, 0.5, 0]]} color="white" position={[i * 0.06 - urls.length * 0.03, -height / 2 + 0.6, 0]} />
      ))}
    </group>
  )
}

interface ItemProps {
  index: number
  position: [number, number, number]
  scale: [number, number]
  url: string
}

function Item({ index, position, scale, url }: ItemProps) {
  const ref = useRef<THREE.Mesh>(null!)
  const scroll = useScroll()
  const { clicked, urls } = useSnapshot(state)
  const [hovered, hover] = useState(false)
  const click = () => (state.clicked = index === clicked ? null : index)
  const over = () => hover(true)
  const out = () => hover(false)
  useFrame((_, delta) => {
    if (!ref.current) return
    const y = scroll.curve(index / urls.length - 1.5 / urls.length, 4 / urls.length)
    easing.damp3(ref.current.scale, [clicked === index ? 4.7 : scale[0], clicked === index ? 5 : 4 + y, 1], 0.15, delta)
    const material = ref.current.material as THREE.MeshBasicMaterial & { scale: [number, number]; grayscale: number }
    material.scale[0] = ref.current.scale.x
    material.scale[1] = ref.current.scale.y
    if (clicked !== null && index < clicked) easing.damp(ref.current.position, 'x', position[0] - 2, 0.15, delta)
    if (clicked !== null && index > clicked) easing.damp(ref.current.position, 'x', position[0] + 2, 0.15, delta)
    if (clicked === null || clicked === index) easing.damp(ref.current.position, 'x', position[0], 0.15, delta)
    easing.damp(material, 'grayscale', hovered || clicked === index ? 0 : Math.max(0, 1 - y), 0.15, delta)
    easing.dampC(material.color, hovered || clicked === index ? 'white' : '#aaa', hovered ? 0.3 : 0.15, delta)
  })
  return <Image ref={ref} url={url} position={position} scale={scale} onClick={click} onPointerOver={over} onPointerOut={out} />
}

function Items({ w = 0.7, gap = 0.15 }) {
  const { urls } = useSnapshot(state)
  const { width } = useThree((state) => state.viewport)
  const xW = w + gap
  return (
    <ScrollControls horizontal damping={0.1} pages={(width - xW + urls.length * xW) / width}>
      <Minimap />
      <Scroll>
        {urls.map((url, i) => <Item key={i} index={i} position={[i * xW, 0, 0]} scale={[w, 4]} url={url} />) /* prettier-ignore */}
      </Scroll>
    </ScrollControls>
  )
}

export default function HorizontalTiles() {
  return (
    <>
      <Canvas gl={{ antialias: false }} dpr={[1, 1.5]} onPointerMissed={() => (state.clicked = null)}>
        <Items />
      </Canvas>
      <PageOverlay />
    </>
  )
}
