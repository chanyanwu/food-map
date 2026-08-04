export const acceptedImageTypes = ['image/jpeg', 'image/png', 'image/webp']
export const maximumImageBytes = 10 * 1024 * 1024
export const maximumImageCount = 5

export interface SelectedImage { file: File; previewUrl: string }

export function validateImages(files: File[], existingCount = 0): string | null {
  if (existingCount + files.length > maximumImageCount) return `最多只能選擇 ${maximumImageCount} 張截圖。`
  if (files.some(file => !acceptedImageTypes.includes(file.type))) return '截圖僅支援 JPEG、PNG 或 WebP 格式。'
  if (files.some(file => file.size > maximumImageBytes)) return '單張截圖不可超過 10 MB。'
  return null
}