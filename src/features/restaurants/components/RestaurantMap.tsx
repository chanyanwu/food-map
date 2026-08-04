import { APIProvider, AdvancedMarker, InfoWindow, Map } from '@vis.gl/react-google-maps'
import { useState } from 'react'
import { hasValidCoordinates } from '../models/coordinates'
import type { Restaurant } from '../models/restaurant'

interface RestaurantMapProps {
  restaurants: Restaurant[]
  apiKey?: string
}

const taipeiCenter = { lat: 25.033, lng: 121.5654 }

export function RestaurantMap({ restaurants, apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY }: RestaurantMapProps) {
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null)
  const mappableRestaurants = restaurants.filter(hasRestaurantCoordinates)

  if (!apiKey) return <section className="restaurant-map card" aria-labelledby="restaurant-map-title"><h2 id="restaurant-map-title">餐廳地圖</h2><p role="alert">尚未設定 Google Maps API Key</p></section>

  return <section className="restaurant-map" aria-labelledby="restaurant-map-title"><div className="restaurant-map-heading"><h2 id="restaurant-map-title">餐廳地圖</h2><p>{mappableRestaurants.length} 個位置</p></div><APIProvider apiKey={apiKey}><Map defaultCenter={taipeiCenter} defaultZoom={12} gestureHandling="greedy" disableDefaultUI><>{mappableRestaurants.map(restaurant => <AdvancedMarker key={restaurant.id} position={{ lat: restaurant.latitude!, lng: restaurant.longitude! }} onClick={() => setSelectedRestaurant(restaurant)} />)}{selectedRestaurant && <InfoWindow position={{ lat: selectedRestaurant.latitude!, lng: selectedRestaurant.longitude! }} onCloseClick={() => setSelectedRestaurant(null)}><strong>{selectedRestaurant.name}</strong><p>{selectedRestaurant.address || '未提供地址'}</p><p>{selectedRestaurant.category || '未分類'}</p></InfoWindow>}</></Map></APIProvider></section>
}

function hasRestaurantCoordinates(restaurant: Restaurant): restaurant is Restaurant & { latitude: number; longitude: number } {
  return hasValidCoordinates(restaurant)
}