<template>
  <v-card rounded="xl" elevation="0" border>
    <v-card-title class="pa-4 pb-2 d-flex align-center ga-2">
      <v-icon color="primary" size="20">mdi-calendar-today</v-icon>
      <span class="text-subtitle-2 font-weight-bold">本日のシフト</span>
    </v-card-title>
    <v-card-subtitle class="px-4 pb-3 text-caption">
      2026年3月1日（日）
    </v-card-subtitle>

    <v-card-text class="px-4 pb-2">
      <div v-if="todayEntries.length === 0" class="text-center py-4 text-medium-emphasis text-body-2">
        本日のシフトはありません
      </div>

      <div v-else class="d-flex flex-column ga-2">
        <div
          v-for="entry in todayEntries.slice(0, 5)"
          :key="entry.id"
          class="d-flex align-center justify-space-between pa-2 rounded-lg"
          style="background: #F8F9FA"
        >
          <div class="d-flex align-center ga-2">
            <v-avatar color="primary" size="28">
              <span class="text-caption text-white">{{ getEmployee(entry.employeeId)?.name.charAt(0) }}</span>
            </v-avatar>
            <div>
              <div class="text-body-2 font-weight-medium">{{ getEmployee(entry.employeeId)?.name }}</div>
              <div class="text-caption text-medium-emphasis">{{ getEmployee(entry.employeeId)?.department }}</div>
            </div>
          </div>
          <div class="text-right">
            <div class="text-caption font-weight-medium text-primary">
              {{ entry.startTime }}〜{{ entry.endTime }}
            </div>
            <v-chip
              :color="cellStatusColor(entry.cellStatus)"
              size="x-small"
              variant="flat"
            >
              {{ cellStatusLabel(entry.cellStatus) }}
            </v-chip>
          </div>
        </div>

        <div v-if="todayEntries.length > 5" class="text-center text-caption text-medium-emphasis">
          他 {{ todayEntries.length - 5 }}件
        </div>
      </div>
    </v-card-text>

    <v-card-actions class="px-4 pb-4">
      <v-btn
        to="/shifts/board/board-2026-03"
        variant="tonal"
        color="primary"
        size="small"
        block
        rounded="lg"
        append-icon="mdi-arrow-right"
      >
        シフトボードを開く
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script setup lang="ts">
import { useMockData } from '~/composables/useMockData'
import type { CellStatus } from '~/types'

const { currentBoard, getEmployee } = useMockData()

const todayEntries = computed(() =>
  currentBoard.entries.filter(e => e.shiftDate === '2026-03-01')
)

function cellStatusColor(status: CellStatus) {
  const map: Record<CellStatus, string> = {
    SHIFT_REQUESTED: 'indigo',
    CONFIRMED: 'primary',
    DAY_OFF_REQUESTED: 'orange',
    DAY_OFF_CONFIRMED: 'default',
    ADJUSTING: 'warning',
  }
  return map[status]
}

function cellStatusLabel(status: CellStatus) {
  const map: Record<CellStatus, string> = {
    SHIFT_REQUESTED: 'シフト希望',
    CONFIRMED: 'シフト確定',
    DAY_OFF_REQUESTED: '休み希望',
    DAY_OFF_CONFIRMED: '休み確定',
    ADJUSTING: '調整中',
  }
  return map[status]
}
</script>
