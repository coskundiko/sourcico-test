import { defineStore } from 'pinia'
import { ref } from 'vue'
import { axios } from '@/bootstrap'
import type { ApiResponse, UserListItem } from '@/types/api'

export const useUsersStore = defineStore('users', () => {
  const users = ref<UserListItem[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchUsers(): Promise<void> {
    loading.value = true
    error.value = null
    try {
      const res = await axios.get<ApiResponse<UserListItem[]>>('/api/users')
      if (res.data.success && res.data.data) {
        users.value = res.data.data
      }
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string; errors?: string[] } } }
      error.value = err.response?.data?.message ?? 'Failed to load users'
    } finally {
      loading.value = false
    }
  }

  async function createUser(data: { name: string; email: string; roleIds: number[] }): Promise<boolean> {
    loading.value = true
    error.value = null
    try {
      await axios.post('/api/users', data)
      await fetchUsers()
      return true
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string; errors?: string[] } } }
      const d = err.response?.data
      error.value = d?.errors?.[0] ?? d?.message ?? 'Failed to create user'
      return false
    } finally {
      loading.value = false
    }
  }

  async function updateUser(id: number, data: { name?: string; email?: string; roleIds?: number[] }): Promise<boolean> {
    loading.value = true
    error.value = null
    try {
      await axios.put(`/api/users/${id}`, data)
      await fetchUsers()
      return true
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string; errors?: string[] } } }
      const d = err.response?.data
      error.value = d?.errors?.[0] ?? d?.message ?? 'Failed to update user'
      return false
    } finally {
      loading.value = false
    }
  }

  async function deleteUser(id: number): Promise<boolean> {
    loading.value = true
    error.value = null
    try {
      await axios.delete(`/api/users/${id}`)
      await fetchUsers()
      return true
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string; errors?: string[] } } }
      error.value = err.response?.data?.message ?? 'Failed to delete user'
      return false
    } finally {
      loading.value = false
    }
  }

  return { users, loading, error, fetchUsers, createUser, updateUser, deleteUser }
})
