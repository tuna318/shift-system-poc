<template>
  <div class="pa-4">
    <!-- Current time display -->
    <v-card rounded="xl" color="primary" class="mb-4" elevation="2">
      <v-card-text class="text-center pa-6">
        <div class="text-white text-caption mb-1" style="opacity: 0.8;">{{ todayLabel }}</div>
        <div class="text-white font-weight-bold" style="font-size: 52px; letter-spacing: -2px; line-height: 1;">
          {{ currentTimeDisplay }}
        </div>
        <div class="text-white mt-2" style="opacity: 0.7; font-size: 12px;">渋谷本店</div>
      </v-card-text>
    </v-card>

    <!-- Status & action -->
    <v-card rounded="xl" elevation="1" class="mb-4">
      <v-card-text class="pa-4">
        <div class="d-flex align-center justify-space-between mb-4">
          <v-chip :color="statusColor" size="default" variant="tonal">
            <v-icon start size="16">{{ statusIcon }}</v-icon>
            {{ statusLabel }}
          </v-chip>
          <span v-if="punchStatus.checkInTime" class="text-body-2 text-grey">
            出勤: {{ punchStatus.checkInTime }}
          </span>
        </div>

        <!-- Elapsed time for WORKING state -->
        <div v-if="punchStatus.status === 'WORKING'" class="text-center mb-4">
          <div class="text-caption text-grey mb-1">勤務時間</div>
          <div class="text-h5 font-weight-bold text-primary">{{ elapsedDisplay }}</div>
        </div>

        <!-- Action buttons -->
        <div v-if="punchStatus.status === 'NOT_STARTED'">
          <v-btn
            block
            color="primary"
            size="x-large"
            rounded="xl"
            height="64"
            @click="openConfirm('CHECK_IN')"
          >
            <v-icon start size="24">mdi-login</v-icon>
            <span style="font-size: 18px;">出勤打刻</span>
          </v-btn>
        </div>

        <div v-else-if="punchStatus.status === 'WORKING'" class="d-flex flex-column gap-3">
          <v-btn
            color="warning"
            size="x-large"
            rounded="xl"
            height="56"
            block
            @click="openConfirm('BREAK_START')"
          >
            <v-icon start size="20">mdi-coffee-outline</v-icon>
            休憩開始
          </v-btn>
          <v-btn
            color="error"
            size="x-large"
            rounded="xl"
            height="56"
            block
            @click="openConfirm('CHECK_OUT')"
          >
            <v-icon start size="20">mdi-logout</v-icon>
            退勤打刻
          </v-btn>
        </div>

        <div v-else-if="punchStatus.status === 'ON_BREAK'">
          <v-btn
            block
            color="success"
            size="x-large"
            rounded="xl"
            height="64"
            @click="openConfirm('BREAK_END')"
          >
            <v-icon start size="24">mdi-play-circle-outline</v-icon>
            <span style="font-size: 18px;">休憩終了</span>
          </v-btn>
        </div>

        <div v-else>
          <v-btn
            block
            disabled
            size="x-large"
            rounded="xl"
            height="64"
            variant="tonal"
          >
            <v-icon start size="24">mdi-check-circle-outline</v-icon>
            <span style="font-size: 18px;">退勤済み</span>
          </v-btn>
          <div class="text-center mt-3 text-body-2 text-grey">本日の勤務お疲れ様でした</div>
        </div>
      </v-card-text>
    </v-card>

    <!-- Punch timeline -->
    <div class="text-subtitle-2 font-weight-bold text-grey-darken-2 mb-2">本日の打刻履歴</div>
    <v-card rounded="xl" elevation="0" variant="outlined" class="mb-4">
      <v-card-text class="pa-4">
        <div v-if="punchStatus.events.length === 0" class="text-body-2 text-grey text-center py-2">
          打刻記録はありません
        </div>
        <div v-else class="punch-timeline">
          <div
            v-for="(event, i) in punchStatus.events"
            :key="i"
            class="punch-event d-flex align-center justify-space-between"
          >
            <div class="d-flex align-center gap-2">
              <v-icon size="16" :color="eventColor(event.type)">{{ eventIcon(event.type) }}</v-icon>
              <span class="text-body-2">{{ eventLabel(event.type) }}</span>
            </div>
            <span class="text-body-2 font-weight-bold">{{ event.time }}</span>
          </div>
        </div>
      </v-card-text>
    </v-card>
  </div>

  <!-- Confirmation dialog -->
  <v-dialog v-model="confirmDialog" max-width="320" persistent>
    <v-card rounded="xl">
      <v-card-text class="pa-6 text-center">
        <v-icon size="48" :color="confirmColor" class="mb-3">{{ confirmIcon }}</v-icon>
        <div class="text-subtitle-1 font-weight-bold mb-2">{{ confirmTitle }}</div>
        <div class="text-body-2 text-grey mb-4">
          現在時刻: <strong>{{ currentTimeDisplay }}</strong> で打刻します
        </div>
        <div class="d-flex gap-2">
          <v-btn
            variant="outlined"
            rounded="lg"
            class="flex-1-1"
            @click="confirmDialog = false"
          >
            キャンセル
          </v-btn>
          <v-btn
            :color="confirmColor"
            rounded="lg"
            class="flex-1-1"
            @click="executePunch"
          >
            打刻する
          </v-btn>
        </div>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import type { PunchType } from '~/types'

const { currentPunchStatus } = useMockData()
const appStore = useAppStore()
const punchStatus = currentPunchStatus

const today = '2026-03-01'
const currentTime = ref('09:45')

const todayLabel = computed(() => {
  const d = new Date(today)
  const dow = ['日', '月', '火', '水', '木', '金', '土']
  return `${d.getMonth() + 1}月${d.getDate()}日 (${dow[d.getDay()]})`
})

const currentTimeDisplay = computed(() => currentTime.value)

const statusConfig = {
  NOT_STARTED: { label: '未出勤', color: 'grey', icon: 'mdi-clock-outline' },
  WORKING: { label: '出勤中', color: 'success', icon: 'mdi-briefcase-outline' },
  ON_BREAK: { label: '休憩中', color: 'warning', icon: 'mdi-coffee-outline' },
  COMPLETED: { label: '退勤済み', color: 'grey', icon: 'mdi-check-circle-outline' },
}

const statusLabel = computed(() => statusConfig[punchStatus.value.status].label)
const statusColor = computed(() => statusConfig[punchStatus.value.status].color)
const statusIcon = computed(() => statusConfig[punchStatus.value.status].icon)

const elapsedDisplay = computed(() => {
  if (!punchStatus.value.checkInTime) return '0:00'
  const [h, m] = punchStatus.value.checkInTime.split(':').map(Number)
  const [nh, nm] = currentTime.value.split(':').map(Number)
  const elapsed = (nh * 60 + nm) - (h * 60 + m) - punchStatus.value.breakMinutes
  if (elapsed <= 0) return '0:00'
  return `${Math.floor(elapsed / 60)}:${String(elapsed % 60).padStart(2, '0')}`
})

const confirmDialog = ref(false)
const pendingAction = ref<PunchType | null>(null)

const actionConfig = {
  CHECK_IN: { title: '出勤打刻しますか？', color: 'primary', icon: 'mdi-login' },
  BREAK_START: { title: '休憩開始しますか？', color: 'warning', icon: 'mdi-coffee-outline' },
  BREAK_END: { title: '休憩終了しますか？', color: 'success', icon: 'mdi-play-circle-outline' },
  CHECK_OUT: { title: '退勤打刻しますか？', color: 'error', icon: 'mdi-logout' },
}

const confirmTitle = computed(() => pendingAction.value ? actionConfig[pendingAction.value].title : '')
const confirmColor = computed(() => pendingAction.value ? actionConfig[pendingAction.value].color : 'primary')
const confirmIcon = computed(() => pendingAction.value ? actionConfig[pendingAction.value].icon : 'mdi-clock')

function openConfirm(type: PunchType) {
  pendingAction.value = type
  confirmDialog.value = true
}

function executePunch() {
  if (!pendingAction.value) return
  const time = currentTime.value

  punchStatus.value.events.push({
    type: pendingAction.value,
    time,
    timestamp: `2026-03-01T${time}:00`,
  })

  if (pendingAction.value === 'CHECK_IN') {
    punchStatus.value.status = 'WORKING'
    punchStatus.value.checkInTime = time
    appStore.showSnackbar(`出勤打刻しました (${time})`, 'success')
  } else if (pendingAction.value === 'BREAK_START') {
    punchStatus.value.status = 'ON_BREAK'
    appStore.showSnackbar(`休憩開始しました (${time})`, 'warning')
  } else if (pendingAction.value === 'BREAK_END') {
    punchStatus.value.status = 'WORKING'
    appStore.showSnackbar(`休憩終了しました (${time})`, 'success')
  } else if (pendingAction.value === 'CHECK_OUT') {
    punchStatus.value.status = 'COMPLETED'
    appStore.showSnackbar(`退勤打刻しました (${time})`, 'success')
  }

  confirmDialog.value = false
  pendingAction.value = null
}

function eventLabel(type: string) {
  const labels: Record<string, string> = {
    CHECK_IN: '出勤',
    BREAK_START: '休憩開始',
    BREAK_END: '休憩終了',
    CHECK_OUT: '退勤',
  }
  return labels[type] ?? type
}

function eventIcon(type: string) {
  const icons: Record<string, string> = {
    CHECK_IN: 'mdi-login',
    BREAK_START: 'mdi-coffee-outline',
    BREAK_END: 'mdi-play-circle-outline',
    CHECK_OUT: 'mdi-logout',
  }
  return icons[type] ?? 'mdi-clock'
}

function eventColor(type: string) {
  const colors: Record<string, string> = {
    CHECK_IN: '#4bd08b',
    BREAK_START: '#f8c076',
    BREAK_END: '#4bd08b',
    CHECK_OUT: '#e6273e',
  }
  return colors[type] ?? '#9e9e9e'
}
</script>

<style scoped>
.gap-2 { gap: 8px; }
.gap-3 { gap: 12px; }

.punch-timeline {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.punch-event {
  position: relative;
  padding-left: 0;
}
</style>
