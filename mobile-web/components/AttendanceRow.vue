<template>
  <div
    class="attendance-row d-flex align-center pa-3"
    :style="{ borderLeft: `4px solid ${borderColor}` }"
    @click="$emit('click')"
  >
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

    <!-- Times + overtime -->
    <div class="flex-1-1 text-right">
      <template v-if="record.checkIn">
        <div class="text-body-2">
          {{ record.checkIn }}
          〜
          <span :class="!record.checkOut ? 'text-warning font-weight-bold' : ''">
            {{ record.checkOut ?? '未退勤⚠' }}
          </span>
        </div>
        <div class="d-flex align-center justify-end gap-1 mt-0-5">
          <span class="text-caption text-grey">{{ totalLabel }}</span>
          <v-chip
            v-if="record.overtimeMinutes > 0"
            size="x-small"
            color="error"
            variant="tonal"
            class="ml-1"
            style="font-size: 10px; height: 16px; padding: 0 5px;"
          >
            +{{ overtimeBadgeLabel }}残業
          </v-chip>
        </div>
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
  APPROVED: { label: '承認済み', color: 'success', border: '#4caf50' },
  PENDING_APPROVAL: { label: '承認待ち', color: 'primary', border: '#3587dc' },
  CORRECTION_REQUESTED: { label: '修正依頼', color: 'error', border: '#e6273e' },
  NOT_SUBMITTED: { label: '未提出', color: 'grey', border: '#9e9e9e' },
  ABSENT: { label: '欠勤', color: 'warning', border: '#f08000' },
}

const statusLabel = computed(() => statusConfig[props.record.status]?.label ?? props.record.status)
const statusColor = computed(() => statusConfig[props.record.status]?.color ?? 'grey')
const borderColor = computed(() => statusConfig[props.record.status]?.border ?? '#e0e0e0')

const totalLabel = computed(() => {
  if (!props.record.totalMinutes) return ''
  const h = Math.floor(props.record.totalMinutes / 60)
  const m = props.record.totalMinutes % 60
  return m > 0 ? `${h}h${m}m` : `${h}h`
})

const overtimeBadgeLabel = computed(() => {
  const ot = props.record.overtimeMinutes
  if (!ot) return ''
  const h = Math.floor(ot / 60)
  const m = ot % 60
  if (h > 0 && m > 0) return `${h}h${m}m`
  if (h > 0) return `${h}h`
  return `${m}m`
})
</script>

<style scoped>
.attendance-row {
  cursor: pointer;
  transition: background 0.15s;
  border-left-style: solid;
}
.attendance-row:active {
  background: #f5f5f7;
}
.gap-1 { gap: 4px; }
.mt-0-5 { margin-top: 2px; }
</style>
