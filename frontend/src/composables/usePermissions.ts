import { useAuthStore } from '@/stores/auth'

export function usePermissions() {
  const auth = useAuthStore()

  function can(permission: string): boolean {
    return auth.permissions.includes(permission)
  }

  return { can }
}
