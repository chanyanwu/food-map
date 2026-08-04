import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { Restaurant } from '../models/restaurant'
import { RestaurantMap } from './RestaurantMap'

vi.mock('@vis.gl/react-google-maps', () => ({
  APIProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="api-provider">{children}</div>,
  Map: ({ children }: { children: React.ReactNode }) => <div data-testid="map">{children}</div>,
  AdvancedMarker: ({ position, children, onClick, title }: { position: { lat: number; lng: number }; children?: React.ReactNode; onClick?: () => void; title?: string }) => <button data-testid="marker" data-position={`${position.lat},${position.lng}`} onClick={onClick}>{title}{children}</button>,
  useMap: () => ({ panTo: vi.fn() }),
  InfoWindow: ({ children }: { children: React.ReactNode }) => <div>{children}</div>
}))

const restaurant = (overrides: Partial<Restaurant> = {}): Restaurant => ({ id: 'restaurant-1', ownerId: 'alice', name: 'Food Map Cafe', address: 'Taipei', category: 'Cafe', rating: null, notes: '', latitude: null, longitude: null, photoURLs: [], createdAt: new Date(), updatedAt: new Date(), schemaVersion: 1, ...overrides })

describe('RestaurantMap', () => {
  it('shows a setup prompt when the API key is absent', () => {
    render(<RestaurantMap restaurants={[]} apiKey="" />)
    expect(screen.getByRole('alert')).toHaveTextContent('尚未設定 Google Maps API Key')
  })

  it('renders an empty map safely', () => {
    render(<RestaurantMap restaurants={[]} apiKey="test-key" />)
    expect(screen.getByTestId('map')).toBeInTheDocument()
    expect(screen.queryByTestId('marker')).not.toBeInTheDocument()
  })

  it('does not create markers for restaurants without valid coordinates', () => {
    render(<RestaurantMap restaurants={[restaurant(), restaurant({ id: 'bad', latitude: 91, longitude: 121 })]} apiKey="test-key" />)
    expect(screen.queryByTestId('marker')).not.toBeInTheDocument()
  })

  it('passes valid restaurant coordinates to markers', () => {
    render(<RestaurantMap restaurants={[restaurant({ latitude: 25.033, longitude: 121.5654 })]} apiKey="test-key" />)
    expect(screen.getByTestId('marker')).toHaveAttribute('data-position', '25.033,121.5654')
  })

  it('notifies the parent from marker clicks and displays the current-location marker', () => {
    const onSelectRestaurant = vi.fn()
    render(<RestaurantMap restaurants={[restaurant({ latitude: 25.033, longitude: 121.5654 })]} selectedRestaurantId={null} onSelectRestaurant={onSelectRestaurant} userLocation={{ latitude: 25.04, longitude: 121.56, accuracy: 20 }} apiKey="test-key" />)
    fireEvent.click(screen.getByRole('button', { name: /Food Map Cafe/ }))
    expect(onSelectRestaurant).toHaveBeenCalledWith('restaurant-1')
    expect(screen.getByRole('button', { name: /目前位置/ })).toHaveAttribute('data-position', '25.04,121.56')
  })
})