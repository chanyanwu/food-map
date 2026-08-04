import { APIProvider, AdvancedMarker, InfoWindow, Map, useMap } from '@vis.gl/react-google-maps'
import { useEffect } from 'react'
import type { UserLocation } from '../../../core/location/geolocation'
import { hasValidCoordinates } from '../models/coordinates'
import type { Restaurant } from '../models/restaurant'

interface RestaurantMapProps {
  restaurants: Restaurant[]
  selectedRestaurantId?: string | null
  onSelectRestaurant?(restaurantId: string | null): void
  userLocation?: UserLocation | null
  apiKey?: string
}

const taipeiCenter = { lat: 25.033, lng: 121.5654 }

export function RestaurantMap({ restaurants, selectedRestaurantId = null, onSelectRestaurant = () => undefined, userLocation = null, apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY }: RestaurantMapProps) {
  const mappableRestaurants = restaurants.filter(hasRestaurantCoordinates)
  const selectedRestaurant = mappableRestaurants.find(restaurant => restaurant.id === selectedRestaurantId) ?? null

  if (!apiKey) return <section className="restaurant-map card" aria-labelledby="restaurant-map-title"><h2 id="restaurant-map-title">餐廳地圖</h2><p role="alert">尚未設定 Google Maps API Key</p></section>

  return <section className="restaurant-map" aria-labelledby="restaurant-map-title"><div className="restaurant-map-heading"><h2 id="restaurant-map-title">餐廳地圖</h2><p>{mappableRestaurants.length} 個位置</p></div><APIProvider apiKey={apiKey}><Map defaultCenter={taipeiCenter} defaultZoom={12} gestureHandling="greedy" disableDefaultUI><MapFocus restaurant={selectedRestaurant} />{mappableRestaurants.map(restaurant => <AdvancedMarker key={restaurant.id} position={{ lat: restaurant.latitude, lng: restaurant.longitude }} title={restaurant.name} onClick={() => onSelectRestaurant(restaurant.id)}><span className={restaurant.id === selectedRestaurantId ? 'restaurant-marker restaurant-marker--selected' : 'restaurant-marker'}>{restaurant.name}</span></AdvancedMarker>)}{userLocation && <AdvancedMarker position={{ lat: userLocation.latitude, lng: userLocation.longitude }} title="目前位置"><span className="user-location-marker">目前位置</span></AdvancedMarker>}{selectedRestaurant && <InfoWindow position={{ lat: selectedRestaurant.latitude, lng: selectedRestaurant.longitude }} onCloseClick={() => onSelectRestaurant(null)}><strong>{selectedRestaurant.name}</strong><p>{selectedRestaurant.address || '未提供地址'}</p><p>{selectedRestaurant.category || '未分類'}</p></InfoWindow>}</Map></APIProvider></section>
}

function MapFocus({ restaurant }: { restaurant: Restaurant | null }) {
  const map = useMap()
  const latitude = restaurant?.latitude
  const longitude = restaurant?.longitude
  useEffect(() => {
    if (latitude !== undefined && latitude !== null && longitude !== undefined && longitude !== null) map?.panTo({ lat: latitude, lng: longitude })
  }, [latitude, longitude, map])
  return null
}

function hasRestaurantCoordinates(restaurant: Restaurant): restaurant is Restaurant & { latitude: number; longitude: number } {
  return hasValidCoordinates(restaurant)
}