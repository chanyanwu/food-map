import { createWorker } from 'tesseract.js'
import type { OcrResult, OcrService } from './OcrService'

export class BrowserOcrService implements OcrService {
  private worker: Awaited<ReturnType<typeof createWorker>> | null = null

  async recognize(images: File[], onProgress?: (progress: { imageIndex: number; imageCount: number; progress: number; status: string }) => void): Promise<OcrResult> {
    if (images.length === 0) return { text: '', resultsByImage: [], warnings: ['請先選擇至少一張截圖。'] }
    try {
      const worker = await createWorker(['chi_tra', 'eng'], 1, { logger: message => onProgress?.({ imageIndex: 0, imageCount: images.length, progress: Math.round((message.progress ?? 0) * 100), status: message.status }) })
      this.worker = worker
      const resultsByImage: string[] = []
      for (const [imageIndex, image] of images.entries()) {
        onProgress?.({ imageIndex, imageCount: images.length, progress: 0, status: `正在辨識第 ${imageIndex + 1} 張圖片` })
        const result = await worker.recognize(image)
        resultsByImage.push(result.data.text.trim())
        onProgress?.({ imageIndex, imageCount: images.length, progress: 100, status: `已完成第 ${imageIndex + 1} 張圖片` })
      }
      return { text: resultsByImage.map((text, index) => `【截圖 ${index + 1}】\n${text}`).join('\n\n'), resultsByImage, warnings: [] }
    } catch {
      throw new Error('文字辨識暫時無法完成，請稍後再試或改用手動貼上文字。')
    } finally {
      const worker = this.worker
      this.worker = null
      await worker?.terminate()
    }
  }

  async cancel(): Promise<void> {
    const worker = this.worker
    this.worker = null
    await worker?.terminate()
  }
}