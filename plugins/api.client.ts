export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()
  const apiBase = config.public.apiBase
  const token = useState<string | null>('token', () =>
    process.client ? localStorage.getItem('token') : null
  )

  const $api = async (path: string, opts: RequestInit = {}) => {
    const isForm = opts.body instanceof FormData
    const headers: any = {
      Accept: 'application/json',
      'X-Requested-With': 'XMLHttpRequest', // bantu Laravel kirim JSON
      ...(opts.headers || {}),
    }
    if (!isForm) headers['Content-Type'] = 'application/json'
    if (token.value) headers['Authorization'] = `Bearer ${token.value}`

    const res = await fetch(`${apiBase}${path}`, { ...opts, headers })
    const data = await res.json().catch(() => ({}))

    if (!res.ok) {
      // lempar error dengan status & body supaya handler di FE bisa baca 422/401
      throw { status: res.status, ...data }
    }
    return data
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
