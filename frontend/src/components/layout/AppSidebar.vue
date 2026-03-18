<script setup lang="ts">
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { usePermissions } from '@/composables/usePermissions'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()
const { can } = usePermissions()

async function logout() {
  await auth.logout()
  router.push('/login')
}
</script>

<template>
  <aside class="flex h-screen w-56 flex-col border-r border-gray-200 bg-white">
    <!-- Logo -->
    <div class="flex h-14 items-center border-b border-gray-200 px-5">
      <span class="text-lg font-semibold text-gray-900">Perion</span>
    </div>

    <!-- Nav -->
    <nav class="flex flex-1 flex-col gap-1 p-3">
      <router-link
        v-if="can('user.view')"
        to="/users"
        class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors"
        :class="route.path === '/users' ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'"
      >
        <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
        Users
      </router-link>

      <router-link
        v-if="can('role.view')"
        to="/roles"
        class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors"
        :class="route.path === '/roles' ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'"
      >
        <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
        Roles
      </router-link>
    </nav>

    <!-- User + Logout -->
    <div class="border-t border-gray-200 p-3">
      <div class="mb-2 px-3 py-1">
        <p class="truncate text-xs font-medium text-gray-900">{{ auth.user?.name }}</p>
        <p class="truncate text-xs text-gray-500">{{ auth.user?.roles?.[0] }}</p>
      </div>
      <button
        @click="logout"
        class="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900"
      >
        <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
        Logout
      </button>
    </div>
  </aside>
</template>
