import { defineStore } from 'pinia'
import { ref } from 'vue'
import { axios } from '@/bootstrap'
import type { ApiResponse, Role } from '@/types/api'

export const useRolesStore = defineStore('roles', () => {
  const roles = ref<Role[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchRoles(): Promise<void> {
    loading.value = true
    error.value = null
    try {
      const res = await axios.get<ApiResponse<Role[]>>('/api/roles')
      if (res.data.success && res.data.data) {
        roles.value = res.data.data
      }
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } }
      error.value = err.response?.data?.message ?? 'Failed to load roles'
    } finally {
      loading.value = false
    }
  }

  async function createRole(name: string): Promise<boolean> {
    loading.value = true
    error.value = null
    try {
      await axios.post('/api/roles', { name })
      await fetchRoles()
      return true
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } }
      error.value = err.response?.data?.message ?? 'Failed to create role'
      return false
    } finally {
      loading.value = false
    }
  }

  async function updateRole(id: number, data: { name?: string; permissionCodes?: number[] }): Promise<boolean> {
    loading.value = true
    error.value = null
    try {
      await axios.put(`/api/roles/${id}`, data)
      await fetchRoles()
      return true
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string; errors?: string[] } } }
      const d = err.response?.data
      error.value = d?.errors?.[0] ?? d?.message ?? 'Failed to update role'
      return false
    } finally {
      loading.value = false
    }
  }

  async function deleteRole(id: number): Promise<boolean> {
    loading.value = true
    error.value = null
    try {
      await axios.delete(`/api/roles/${id}`)
      await fetchRoles()
      return true
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } }
      error.value = err.response?.data?.message ?? 'Failed to delete role'
      return false
    } finally {
      loading.value = false
    }
  }

  return { roles, loading, error, fetchRoles, createRole, updateRole, deleteRole }
})
