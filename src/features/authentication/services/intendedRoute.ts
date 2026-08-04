const intendedRouteKey = 'food-map.intended-route'

export function saveIntendedRoute(route: string, storage: Storage = sessionStorage): void {
  if (route.startsWith('/') && !route.startsWith('//')) storage.setItem(intendedRouteKey, route)
}

export function consumeIntendedRoute(storage: Storage = sessionStorage): string | null {
  const route = storage.getItem(intendedRouteKey)
  storage.removeItem(intendedRouteKey)
  return route?.startsWith('/') && !route.startsWith('//') ? route : null
}