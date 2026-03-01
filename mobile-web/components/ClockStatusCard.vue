<template>
  <v-card rounded="xl" :style="`border-left: 4px solid ${statusColor};`" elevation="1">
    <v-card-text class="pa-4">
      <!-- Status row -->
      <div class="d-flex align-center justify-space-between mb-3">
        <v-chip :color="statusColor" size="small" variant="tonal">
          <v-icon start size="14">{{ statusIcon }}</v-icon>
          {{ statusLabel }}
        </v-chip>
        <span v-if="status === 'WORKING'" class="text-caption text-grey">
          {{ elapsedLabel }}
        </span>
        <span v-else-if="status === 'ON_BREAK'" class="text-caption text-grey">
          休憩中
        </span>
      </div>

      <!-- Check-in time -->
      <div v-if="checkInTime" class="text-body-2 text-grey-darken-1 mb-4">
        出勤: <strong>{{ checkInTime }}</strong>
      </div>

      <!-- Action buttons -->
      <div v-if="status === 'NOT_STARTED'">
        <v-btn
          block
          color="primary"
          size="large"
          rounded="lg"
          @click="$emit('action', 'CHECK_IN')"
        >
          <v-icon start>mdi-login</v-icon>
          出勤打刻
        </v-btn>
      </div>

      <div v-else-if="status === 'WORKING'" class="d-flex gap-2">
        <v-btn
          color="warning"
          size="default"
          rounded="lg"
          class="flex-1-1"
          @click="$emit('action', 'BREAK_START')"
        >
          <v-icon start size="18">mdi-coffee-outline</v-icon>
          休憩開始
        </v-btn>
        <v-btn
          color="error"
          size="default"
          rounded="lg"
          class="flex-1-1"
          @click="$emit('action', 'CHECK_OUT')"
        >
          <v-icon start size="18">mdi-logout</v-icon>
          退勤打刻
        </v-btn>
      </div>

      <div v-else-if="status === 'ON_BREAK'">
        <v-btn
          block
          color="success"
          size="large"
          rounded="lg"
          @click="$emit('action', 'BREAK_END')"
        >
          <v-icon start>mdi-play-circle-outline</v-icon>
          休憩終了
        </v-btn>
      </div>

      <div v-else>
        <v-btn block disabled size="large" rounded="lg" variant="tonal">
          <v-icon start>mdi-check-circle-outline</v-icon>
          退勤済み
        </v-btn>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import type { ClockStatus } from '~/types'

const props = defineProps<{
  status: ClockStatus
  checkInTime: string | null
  breakMinutes: number
}>()

defineEmits<{
  action: [type: string]
}>()

const statusConfig = {
  NOT_STARTED: { label: '未出勤', color: '#9e9e9e', icon: 'mdi-clock-outline' },
  WORKING: { label: '出勤中', color: '#4bd08b', icon: 'mdi-briefcase-outline' },
  ON_BREAK: { label: '休憩中', color: '#f8c076', icon: 'mdi-coffee-outline' },
  COMPLETED: { label: '退勤済み', color: '#9e9e9e', icon: 'mdi-check-circle-outline' },
}

const statusLabel = computed(() => statusConfig[props.status].label)
const statusColor = computed(() => statusConfig[props.status].color)
const statusIcon = computed(() => statusConfig[props.status].icon)

// Elapsed time since check-in (static for prototype)
const elapsedLabel = computed(() => {
  if (!props.checkInTime) return ''
  const [h, m] = props.checkInTime.split(':').map(Number)
  // Use a fixed "current time" of 09:45 for demo purposes
  const nowH = 9, nowM = 45
  const elapsed = (nowH * 60 + nowM) - (h * 60 + m)
  if (elapsed <= 0) return ''
  const eh = Math.floor(elapsed / 60)
  const em = elapsed % 60
  return eh > 0 ? `${eh}時間${em}分経過` : `${em}分経過`
})
</script>

<style scoped>
.gap-2 {
  gap: 8px;
}
</style>
