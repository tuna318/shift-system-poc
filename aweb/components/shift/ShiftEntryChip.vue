<template>
  <div class="shift-chip" :class="chipClass" @click.stop="emit('click')">
    <div class="chip-inner">
      <div class="chip-top-row">
        <v-icon :size="10" class="chip-icon flex-shrink-0">{{ statusIcon }}</v-icon>
        <span class="chip-status-label">{{ statusLabel }}</span>
      </div>
      <div v-if="!isDayOff" class="chip-time-row">
        {{ entry.startTime }}〜{{ entry.endTime }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ShiftEntry } from '~/types'

const props = defineProps<{
  entry: ShiftEntry
}>()

const emit = defineEmits<{
  click: []
}>()

const chipClass = computed(() => ({
  'chip-shift-requested': props.entry.cellStatus === 'SHIFT_REQUESTED',
  'chip-confirmed': props.entry.cellStatus === 'CONFIRMED',
  'chip-day-off-requested': props.entry.cellStatus === 'DAY_OFF_REQUESTED',
  'chip-day-off-confirmed': props.entry.cellStatus === 'DAY_OFF_CONFIRMED',
  'chip-adjusting': props.entry.cellStatus === 'ADJUSTING',
}))

const isDayOff = computed(() =>
  props.entry.cellStatus === 'DAY_OFF_REQUESTED' || props.entry.cellStatus === 'DAY_OFF_CONFIRMED'
)

const dayOffLabel = computed(() =>
  props.entry.cellStatus === 'DAY_OFF_REQUESTED' ? '休み希望' : '休み確定'
)

const statusIcon = computed(() => {
  const map: Record<string, string> = {
    SHIFT_REQUESTED: 'mdi-clock-outline',
    CONFIRMED: 'mdi-check-circle-outline',
    DAY_OFF_REQUESTED: 'mdi-calendar-remove-outline',
    DAY_OFF_CONFIRMED: 'mdi-moon-waning-crescent',
    ADJUSTING: 'mdi-alert-circle-outline',
  }
  return map[props.entry.cellStatus] ?? 'mdi-circle-outline'
})

const statusLabel = computed(() => {
  const map: Record<string, string> = {
    SHIFT_REQUESTED: 'シフト希望',
    CONFIRMED: 'シフト確定',
    DAY_OFF_REQUESTED: '休み希望',
    DAY_OFF_CONFIRMED: '休み確定',
    ADJUSTING: '調整中',
  }
  return map[props.entry.cellStatus] ?? ''
})
</script>

<style scoped>
.shift-chip {
  border-radius: 5px;
  padding: 3px 5px;
  margin: 1px 2px;
  cursor: pointer;
  font-size: 11px;
  line-height: 1.35;
  min-height: 22px;
  transition: filter 0.12s, opacity 0.12s;
  border: 1.5px solid transparent;
}

.shift-chip:hover {
  filter: brightness(0.93);
}

/* ── Shift entries ────────────────────────── */
/* シフト希望: outlined blue (no fill) */
.chip-shift-requested {
  background: transparent;
  border-color: #3587dc;
  color: #1d4ed8;
}

/* シフト確定: filled blue */
.chip-confirmed {
  background: #3587dc;
  border-color: #3587dc;
  color: #ffffff;
}

/* ── Day-off entries ─────────────────────── */
/* 休み希望: outlined slate (no fill) */
.chip-day-off-requested {
  background: transparent;
  border-color: #64748b;
  color: #475569;
}

/* 休み確定: filled slate */
.chip-day-off-confirmed {
  background: #64748b;
  border-color: #64748b;
  color: #ffffff;
}

/* ── Adjusting ───────────────────────────── */
/* 調整中: filled amber */
.chip-adjusting {
  background: #f59e0b;
  border-color: #d97706;
  color: #1c1917;
}

/* ── Inner layout ────────────────────────── */
.chip-inner {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.chip-top-row {
  display: flex;
  align-items: center;
  gap: 3px;
  line-height: 1.2;
}

.chip-icon {
  flex-shrink: 0;
  opacity: 0.85;
}

.chip-status-label {
  flex: 1;
  font-size: 10px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  letter-spacing: 0;
}

.chip-time-row {
  font-size: 10px;
  font-weight: 400;
  opacity: 0.82;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  padding-left: 13px; /* align under label past the icon */
}
</style>
