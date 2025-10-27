<script setup lang="ts"></script>

<template>
  <NuxtLoadingIndicator />
  <NuxtLayout>
    <!-- Header yang butuh client-side boleh tetap ClientOnly -->
    <ClientOnly>
      <slot name="header" />
    </ClientOnly>

    <!-- JANGAN ditunda -->
    <NuxtPage />

    <!-- Toast memang client-only -->
    <ClientOnly>
      <UiToast />
    </ClientOnly>
  </NuxtLayout>
</template>
