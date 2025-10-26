<script setup lang="ts">
const route = useRoute();
const { $api } = useNuxtApp() as any;
const data = ref<{ profile: any; links: any[] } | null>(null);
const loading = ref(true);

onMounted(async () => {
  try {
    data.value = await $api(`/u/${route.params.username}`);
  } finally {
    loading.value = false;
  }
});

const clickLink = async (id: number) => {
  // fire-and-forget tracking
  fetch(useRuntimeConfig().public.apiBase + "/click", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ link_id: id }),
  }).catch(() => {});
};

// Get theme classes
const getThemeClasses = (theme: string) => {
  const themes = {
    light: {
      bg: 'bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50',
      card: 'bg-white/80 backdrop-blur-sm border-gray-200 hover:border-blue-400 text-gray-900 hover:bg-white hover:shadow-xl hover:shadow-blue-100',
      text: 'text-gray-900',
      subtext: 'text-gray-600',
      avatar: 'ring-4 ring-blue-200 shadow-xl'
    },
    dark: {
      bg: 'bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900',
      card: 'bg-slate-800/50 backdrop-blur-xl border-slate-700/50 hover:border-cyan-500/50 text-white hover:bg-slate-800/70 hover:shadow-xl hover:shadow-cyan-500/20',
      text: 'text-white',
      subtext: 'text-slate-400',
      avatar: 'ring-4 ring-cyan-500/50 shadow-2xl shadow-cyan-500/30'
    },
    minimal: {
      bg: 'bg-white',
      card: 'bg-gray-50 border-gray-300 hover:border-gray-900 text-gray-900 hover:bg-gray-100',
      text: 'text-gray-900',
      subtext: 'text-gray-600',
      avatar: 'ring-2 ring-gray-900 shadow-lg'
    },
    neon: {
      bg: 'bg-black',
      card: 'bg-gradient-to-r from-purple-900/20 to-pink-900/20 backdrop-blur-sm border-purple-500/50 hover:border-pink-500 text-white hover:shadow-2xl hover:shadow-pink-500/50 hover:from-purple-900/40 hover:to-pink-900/40',
      text: 'text-white',
      subtext: 'text-purple-300',
      avatar: 'ring-4 ring-gradient-to-r from-purple-500 to-pink-500 shadow-2xl shadow-purple-500/50'
    }
  };
  return themes[theme as keyof typeof themes] || themes.light;
};
</script>

<template>
  <main>
    <!-- Loading State -->
    <div v-if="loading" class="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <div class="text-center">
        <div class="animate-spin rounded-full h-16 w-16 border-b-4 border-cyan-400 mx-auto mb-4"></div>
        <p class="text-slate-400 text-lg">Loading profile...</p>
      </div>
    </div>

    <!-- Profile Content -->
    <div
      v-else-if="data"
      :class="[
        'min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden',
        getThemeClasses(data.profile.theme).bg
      ]"
    >
      <!-- Decorative Elements based on theme -->
      <div v-if="data.profile.theme === 'neon'" class="absolute inset-0 overflow-hidden pointer-events-none">
        <div class="absolute top-20 left-20 w-96 h-96 bg-purple-500/30 rounded-full filter blur-[128px] animate-pulse"></div>
        <div class="absolute bottom-20 right-20 w-96 h-96 bg-pink-500/30 rounded-full filter blur-[128px] animate-pulse" style="animation-delay: 1s;"></div>
      </div>

      <div v-if="data.profile.theme === 'dark'" class="absolute inset-0 overflow-hidden pointer-events-none">
        <div class="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/20 rounded-full filter blur-[128px]"></div>
        <div class="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full filter blur-[128px]"></div>
      </div>

      <!-- Content Container -->
      <div class="relative z-10 w-full max-w-2xl mx-auto">
        <!-- Avatar Section -->
        <div class="flex flex-col items-center mb-8 animate-fadeIn">
          <div v-if="data.profile.avatar_url" class="relative group mb-6">
            <img
              :src="data.profile.avatar_url"
              :alt="data.profile.display_name"
              :class="[
                'w-32 h-32 rounded-full object-cover transition-all duration-300',
                getThemeClasses(data.profile.theme).avatar,
                'group-hover:scale-105'
              ]"
            />
            <!-- Animated ring for neon theme -->
            <div v-if="data.profile.theme === 'neon'" class="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 animate-spin-slow opacity-50 blur-md -z-10"></div>
          </div>

          <!-- Name -->
          <h1 
            :class="[
              'text-4xl md:text-5xl font-bold mb-3 text-center',
              getThemeClasses(data.profile.theme).text
            ]"
            class="animate-slideDown"
          >
            {{ data.profile.display_name || "@" + data.profile.username }}
          </h1>

          <!-- Bio -->
          <p 
            v-if="data.profile.bio"
            :class="[
              'text-center max-w-md mb-2 whitespace-pre-line leading-relaxed',
              getThemeClasses(data.profile.theme).subtext
            ]"
            class="animate-slideDown"
            style="animation-delay: 0.1s;"
          >
            {{ data.profile.bio }}
          </p>

          <!-- Username badge -->
          <div 
            class="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium animate-slideDown"
            :class="[
              data.profile.theme === 'neon' 
                ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/50 text-purple-300'
                : data.profile.theme === 'dark'
                ? 'bg-slate-800/50 border border-slate-700/50 text-slate-400'
                : data.profile.theme === 'minimal'
                ? 'bg-gray-100 border border-gray-300 text-gray-600'
                : 'bg-white/50 border border-gray-200 text-gray-600'
            ]"
            style="animation-delay: 0.2s;"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            @{{ data.profile.username }}
          </div>
        </div>

        <!-- Links Section -->
        <div class="w-full space-y-4 px-4">
          <a
            v-for="(l, index) in data.links"
            :key="l.id"
            :href="l.url"
            target="_blank"
            rel="noopener noreferrer"
            @click="clickLink(l.id)"
            :class="[
              'block border-2 rounded-2xl px-6 py-4 text-center font-semibold transition-all duration-300 transform hover:scale-[1.02] hover:-translate-y-1 group relative overflow-hidden',
              getThemeClasses(data.profile.theme).card,
              'animate-slideUp'
            ]"
            :style="`animation-delay: ${0.3 + index * 0.1}s;`"
          >
            <!-- Neon glow effect -->
            <div 
              v-if="data.profile.theme === 'neon'" 
              class="absolute inset-0 bg-gradient-to-r from-purple-500/0 via-pink-500/0 to-purple-500/0 group-hover:from-purple-500/20 group-hover:via-pink-500/20 group-hover:to-purple-500/20 transition-all duration-300 rounded-2xl"
            ></div>

            <!-- Link content -->
            <div class="relative flex items-center justify-between">
              <span class="flex-1 text-lg">{{ l.title }}</span>
              <svg 
                class="w-5 h-5 transform group-hover:translate-x-1 transition-transform duration-300" 
                :class="[
                  data.profile.theme === 'neon' ? 'text-pink-400' :
                  data.profile.theme === 'dark' ? 'text-cyan-400' :
                  data.profile.theme === 'minimal' ? 'text-gray-600' :
                  'text-blue-500'
                ]"
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </div>

            <!-- Hover border effect for minimal theme -->
            <div v-if="data.profile.theme === 'minimal'" class="absolute inset-0 border-2 border-transparent group-hover:border-gray-900 rounded-2xl transition-colors duration-300"></div>
          </a>

          <!-- Empty state -->
          <div 
            v-if="data.links.length === 0"
            class="text-center py-16 animate-fadeIn"
          >
            <svg 
              :class="[
                'w-20 h-20 mx-auto mb-4',
                getThemeClasses(data.profile.theme).subtext
              ]"
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            <p 
              :class="[
                'text-xl font-medium',
                getThemeClasses(data.profile.theme).subtext
              ]"
            >
              No links yet
            </p>
          </div>
        </div>

        <!-- Footer -->
        <div 
          class="mt-12 text-center animate-fadeIn"
          style="animation-delay: 0.8s;"
        >
          <p 
            :class="[
              'text-sm',
              getThemeClasses(data.profile.theme).subtext
            ]"
          >
            Powered by ItsLink
          </p>
        </div>
      </div>
    </div>

    <!-- Error State -->
    <div v-else class="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <div class="text-center">
        <svg class="w-20 h-20 text-red-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <h2 class="text-2xl font-bold text-white mb-2">Profile Not Found</h2>
        <p class="text-slate-400">The profile you're looking for doesn't exist.</p>
      </div>
    </div>
  </main>
</template>

<style scoped>
/* Animations */
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes spin-slow {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.animate-fadeIn {
  animation: fadeIn 0.6s ease-out forwards;
}

.animate-slideDown {
  animation: slideDown 0.6s ease-out forwards;
  opacity: 0;
}

.animate-slideUp {
  animation: slideUp 0.6s ease-out forwards;
  opacity: 0;
}

.animate-spin-slow {
  animation: spin-slow 3s linear infinite;
}

/* Smooth scrolling */
html {
  scroll-behavior: smooth;
}

/* Custom scrollbar based on theme */
::-webkit-scrollbar {
  width: 10px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: rgba(100, 116, 139, 0.5);
  border-radius: 5px;
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(148, 163, 184, 0.7);
}
</style>