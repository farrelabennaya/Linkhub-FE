import { defineStore } from "pinia";
export const useAuth = defineStore("auth", {
  state: () => ({ user: null as any }),
  actions: {
    async login(email: string, password: string) {
      const { $api, $setToken } = useNuxtApp() as any;
      const res = await $api("/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      $setToken(res.token);
      this.user = res.user;
    },
    async register(payload: {
      name: string;
      email: string;
      password: string;
      username: string;
    }) {
      const { $api, $setToken } = useNuxtApp() as any;
      const res = await $api("/register", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      $setToken(res.token);
      this.user = res.user;
    },
    async fetchMe() {
      const { $api } = useNuxtApp() as any;
      this.user = await $api("/me");
    },
    logout() {
      const { $api, $setToken } = useNuxtApp() as any;
      $api("/logout", { method: "POST" }).catch(() => {});
      $setToken(null);
      this.user = null;
    },
  },
   persist: {
    paths: ['user'], // simpan field 'user' ke localStorage
  },
});
