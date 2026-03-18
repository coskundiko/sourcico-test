export interface ApiResponse<T> {
  success: boolean
  data: T | null
  message: string | null
  errors: string[] | null
}

export interface AuthUser {
  id: number
  name: string
  email: string
  roles: string[]
  permissions: string[]
}

export interface UserListItem {
  id: number
  name: string
  email: string
  roles: { id: number; name: string }[]
  status: string
}

export interface Role {
  id: number
  name: string
  permissions: string[]
}
