<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, RouterView } from 'vue-router'
import AppSidebar from './AppSidebar.vue'
import AppHeader from './AppHeader.vue'

const route = useRoute()
const pageTitle = computed(() => {
  const titles: Record<string, string> = {
    users: 'User Management',
    roles: 'Roles & Permissions',
  }
  return titles[route.name as string] ?? 'Dashboard'
})
</script>

<template>
  <div class="flex h-screen overflow-hidden bg-gray-50">
    <AppSidebar />

    <div class="flex flex-1 flex-col overflow-hidden">
      <AppHeader :title="pageTitle" />

      <main class="flex-1 overflow-y-auto p-6">
        <RouterView />
      </main>
    </div>
  </div>
</template>
