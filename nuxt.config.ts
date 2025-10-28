// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  routeRules: {
    "/": { redirect: "/login" },
  },
  devtools: { enabled: true },
  modules: ["@pinia/nuxt", "@nuxtjs/tailwindcss"],
  css: ["@/src/input.css"],
  runtimeConfig: {
    public: {
      apiBase:
        // process.env.NUXT_PUBLIC_API_BASE || "http://127.0.0.1:8000/api/v1",
        process.env.NUXT_PUBLIC_API_BASE ||
        "https://linkhub-api-kf3a.onrender.com/api/v1",
    },
  },
   app: {
    head: {
      title: 'HulaHub',
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.png' },
        { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicon.png' },
        { rel: 'icon', type: 'image/png', sizes: '16x16', href: '/favicon.png' },
        { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' },
        { rel: 'manifest', href: '/site.webmanifest' },
        // Kalau pakai SVG:
        // { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
      ],
      meta: [
        { name: 'theme-color', content: '#0f172a' } // warna address bar di Android
      ]
    }
  },
  
  imports: {
    dirs: ["stores"],
  },
  pinia: {
    storesDirs: ["./stores/**", "./custom-folder/stores/**"],
  },
});
