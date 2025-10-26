// middleware/auth.global.ts
import { useAuth, navigateTo } from '#imports'

export default defineNuxtRouteMiddleware(async (to) => {
  if (process.server) return

  const auth = useAuth()
  const { $setToken } = useNuxtApp() as any
  const hasToken = !!localStorage.getItem('token')

  if (hasToken && !auth.user) {
    try {
      await auth.fetchMe()
    } catch {
      $setToken(null) // sinkron: state & localStorage
    }
  }

  const privatePages = ['/dashboard']
  if (privatePages.includes(to.path) && !auth.user) {
    return navigateTo('/login')
  }
})
