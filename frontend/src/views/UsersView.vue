<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useUsersStore } from '@/stores/users'
import { useRolesStore } from '@/stores/roles'
import { usePermissions } from '@/composables/usePermissions'
import Can from '@/components/ui/Can.vue'
import type { UserListItem } from '@/types/api'

const usersStore = useUsersStore()
const rolesStore = useRolesStore()
const { can } = usePermissions()

onMounted(async () => {
  await usersStore.fetchUsers()
  if (can('role.view')) {
    await rolesStore.fetchRoles()
  }
})

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
  form.value = {
    name: user.name,
    email: user.email,
    roleId: user.roles[0]?.id ?? 0,
  }
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
      roleId: form.value.roleId,
    })
  } else {
    ok = await usersStore.createUser(form.value)
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
    <!-- Header row -->
    <div class="mb-4 flex items-center justify-between">
      <p class="text-sm text-gray-500">{{ usersStore.users.length }} user{{ usersStore.users.length !== 1 ? 's' : '' }}</p>
      <Can permission="user.create">
        <button
          @click="openAdd"
          class="rounded-lg bg-gray-900 px-3 py-2 text-sm font-medium text-white hover:bg-gray-700"
        >
          + Add User
        </button>
      </Can>
    </div>

    <!-- Error -->
    <p v-if="usersStore.error" class="mb-4 text-sm text-red-600">{{ usersStore.error }}</p>

    <!-- Table -->
    <div class="overflow-hidden rounded-xl border border-gray-200 bg-white">
      <table class="w-full text-sm">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">Name</th>
            <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">Email</th>
            <th v-if="can('role.view')" class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">Role</th>
            <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">Status</th>
            <th class="px-4 py-3"></th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100">
          <tr v-if="usersStore.loading">
            <td colspan="5" class="px-4 py-8 text-center text-gray-400">Loading…</td>
          </tr>
          <tr v-else-if="usersStore.users.length === 0">
            <td colspan="5" class="px-4 py-8 text-center text-gray-400">No users found.</td>
          </tr>
          <tr v-for="user in usersStore.users" :key="user.id" class="hover:bg-gray-50">
            <td class="px-4 py-3 font-medium text-gray-900">{{ user.name }}</td>
            <td class="px-4 py-3 text-gray-600">{{ user.email }}</td>
            <td v-if="can('role.view')" class="px-4 py-3 text-gray-600">
              {{ user.roles.map(r => r.name).join(', ') || '—' }}
            </td>
            <td class="px-4 py-3">
              <span class="inline-flex rounded-full px-2 py-0.5 text-xs font-medium"
                :class="user.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'">
                {{ user.status ?? 'active' }}
              </span>
            </td>
            <td class="px-4 py-3">
              <div class="flex items-center justify-end gap-2">
                <Can permission="user.edit">
                  <button
                    @click="openEdit(user)"
                    class="text-xs text-gray-500 hover:text-gray-900"
                  >
                    Edit
                  </button>
                </Can>
                <Can permission="user.delete">
                  <button
                    @click="deleteUser(user.id)"
                    class="text-xs text-red-500 hover:text-red-700"
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

    <!-- Modal -->
    <div v-if="showModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div class="w-full max-w-md rounded-xl border border-gray-200 bg-white p-6 shadow-xl">
        <h2 class="mb-4 text-base font-semibold text-gray-900">
          {{ editTarget ? 'Edit User' : 'Add User' }}
        </h2>

        <div class="space-y-3">
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700">Name</label>
            <input
              v-model="form.name"
              type="text"
              class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-400 focus:outline-none"
            />
          </div>
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700">Email</label>
            <input
              v-model="form.email"
              type="email"
              class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-400 focus:outline-none"
            />
          </div>
          <div v-if="can('role.view')">
            <label class="mb-1 block text-sm font-medium text-gray-700">Role</label>
            <select
              v-model="form.roleId"
              class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-gray-400 focus:outline-none"
            >
              <option v-for="role in rolesStore.roles" :key="role.id" :value="role.id">
                {{ role.name }}
              </option>
            </select>
          </div>
        </div>

        <p v-if="usersStore.error" class="mt-3 text-sm text-red-600">{{ usersStore.error }}</p>

        <div class="mt-5 flex justify-end gap-2">
          <button @click="closeModal" class="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">
            Cancel
          </button>
          <button
            @click="saveUser"
            :disabled="usersStore.loading"
            class="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"
          >
            {{ usersStore.loading ? 'Saving…' : 'Save' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
