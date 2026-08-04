export interface OcrProgress {
  imageIndex: number
  imageCount: number
  progress: number
  status: string
}

export interface OcrResult {
  text: string
  resultsByImage: string[]
  warnings: string[]
}

export interface OcrService {
  recognize(images: File[], onProgress?: (progress: OcrProgress) => void): Promise<OcrResult>
  cancel?(): Promise<void>
}