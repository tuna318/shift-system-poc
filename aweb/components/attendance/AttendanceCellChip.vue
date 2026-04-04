<template>
  <div
    class="att-cell"
    :class="[`att-cell--${statusKey}`, { 'att-cell--clickable': status !== 'NO_RECORD' || hasShift }]"
    @click="$emit('click')"
  >
    <template v-if="status === 'NO_RECORD'">
      <span v-if="hasShift" class="att-cell__label att-cell__label--no-record">未出勤</span>
      <span v-else class="att-cell__dash">—</span>
    </template>

    <template v-else>
      <div class="att-cell__top">
        <v-icon :color="iconColor" size="12">{{ icon }}</v-icon>
        <span class="att-cell__label">{{ label }}</span>
        <span v-if="pendingCorrectionCount > 0" class="att-cell__dot" />
      </div>
      <div v-if="totalMinutes > 0" class="att-cell__hours">{{ hoursDisplay }}</div>
      <div v-if="complianceFlags.length > 0" class="att-cell__flags">
        <v-icon v-for="f in complianceFlags" :key="f.key" size="10" :color="f.level === 'error' ? 'error' : 'warning'">
          {{ f.icon }}
        </v-icon>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { AttendanceApprovalStatus, ComplianceFlag } from '~/types'

const props = defineProps<{
  status: AttendanceApprovalStatus
  totalMinutes: number
  sessionCount: number
  pendingCorrectionCount: number
  complianceFlags: ComplianceFlag[]
  hasShift?: boolean
}>()

defineEmits<{ click: [] }>()

const statusKey = computed(() => props.status.toLowerCase().replace('_', '-'))

const icon = computed(() => {
  switch (props.status) {
    case 'APPROVED': return 'mdi-check-circle'
    case 'PENDING_APPROVAL': return 'mdi-clock-outline'
    case 'CORRECTION_REQUESTED': return 'mdi-alert-circle-outline'
    case 'NOT_SUBMITTED': return 'mdi-circle-outline'
    default: return 'mdi-minus'
  }
})

const iconColor = computed(() => {
  switch (props.status) {
    case 'APPROVED': return '#4caf50'
    case 'PENDING_APPROVAL': return '#1976d2'
    case 'CORRECTION_REQUESTED': return '#f59e0b'
    case 'NOT_SUBMITTED': return '#9e9e9e'
    default: return '#bdbdbd'
  }
})

const label = computed(() => {
  switch (props.status) {
    case 'APPROVED': return '承認済'
    case 'PENDING_APPROVAL': return '申請中'
    case 'CORRECTION_REQUESTED': return '差戻'
    case 'NOT_SUBMITTED': return '未提出'
    default: return '—'
  }
})

const hoursDisplay = computed(() => {
  const h = Math.floor(props.totalMinutes / 60)
  const m = props.totalMinutes % 60
  return m > 0 ? `${h}h${String(m).padStart(2, '0')}m` : `${h}h`
})
</script>

<style scoped>
.att-cell {
  min-height: 52px;
  padding: 4px 6px;
  border-radius: 6px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  transition: background 0.15s;
  cursor: default;
  user-select: none;
}
.att-cell--clickable { cursor: pointer; }
.att-cell--clickable:hover { background: rgba(0,0,0,0.04); }

.att-cell__top {
  display: flex;
  align-items: center;
  gap: 3px;
}
.att-cell__label {
  font-size: 11px;
  font-weight: 600;
  white-space: nowrap;
}
.att-cell__label--no-record {
  font-size: 11px;
  font-weight: 500;
  color: #ef5350;
}
.att-cell__dash {
  font-size: 14px;
  color: #bdbdbd;
}
.att-cell__hours {
  font-size: 11px;
  color: #616161;
  font-feature-settings: "tnum";
}
.att-cell__flags {
  display: flex;
  gap: 2px;
}
.att-cell__dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: #f59e0b;
  flex-shrink: 0;
}

/* Status background tints */
.att-cell--approved       { background: #e8f5e9; }
.att-cell--pending-approval { background: #e3f2fd; }
.att-cell--correction-requested { background: #fff8e1; }
.att-cell--not-submitted  { background: #f5f5f5; }
.att-cell--no-record      { background: transparent; }

.att-cell--approved .att-cell__label       { color: #2e7d32; }
.att-cell--pending-approval .att-cell__label { color: #1565c0; }
.att-cell--correction-requested .att-cell__label { color: #e65100; }
.att-cell--not-submitted .att-cell__label  { color: #757575; }
</style>
