'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import AddFoodModal from '@/components/AddFoodModal'
import BouncingFoodItems from '@/components/BouncingFoodItems'
import type { FoodItem, FridgeContent, StorageType } from '@/types'

const TABS: { key: StorageType; label: string }[] = [
  { key: 'fridge', label: '냉장' },
  { key: 'freezer', label: '냉동' },
  { key: 'room_temp', label: '실온' },
]

const STACK_OFFSETS = [
  { x: 35, y: 35, rot:   0 },
  { x: 12, y: 14, rot: -14 },
  { x: 58, y: 18, rot:  11 },
  { x: 14, y: 57, rot:  -9 },
  { x: 56, y: 54, rot:  15 },
]

const GRID_SCALE = 112 / 170

export default function Home() {
  const [contents, setContents] = useState<FridgeContent[]>([])
  const [allFoodItems, setAllFoodItems] = useState<FoodItem[]>([])
  const [activeTab, setActiveTab] = useState<StorageType>('fridge')
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [viewMode, setViewMode] = useState<'bounce' | 'grid'>('bounce')
  const [selectedContent, setSelectedContent] = useState<FridgeContent | null>(null)
  const [hoveredGridId, setHoveredGridId] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    const [contentsRes, foodItemsRes] = await Promise.all([
      supabase.from('fridge_contents').select('*, food_items(*)'),
      supabase.from('food_items').select('*'),
    ])
    if (contentsRes.data) setContents(contentsRes.data as FridgeContent[])
    if (foodItemsRes.data) setAllFoodItems(foodItemsRes.data as FoodItem[])
    setLoading(false)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  async function handleQuantityUpdate(contentId: string, newQuantity: number) {
    if (newQuantity <= 0) {
      await supabase.from('fridge_contents').delete().eq('id', contentId)
      setSelectedContent(null)
    } else {
      await supabase.from('fridge_contents').update({ quantity: newQuantity }).eq('id', contentId)
      setSelectedContent(prev => prev ? { ...prev, quantity: newQuantity } : null)
    }
    fetchData()
  }

  const filtered = contents.filter((c) => c.food_items?.storage_type === activeTab)

  return (
    <main className="min-h-screen bg-zinc-900 flex flex-col items-center py-6 px-4">
      <h1 className="text-white text-2xl font-bold mb-4">내 냉장고</h1>

      <div className="flex gap-2 mb-4">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-5 py-2 rounded-full text-sm font-semibold transition-colors ${
              activeTab === tab.key ? 'bg-white text-zinc-900' : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="relative w-full max-w-sm">
        <div className="relative w-full overflow-hidden rounded-2xl shadow-2xl">
          {activeTab !== 'room_temp' ? (
            <img src="/fridge-bg.jpg" alt="냉장고 내부" className="w-full object-cover" />
          ) : (
            <img src="https://ovbkdgjrkstzyahidyzv.supabase.co/storage/v1/object/public/images/room-temp-bg.jpg" alt="실온 배경" className="w-full object-cover" />
          )}

          {/* 뷰 모드 토글 */}
          <button
            onClick={() => setViewMode(v => v === 'bounce' ? 'grid' : 'bounce')}
            className="absolute top-3 right-3 z-50 w-8 h-8 bg-black/40 hover:bg-black/60 rounded-lg flex items-center justify-center transition-colors"
          >
            {viewMode === 'bounce' ? (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="white">
                <rect x="1" y="1" width="6" height="6" rx="1"/>
                <rect x="9" y="1" width="6" height="6" rx="1"/>
                <rect x="1" y="9" width="6" height="6" rx="1"/>
                <rect x="9" y="9" width="6" height="6" rx="1"/>
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="white" strokeWidth="1.5">
                <circle cx="4" cy="5" r="2.5"/>
                <circle cx="12" cy="11" r="2.5"/>
                <circle cx="11" cy="4" r="1.5"/>
                <circle cx="4" cy="12" r="1.5"/>
              </svg>
            )}
          </button>

          <div className="absolute inset-0">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-white text-sm bg-black/30 px-3 py-2 rounded-lg">불러오는 중...</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-white text-sm bg-black/30 px-3 py-2 rounded-lg">비어있어요</p>
              </div>
            ) : viewMode === 'bounce' ? (
              <BouncingFoodItems
                key={activeTab}
                items={filtered}
                onSelect={setSelectedContent}
              />
            ) : (
              <div className="grid grid-cols-3 gap-2 p-3 w-full">
                {filtered.map((content) => {
                  const stackCount = Math.min(content.quantity, 5)
                  const showBadge = content.quantity >= 5
                  const imgUrl = content.food_items.image_url
                  const imgSize = Math.round(100 * GRID_SCALE)
                  const isHovered = hoveredGridId === content.id
                  return (
                    <div
                      key={content.id}
                      className="flex items-center justify-center cursor-pointer"
                      style={{
                        transform: isHovered ? 'scale(1.12)' : 'scale(1)',
                        transition: 'transform 0.15s ease, filter 0.15s ease',
                        filter: isHovered ? 'drop-shadow(0 0 10px rgba(255,255,255,0.5))' : 'none',
                      }}
                      onMouseEnter={() => setHoveredGridId(content.id)}
                      onMouseLeave={() => setHoveredGridId(null)}
                      onClick={() => setSelectedContent(content)}
                    >
                      <div className="relative" style={{ width: 112, height: 112 }}>
                        {Array.from({ length: stackCount }).map((_, idx) => {
                          const off = STACK_OFFSETS[idx]
                          return imgUrl ? (
                            <img
                              key={idx}
                              src={imgUrl}
                              alt={content.food_items.name}
                              className="absolute object-contain drop-shadow"
                              style={{
                                width: imgSize, height: imgSize,
                                left: Math.round(off.x * GRID_SCALE),
                                top: Math.round(off.y * GRID_SCALE),
                                transform: `rotate(${off.rot}deg)`,
                                zIndex: stackCount - idx,
                              }}
                            />
                          ) : (
                            <div
                              key={idx}
                              className="absolute bg-white/80 rounded-xl flex items-center justify-center text-2xl shadow"
                              style={{
                                width: imgSize, height: imgSize,
                                left: Math.round(off.x * GRID_SCALE),
                                top: Math.round(off.y * GRID_SCALE),
                                transform: `rotate(${off.rot}deg)`,
                                zIndex: stackCount - idx,
                              }}
                            >🍽️</div>
                          )
                        })}
                        {showBadge && (
                          <div className="absolute flex items-center justify-center bg-white rounded-full shadow-md" style={{ width: 24, height: 24, right: 4, bottom: 4, zIndex: 20 }}>
                            <span className="text-[10px] font-bold text-zinc-800">{content.quantity}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="absolute bottom-4 right-4 w-14 h-14 bg-white rounded-full shadow-xl flex items-center justify-center text-3xl font-bold text-zinc-800 hover:scale-110 transition-transform"
        >
          +
        </button>
      </div>

      {/* 아이템 클릭 팝업 */}
      {selectedContent && (
        <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50" onClick={() => setSelectedContent(null)}>
          <div className="bg-white rounded-t-3xl w-full max-w-sm p-6 flex flex-col items-center gap-4" onClick={e => e.stopPropagation()}>
            {selectedContent.food_items.image_url && (
              <img src={selectedContent.food_items.image_url} alt={selectedContent.food_items.name} className="w-28 h-28 object-contain" />
            )}
            <p className="font-bold text-zinc-800 text-lg">{selectedContent.food_items.name}</p>
            {selectedContent.food_items.description && (
              <p className="text-sm text-zinc-500">{selectedContent.food_items.description}</p>
            )}
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleQuantityUpdate(selectedContent.id, selectedContent.quantity - 1)}
                className="w-10 h-10 rounded-full bg-zinc-100 text-zinc-700 text-xl font-bold hover:bg-zinc-200 flex items-center justify-center"
              >−</button>
              <span className="text-xl font-bold text-zinc-800 w-10 text-center">{selectedContent.quantity}</span>
              <button
                onClick={() => handleQuantityUpdate(selectedContent.id, selectedContent.quantity + 1)}
                className="w-10 h-10 rounded-full bg-zinc-100 text-zinc-700 text-xl font-bold hover:bg-zinc-200 flex items-center justify-center"
              >+</button>
              <button
                onClick={() => handleQuantityUpdate(selectedContent.id, 0)}
                className="w-10 h-10 rounded-full bg-red-100 text-red-500 text-lg font-bold hover:bg-red-200 flex items-center justify-center ml-2"
              >🗑</button>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <AddFoodModal
          foodItems={allFoodItems}
          currentTab={activeTab}
          onClose={() => setShowModal(false)}
          onAdded={fetchData}
        />
      )}
    </main>
  )
}
