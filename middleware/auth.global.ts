// middleware/auth.global.ts
import { useAuth, navigateTo } from '#imports'

export default defineNuxtRouteMiddleware((to) => {
  if (process.server) return

  const auth = useAuth()
  const { $setToken } = useNuxtApp() as any
  const hasToken = !!localStorage.getItem('token')

  // Jangan await — biarkan jalan di background
  if (hasToken && !auth.user) {
    auth.fetchMe().catch(() => $setToken(null))
  }

  const privatePages = ['/dashboard']

  // Hanya cegat kalau masuk private page dan TIDAK punya token
  if (privatePages.includes(to.path) && !hasToken) {
    return navigateTo('/login')
  }
})
