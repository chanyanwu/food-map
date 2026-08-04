export interface UserLocation {
  latitude: number
  longitude: number
  accuracy: number | null
}

export class GeolocationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'GeolocationError'
  }
}

const options: PositionOptions = { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }

export function getCurrentLocation(geolocation: Geolocation | undefined = navigator.geolocation): Promise<UserLocation> {
  if (!geolocation) return Promise.reject(new GeolocationError('此瀏覽器不支援定位功能'))
  return new Promise((resolve, reject) => {
    geolocation.getCurrentPosition(
      position => resolve({ latitude: position.coords.latitude, longitude: position.coords.longitude, accuracy: Number.isFinite(position.coords.accuracy) ? position.coords.accuracy : null }),
      error => reject(new GeolocationError(toLocationErrorMessage(error))),
      options
    )
  })
}

function toLocationErrorMessage(error: GeolocationPositionError): string {
  if (error.code === error.PERMISSION_DENIED) return '定位權限已被拒絕，請在瀏覽器設定中允許位置存取'
  if (error.code === error.TIMEOUT) return '取得目前位置逾時，請稍後再試'
  return '目前無法取得你的位置'
}