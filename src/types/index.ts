export type StorageType = 'fridge' | 'freezer' | 'room_temp'

export interface FoodItem {
  id: string
  name: string
  description: string | null
  image_url: string | null
  storage_type: StorageType
  created_at: string
}

export interface FridgeContent {
  id: string
  food_item_id: string
  quantity: number
  added_at: string
  updated_at: string
  food_items: FoodItem
}
