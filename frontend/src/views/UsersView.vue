<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useUsersStore } from '@/stores/users'
import { useRolesStore } from '@/stores/roles'
import { usePermissions } from '@/composables/usePermissions'
import Can from '@/components/ui/Can.vue'
import type { UserListItem } from '@/types/api'

const usersStore = useUsersStore()
const rolesStore = useRolesStore()
const { can } = usePermissions()

const search = ref('')

const filteredUsers = computed(() => {
  if (!search.value) return usersStore.users
  const q = search.value.toLowerCase()
  return usersStore.users.filter(
    (u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q),
  )
})

onMounted(async () => {
  await usersStore.fetchUsers()
  if (can('role.view')) await rolesStore.fetchRoles()
})

function initials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function roleBadgeClass(roleName: string): string {
  const lower = roleName.toLowerCase()
  if (lower === 'admin') return 'bg-[#cffafe] text-[#0e7490]'
  if (lower === 'editor') return 'bg-blue-100 text-blue-700'
  return 'bg-gray-100 text-gray-600'
}

// Modal state
const showModal = ref(false)
const editTarget = ref<UserListItem | null>(null)
const form = ref({ name: '', email: '', roleId: 0 })

function openAdd() {
  editTarget.value = null
  form.value = { name: '', email: '', roleId: rolesStore.roles[0]?.id ?? 0 }
  showModal.value = true
}

function openEdit(user: UserListItem) {
  editTarget.value = user
  form.value = { name: user.name, email: user.email, roleId: user.roles[0]?.id ?? 0 }
  showModal.value = true
}

function closeModal() {
  showModal.value = false
  editTarget.value = null
}

async function saveUser() {
  let ok = false
  if (editTarget.value) {
    ok = await usersStore.updateUser(editTarget.value.id, {
      name: form.value.name,
      email: form.value.email,
      roleIds: [form.value.roleId],
    })
  } else {
    ok = await usersStore.createUser({
      name: form.value.name,
      email: form.value.email,
      roleIds: [form.value.roleId],
    })
  }
  if (ok) closeModal()
}

async function deleteUser(id: number) {
  if (!confirm('Delete this user?')) return
  await usersStore.deleteUser(id)
}
</script>

<template>
  <div>
    <!-- Search + Add in header area -->
    <div class="mb-4 flex items-center justify-between">
      <div class="relative">
        <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-base text-gray-400">search</span>
        <input
          v-model="search"
          type="text"
          placeholder="Search users..."
          class="w-60 rounded-lg border border-gray-200 py-2 pl-9 pr-3 text-sm focus:border-[#0e7490] focus:outline-none focus:ring-2 focus:ring-[#0e7490]/20"
        />
      </div>
      <Can permission="user.create">
        <button
          @click="openAdd"
          class="flex items-center gap-1.5 rounded-lg bg-[#0e7490] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0c6478]"
        >
          <span class="material-symbols-outlined text-base">add</span>
          Add User
        </button>
      </Can>
    </div>

    <p v-if="usersStore.error" class="mb-4 text-sm text-red-600">{{ usersStore.error }}</p>

    <!-- Table -->
    <div class="overflow-hidden rounded-xl border border-gray-200 bg-white">
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b border-gray-100 bg-gray-50">
            <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Name</th>
            <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Email</th>
            <th v-if="can('role.view')" class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Role</th>
            <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Status</th>
            <th class="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100">
          <tr v-if="usersStore.loading">
            <td colspan="5" class="px-4 py-10 text-center text-sm text-gray-400">Loading…</td>
          </tr>
          <tr v-else-if="filteredUsers.length === 0">
            <td colspan="5" class="px-4 py-10 text-center text-sm text-gray-400">No users found.</td>
          </tr>
          <tr v-for="user in filteredUsers" :key="user.id" class="hover:bg-gray-50">
            <td class="px-4 py-3">
              <div class="flex items-center gap-3">
                <div class="flex h-8 w-8 items-center justify-center rounded-full bg-[#cffafe] text-xs font-bold text-[#0e7490]">
                  {{ initials(user.name) }}
                </div>
                <span class="font-medium text-[#1e293b]">{{ user.name }}</span>
              </div>
            </td>
            <td class="px-4 py-3 text-[#64748b]">{{ user.email }}</td>
            <td v-if="can('role.view')" class="px-4 py-3">
              <span
                v-for="role in user.roles"
                :key="role.id"
                class="inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold"
                :class="roleBadgeClass(role.name)"
              >
                {{ role.name }}
              </span>
              <span v-if="user.roles.length === 0" class="text-gray-400">—</span>
            </td>
            <td class="px-4 py-3">
              <span class="inline-flex items-center gap-1.5 text-xs font-medium"
                :class="user.status === 'active' || !user.status ? 'text-green-600' : 'text-gray-400'">
                <span class="h-1.5 w-1.5 rounded-full"
                  :class="user.status === 'active' || !user.status ? 'bg-green-500' : 'bg-gray-400'"></span>
                {{ user.status === 'active' || !user.status ? 'Active' : 'Inactive' }}
              </span>
            </td>
            <td class="px-4 py-3">
              <div class="flex items-center justify-end gap-1">
                <Can permission="user.edit">
                  <button
                    @click="openEdit(user)"
                    class="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                    title="Edit"
                  >
                    <span class="material-symbols-outlined text-base">edit</span>
                  </button>
                </Can>
                <Can permission="user.delete">
                  <button
                    @click="deleteUser(user.id)"
                    class="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500"
                    title="Delete"
                  >
                    <span class="material-symbols-outlined text-base">delete</span>
                  </button>
                </Can>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal -->
    <div v-if="showModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div class="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-xl">
        <h2 class="mb-5 text-base font-bold text-[#1e293b]">
          {{ editTarget ? 'Edit User' : 'Add User' }}
        </h2>

        <div class="space-y-4">
          <div>
            <label class="mb-1.5 block text-sm font-semibold text-[#1e293b]">Name</label>
            <input v-model="form.name" type="text"
              class="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-[#0e7490] focus:outline-none" />
          </div>
          <div>
            <label class="mb-1.5 block text-sm font-semibold text-[#1e293b]">Email</label>
            <input v-model="form.email" type="email"
              class="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-[#0e7490] focus:outline-none" />
          </div>
          <div v-if="can('role.view')">
            <label class="mb-1.5 block text-sm font-semibold text-[#1e293b]">Role</label>
            <select v-model="form.roleId"
              class="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm focus:border-[#0e7490] focus:outline-none">
              <option v-for="role in rolesStore.roles" :key="role.id" :value="role.id">{{ role.name }}</option>
            </select>
          </div>
        </div>

        <p v-if="usersStore.error" class="mt-3 text-sm text-red-600">{{ usersStore.error }}</p>

        <div class="mt-6 flex justify-end gap-2">
          <button @click="closeModal"
            class="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50">
            Cancel
          </button>
          <button @click="saveUser" :disabled="usersStore.loading"
            class="rounded-lg bg-[#0e7490] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0c6478] disabled:opacity-50">
            {{ usersStore.loading ? 'Saving…' : 'Save' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
