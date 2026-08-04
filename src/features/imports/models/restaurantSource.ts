export const sourcePlatforms = ['Instagram', 'Threads', 'Facebook', 'TikTok', 'YouTube', '小紅書', '部落格', '其他'] as const
export type SourcePlatform = typeof sourcePlatforms[number]
export const maximumMentionedDishes = 10
export const maximumMentionedDishLength = 100

export interface RestaurantSource {
  id: string
  restaurantId: string
  ownerId: string
  sourceType: 'social-content'
  sourcePlatform: SourcePlatform
  sourceUrl: string | null
  sourceText: string
  sourceNote: string
  mentionedDishes: string[]
  createdAt: Date
  updatedAt: Date
  schemaVersion: 1
}

export interface CreateRestaurantSourceInput {
  restaurantId: string
  ownerId: string
  sourceType: 'social-content'
  sourcePlatform: SourcePlatform
  sourceUrl: string | null
  sourceText: string
  sourceNote: string
  mentionedDishes: string[]
}

export function validateMentionedDishes(mentionedDishes: string[]): string | null {
  if (mentionedDishes.length > maximumMentionedDishes) return `必點餐點最多 ${maximumMentionedDishes} 項，且每項不可超過 ${maximumMentionedDishLength} 字。`
  if (mentionedDishes.some(dish => !dish.trim() || dish.length > maximumMentionedDishLength)) return `必點餐點最多 ${maximumMentionedDishes} 項，且每項不可超過 ${maximumMentionedDishLength} 字。`
  return null
}