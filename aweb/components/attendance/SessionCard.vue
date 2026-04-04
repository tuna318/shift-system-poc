<template>
  <v-card variant="outlined" rounded="lg" class="session-card mb-3">
    <v-card-text class="pa-3">
      <!-- Header row -->
      <div class="d-flex align-center justify-space-between mb-2">
        <div class="d-flex align-center ga-2">
          <v-chip size="x-small" color="primary" variant="flat">
            セッション {{ session.sessionIdx !== undefined ? session.sessionIdx + 1 : idx + 1 }}
          </v-chip>
          <v-chip v-if="session.punchVariant === 'HELP'" size="x-small" color="orange" variant="tonal">
            応援 {{ session.helpStore ? `(${session.helpStore})` : '' }}
          </v-chip>
          <v-chip v-else-if="session.punchVariant === 'TRAINING'" size="x-small" color="purple" variant="tonal">
            研修
          </v-chip>
          <span class="text-caption text-medium-emphasis">{{ session.department }}</span>
        </div>
        <div class="d-flex align-center ga-1">
          <v-icon v-for="f in flags" :key="f.key" :color="f.level === 'error' ? 'error' : 'warning'" size="16">
            {{ f.icon }}
          </v-icon>
        </div>
      </div>

      <!-- Times row -->
      <div class="d-flex align-center ga-4 mb-2">
        <div class="time-block">
          <div class="time-label">出勤</div>
          <div class="time-value">{{ session.checkIn ?? '—' }}</div>
        </div>
        <v-icon color="medium-emphasis" size="16">mdi-arrow-right</v-icon>
        <div class="time-block">
          <div class="time-label">退勤</div>
          <div class="time-value" :class="{ 'text-error': !session.checkOut }">
            {{ session.checkOut ?? '未打刻' }}
          </div>
        </div>
        <div class="time-block">
          <div class="time-label">休憩</div>
          <div class="time-value">{{ session.breakMinutes }}分</div>
        </div>
        <div class="time-block">
          <div class="time-label">実働</div>
          <div class="time-value font-weight-bold">{{ formatMins(session.actualMinutes) }}</div>
        </div>
        <div v-if="session.nightMinutes" class="time-block">
          <div class="time-label">深夜</div>
          <div class="time-value text-purple">{{ session.nightMinutes }}分</div>
        </div>
      </div>

      <!-- Compliance flags -->
      <div v-if="flags.length > 0" class="d-flex flex-wrap ga-1 mb-2">
        <v-chip
          v-for="f in flags"
          :key="f.key"
          size="x-small"
          :color="f.level === 'error' ? 'error' : 'warning'"
          variant="tonal"
          :prepend-icon="f.icon"
        >
          {{ f.message }}
        </v-chip>
      </div>

      <!-- Punch events (expandable) -->
      <v-expansion-panels variant="accordion" flat class="punch-expand">
        <v-expansion-panel
          :title="`打刻履歴 (${punchEvents.length}件)`"
          class="punch-expand-panel"
        >
          <template #text>
            <div class="punch-timeline">
              <div
                v-for="ev in punchEvents"
                :key="ev.id"
                class="punch-event"
                :class="{ 'punch-event--voided': ev.isVoided }"
              >
                <v-icon :color="punchColor(ev.punchType)" size="14">{{ punchIcon(ev.punchType) }}</v-icon>
                <span class="punch-time">{{ formatPunchTime(ev.punchedAt) }}</span>
                <span class="punch-type">{{ punchLabel(ev.punchType) }}</span>
              </div>
            </div>
          </template>
        </v-expansion-panel>
      </v-expansion-panels>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import type { WorkSession, PunchEvent, PunchType, ComplianceFlag } from '~/types'

const props = defineProps<{
  session: WorkSession
  idx: number
  punchEvents?: PunchEvent[]
  flags?: ComplianceFlag[]
}>()

const punchEvents = computed(() => props.punchEvents ?? [])
const flags = computed(() => props.flags ?? [])

function formatMins(m: number): string {
  const h = Math.floor(m / 60)
  const min = m % 60
  return `${h}h${String(min).padStart(2, '0')}m`
}

function formatPunchTime(punchedAt: string): string {
  return punchedAt.slice(11, 16)
}

function punchIcon(type: PunchType): string {
  switch (type) {
    case 'CHECK_IN': return 'mdi-login'
    case 'CHECK_OUT': return 'mdi-logout'
    case 'BREAK_START': return 'mdi-coffee'
    case 'BREAK_END': return 'mdi-coffee-off'
  }
}

function punchColor(type: PunchType): string {
  switch (type) {
    case 'CHECK_IN': return 'success'
    case 'CHECK_OUT': return 'error'
    case 'BREAK_START': return 'warning'
    case 'BREAK_END': return 'info'
  }
}

function punchLabel(type: PunchType): string {
  switch (type) {
    case 'CHECK_IN': return '出勤'
    case 'CHECK_OUT': return '退勤'
    case 'BREAK_START': return '休憩開始'
    case 'BREAK_END': return '休憩終了'
  }
}
</script>

<style scoped>
.session-card {
  border-color: #e0e0e0;
}
.time-block {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 40px;
}
.time-label {
  font-size: 10px;
  color: #9e9e9e;
}
.time-value {
  font-size: 14px;
  font-weight: 500;
  font-feature-settings: "tnum";
}
.text-purple { color: #7e57c2; }

.punch-expand { background: transparent; }
.punch-expand-panel { background: transparent !important; }
.punch-expand-panel:deep(.v-expansion-panel-title) {
  font-size: 12px;
  color: #757575;
  padding: 4px 0;
  min-height: 32px;
}
.punch-timeline { display: flex; flex-direction: column; gap: 6px; padding: 4px 0; }
.punch-event {
  display: flex;
  align-items: center;
  gap: 8px;
}
.punch-event--voided { opacity: 0.4; text-decoration: line-through; }
.punch-time { font-size: 12px; font-feature-settings: "tnum"; min-width: 36px; }
.punch-type { font-size: 12px; color: #616161; }
</style>
