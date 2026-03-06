'use client'

import { useEffect, useRef, useState } from 'react'
import type { FridgeContent } from '@/types'

const ITEM_W = 170
const ITEM_H = 170

function seedRand(n: number) {
  let h = (n + 1) * 2654435761
  h ^= h >>> 16
  return (h >>> 0) / 0xffffffff
}

const STACK_OFFSETS = [
  { x: 35, y: 35, rot:   0 },
  { x: 12, y: 14, rot: -14 },
  { x: 58, y: 18, rot:  11 },
  { x: 14, y: 57, rot:  -9 },
  { x: 56, y: 54, rot:  15 },
]

interface Props {
  items: FridgeContent[]
  onSelect: (content: FridgeContent) => void
}

export default function BouncingFoodItems({ items, onSelect }: Props) {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const itemRefs = useRef<(HTMLDivElement | null)[]>([])
  const stateRef = useRef<{ x: number; y: number; dx: number; dy: number }[]>([])
  const rafRef = useRef<number>()
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  useEffect(() => {
    const wrapper = wrapperRef.current
    if (!wrapper || items.length === 0) return

    const W = wrapper.clientWidth
    const H = wrapper.clientHeight

    stateRef.current = items.map((_, i) => {
      const x = seedRand(i * 4 + 0) * Math.max(0, W - ITEM_W)
      const y = seedRand(i * 4 + 1) * Math.max(0, H - ITEM_H)
      const angle = seedRand(i * 4 + 2) * Math.PI * 2
      const speed = 0.6 + seedRand(i * 4 + 3) * 0.6
      return { x, y, dx: Math.cos(angle) * speed, dy: Math.sin(angle) * speed }
    })

    function animate() {
      const W = wrapper!.clientWidth
      const H = wrapper!.clientHeight

      stateRef.current = stateRef.current.map((s, i) => {
        let { x, y, dx, dy } = s
        x += dx
        y += dy

        if (x <= 0) { x = 0; dx = Math.abs(dx) }
        else if (x >= W - ITEM_W) { x = W - ITEM_W; dx = -Math.abs(dx) }
        if (y <= 0) { y = 0; dy = Math.abs(dy) }
        else if (y >= H - ITEM_H) { y = H - ITEM_H; dy = -Math.abs(dy) }

        const el = itemRefs.current[i]
        if (el) {
          el.style.left = `${x}px`
          el.style.top = `${y}px`
        }

        return { x, y, dx, dy }
      })

      rafRef.current = requestAnimationFrame(animate)
    }

    rafRef.current = requestAnimationFrame(animate)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [items])

  return (
    <div ref={wrapperRef} className="absolute inset-0">
      {items.map((content, i) => {
        const stackCount = Math.min(content.quantity, 5)
        const showBadge = content.quantity >= 5
        const imgUrl = content.food_items.image_url
        const isHovered = hoveredId === content.id

        return (
          <div
            key={content.id}
            ref={el => { itemRefs.current[i] = el }}
            className="absolute cursor-pointer"
            style={{
              left: 0, top: 0,
              transform: isHovered ? 'scale(1.12)' : 'scale(1)',
              transition: 'transform 0.15s ease, filter 0.15s ease',
              filter: isHovered ? 'drop-shadow(0 0 12px rgba(255,255,255,0.6))' : 'none',
              zIndex: isHovered ? 10 : 1,
            }}
            onMouseEnter={() => setHoveredId(content.id)}
            onMouseLeave={() => setHoveredId(null)}
            onClick={() => onSelect(content)}
          >
            <div className="relative" style={{ width: ITEM_W, height: ITEM_H }}>
              {Array.from({ length: stackCount }).map((_, idx) => {
                const { x, y, rot } = STACK_OFFSETS[idx]
                return imgUrl ? (
                  <img
                    key={idx}
                    src={imgUrl}
                    alt={content.food_items.name}
                    className="absolute object-contain drop-shadow"
                    style={{ width: 100, height: 100, left: x, top: y, transform: `rotate(${rot}deg)`, zIndex: stackCount - idx }}
                  />
                ) : (
                  <div
                    key={idx}
                    className="absolute bg-white/80 rounded-xl flex items-center justify-center text-3xl shadow"
                    style={{ width: 100, height: 100, left: x, top: y, transform: `rotate(${rot}deg)`, zIndex: stackCount - idx }}
                  >🍽️</div>
                )
              })}
              {showBadge && (
                <div className="absolute flex items-center justify-center bg-white rounded-full shadow-md" style={{ width: 32, height: 32, right: 6, bottom: 6, zIndex: 20 }}>
                  <span className="text-xs font-bold text-zinc-800">{content.quantity}</span>
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
