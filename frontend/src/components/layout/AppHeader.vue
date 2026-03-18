<script setup lang="ts">
defineProps<{ title: string }>()
</script>

<template>
  <header class="flex h-14 items-center justify-between border-b border-gray-200 bg-white px-6">
    <h1 class="text-base font-bold text-[#1e293b]">{{ title }}</h1>
    <div id="header-actions" class="ml-auto flex items-center gap-2"></div>
  </header>
</template>
