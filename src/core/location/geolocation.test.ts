import { describe, expect, it, vi } from 'vitest'
import { getCurrentLocation } from './geolocation'

function geolocation(): Geolocation {
  return { getCurrentPosition: vi.fn(), watchPosition: vi.fn(), clearWatch: vi.fn() } as unknown as Geolocation
}

describe('getCurrentLocation', () => {
  it('returns position data and uses bounded browser options', async () => {
    const browserGeolocation = geolocation()
    const result = getCurrentLocation(browserGeolocation)
    ;(browserGeolocation.getCurrentPosition as ReturnType<typeof vi.fn>).mock.calls[0][0]({ coords: { latitude: 25.033, longitude: 121.5654, accuracy: 18 } })
    await expect(result).resolves.toEqual({ latitude: 25.033, longitude: 121.5654, accuracy: 18 })
    expect((browserGeolocation.getCurrentPosition as ReturnType<typeof vi.fn>).mock.calls[0][2]).toEqual({ enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 })
  })

  it('reports unsupported, denied, timeout, and unknown failures in Chinese', async () => {
    await expect(getCurrentLocation(undefined)).rejects.toThrow('此瀏覽器不支援定位功能')
    const errors: Array<[number, string]> = [[1, '定位權限已被拒絕，請在瀏覽器設定中允許位置存取'], [3, '取得目前位置逾時，請稍後再試'], [2, '目前無法取得你的位置']]
    for (const [code, message] of errors) {
      const browserGeolocation = { getCurrentPosition: vi.fn((_success, failure) => failure({ code, PERMISSION_DENIED: 1, TIMEOUT: 3 })) } as unknown as Geolocation
      await expect(getCurrentLocation(browserGeolocation)).rejects.toThrow(message)
    }
  })
})