<template>
  <v-timeline density="compact" side="end" align="start">
    <v-timeline-item
      v-for="event in events"
      :key="event.id"
      :dot-color="event.color"
      size="small"
    >
      <template #opposite>
        <span class="text-caption font-weight-medium">{{ formatTime(event.punchedAt) }}</span>
      </template>
      <div class="d-flex align-center ga-2">
        <v-icon :color="event.color" size="16">{{ event.icon }}</v-icon>
        <div>
          <div class="text-body-2 font-weight-medium">{{ event.label }}</div>
          <div v-if="event.duration" class="text-caption text-medium-emphasis">
            {{ event.duration }}
          </div>
        </div>
        <v-chip v-if="event.isVoided" color="error" size="x-small" variant="tonal">無効</v-chip>
      </div>
    </v-timeline-item>
  </v-timeline>
</template>

<script setup lang="ts">
import type { PunchEvent } from '~/types'

const props = defineProps<{
  punchEvents: PunchEvent[]
}>()

const events = computed(() => {
  return props.punchEvents
    .slice()
    .sort((a, b) => a.punchedAt.localeCompare(b.punchedAt))
    .map((event, idx, arr) => {
      const typeMap = {
        CHECK_IN: { label: '出勤', icon: 'mdi-login', color: 'success' },
        BREAK_START: { label: '休憩開始', icon: 'mdi-coffee-outline', color: 'warning' },
        BREAK_END: { label: '休憩終了', icon: 'mdi-coffee-off-outline', color: 'warning' },
        CHECK_OUT: { label: '退勤', icon: 'mdi-logout', color: 'primary' },
      }
      const meta = typeMap[event.punchType] ?? { label: event.punchType, icon: 'mdi-clock', color: 'default' }

      // Compute duration from previous event
      let duration = ''
      if (idx > 0) {
        const prev = arr[idx - 1]
        const prevTime = new Date(prev.punchedAt)
        const curTime = new Date(event.punchedAt)
        const diffMin = Math.round((curTime.getTime() - prevTime.getTime()) / 60000)
        if (diffMin > 0) duration = `経過: ${diffMin}分`
      }

      return { ...event, ...meta, duration }
    })
})

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString('ja-JP', {
    hour: '2-digit', minute: '2-digit',
  })
}
</script>
