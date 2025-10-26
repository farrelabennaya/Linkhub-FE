<script setup lang="ts">
const r = useRouter()
// SSR-safe: return navigateTo agar dieksekusi di server
await navigateTo('/login', { replace: true })
</script>

<template></template>
