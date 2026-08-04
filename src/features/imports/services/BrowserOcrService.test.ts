import { describe, expect, it, vi } from 'vitest'
const mocks = vi.hoisted(() => ({ terminate: vi.fn(), recognize: vi.fn(), createWorker: vi.fn() }))
vi.mock('tesseract.js', () => ({ createWorker: mocks.createWorker }))
import { BrowserOcrService } from './BrowserOcrService'

describe('BrowserOcrService', () => {
  it('does not create a worker without images', async () => {
    await expect(new BrowserOcrService().recognize([])).resolves.toEqual({ text: '', resultsByImage: [], warnings: ['請先選擇至少一張截圖。'] })
    expect(mocks.createWorker).not.toHaveBeenCalled()
  })

  it('recognizes images in order, reports progress, and terminates the worker', async () => {
    mocks.recognize.mockResolvedValueOnce({ data: { text: '第一張' } }).mockResolvedValueOnce({ data: { text: 'Second' } })
    mocks.createWorker.mockResolvedValue({ recognize: mocks.recognize, terminate: mocks.terminate })
    const progress = vi.fn()
    const result = await new BrowserOcrService().recognize([new File(['a'], 'one.png', { type: 'image/png' }), new File(['b'], 'two.png', { type: 'image/png' })], progress)
    expect(result.text).toBe('【截圖 1】\n第一張\n\n【截圖 2】\nSecond')
    expect(progress).toHaveBeenCalledWith(expect.objectContaining({ imageIndex: 0, imageCount: 2, progress: 0 }))
    expect(mocks.terminate).toHaveBeenCalledOnce()
  })

  it('returns a friendly error and terminates after worker failure', async () => {
    mocks.recognize.mockRejectedValueOnce(new Error('worker failure'))
    mocks.createWorker.mockResolvedValue({ recognize: mocks.recognize, terminate: mocks.terminate })
    await expect(new BrowserOcrService().recognize([new File(['a'], 'one.png', { type: 'image/png' })])).rejects.toThrow('文字辨識暫時無法完成')
    expect(mocks.terminate).toHaveBeenCalled()
  })
})