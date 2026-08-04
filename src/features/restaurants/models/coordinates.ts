export interface RestaurantCoordinates {
  latitude: number | null
  longitude: number | null
}

export type CoordinateValidation = { valid: true; coordinates: RestaurantCoordinates } | { valid: false; message: string }

export function validateCoordinates(latitudeInput: string, longitudeInput: string): CoordinateValidation {
  const latitude = latitudeInput.trim()
  const longitude = longitudeInput.trim()
  if (!latitude && !longitude) return { valid: true, coordinates: { latitude: null, longitude: null } }
  if (!latitude || !longitude) return { valid: false, message: '請同時填寫緯度與經度。' }

  const parsedLatitude = Number(latitude)
  const parsedLongitude = Number(longitude)
  if (!Number.isFinite(parsedLatitude) || !Number.isFinite(parsedLongitude)) return { valid: false, message: '緯度與經度必須為合法數字。' }
  if (parsedLatitude < -90 || parsedLatitude > 90) return { valid: false, message: '緯度必須介於 -90 到 90。' }
  if (parsedLongitude < -180 || parsedLongitude > 180) return { valid: false, message: '經度必須介於 -180 到 180。' }
  return { valid: true, coordinates: { latitude: parsedLatitude, longitude: parsedLongitude } }
}

export function hasValidCoordinates(coordinates: RestaurantCoordinates): coordinates is { latitude: number; longitude: number } {
  return coordinates.latitude !== null && coordinates.longitude !== null
    && Number.isFinite(coordinates.latitude) && Number.isFinite(coordinates.longitude)
    && coordinates.latitude >= -90 && coordinates.latitude <= 90
    && coordinates.longitude >= -180 && coordinates.longitude <= 180
}