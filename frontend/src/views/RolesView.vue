<script setup lang="ts">
import { onMounted } from 'vue'
import { useRolesStore } from '@/stores/roles'
import { usePermissions } from '@/composables/usePermissions'
import Can from '@/components/ui/Can.vue'

const rolesStore = useRolesStore()
const { can } = usePermissions()

onMounted(() => rolesStore.fetchRoles())

const ALL_PERMISSIONS = [
  { code: 1000, label: 'user.view' },
  { code: 1001, label: 'user.create' },
  { code: 1002, label: 'user.edit' },
  { code: 1003, label: 'user.delete' },
  { code: 1100, label: 'role.view' },
  { code: 1101, label: 'role.edit' },
]
</script>

<template>
  <div>
    <p v-if="rolesStore.loading" class="text-sm text-gray-400">Loading…</p>
    <p v-if="rolesStore.error" class="mb-4 text-sm text-red-600">{{ rolesStore.error }}</p>

    <div class="grid gap-4">
      <div
        v-for="role in rolesStore.roles"
        :key="role.id"
        class="rounded-xl border border-gray-200 bg-white p-5"
      >
        <div class="mb-3 flex items-center justify-between">
          <h3 class="font-semibold text-gray-900">{{ role.name }}</h3>
          <Can permission="role.edit">
            <span class="text-xs text-gray-400">(Admin can edit)</span>
          </Can>
        </div>

        <div class="flex flex-wrap gap-2">
          <span
            v-for="perm in ALL_PERMISSIONS"
            :key="perm.code"
            class="inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium"
            :class="role.permissions.includes(perm.label)
              ? 'bg-green-100 text-green-700'
              : 'bg-gray-100 text-gray-400'"
          >
            {{ perm.label }}
          </span>
        </div>

        <!-- Edit role permissions (Admin only) -->
        <Can permission="role.edit">
          <details class="mt-4">
            <summary class="cursor-pointer text-xs text-gray-500 hover:text-gray-900">Edit permissions</summary>
            <div class="mt-3 space-y-1.5">
              <label
                v-for="perm in ALL_PERMISSIONS"
                :key="perm.code"
                class="flex cursor-pointer items-center gap-2 text-sm text-gray-700"
              >
                <input
                  type="checkbox"
                  :checked="role.permissions.includes(perm.label)"
                  class="rounded border-gray-300"
                  @change="async (e) => {
                    const checked = (e.target as HTMLInputElement).checked
                    const current = ALL_PERMISSIONS
                      .filter(p => role.permissions.includes(p.label))
                      .map(p => p.code)
                    const next = checked
                      ? [...current, perm.code]
                      : current.filter(c => c !== perm.code)
                    await rolesStore.updateRole(role.id, { permissionCodes: next })
                  }"
                  :disabled="!can('role.edit')"
                />
                {{ perm.label }}
              </label>
            </div>
          </details>
        </Can>
      </div>
    </div>
  </div>
</template>
