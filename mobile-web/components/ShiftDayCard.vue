<template>
  <v-card rounded="lg" elevation="0" variant="outlined" class="shift-day-card">
    <v-card-text class="pa-3">
      <div class="d-flex align-center justify-space-between">
        <!-- Date info -->
        <div>
          <div class="text-body-2 font-weight-bold text-grey-darken-2">
            {{ dateLabel }}
          </div>
          <div class="text-caption text-grey">{{ dayOfWeek }}</div>
        </div>

        <!-- Shift info or empty state -->
        <div class="text-right">
          <template v-if="entry">
            <v-chip color="primary" size="small" variant="tonal">
              {{ entry.startTime }}〜{{ entry.endTime }}
            </v-chip>
            <div class="text-caption text-grey mt-1">{{ entry.department }}</div>
          </template>
          <template v-else-if="preference">
            <v-chip color="warning" size="small" variant="tonal">
              希望提出済み
            </v-chip>
          </template>
          <template v-else>
            <span class="text-caption text-grey">未確定</span>
          </template>
        </div>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import type { ShiftEntry, ShiftPreference } from '~/types'

const props = defineProps<{
  date: string
  entry: ShiftEntry | null
  preference?: ShiftPreference | null
}>()

const DOW = ['日', '月', '火', '水', '木', '金', '土']

const dateLabel = computed(() => {
  const d = new Date(props.date)
  return `${d.getMonth() + 1}/${d.getDate()}`
})

const dayOfWeek = computed(() => {
  const d = new Date(props.date)
  return `(${DOW[d.getDay()]})`
})
</script>
