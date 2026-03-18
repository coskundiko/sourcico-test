<script setup lang="ts">
defineProps<{ title: string }>()
</script>

<template>
  <header class="flex h-16 items-center border-b border-gray-200 bg-white px-6">
    <h1 class="text-base font-semibold text-gray-900">{{ title }}</h1>
  </header>
</template>
