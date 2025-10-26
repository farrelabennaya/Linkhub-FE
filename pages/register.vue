<script setup lang="ts">
import { useAuth } from '~/stores/auth';

const name = ref("");
const email = ref("");
const password = ref("");
const username = ref("");
const err = ref("");
const auth = useAuth();
const loading = ref(false)

const fieldErr = ref<Record<string, string[]>>({})

const onReg = async () => {
  err.value = ''
  fieldErr.value = {}

  // pre-validate cepat di FE (BE tetap validasi ya)
  if (!name.value || !username.value || !email.value || !password.value) {
    err.value = 'Lengkapi semua field ya.'
    return
  }

  loading.value = true
  try {
    await auth.register({
      name: name.value,
      email: email.value,
      password: password.value,
      username: username.value,
    })
    navigateTo('/dashboard')
  } catch (e: any) {
    if (e.status === 422 && e.errors) {
      fieldErr.value = e.errors
      const first = Object.values(e.errors).flat()?.[0]
      err.value = first || 'Data tidak valid.'
    } else {
      err.value = e.message || 'Gagal daftar.'
    }
  } finally {
    loading.value = false
  }
}

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
        <!-- Logo/Icon -->
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

        <!-- Title -->
        <h1 class="text-3xl font-bold text-center text-white mb-2">Create account</h1>
        <p class="text-center text-slate-400 text-sm mb-8">
          Join in and start sharing your links.
        </p>

        <!-- Error -->
        <div
          v-if="err"
          class="mb-4 p-3 rounded-lg bg-red-500/20 border border-red-500/50"
        >
          <p class="text-red-300 text-sm text-center">{{ err }}</p>
        </div>

        <!-- Form -->
        <div class="space-y-4">
          <div>
            <label class="block text-slate-300 text-sm mb-2">Name</label>
            <input
              v-model="name"
              type="text"
              placeholder="Farrel Abennaya"
              class="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition-all"
              @keyup.enter="onReg"
            />
          </div>

          <div>
            <label class="block text-slate-300 text-sm mb-2">Username</label>
            <input
              v-model="username"
              type="text"
              placeholder="aben"
              class="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition-all"
              @keyup.enter="onReg"
            />
          </div>

          <div>
            <label class="block text-slate-300 text-sm mb-2">Email</label>
            <input
              v-model="email"
              type="email"
              placeholder="aben@mail.com"
              class="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition-all"
              @keyup.enter="onReg"
            />
          </div>

          <div>
            <label class="block text-slate-300 text-sm mb-2">Password</label>
            <input
              v-model="password"
              type="password"
              placeholder="Min. 8 characters"
              class="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition-all"
              @keyup.enter="onReg"
            />
          </div>

          <button
            @click="onReg"
            class="w-full h-11 mt-2 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-lg flex items-center justify-center hover:shadow-lg hover:shadow-cyan-500/50 transition-all"
          >
            <span class="text-white font-medium">Create Account</span>
          </button>
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

        <!-- Link to Login -->
        <p class="text-center text-sm text-slate-400">
          Already have an account?
          <NuxtLink
            to="/login"
            class="text-cyan-400 hover:text-cyan-300 font-medium ml-1 transition-colors"
          >
            Sign in
          </NuxtLink>
        </p>
      </div>
    </div>
  </main>
</template>