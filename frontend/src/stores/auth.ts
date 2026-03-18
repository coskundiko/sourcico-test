import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { axios } from '@/bootstrap'
import type { ApiResponse, AuthUser } from '@/types/api'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<AuthUser | null>(null)
  const loading = ref(false)

  const isAuthenticated = computed(() => !!user.value)
  const permissions = computed(() => user.value?.permissions ?? [])

  async function fetchMe(): Promise<boolean> {
    try {
      const res = await axios.get<ApiResponse<AuthUser>>('/api/auth/me')
      if (res.data.success && res.data.data) {
        user.value = res.data.data
        return true
      }
      return false
    } catch {
      user.value = null
      return false
    }
  }

  async function selectUser(userId: number): Promise<boolean> {
    loading.value = true
    try {
      const res = await axios.post<ApiResponse<AuthUser>>('/api/auth/select', { userId })
      if (res.data.success && res.data.data) {
        user.value = res.data.data
        return true
      }
      return false
    } catch {
      return false
    } finally {
      loading.value = false
    }
  }

  async function logout(): Promise<void> {
    try {
      await axios.post('/api/auth/logout')
    } catch {
      // ignore
    } finally {
      user.value = null
    }
  }

  return { user, loading, isAuthenticated, permissions, fetchMe, selectUser, logout }
})
