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

function getRoleBadgeClass(name: string): string {
  const lower = name.toLowerCase()
  if (lower.includes('admin')) return 'bg-teal-50 text-teal-700 border border-teal-200'
  if (lower.includes('editor')) return 'bg-blue-50 text-blue-700 border border-blue-200'
  return 'bg-gray-100 text-gray-600 border border-gray-200'
}

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
  <div class="flex min-h-screen flex-col items-center justify-center bg-[#f6f8f8] px-4">
    <!-- Logo -->
    <div class="mb-6 flex flex-col items-center gap-2">
      <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-[#0e7490]">
        <span class="material-symbols-outlined text-xl text-white">lock</span>
      </div>
      <h1 class="text-xl font-bold text-[#1e293b]">Perion</h1>
    </div>

    <!-- Card -->
    <div class="w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
      <div class="mb-6 text-center">
        <h2 class="text-lg font-bold text-[#1e293b]">Select your account</h2>
        <p class="mt-1 text-sm text-[#64748b]">No password required</p>
      </div>

      <div class="space-y-4">
        <div>
          <label class="mb-1.5 block text-sm font-semibold text-[#1e293b]">Account</label>
          <select
            v-model="selectedUserId"
            class="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-[#1e293b] focus:border-[#0e7490] focus:outline-none focus:ring-2 focus:ring-[#0e7490]/20"
          >
            <option :value="null" disabled>— choose account —</option>
            <option v-for="u in users" :key="u.id" :value="u.id">{{ u.name }}</option>
          </select>
        </div>

        <!-- Role chips -->
        <div class="flex items-center justify-center gap-2">
          <span
            v-for="u in users"
            :key="u.id"
            class="cursor-pointer rounded-full px-3 py-1 text-xs font-semibold transition-all"
            :class="[
              getRoleBadgeClass(u.name),
              selectedUserId === u.id ? 'ring-2 ring-[#0e7490] ring-offset-1' : ''
            ]"
            @click="selectedUserId = u.id"
          >
            {{ u.name.split(' ')[0] }}
          </span>
        </div>

        <p v-if="error" class="text-sm text-red-600">{{ error }}</p>

        <button
          @click="login"
          :disabled="!selectedUserId || auth.loading"
          class="w-full rounded-xl bg-[#0e7490] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#0c6478] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {{ auth.loading ? 'Signing in…' : 'Continue' }}
        </button>
      </div>

      <p class="mt-6 text-center text-xs text-[#94a3b8]">Securely managing permissions for your organization.</p>
    </div>

    <!-- Footer -->
    <div class="mt-6 flex gap-4 text-sm text-[#64748b]">
      <a href="#" class="hover:text-[#0e7490]">Support</a>
      <a href="#" class="hover:text-[#0e7490]">Privacy Policy</a>
      <a href="#" class="hover:text-[#0e7490]">Docs</a>
    </div>
  </div>
</template>