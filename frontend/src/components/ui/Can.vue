<script setup lang="ts">
import { computed } from 'vue'
import { usePermissions } from '@/composables/usePermissions'

const props = defineProps<{ permission: string }>()

const { can } = usePermissions()
const allowed = computed(() => can(props.permission))
</script>

<template>
  <slot v-if="allowed" />
</template>
