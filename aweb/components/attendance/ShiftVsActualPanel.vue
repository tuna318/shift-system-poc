<template>
  <v-card variant="outlined" rounded="xl" class="shift-panel">
    <v-card-text class="pa-4">
      <div class="text-subtitle-2 font-weight-bold mb-3 d-flex align-center ga-2">
        <v-icon size="16" color="primary">mdi-calendar-clock</v-icon>
        シフト参照
      </div>

      <!-- No shift -->
      <template v-if="!shift">
        <div class="text-body-2 text-medium-emphasis text-center py-2">
          <v-icon size="20" class="mb-1">mdi-calendar-remove-outline</v-icon><br>
          この日のシフトはありません
        </div>
      </template>

      <template v-else>
        <!-- Shift info -->
        <div class="shift-info mb-3">
          <div class="d-flex align-center justify-space-between mb-1">
            <div class="d-flex align-center ga-2">
              <v-icon size="14" color="primary">mdi-clock-outline</v-icon>
              <span class="text-body-2 font-weight-medium">{{ shift.startTime }} — {{ shift.endTime }}</span>
            </div>
            <v-chip size="x-small" color="primary" variant="tonal">{{ shift.department }}</v-chip>
          </div>
          <div class="text-caption text-medium-emphasis">
            予定時間: {{ shiftMinutes }}分 ({{ formatMins(shiftMinutes) }})
          </div>
        </div>

        <!-- Visual timeline bars -->
        <div class="timeline-wrap mb-3">
          <div class="timeline-label text-caption text-medium-emphasis mb-1">タイムライン (06:00–23:00)</div>
          <!-- Shift bar -->
          <div class="timeline-row">
            <span class="tl-type text-caption text-medium-emphasis">予定</span>
            <div class="tl-track">
              <div class="tl-bar tl-bar--shift" :style="shiftBarStyle" />
            </div>
          </div>
          <!-- Actual bars (one per session) -->
          <div v-for="(sess, i) in sessions" :key="i" class="timeline-row">
            <span class="tl-type text-caption text-medium-emphasis">実績{{ sessions.length > 1 ? i + 1 : '' }}</span>
            <div class="tl-track">
              <div v-if="sess.checkIn && sess.checkOut" class="tl-bar tl-bar--actual" :style="actualBarStyle(sess.checkIn, sess.checkOut)" />
            </div>
          </div>
        </div>

        <!-- Deviation table -->
        <div class="deviation-table">
          <div class="dev-row">
            <span class="dev-label">出勤 差異</span>
            <span class="dev-value" :class="deviationColor(inDev)">{{ deviationText(inDev, '出勤') }}</span>
          </div>
          <div class="dev-row">
            <span class="dev-label">退勤 差異</span>
            <span class="dev-value" :class="deviationColor(outDev)">{{ deviationText(outDev, '退勤') }}</span>
          </div>
          <div class="dev-row">
            <span class="dev-label">実働 差異</span>
            <span class="dev-value" :class="deviationColor(-workDev)">
              {{ workDev >= 0 ? '+' : '' }}{{ formatMins(Math.abs(workDev)) }}
              {{ workDev > 0 ? '(超過)' : workDev < 0 ? '(不足)' : '(一致)' }}
            </span>
          </div>
        </div>
      </template>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import type { WorkSession, ShiftEntry } from '~/types'

const props = defineProps<{
  shift?: Pick<ShiftEntry, 'id' | 'startTime' | 'endTime' | 'department'> | null
  sessions: WorkSession[]
}>()

const TRACK_START = 6 * 60   // 06:00
const TRACK_END   = 23 * 60  // 23:00
const TRACK_SPAN  = TRACK_END - TRACK_START

function toMins(t: string): number {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}
function formatMins(m: number): string {
  const h = Math.floor(Math.abs(m) / 60)
  const min = Math.abs(m) % 60
  return `${h}h${String(min).padStart(2, '0')}m`
}

function pct(t: string): number {
  return Math.max(0, Math.min(100, ((toMins(t) - TRACK_START) / TRACK_SPAN) * 100))
}

const shiftMinutes = computed(() => {
  if (!props.shift) return 0
  return toMins(props.shift.endTime) - toMins(props.shift.startTime)
})

const shiftBarStyle = computed(() => {
  if (!props.shift) return {}
  const left = pct(props.shift.startTime)
  const right = 100 - pct(props.shift.endTime)
  return { left: `${left}%`, right: `${right}%` }
})

function actualBarStyle(ci: string, co: string) {
  return { left: `${pct(ci)}%`, right: `${100 - pct(co)}%` }
}

// Deviation: positive = late/overtime, negative = early/undertime
const inDev = computed(() => {
  if (!props.shift || !props.sessions[0]?.checkIn) return null
  return toMins(props.sessions[0].checkIn) - toMins(props.shift.startTime)
})
const outDev = computed(() => {
  if (!props.shift) return null
  const lastSess = props.sessions[props.sessions.length - 1]
  if (!lastSess?.checkOut) return null
  return toMins(lastSess.checkOut) - toMins(props.shift.endTime)
})
const workDev = computed(() => {
  const actual = props.sessions.reduce((s, sess) => s + (sess.actualMinutes ?? 0), 0)
  return actual - shiftMinutes.value
})

function deviationText(dev: number | null, type: string): string {
  if (dev === null) return '—'
  if (dev === 0) return '定刻通り'
  const abs = Math.abs(dev)
  const h = Math.floor(abs / 60)
  const m = abs % 60
  const timeStr = h > 0 ? `${h}時間${m}分` : `${m}分`
  if (type === '出勤') return dev > 0 ? `${timeStr}遅刻` : `${timeStr}早出`
  return dev > 0 ? `${timeStr}残業` : `${timeStr}早退`
}

function deviationColor(dev: number | null): string {
  if (dev === null || dev === 0) return 'text-medium-emphasis'
  return dev > 0 ? 'text-error' : 'text-info'
}
</script>

<style scoped>
.shift-panel { border-color: #e0e0e0; }

.timeline-wrap { background: #fafafa; border-radius: 8px; padding: 8px; }
.timeline-row { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
.tl-type { min-width: 32px; text-align: right; }
.tl-track {
  flex: 1;
  height: 12px;
  background: #eeeeee;
  border-radius: 6px;
  position: relative;
}
.tl-bar {
  position: absolute;
  top: 0;
  bottom: 0;
  border-radius: 6px;
}
.tl-bar--shift  { background: #90caf9; }
.tl-bar--actual { background: #4caf50; }

.deviation-table { display: flex; flex-direction: column; gap: 4px; }
.dev-row { display: flex; justify-content: space-between; align-items: center; }
.dev-label { font-size: 12px; color: #757575; }
.dev-value { font-size: 12px; font-weight: 600; }
</style>
