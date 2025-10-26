// plugins/api.ts (ringkas)
export default defineNuxtPlugin((nuxtApp) => {
  const config = useRuntimeConfig()
  const apiBase = config.public.apiBase
  const token = useState<string | null>('token', () =>
    process.client ? localStorage.getItem('token') : null
  )

  const $api = async (path: string, opts: RequestInit = {}) => {
    const isForm = opts.body instanceof FormData
    const headers: any = {
      Accept: 'application/json',
      ...(opts.headers || {}),
    }
    if (!isForm) headers['Content-Type'] = 'application/json'
    if (token.value) headers['Authorization'] = `Bearer ${token.value}`

    const res = await fetch(`${apiBase}${path}`, { ...opts, headers })
    if (!res.ok) throw await res.json().catch(() => ({ message: res.statusText }))
    return res.json()
  }

  return {
    provide: {
      api: $api,
      setToken: (t: string | null) => {
        token.value = t
        if (process.client) t ? localStorage.setItem('token', t) : localStorage.removeItem('token')
      },
    },
  }
})
