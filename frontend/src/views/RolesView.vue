<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRolesStore } from '@/stores/roles'
import { useUsersStore } from '@/stores/users'
import { usePermissions } from '@/composables/usePermissions'
import Can from '@/components/ui/Can.vue'
import type { Role } from '@/types/api'

const rolesStore = useRolesStore()
const usersStore = useUsersStore()
const { can } = usePermissions()

onMounted(async () => {
  await rolesStore.fetchRoles()
  await usersStore.fetchUsers()
})

// Permission groups
const PERMISSION_GROUPS = [
  {
    label: 'Users',
    permissions: [
      { code: 1000, label: 'user.view', description: 'View user profiles and lists' },
      { code: 1001, label: 'user.create', description: 'Invite and onboard new users' },
      { code: 1002, label: 'user.edit', description: 'Modify existing user details' },
      { code: 1003, label: 'user.delete', description: 'Suspend or remove user accounts' },
    ],
  },
  {
    label: 'Role',
    permissions: [
      { code: 1100, label: 'role.view', description: 'View roles and assignments' },
      { code: 1101, label: 'role.edit', description: 'Control role assignments & settings' },
    ],
  },
]

const ALL_PERMISSION_LABELS = PERMISSION_GROUPS.flatMap((g) => g.permissions.map((p) => p.label))
const ALL_PERMISSION_CODES = PERMISSION_GROUPS.flatMap((g) => g.permissions.map((p) => p.code))

function codeFromLabel(label: string): number {
  for (const g of PERMISSION_GROUPS) {
    const p = g.permissions.find((p) => p.label === label)
    if (p) return p.code
  }
  return -1
}

// Role list
const selectedRole = ref<Role | null>(null)
const editingCodes = ref<number[]>([])
const editingName = ref('')

function isAdmin(role: Role) {
  return role.name.toLowerCase() === 'admin'
}

function usersInRole(role: Role) {
  return usersStore.users.filter((u) => u.roles.some((r) => r.id === role.id))
}

function openDetail(role: Role) {
  selectedRole.value = role
  editingName.value = role.name
  editingCodes.value = role.permissions.map((label) => codeFromLabel(label)).filter((c) => c !== -1)
}

function closeDetail() {
  selectedRole.value = null
  editingCodes.value = []
  editingName.value = ''
}

function togglePermission(code: number) {
  if (editingCodes.value.includes(code)) {
    editingCodes.value = editingCodes.value.filter((c) => c !== code)
  } else {
    editingCodes.value = [...editingCodes.value, code]
  }
}

async function saveChanges() {
  if (!selectedRole.value) return
  const data: { name?: string; permissionCodes?: number[] } = {}
  if (editingName.value && editingName.value !== selectedRole.value.name) {
    data.name = editingName.value
  }
  if (!isAdmin(selectedRole.value)) {
    data.permissionCodes = editingCodes.value
  }
  await rolesStore.updateRole(selectedRole.value.id, data)
  closeDetail()
}

async function deleteRole(role: Role) {
  if (!confirm(`Delete role "${role.name}"?`)) return
  const ok = await rolesStore.deleteRole(role.id)
  if (!ok) alert(rolesStore.error)
}

// Add Role modal
const showAddRole = ref(false)
const newRoleName = ref('')

async function submitAddRole() {
  if (!newRoleName.value.trim()) return
  const ok = await rolesStore.createRole(newRoleName.value.trim())
  if (ok) {
    newRoleName.value = ''
    showAddRole.value = false
  }
}

// Add Users to role
const showAddUsers = ref(false)
const selectedUserIds = ref<number[]>([])

function openAddUsers() {
  selectedUserIds.value = []
  showAddUsers.value = true
}

function toggleUserSelect(userId: number) {
  if (selectedUserIds.value.includes(userId)) {
    selectedUserIds.value = selectedUserIds.value.filter((id) => id !== userId)
  } else {
    selectedUserIds.value = [...selectedUserIds.value, userId]
  }
}

async function addUsersToRole() {
  if (!selectedRole.value || selectedUserIds.value.length === 0) return
  // Update each selected user to add this role
  for (const userId of selectedUserIds.value) {
    const user = usersStore.users.find((u) => u.id === userId)
    if (!user) continue
    const currentRoleIds = user.roles.map((r) => r.id)
    if (!currentRoleIds.includes(selectedRole.value.id)) {
      await usersStore.updateUser(userId, { roleIds: [...currentRoleIds, selectedRole.value.id] })
    }
  }
  await rolesStore.fetchRoles()
  showAddUsers.value = false
  selectedUserIds.value = []
}

async function removeUserFromRole(userId: number) {
  if (!selectedRole.value) return
  const user = usersStore.users.find((u) => u.id === userId)
  if (!user) return
  const newRoleIds = user.roles.map((r) => r.id).filter((id) => id !== selectedRole.value!.id)
  await usersStore.updateUser(userId, { roleIds: newRoleIds })
  await rolesStore.fetchRoles()
}

// Permissions tag display for list
function permissionTags(role: Role) {
  if (role.permissions.length === ALL_PERMISSION_LABELS.length) return null // show "All"
  return role.permissions.slice(0, 3)
}
</script>

<template>
  <div>
    <p v-if="rolesStore.loading" class="text-sm text-gray-400">Loading…</p>
    <p v-if="rolesStore.error" class="mb-4 text-sm text-red-600">{{ rolesStore.error }}</p>

    <!-- ── ROLES LIST ── -->
    <div v-if="!selectedRole">
      <div class="mb-4 flex justify-end">
        <Can permission="role.edit">
          <button
            @click="showAddRole = true"
            class="flex items-center gap-1.5 rounded-lg bg-[#0e7490] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0c6478]"
          >
            <span class="material-symbols-outlined text-base">add</span>
            Add Role
          </button>
        </Can>
      </div>

      <div class="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-gray-100 bg-gray-50">
              <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Role Name</th>
              <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Permissions</th>
              <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Users</th>
              <th class="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr
              v-for="role in rolesStore.roles"
              :key="role.id"
              class="cursor-pointer hover:bg-gray-50"
              @click="openDetail(role)"
            >
              <td class="px-4 py-4 font-semibold text-[#1e293b]">{{ role.name }}</td>
              <td class="px-4 py-4">
                <div class="flex flex-wrap gap-1.5">
                  <span
                    v-if="role.permissions.length === ALL_PERMISSION_LABELS.length"
                    class="inline-flex rounded-full bg-[#cffafe] px-2.5 py-0.5 text-xs font-semibold text-[#0e7490]"
                  >
                    All Permissions
                  </span>
                  <template v-else-if="role.permissions.length > 0">
                    <span
                      v-for="perm in role.permissions.slice(0, 3)"
                      :key="perm"
                      class="inline-flex rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600"
                    >
                      {{ perm }}
                    </span>
                    <span v-if="role.permissions.length > 3" class="text-xs text-gray-400">
                      +{{ role.permissions.length - 3 }} more
                    </span>
                  </template>
                  <span v-else class="text-xs text-gray-400">No permissions</span>
                </div>
              </td>
              <td class="px-4 py-4 text-[#64748b]">{{ role.usersCount }} user{{ role.usersCount !== 1 ? 's' : '' }}</td>
              <td class="px-4 py-4 text-right" @click.stop>
                <div class="flex items-center justify-end gap-3">
                  <Can permission="role.edit">
                    <button
                      @click="openDetail(role)"
                      class="text-sm font-semibold"
                      :class="isAdmin(role) ? 'text-gray-400' : 'text-[#0e7490] hover:underline'"
                    >
                      {{ isAdmin(role) ? 'View' : 'Edit' }}
                    </button>
                    <button
                      v-if="!isAdmin(role)"
                      @click="deleteRole(role)"
                      class="text-sm text-red-500 hover:underline"
                    >
                      Delete
                    </button>
                  </Can>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ── ROLE DETAIL ── -->
    <div v-else>
      <!-- Back + title -->
      <div class="mb-6 flex items-center gap-3">
        <button @click="closeDetail" class="flex items-center gap-1 text-sm text-gray-500 hover:text-[#0e7490]">
          <span class="material-symbols-outlined text-base">arrow_back</span>
          Roles
        </button>
        <span class="text-gray-300">/</span>
        <h2 class="text-2xl font-bold text-[#1e293b]">{{ selectedRole.name }}</h2>
        <span class="rounded-full bg-[#cffafe] px-2.5 py-0.5 text-xs font-semibold text-[#0e7490]">
          {{ selectedRole.name.toUpperCase() }} ROLE
        </span>
      </div>

      <!-- Role name edit (non-admin only) -->
      <div v-if="!isAdmin(selectedRole)" class="mb-4 rounded-xl border border-gray-200 bg-white p-5">
        <label class="mb-1.5 block text-sm font-semibold text-[#1e293b]">Role Name</label>
        <input
          v-model="editingName"
          type="text"
          class="w-full max-w-xs rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[#0e7490] focus:outline-none"
        />
      </div>

      <!-- Users in this role -->
      <div class="mb-4 rounded-xl border border-gray-200 bg-white p-5">
        <div class="mb-4 flex items-center justify-between">
          <div>
            <h3 class="font-semibold text-[#1e293b]">Users in this role</h3>
            <p class="text-xs text-[#64748b]">{{ usersInRole(selectedRole).length }} member{{ usersInRole(selectedRole).length !== 1 ? 's' : '' }}</p>
          </div>
          <Can permission="user.edit">
            <button
              @click="openAddUsers"
              class="flex items-center gap-1.5 text-sm font-semibold text-[#0e7490] hover:underline"
            >
              <span class="material-symbols-outlined text-base">person_add</span>
              Add Users
            </button>
          </Can>
        </div>

        <table v-if="usersInRole(selectedRole).length > 0" class="w-full text-sm">
          <thead>
            <tr class="border-b border-gray-100">
              <th class="pb-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Name</th>
              <th class="pb-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Email</th>
              <th class="pb-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Status</th>
              <th class="pb-2"></th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-for="user in usersInRole(selectedRole)" :key="user.id">
              <td class="py-2.5 font-medium text-[#1e293b]">{{ user.name }}</td>
              <td class="py-2.5 text-[#64748b]">{{ user.email }}</td>
              <td class="py-2.5">
                <span class="inline-flex items-center gap-1.5 text-xs font-medium"
                  :class="user.status === 'active' || !user.status ? 'text-green-600' : 'text-gray-400'">
                  <span class="h-1.5 w-1.5 rounded-full"
                    :class="user.status === 'active' || !user.status ? 'bg-green-500' : 'bg-gray-400'"></span>
                  {{ user.status === 'active' || !user.status ? 'Active' : 'Inactive' }}
                </span>
              </td>
              <td class="py-2.5 text-right">
                <Can permission="user.edit">
                  <button
                    v-if="!(isAdmin(selectedRole) && usersInRole(selectedRole).length <= 1)"
                    @click="removeUserFromRole(user.id)"
                    class="text-xs text-red-500 hover:underline"
                  >
                    Remove
                  </button>
                </Can>
              </td>
            </tr>
          </tbody>
        </table>
        <p v-else class="py-4 text-center text-sm text-gray-400">No users in this role yet.</p>
      </div>

      <!-- Permissions -->
      <div class="rounded-xl border border-gray-200 bg-white p-5">
        <h3 class="mb-1 font-semibold text-[#1e293b]">Permissions</h3>
        <p class="mb-5 text-sm text-[#64748b]">
          {{ isAdmin(selectedRole) ? 'Admin has all permissions and cannot be changed.' : 'Define the actions allowed for this role.' }}
        </p>

        <div class="space-y-6">
          <div v-for="group in PERMISSION_GROUPS" :key="group.label">
            <p class="mb-3 text-xs font-bold uppercase tracking-wide text-gray-400">{{ group.label }}</p>
            <div class="grid grid-cols-2 gap-3">
              <label
                v-for="perm in group.permissions"
                :key="perm.code"
                class="flex items-start gap-3 rounded-lg border border-gray-100 p-3"
                :class="isAdmin(selectedRole) ? 'cursor-default bg-gray-50' : 'cursor-pointer hover:bg-gray-50'"
              >
                <input
                  type="checkbox"
                  :checked="isAdmin(selectedRole) ? true : editingCodes.includes(perm.code)"
                  :disabled="isAdmin(selectedRole) || !can('role.edit')"
                  @change="togglePermission(perm.code)"
                  class="mt-0.5 h-4 w-4 rounded border-gray-300 accent-[#0e7490]"
                />
                <div>
                  <p class="text-sm font-semibold text-[#1e293b]">{{ perm.label }}</p>
                  <p class="text-xs text-[#64748b]">{{ perm.description }}</p>
                </div>
              </label>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div v-if="!isAdmin(selectedRole)" class="mt-6 flex justify-end gap-3">
          <button @click="closeDetail"
            class="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50">
            Discard Changes
          </button>
          <Can permission="role.edit">
            <button @click="saveChanges" :disabled="rolesStore.loading"
              class="rounded-lg bg-[#0e7490] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0c6478] disabled:opacity-50">
              {{ rolesStore.loading ? 'Saving…' : 'Save Changes' }}
            </button>
          </Can>
        </div>
        <div v-else class="mt-6 flex justify-end">
          <button @click="closeDetail"
            class="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50">
            Back to Roles
          </button>
        </div>
      </div>
    </div>

    <!-- Add Role Modal -->
    <div v-if="showAddRole" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div class="w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-6 shadow-xl">
        <h2 class="mb-4 font-bold text-[#1e293b]">Add Role</h2>
        <input
          v-model="newRoleName"
          type="text"
          placeholder="Role name"
          class="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-[#0e7490] focus:outline-none"
          @keyup.enter="submitAddRole"
        />
        <p v-if="rolesStore.error" class="mt-2 text-sm text-red-600">{{ rolesStore.error }}</p>
        <div class="mt-4 flex justify-end gap-2">
          <button @click="showAddRole = false"
            class="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50">
            Cancel
          </button>
          <button @click="submitAddRole" :disabled="!newRoleName.trim() || rolesStore.loading"
            class="rounded-lg bg-[#0e7490] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0c6478] disabled:opacity-50">
            Create
          </button>
        </div>
      </div>
    </div>

    <!-- Add Users Modal -->
    <div v-if="showAddUsers" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div class="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-xl">
        <h2 class="mb-4 font-bold text-[#1e293b]">Add Users to {{ selectedRole?.name }}</h2>
        <div class="max-h-64 overflow-y-auto">
          <label
            v-for="user in usersStore.users.filter(u => !u.roles.some(r => r.id === selectedRole?.id))"
            :key="user.id"
            class="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2.5 hover:bg-gray-50"
          >
            <input
              type="checkbox"
              :checked="selectedUserIds.includes(user.id)"
              @change="toggleUserSelect(user.id)"
              class="h-4 w-4 rounded border-gray-300 accent-[#0e7490]"
            />
            <div>
              <p class="text-sm font-medium text-[#1e293b]">{{ user.name }}</p>
              <p class="text-xs text-gray-400">{{ user.email }}</p>
            </div>
          </label>
          <p v-if="usersStore.users.filter(u => !u.roles.some(r => r.id === selectedRole?.id)).length === 0"
            class="py-4 text-center text-sm text-gray-400">All users are already in this role.</p>
        </div>
        <div class="mt-4 flex justify-end gap-2">
          <button @click="showAddUsers = false"
            class="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50">
            Cancel
          </button>
          <button @click="addUsersToRole" :disabled="selectedUserIds.length === 0 || usersStore.loading"
            class="rounded-lg bg-[#0e7490] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0c6478] disabled:opacity-50">
            Add Selected
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
