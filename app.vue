<script setup lang="ts">
const ready = ref(false)
onMounted(() => { ready.value = true })
</script>

<template>
  <NuxtLoadingIndicator />
  <NuxtLayout>
    <!-- Jika ada header yang tergantung auth.user -->
    <ClientOnly>
      <slot name="header" />
    </ClientOnly>

    <NuxtPage v-if="ready" />
    <!-- atau <ClientOnly><NuxtPage /></ClientOnly> kalau mau full client -->

    <ClientOnly>
      <UiToast />
    </ClientOnly>
  </NuxtLayout>
</template>
