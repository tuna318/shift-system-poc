<template>
  <div class="attendance-row d-flex align-center pa-3" @click="$emit('click')">
    <!-- Date -->
    <div style="min-width: 52px;">
      <div class="text-body-2 font-weight-bold">{{ dateLabel }}</div>
      <div class="text-caption" :class="isWeekend ? 'text-error' : 'text-grey'">{{ dayOfWeek }}</div>
    </div>

    <!-- Status badge -->
    <v-chip
      :color="statusColor"
      size="x-small"
      variant="tonal"
      class="mx-2"
      style="min-width: 72px; justify-content: center;"
    >
      {{ statusLabel }}
    </v-chip>

    <!-- Times -->
    <div class="flex-1-1 text-right">
      <template v-if="record.checkIn">
        <div class="text-body-2">{{ record.checkIn }} 〜 {{ record.checkOut ?? '未退勤' }}</div>
        <div class="text-caption text-grey">{{ totalLabel }}</div>
      </template>
      <template v-else>
        <span class="text-caption text-grey">—</span>
      </template>
    </div>

    <v-icon size="16" color="grey" class="ml-2">mdi-chevron-right</v-icon>
  </div>
</template>

<script setup lang="ts">
import type { AttendanceRecord } from '~/types'

const props = defineProps<{
  record: AttendanceRecord
}>()

defineEmits<{ click: [] }>()

const DOW = ['日', '月', '火', '水', '木', '金', '土']

const dateLabel = computed(() => {
  const d = new Date(props.record.date)
  return `${d.getMonth() + 1}/${d.getDate()}`
})

const dayOfWeek = computed(() => {
  const d = new Date(props.record.date)
  return DOW[d.getDay()]
})

const isWeekend = computed(() => {
  const d = new Date(props.record.date)
  return d.getDay() === 0 || d.getDay() === 6
})

const statusConfig = {
  APPROVED: { label: '承認済み', color: 'success' },
  PENDING_APPROVAL: { label: '承認待ち', color: 'primary' },
  CORRECTION_REQUESTED: { label: '修正依頼', color: 'error' },
  NOT_SUBMITTED: { label: '未提出', color: 'grey' },
  ABSENT: { label: '欠勤', color: 'warning' },
}

const statusLabel = computed(() => statusConfig[props.record.status]?.label ?? props.record.status)
const statusColor = computed(() => statusConfig[props.record.status]?.color ?? 'grey')

const totalLabel = computed(() => {
  if (!props.record.totalMinutes) return ''
  const h = Math.floor(props.record.totalMinutes / 60)
  const m = props.record.totalMinutes % 60
  return m > 0 ? `${h}h${m}m` : `${h}h`
})
</script>

<style scoped>
.attendance-row {
  cursor: pointer;
  transition: background 0.15s;
}
.attendance-row:active {
  background: #f5f5f7;
}
</style>
