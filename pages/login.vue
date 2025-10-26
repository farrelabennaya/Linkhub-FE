<script setup lang="ts">
import { useAuth } from "~/stores/auth";

const email = ref("");
const password = ref("");
const err = ref("");
const auth = useAuth();
const onLogin = async () => {
  try {
  await auth.login(email.value, password.value)
  navigateTo('/dashboard')
} catch (e: any) {
  if (e.status === 422 && e.errors) {
    // ambil pesan pertama dari validasi
    const first = Object.values(e.errors).flat()?.[0]
    err.value = first || 'Data tidak valid.'
  } else if (e.status === 401) {
    err.value = 'Email atau password salah.'
  } else {
    err.value = 'Terjadi kesalahan. Coba lagi ya.'
  }
}

};
</script>

<template>
  <main
    class="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-4"
  >
    <div class="w-full max-w-md">
      <!-- Glass Card -->
      <div
        class="backdrop-blur-xl bg-gradient-to-br from-slate-800/40 to-blue-900/30 rounded-3xl shadow-2xl border border-white/10 p-8"
      >
        <!-- Logo Icon -->
        <div class="flex justify-center mb-6">
          <div
            class="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center shadow-lg"
          >
            <svg
              class="w-6 h-6 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          </div>
        </div>

        <!-- Welcome Text -->
        <h1 class="text-3xl font-bold text-center text-white mb-2">
          Welcome back
        </h1>
        <p class="text-center text-slate-400 text-sm mb-8">
          Please enter your details to sign in.
        </p>

        <!-- Error Message -->
        <div
          v-if="err"
          class="mb-4 p-3 rounded-lg bg-red-500/20 border border-red-500/50"
        >
          <p class="text-red-300 text-sm text-center">{{ err }}</p>
        </div>

        <!-- Email Input -->
        <div class="mb-4">
          <label class="block text-slate-300 text-sm mb-2">Email</label>
          <div class="relative">
            <input
              v-model="email"
              type="email"
              placeholder="merveavsar@mail.com"
              class="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition-all mb-3"
              @keyup.enter="onLogin"
            />
             <label class="block text-slate-300 text-sm mb-2">Password</label>
            <input
              v-model="password"
              type="password"
              placeholder="Min. 8 character"
              class="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition-all"
            />
            <button
              @click="onLogin"
              class="w-full h-10 mt-6 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-lg flex items-center justify-center hover:shadow-lg hover:shadow-cyan-500/50 transition-all"
            >
              <span class="text-white">
                Login
              </span>
            </button>
          </div>
        </div>

        <!-- Divider -->
        <div class="relative my-6">
          <div class="absolute inset-0 flex items-center">
            <div class="w-full border-t border-slate-700/50"></div>
          </div>
          <div class="relative flex justify-center text-sm">
            <span class="px-4 bg-transparent text-slate-500">OR</span>
          </div>
        </div>

        <!-- Sign Up Link -->
        <p class="text-center text-sm text-slate-400">
          Don't have an account?
          <NuxtLink
            to="/register"
            class="text-cyan-400 hover:text-cyan-300 font-medium ml-1 transition-colors"
          >
            Create Account
          </NuxtLink>
        </p>
      </div>
    </div>
  </main>
</template>

<style>
.input {
  @apply w-full border rounded px-3 py-2;
}
.btn {
  @apply w-full bg-black text-white rounded px-3 py-2;
}
</style>
