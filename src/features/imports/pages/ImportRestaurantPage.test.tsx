import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthProvider } from '../../../app/providers/AuthProvider'
import { MockAuthRepository } from '../../authentication/repositories/MockAuthRepository'
import type { RestaurantRepository } from '../../restaurants/repositories/RestaurantRepository'
import type { Restaurant } from '../../restaurants/models/restaurant'
import type { RestaurantSourceRepository } from '../repositories/RestaurantSourceRepository'
import type { OcrService } from '../services/OcrService'
import { ImportRestaurantPage } from './ImportRestaurantPage'

vi.mock('../../../core/firebase/firebaseClient', () => ({ createFirebaseServices: vi.fn(() => ({ firestore: {} })), shouldUseFirebaseEmulator: vi.fn(() => false) }))

const user = { id: 'alice', displayName: 'Alice', email: 'alice@example.com', photoURL: null }
const createObjectURL = vi.fn(() => 'blob:screenshot')
const revokeObjectURL = vi.fn()
beforeEach(() => {
  Object.assign(URL, { createObjectURL, revokeObjectURL })
})
afterEach(() => {
  createObjectURL.mockClear()
  revokeObjectURL.mockClear()
})
function repositories() {
  return {
    restaurants: { createRestaurant: vi.fn().mockResolvedValue('restaurant-1'), getRestaurantsByOwner: vi.fn().mockResolvedValue([] as Restaurant[]), getRestaurantById: vi.fn().mockResolvedValue(null), updateRestaurant: vi.fn().mockResolvedValue(undefined), deleteRestaurant: vi.fn().mockResolvedValue(undefined) } satisfies RestaurantRepository,
    sources: { createRestaurantSource: vi.fn().mockResolvedValue('source-1'), getRestaurantSourceById: vi.fn().mockResolvedValue(null), updateRestaurantSource: vi.fn().mockResolvedValue(undefined), deleteRestaurantSource: vi.fn().mockResolvedValue(undefined) } satisfies RestaurantSourceRepository
  }
}
function LocationProbe() {
  return <output data-testid="location-path">{useLocation().pathname}</output>
}
function renderPage(options: { ocrService?: OcrService; restaurantRepository?: RestaurantRepository; sourceRepository?: RestaurantSourceRepository } = {}) {
  const fallback = repositories()
  return render(<AuthProvider repository={new MockAuthRepository({ initialUser: user })}><MemoryRouter><ImportRestaurantPage restaurantRepository={options.restaurantRepository ?? fallback.restaurants} sourceRepository={options.sourceRepository ?? fallback.sources} ocrService={options.ocrService} /><LocationProbe /></MemoryRouter></AuthProvider>)
}

describe('ImportRestaurantPage', () => {
  it('keeps manual text while placing OCR output into an editable separate field', async () => {
    const ocrService: OcrService = { recognize: vi.fn().mockResolvedValue({ text: 'OCR text', resultsByImage: ['OCR text'], warnings: [] }) }
    renderPage({ ocrService })
    fireEvent.change(await screen.findByRole('textbox', { name: '手動貼上的來源文字' }), { target: { value: 'Manual text' } })
    fireEvent.change(screen.getByLabelText(/截圖（JPEG/), { target: { files: [new File(['image'], 'shot.png', { type: 'image/png' })] } })
    fireEvent.click(screen.getByRole('button', { name: '開始辨識文字' }))
    expect(await screen.findByRole('textbox', { name: '截圖 OCR 文字' })).toHaveValue('OCR text')
    expect(screen.getByRole('textbox', { name: '手動貼上的來源文字' })).toHaveValue('Manual text')
  })

  it('revokes a preview URL when a screenshot is removed', async () => {
    renderPage()
    fireEvent.change(await screen.getByLabelText(/截圖（JPEG/), { target: { files: [new File(['image'], 'shot.png', { type: 'image/png' })] } })
    expect(screen.getByRole('img', { name: '截圖預覽：shot.png' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '移除圖片' }))
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:screenshot')
  })

  it('rejects an invalid source URL before candidate extraction', async () => {
    renderPage()
    fireEvent.change(await screen.findByRole('textbox', { name: '來源連結（選填）' }), { target: { value: 'ftp://example.com' } })
    fireEvent.change(screen.getByRole('textbox', { name: '來源文字（供候選解析，可直接編輯）' }), { target: { value: 'Food Map Cafe' } })
    fireEvent.click(screen.getByRole('button', { name: '從來源文字提供草稿建議' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('合法的 http 或 https URL')
  })

  it('only calls repositories after a selected, named candidate is confirmed', async () => {
    const { restaurants, sources } = repositories()
    renderPage({ restaurantRepository: restaurants, sourceRepository: sources })
    await screen.findByRole('button', { name: '新增候選餐廳' })
    fireEvent.click(screen.getByRole('button', { name: '新增候選餐廳' }))
    expect(restaurants.createRestaurant).not.toHaveBeenCalled()
    fireEvent.change(screen.getByRole('textbox', { name: '餐廳名稱' }), { target: { value: 'Food Map Cafe' } })
    fireEvent.click(screen.getByRole('button', { name: '確認並儲存餐廳' }))
    await waitFor(() => expect(restaurants.createRestaurant).toHaveBeenCalledWith(expect.objectContaining({ ownerId: 'alice', name: 'Food Map Cafe' })))
    expect(sources.createRestaurantSource).toHaveBeenCalledWith(expect.objectContaining({ restaurantId: 'restaurant-1', sourceUrl: null }))
  })

  it('retries only the source after a partial failure, then navigates after it succeeds', async () => {
    const { restaurants, sources } = repositories()
    vi.mocked(sources.createRestaurantSource).mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce('source-1')
    renderPage({ restaurantRepository: restaurants, sourceRepository: sources })
    await screen.findByRole('button', { name: '新增候選餐廳' })
    fireEvent.click(screen.getByRole('button', { name: '新增候選餐廳' }))
    fireEvent.change(screen.getByRole('textbox', { name: '餐廳名稱' }), { target: { value: 'Food Map Cafe' } })
    fireEvent.click(screen.getByRole('button', { name: '確認並儲存餐廳' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('店家已建立，但來源資料尚未儲存')
    expect(restaurants.createRestaurant).toHaveBeenCalledTimes(1)
    fireEvent.click(screen.getByRole('button', { name: '重新儲存來源' }))
    await waitFor(() => expect(sources.createRestaurantSource).toHaveBeenCalledTimes(2))
    expect(restaurants.createRestaurant).toHaveBeenCalledTimes(1)
    expect(screen.getByTestId('location-path')).toHaveTextContent('/restaurants/restaurant-1/edit')
  })

  it('does not recreate the restaurant when a source retry fails again', async () => {
    const { restaurants, sources } = repositories()
    vi.mocked(sources.createRestaurantSource).mockRejectedValue(new Error('offline'))
    renderPage({ restaurantRepository: restaurants, sourceRepository: sources })
    await screen.findByRole('button', { name: '新增候選餐廳' })
    fireEvent.click(screen.getByRole('button', { name: '新增候選餐廳' }))
    fireEvent.change(screen.getByRole('textbox', { name: '餐廳名稱' }), { target: { value: 'Food Map Cafe' } })
    fireEvent.click(screen.getByRole('button', { name: '確認並儲存餐廳' }))
    await screen.findByRole('button', { name: '重新儲存來源' })
    fireEvent.click(screen.getByRole('button', { name: '重新儲存來源' }))
    await waitFor(() => expect(sources.createRestaurantSource).toHaveBeenCalledTimes(2))
    expect(restaurants.createRestaurant).toHaveBeenCalledTimes(1)
    expect(screen.getByRole('alert')).toHaveTextContent('來源資料暫時無法儲存')
  })
})