export interface RestaurantCandidate {
  id: string
  name: string
  address: string
  area: string
  category: string
  rating: number | null
  mentionedDishes: string[]
  notes: string
  confidence: number | null
  evidence: string
  latitude: number | null
  longitude: number | null
}

export interface RestaurantCandidateExtractor {
  extract(sourceText: string): Promise<RestaurantCandidate[]>
}