<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { axios } from '@/bootstrap'
import { useAuthStore } from '@/stores/auth'
import type { ApiResponse } from '@/types/api'

interface AvailableUser {
  id: number
  name: string
  email: string
}

const router = useRouter()
const auth = useAuthStore()

const users = ref<AvailableUser[]>([])
const selectedUserId = ref<number | null>(null)
const error = ref<string | null>(null)

onMounted(async () => {
  const res = await axios.get<ApiResponse<AvailableUser[]>>('/api/auth/users')
  if (res.data.success && res.data.data) {
    users.value = res.data.data
  }
})

async function login() {
  if (!selectedUserId.value) return
  error.value = null
  const ok = await auth.selectUser(selectedUserId.value)
  if (ok) {
    router.push('/users')
  } else {
    error.value = 'Login failed. Please try again.'
  }
}
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-gray-50">
    <div class="w-full max-w-sm">
      <div class="mb-8 text-center">
        <h1 class="text-2xl font-semibold text-gray-900">Perion</h1>
        <p class="mt-1 text-sm text-gray-500">Select a user to continue</p>
      </div>

      <div class="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div class="space-y-4">
          <div>
            <label class="mb-1.5 block text-sm font-medium text-gray-700">Login as</label>
            <select
              v-model="selectedUserId"
              class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200"
            >
              <option :value="null" disabled>— choose user —</option>
              <option v-for="u in users" :key="u.id" :value="u.id">
                {{ u.name }} ({{ u.email }})
              </option>
            </select>
          </div>

          <p v-if="error" class="text-sm text-red-600">{{ error }}</p>

          <button
            @click="login"
            :disabled="!selectedUserId || auth.loading"
            class="w-full rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {{ auth.loading ? 'Signing in…' : 'Sign in' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
