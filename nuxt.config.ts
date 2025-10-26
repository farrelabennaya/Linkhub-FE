// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },
  modules: ["@pinia/nuxt", "@nuxtjs/tailwindcss"],
  css: ["@/src/input.css"],
  runtimeConfig: {
    public: {
      apiBase:
        // process.env.NUXT_PUBLIC_API_BASE || "http://127.0.0.1:8000/api/v1",
        process.env.NUXT_PUBLIC_API_BASE || "https://linkhub-api-kf3a.onrender.com/api/v1",
    },
  },
  app: { head: { title: "LinkHub" } },
  imports: {
    dirs: ["stores"],
  },
  pinia: {
    storesDirs: ["./stores/**", "./custom-folder/stores/**"],
  },
});