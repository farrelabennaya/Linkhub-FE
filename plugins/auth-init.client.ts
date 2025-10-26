// plugins/auth-init.client.ts
export default defineNuxtPlugin(async () => {
  const auth = useAuth()
  const { $setToken } = useNuxtApp() as any

  const t = localStorage.getItem('token')
  if (t) $setToken(t)            // sinkronkan state Nuxt dengan localStorage

  if (t && !auth.user) {
    try { await auth.fetchMe() }
    catch { $setToken(null) }    // kosongkan keduanya bila invalid
  }
})
