<template>
  <div>
    <!-- Page header -->
    <div class="d-flex align-center justify-space-between mb-6">
      <div>
        <h1 class="text-h5 font-weight-bold">ダッシュボード</h1>
        <p class="text-body-2 text-medium-emphasis mt-1">2026年3月1日（日）渋谷本店</p>
      </div>
      <div class="d-flex ga-2">
        <v-btn
          to="/attendance/approval"
          variant="tonal"
          color="primary"
          prepend-icon="mdi-check-circle-outline"
          rounded="lg"
        >
          勤怠承認
        </v-btn>
        <v-btn
          to="/shifts/board/board-2026-03"
          color="primary"
          prepend-icon="mdi-table-large"
          rounded="lg"
        >
          シフトボード
        </v-btn>
      </div>
    </div>

    <!-- Stats row -->
    <v-row class="mb-4">
      <v-col
        v-for="stat in stats"
        :key="stat.label"
        cols="12" sm="6" md="3"
      >
        <v-card rounded="xl" elevation="0" border class="pa-4">
          <div class="d-flex align-center justify-space-between mb-2">
            <span class="text-caption text-medium-emphasis">{{ stat.label }}</span>
            <v-icon :color="stat.color" size="20">{{ stat.icon }}</v-icon>
          </div>
          <div class="text-h4 font-weight-bold" :style="{ color: stat.valueColor }">
            {{ stat.value }}
          </div>
          <div class="text-caption text-medium-emphasis mt-1">{{ stat.sub }}</div>
        </v-card>
      </v-col>
    </v-row>

    <!-- Widget grid -->
    <v-row>
      <v-col cols="12" md="4">
        <AttendanceWidget />
      </v-col>
      <v-col cols="12" md="4">
        <ShiftSummaryWidget />
      </v-col>
      <v-col cols="12" md="4">
        <AlertWidget />
      </v-col>
    </v-row>

    <!-- Quick actions -->
    <v-row class="mt-2">
      <v-col cols="12">
        <v-card rounded="xl" elevation="0" border>
          <v-card-title class="pa-4 pb-2 text-subtitle-2 font-weight-bold">
            クイックアクション
          </v-card-title>
          <v-card-text class="px-4 pb-4">
            <div class="d-flex flex-wrap ga-2">
              <v-btn
                v-for="action in quickActions"
                :key="action.label"
                :to="action.to"
                :color="action.color"
                :prepend-icon="action.icon"
                variant="tonal"
                rounded="lg"
                size="small"
              >
                {{ action.label }}
              </v-btn>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script setup lang="ts">
import { useMockData } from '~/composables/useMockData'

const { attendanceRecords, currentBoard, alerts } = useMockData()

const todayRecords = computed(() =>
  attendanceRecords.filter(r => r.workDate === '2026-03-01')
)

const stats = computed(() => [
  {
    label: '本日の出勤者数',
    value: todayRecords.value.filter(r => r.status === 'WORKING' || r.status === 'ON_BREAK').length + '名',
    sub: '全シフト ' + todayRecords.value.length + '名',
    icon: 'mdi-account-multiple',
    color: 'success',
    valueColor: '#4bd08b',
  },
  {
    label: '今月のシフト登録数',
    value: currentBoard.entries.length + '件',
    sub: 'DRAFT ボード',
    icon: 'mdi-calendar-check',
    color: 'primary',
    valueColor: '#3587dc',
  },
  {
    label: '未承認の勤怠',
    value: attendanceRecords.filter(r => r.status === 'COMPLETED').length + '件',
    sub: '要承認',
    icon: 'mdi-clock-alert-outline',
    color: 'warning',
    valueColor: '#f8c076',
  },
  {
    label: 'アクティブアラート',
    value: alerts.length + '件',
    sub: alerts.filter(a => a.level === 'critical').length + '件 重要',
    icon: 'mdi-alert-circle-outline',
    color: 'error',
    valueColor: '#e6273e',
  },
])

const quickActions = [
  { label: 'シフトボードを編集', to: '/shifts/board/board-2026-03', icon: 'mdi-table-edit', color: 'primary' },
  { label: 'シフト収集を確認', to: '/shifts/collections', icon: 'mdi-clipboard-list-outline', color: 'primary' },
  { label: '勤怠承認', to: '/attendance/approval', icon: 'mdi-check-circle-outline', color: 'success' },
  { label: '修正申請を確認', to: '/attendance/modifications', icon: 'mdi-pencil-outline', color: 'warning' },
  { label: 'スタッフ一覧', to: '/employees', icon: 'mdi-account-group-outline', color: 'default' },
  { label: 'レポート', to: '/reports', icon: 'mdi-chart-bar', color: 'default' },
]
</script>
