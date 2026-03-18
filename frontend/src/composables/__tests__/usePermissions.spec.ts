import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from '@/stores/auth'
import { usePermissions } from '@/composables/usePermissions'

describe('usePermissions', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('returns false for all permissions when user is not authenticated', () => {
    const { can } = usePermissions()
    expect(can('user.view')).toBe(false)
    expect(can('user.create')).toBe(false)
  })

  it('returns true when user has the requested permission', () => {
    const auth = useAuthStore()
    auth.user = {
      id: 1,
      name: 'Admin',
      email: 'admin@test.com',
      roles: ['Admin'],
      permissions: ['user.view', 'user.create', 'user.edit', 'user.delete', 'role.view', 'role.edit'],
    }

    const { can } = usePermissions()
    expect(can('user.view')).toBe(true)
    expect(can('user.create')).toBe(true)
    expect(can('role.edit')).toBe(true)
  })

  it('returns false when user does not have the requested permission', () => {
    const auth = useAuthStore()
    auth.user = {
      id: 2,
      name: 'Viewer',
      email: 'viewer@test.com',
      roles: ['Viewer'],
      permissions: ['user.view'],
    }

    const { can } = usePermissions()
    expect(can('user.create')).toBe(false)
    expect(can('user.delete')).toBe(false)
    expect(can('role.view')).toBe(false)
  })

  it('editor can view and edit users but not create or delete', () => {
    const auth = useAuthStore()
    auth.user = {
      id: 3,
      name: 'Editor',
      email: 'editor@test.com',
      roles: ['Editor'],
      permissions: ['user.view', 'user.edit', 'role.view'],
    }

    const { can } = usePermissions()
    expect(can('user.view')).toBe(true)
    expect(can('user.edit')).toBe(true)
    expect(can('role.view')).toBe(true)
    expect(can('user.create')).toBe(false)
    expect(can('user.delete')).toBe(false)
    expect(can('role.edit')).toBe(false)
  })
})
