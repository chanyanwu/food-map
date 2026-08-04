import { hasValidCoordinates, type RestaurantCoordinates } from '../models/coordinates'

const earthRadiusKilometers = 6371

export function calculateDistanceKilometers(first: RestaurantCoordinates, second: RestaurantCoordinates): number | null {
  if (!hasValidCoordinates(first) || !hasValidCoordinates(second)) return null
  const latitudeDifference = toRadians(second.latitude - first.latitude)
  const longitudeDifference = toRadians(second.longitude - first.longitude)
  const value = Math.sin(latitudeDifference / 2) ** 2
    + Math.cos(toRadians(first.latitude)) * Math.cos(toRadians(second.latitude)) * Math.sin(longitudeDifference / 2) ** 2
  return earthRadiusKilometers * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value))
}

export function formatDistance(distanceKilometers: number): string {
  if (!Number.isFinite(distanceKilometers) || distanceKilometers < 0) return ''
  if (distanceKilometers < 1) return `${Math.round(distanceKilometers * 1000)} 公尺`
  return `${distanceKilometers.toFixed(1)} 公里`
}

function toRadians(degrees: number): number {
  return degrees * Math.PI / 180
}