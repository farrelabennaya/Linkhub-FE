// plugins/toast.client.ts
export default defineNuxtPlugin(() => {
  const toasts = useState<any[]>('toasts', () => [])

  const makeId = () => {
    try { if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID() } catch {}
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`
  }

  const remove = (id: string) => {
    const t = toasts.value.find(x => x.id === id)
    if (t?.__timer) clearTimeout(t.__timer)
    toasts.value = toasts.value.filter(x => x.id !== id)
  }

  const push = (p: { title?: string; message: string; type?: 'success'|'error'|'info'|'warning'; timeout?: number }) => {
    // anti-spam: hanya izinkan 1 toast aktif
    if (toasts.value.length > 0) return

    const id = makeId()
    const timeout = p.timeout ?? 2000
    const t: any = { id, type: p.type || 'info', title: p.title, message: p.message, timeout, __timer: null }
    toasts.value.push(t)
    // t.__timer = setTimeout(() => remove(id), timeout)
  }

  return {
    provide: {
      toast: {
        show:    (m: any) => push(m),
        success: (m: string, opt: any = {}) => push({ message: m, type: 'success', ...opt }),
        error:   (m: string, opt: any = {}) => push({ message: m, type: 'error',   ...opt }),
        info:    (m: string, opt: any = {}) => push({ message: m, type: 'info',    ...opt }),
        warning: (m: string, opt: any = {}) => push({ message: m, type: 'warning', ...opt }),
        remove,
        _list: toasts,
      }
    }
  }
})
