<template>
  <div class="gantt-page">
    <!-- Top bar -->
    <div class="d-flex align-center justify-space-between mb-4">
      <div class="d-flex align-center ga-3">
        <v-btn
          to="/shifts/board"
          icon
          size="small"
          variant="text"
        >
          <v-icon>mdi-arrow-left</v-icon>
        </v-btn>
        <div>
          <div class="d-flex align-center ga-2">
            <h1 class="text-h6 font-weight-bold">{{ board?.name }}</h1>
            <v-chip
              :color="board?.status === 'PUBLISHED' ? 'success' : 'warning'"
              size="small"
              variant="flat"
            >
              {{ board?.status === 'PUBLISHED' ? '公開済み' : 'DRAFT' }}
            </v-chip>
          </div>
          <p class="text-caption text-medium-emphasis">
            {{ board?.periodStart }} 〜 {{ board?.periodEnd }}
            ／ {{ shiftStore.entries.length }}件 · {{ totalHours }}h ·
            <span :class="shiftStore.costSummary.variance > 0 ? 'text-error' : ''">
              ¥{{ shiftStore.costSummary.totalCost.toLocaleString() }}
            </span>
            / ¥{{ shiftStore.costSummary.budget.toLocaleString() }}
          </p>
        </div>
      </div>

      <div class="d-flex ga-2">
        <v-btn
          variant="tonal"
          prepend-icon="mdi-download-outline"
          rounded="lg"
          @click="handleExport"
        >
          エクスポート
        </v-btn>
        <v-btn
          v-if="collection?.status === 'COLLECTING'"
          variant="tonal"
          color="warning"
          prepend-icon="mdi-bell-outline"
          rounded="lg"
          @click="sendReminder"
        >
          リマインド送信
          <v-chip size="x-small" color="warning" variant="flat" class="ml-1">
            {{ pendingCount }}名
          </v-chip>
        </v-btn>
        <v-btn
          v-if="board?.status === 'DRAFT'"
          color="primary"
          prepend-icon="mdi-send-outline"
          rounded="lg"
          @click="publishDialog = true"
        >
          公開する
        </v-btn>
        <v-btn
          v-else
          color="success"
          variant="tonal"
          prepend-icon="mdi-check-circle"
          rounded="lg"
          disabled
        >
          公開済み
        </v-btn>
      </div>
    </div>

    <!-- View toggle + status legend -->
    <div class="d-flex align-center justify-space-between mb-3 flex-wrap ga-2">
      <v-btn-toggle v-model="activeView" mandatory density="compact" rounded="lg" color="primary">
        <v-btn value="gantt" size="small" prepend-icon="mdi-table">
          シフトボード
        </v-btn>
        <v-btn
          value="allocation"
          size="small"
          prepend-icon="mdi-calendar-month-outline"
          :disabled="!board?.allocationSetup"
        >
          配置カレンダー
        </v-btn>
      </v-btn-toggle>

      <!-- Status legend (always visible) -->
      <div class="d-flex align-center ga-2 flex-wrap">
        <div
          v-for="item in statusLegend"
          :key="item.status"
          class="status-legend-chip"
          :style="{ background: item.color, border: `1.5px solid ${item.borderColor}`, color: item.textColor }"
        >
          {{ item.label }}
        </div>
      </div>
    </div>

    <!-- Gantt Board -->
    <GanttBoard
      v-if="activeView === 'gantt' && board"
      :board-id="board.id"
      :period-start="board.periodStart"
      :period-end="board.periodEnd"
    />

    <!-- Allocation overview calendar -->
    <v-card v-else-if="activeView === 'allocation' && board?.allocationSetup" rounded="xl" elevation="0" border>
      <v-card-text class="pa-4">
        <AllocationOverviewCalendar
          :period-start="board.periodStart"
          :period-end="board.periodEnd"
          :allocation-setup="board.allocationSetup"
          :entries="shiftStore.entries"
        />
      </v-card-text>
    </v-card>

    <!-- Publish confirm dialog -->
    <v-dialog v-model="publishDialog" max-width="400">
      <v-card rounded="xl">
        <v-card-title class="pa-4 text-subtitle-1 font-weight-bold">
          シフトボードを公開しますか？
        </v-card-title>
        <v-card-text class="px-4 pb-4 text-body-2 text-medium-emphasis">
          公開すると全スタッフがシフトを確認できるようになります。公開後も編集は可能です。
        </v-card-text>
        <v-card-actions class="pa-4 pt-0">
          <v-spacer />
          <v-btn variant="text" @click="publishDialog = false">キャンセル</v-btn>
          <v-btn color="primary" variant="flat" @click="handlePublish">公開する</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Snackbar -->
    <v-snackbar
      v-model="shiftStore.snackbar.show"
      location="top center"
      :timeout="2500"
      color="primary"
      rounded="pill"
    >
      {{ shiftStore.snackbar.message }}
    </v-snackbar>
  </div>
</template>

<script setup lang="ts">
import { useShiftStore } from '~/stores/shift.store'
import { useMockData } from '~/composables/useMockData'

const route = useRoute()
const shiftStore = useShiftStore()
const { boards, getCollectionForBoard } = useMockData()

const boardId = computed(() => route.params.id as string)
const board = computed(() => shiftStore.currentBoard ?? boards.find(b => b.id === boardId.value))

const totalHours = computed(() =>
  (shiftStore.perEmployeeStats.reduce((sum, e) => sum + e.hours, 0)).toFixed(1)
)

const collection = computed(() => getCollectionForBoard(boardId.value))
const pendingCount = computed(() =>
  collection.value?.submissions?.filter(s => !s.submitted).length ?? 0
)

function sendReminder() {
  shiftStore.showSnackbar(`未提出の${pendingCount.value}名にリマインドを送信しました`)
}

// Load board into store on mount
onMounted(() => {
  shiftStore.loadBoard(boardId.value)
})

const activeView = ref<'gantt' | 'allocation'>('gantt')

const statusLegend = [
  { status: 'SHIFT_REQUESTED',   label: 'シフト希望', color: 'transparent', borderColor: '#3587dc', textColor: '#1d4ed8' },
  { status: 'CONFIRMED',         label: 'シフト確定', color: '#3587dc',     borderColor: '#3587dc', textColor: '#ffffff' },
  { status: 'DAY_OFF_REQUESTED', label: '休み希望',   color: 'transparent', borderColor: '#64748b', textColor: '#475569' },
  { status: 'DAY_OFF_CONFIRMED', label: '休み確定',   color: '#64748b',     borderColor: '#64748b', textColor: '#ffffff' },
  { status: 'ADJUSTING',         label: '調整中',     color: '#f59e0b',     borderColor: '#d97706', textColor: '#1c1917' },
]

const publishDialog = ref(false)

function handlePublish() {
  shiftStore.publishBoard()
  publishDialog.value = false
}

function handleExport() {
  shiftStore.showSnackbar('エクスポートを開始しました（モック）')
}

// Override page title for gantt — no extra padding
definePageMeta({
  layout: 'default',
})
</script>

<style scoped>
.gantt-page {
  /* Ensure the gantt takes full available height */
  display: flex;
  flex-direction: column;
}

.status-legend-chip {
  display: inline-flex;
  align-items: center;
  padding: 3px 9px;
  border-radius: 5px;
  font-size: 11px;
  font-weight: 600;
  white-space: nowrap;
}
</style>
