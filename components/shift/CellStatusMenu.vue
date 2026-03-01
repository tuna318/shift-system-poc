<template>
  <v-menu
    v-model="menu"
    :target="target"
    location="bottom start"
    offset="4"
  >
    <v-list density="compact" width="200" rounded="lg" elevation="3">
      <v-list-subheader class="text-caption">ステータス変更</v-list-subheader>
      <v-list-item
        v-for="item in statusItems"
        :key="item.status"
        :prepend-icon="item.icon"
        :title="item.label"
        :value="item.status"
        density="compact"
        rounded="lg"
        @click="selectStatus(item.status)"
      >
        <template #prepend>
          <v-icon :color="item.color" size="18">{{ item.icon }}</v-icon>
        </template>
      </v-list-item>

      <v-divider class="my-1" />

      <v-list-item
        prepend-icon="mdi-delete-outline"
        title="削除"
        value="delete"
        density="compact"
        rounded="lg"
        @click="emit('delete')"
      >
        <template #prepend>
          <v-icon color="error" size="18">mdi-delete-outline</v-icon>
        </template>
        <template #title>
          <span class="text-error">削除</span>
        </template>
      </v-list-item>
    </v-list>
  </v-menu>
</template>

<script setup lang="ts">
import type { CellStatus } from '~/types'

const props = defineProps<{
  modelValue: boolean
  target?: HTMLElement | null
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'update:status': [status: CellStatus]
  delete: []
}>()

const menu = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
})

const statusItems: Array<{ status: CellStatus; label: string; icon: string; color: string }> = [
  { status: 'SHIFT_REQUESTED', label: 'シフト希望', icon: 'mdi-clock-outline', color: 'indigo' },
  { status: 'CONFIRMED', label: 'シフト確定', icon: 'mdi-check-circle', color: 'primary' },
  { status: 'DAY_OFF_REQUESTED', label: '休み希望', icon: 'mdi-calendar-remove-outline', color: 'orange' },
  { status: 'DAY_OFF_CONFIRMED', label: '休み確定', icon: 'mdi-moon-waning-crescent', color: 'default' },
  { status: 'ADJUSTING', label: '調整中', icon: 'mdi-alert-circle-outline', color: 'warning' },
]

function selectStatus(status: CellStatus) {
  emit('update:status', status)
  menu.value = false
}
</script>
