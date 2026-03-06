'use client'

import { useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import type { FoodItem, StorageType } from '@/types'

interface Props {
  foodItems: FoodItem[]
  currentTab: StorageType
  onClose: () => void
  onAdded: () => void
}

const STORAGE_LABELS: Record<StorageType, string> = {
  fridge: '냉장',
  freezer: '냉동',
  room_temp: '실온',
}

export default function AddFoodModal({ foodItems, currentTab, onClose, onAdded }: Props) {
  const [mode, setMode] = useState<'list' | 'new' | 'detail'>('list')
  const [selectedItem, setSelectedItem] = useState<FoodItem | null>(null)
  const [addQuantity, setAddQuantity] = useState(1)
  const [loading, setLoading] = useState(false)
  const [newName, setNewName] = useState('')
  const [newStorageType, setNewStorageType] = useState<StorageType>(currentTab)
  const [newDescription, setNewDescription] = useState('')
  const [newQuantity, setNewQuantity] = useState(1)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleAddExisting(foodItem: FoodItem, quantity: number) {
    setLoading(true)
    const { data: existing } = await supabase
      .from('fridge_contents')
      .select('id, quantity')
      .eq('food_item_id', foodItem.id)
      .single()

    if (existing) {
      await supabase
        .from('fridge_contents')
        .update({ quantity: existing.quantity + quantity })
        .eq('id', existing.id)
    } else {
      await supabase
        .from('fridge_contents')
        .insert({ food_item_id: foodItem.id, quantity })
    }
    setLoading(false)
    onAdded()
    onClose()
  }

  async function handleAddNew() {
    if (!newName.trim()) return
    setLoading(true)

    let image_url: string | null = null
    if (imageFile) {
      const ext = imageFile.name.split('.').pop()
      const fileName = `${Date.now()}.${ext}`
      const { data, error } = await supabase.storage.from('food-images').upload(fileName, imageFile)
      if (!error && data) {
        const { data: urlData } = supabase.storage.from('food-images').getPublicUrl(data.path)
        image_url = urlData.publicUrl
      }
    }

    const { data: newFood, error: foodError } = await supabase
      .from('food_items')
      .insert({ name: newName.trim(), description: newDescription.trim() || null, storage_type: newStorageType, image_url })
      .select()
      .single()

    if (!foodError && newFood) {
      await supabase.from('fridge_contents').insert({ food_item_id: newFood.id, quantity: newQuantity })
    }

    setLoading(false)
    onAdded()
    onClose()
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  function openDetail(item: FoodItem) {
    setSelectedItem(item)
    setAddQuantity(1)
    setMode('detail')
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-end justify-center z-50" onClick={onClose}>
      <div
        className="bg-white rounded-t-3xl w-full max-w-sm max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 음식 목록 */}
        {mode === 'list' && (
          <>
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-bold">냉장고에 추가</h2>
              <button onClick={onClose} className="text-zinc-400 text-2xl leading-none">×</button>
            </div>
            <div className="p-4 grid grid-cols-3 gap-3">
              {foodItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => openDetail(item)}
                  className="flex flex-col items-center gap-1 p-3 rounded-xl border border-zinc-100 hover:bg-zinc-50 active:scale-95 transition-transform"
                >
                  {item.image_url ? (
                    <img src={item.image_url} alt={item.name} className="w-12 h-12 object-contain" />
                  ) : (
                    <div className="w-12 h-12 bg-zinc-100 rounded-lg flex items-center justify-center text-xl">🍽️</div>
                  )}
                  <span className="text-xs font-medium text-zinc-700 text-center leading-tight">{item.name}</span>
                  <span className="text-xs text-zinc-400">{STORAGE_LABELS[item.storage_type]}</span>
                </button>
              ))}
            </div>
            <div className="p-4 border-t">
              <button
                onClick={() => setMode('new')}
                className="w-full py-3 rounded-2xl border-2 border-dashed border-zinc-300 text-zinc-500 font-medium hover:border-zinc-400 hover:text-zinc-700 transition-colors"
              >
                + 새 음식 등록
              </button>
            </div>
          </>
        )}

        {/* 음식 상세 팝업 */}
        {mode === 'detail' && selectedItem && (
          <>
            <div className="flex items-center gap-3 p-4 border-b">
              <button onClick={() => setMode('list')} className="text-zinc-500 text-xl">←</button>
              <h2 className="text-lg font-bold">{selectedItem.name}</h2>
            </div>
            <div className="p-6 flex flex-col items-center gap-4">
              {selectedItem.image_url ? (
                <img src={selectedItem.image_url} alt={selectedItem.name} className="w-32 h-32 object-contain" />
              ) : (
                <div className="w-32 h-32 bg-zinc-100 rounded-2xl flex items-center justify-center text-5xl">🍽️</div>
              )}
              <div className="text-center">
                <p className="font-bold text-zinc-800 text-lg">{selectedItem.name}</p>
                <p className="text-sm text-zinc-400 mt-1">{STORAGE_LABELS[selectedItem.storage_type]}</p>
                {selectedItem.description && (
                  <p className="text-sm text-zinc-500 mt-1">{selectedItem.description}</p>
                )}
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-zinc-500 font-medium">추가 수량</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setAddQuantity(q => Math.max(1, q - 1))}
                    className="w-9 h-9 rounded-full bg-zinc-100 text-zinc-700 text-lg font-bold hover:bg-zinc-200 flex items-center justify-center"
                  >−</button>
                  <span className="w-8 text-center font-semibold text-zinc-800">{addQuantity}</span>
                  <button
                    type="button"
                    onClick={() => setAddQuantity(q => q + 1)}
                    className="w-9 h-9 rounded-full bg-zinc-100 text-zinc-700 text-lg font-bold hover:bg-zinc-200 flex items-center justify-center"
                  >+</button>
                </div>
              </div>
              <button
                onClick={() => handleAddExisting(selectedItem, addQuantity)}
                disabled={loading}
                className="w-full py-4 rounded-2xl bg-zinc-900 text-white font-semibold disabled:opacity-40"
              >
                {loading ? '추가 중...' : '냉장고에 추가'}
              </button>
            </div>
          </>
        )}

        {/* 새 음식 등록 */}
        {mode === 'new' && (
          <>
            <div className="flex items-center gap-3 p-4 border-b">
              <button onClick={() => setMode('list')} className="text-zinc-500 text-xl">←</button>
              <h2 className="text-lg font-bold">새 음식 등록</h2>
            </div>
            <div className="p-4 flex flex-col gap-4">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-28 h-28 mx-auto rounded-2xl border-2 border-dashed border-zinc-300 flex items-center justify-center overflow-hidden hover:border-zinc-400 transition-colors"
              >
                {imagePreview ? (
                  <img src={imagePreview} alt="preview" className="w-full h-full object-contain" />
                ) : (
                  <span className="text-zinc-400 text-sm text-center px-2">이미지<br/>추가</span>
                )}
              </button>
              <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={handleFileChange} />
              <input
                type="text"
                placeholder="음식 이름"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:outline-none focus:border-zinc-400"
              />
              <input
                type="text"
                placeholder="설명 (예: 1개 = 200g)"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:outline-none focus:border-zinc-400"
              />
              <div className="flex items-center gap-3">
                <span className="text-sm text-zinc-500 font-medium">수량</span>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => setNewQuantity(q => Math.max(1, q - 1))} className="w-9 h-9 rounded-full bg-zinc-100 text-zinc-700 text-lg font-bold hover:bg-zinc-200 flex items-center justify-center">−</button>
                  <span className="w-8 text-center font-semibold text-zinc-800">{newQuantity}</span>
                  <button type="button" onClick={() => setNewQuantity(q => q + 1)} className="w-9 h-9 rounded-full bg-zinc-100 text-zinc-700 text-lg font-bold hover:bg-zinc-200 flex items-center justify-center">+</button>
                </div>
              </div>
              <div className="flex gap-2">
                {(['fridge', 'freezer', 'room_temp'] as StorageType[]).map((type) => (
                  <button
                    key={type}
                    onClick={() => setNewStorageType(type)}
                    className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${newStorageType === type ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-600'}`}
                  >
                    {STORAGE_LABELS[type]}
                  </button>
                ))}
              </div>
              <button
                onClick={handleAddNew}
                disabled={loading || !newName.trim()}
                className="w-full py-4 rounded-2xl bg-zinc-900 text-white font-semibold disabled:opacity-40"
              >
                {loading ? '등록 중...' : '등록하기'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
