<script setup lang="ts">
const { $toast } = useNuxtApp() as any
const toasts = $toast._list
const close = (id: string) => $toast.remove(id)

// Consistent auto-close duration (3 seconds)
const TOAST_DURATION = 3000

onMounted(() => {
  // Auto-close toasts after consistent duration
  const interval = setInterval(() => {
    toasts.value.forEach((toast: any) => {
      if (!toast._timestamp) {
        toast._timestamp = Date.now()
      }
      if (Date.now() - toast._timestamp > TOAST_DURATION) {
        close(toast.id)
      }
    })
  }, 100)

  onUnmounted(() => clearInterval(interval))
})

const getIcon = (type: string) => {
  switch(type) {
    case 'success': return 'M5 13l4 4L19 7'
    case 'error': return 'M6 18L18 6M6 6l12 12'
    case 'warning': return 'M12 9v2m0 4h.01'
    default: return 'M13 16h-1v-4h-1m1-4h.01'
  }
}
</script>

<template>
  <div class="fixed z-[9999] top-4 right-4 pointer-events-none">
    <div class="w-64 sm:w-80 space-y-2 pointer-events-auto">
      <TransitionGroup name="toast">
        <div
          v-for="t in toasts"
          :key="t.id"
          class="relative rounded-lg shadow-lg border overflow-hidden bg-white dark:bg-slate-800"
          :class="{
            'border-emerald-200 dark:border-emerald-800': t.type === 'success',
            'border-red-200 dark:border-red-800': t.type === 'error',
            'border-amber-200 dark:border-amber-800': t.type === 'warning',
            'border-slate-200 dark:border-slate-700': t.type === 'info' || !t.type
          }"
        >
          <!-- Progress bar -->
          <!-- animate-progress HAS BEEN DELETED-->
          <div 
            class="absolute top-0 left-0 h-0.5"
            :class="{
              'bg-emerald-500': t.type === 'success',
              'bg-red-500': t.type === 'error',
              'bg-amber-500': t.type === 'warning',
              'bg-slate-500': t.type === 'info' || !t.type
            }"
          ></div>

          <!-- Content -->
          <div class="flex items-start gap-3 p-3">
            <!-- Icon -->
            <div 
              class="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-0.5"
              :class="{
                'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400': t.type === 'success',
                'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400': t.type === 'error',
                'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400': t.type === 'warning',
                'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400': t.type === 'info' || !t.type
              }"
            >
              <svg 
                class="w-3 h-3" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
                stroke-width="3"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path :d="getIcon(t.type || 'info')" />
              </svg>
            </div>

            <!-- Text content -->
            <div class="flex-1 min-w-0">
              <p 
                v-if="t.title" 
                class="font-semibold text-sm text-slate-900 dark:text-white mb-0.5"
              >
                {{ t.title }}
              </p>
              <p 
                class="text-sm text-slate-600 dark:text-slate-300"
              >
                {{ t.message }}
              </p>
            </div>

            <!-- Close button -->
            <button 
              @click="close(t.id)" 
              class="flex-shrink-0 w-5 h-5 rounded flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              title="Close"
            >
              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </TransitionGroup>
    </div>
  </div>
</template>

<style scoped>
/* Toast enter/leave transitions */
.toast-enter-from {
  opacity: 0;
  transform: translateX(20px);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(20px);
  max-height: 0;
  padding: 0;
  margin: 0;
}

.toast-enter-active {
  transition: all 0.3s ease-out;
}

.toast-leave-active {
  transition: all 0.2s ease-in;
}

.toast-move {
  transition: transform 0.3s ease;
}

/* Progress bar animation - exactly 3 seconds */
@keyframes progress {
  from {
    width: 100%;
  }
  to {
    width: 0%;
  }
}

.animate-progress {
  animation: progress 3s linear forwards;
}

/* Responsive adjustments */
@media (max-width: 640px) {
  .toast-enter-from {
    transform: translateY(-10px);
  }
  
  .toast-leave-to {
    transform: translateY(-10px);
  }
}
</style>