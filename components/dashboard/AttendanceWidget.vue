<template>
  <v-card rounded="xl" elevation="0" border>
    <v-card-title class="pa-4 pb-2 d-flex align-center ga-2">
      <v-icon color="primary" size="20">mdi-clock-check-outline</v-icon>
      <span class="text-subtitle-2 font-weight-bold">本日の勤怠状況</span>
    </v-card-title>
    <v-card-subtitle class="px-4 pb-3 text-caption">
      {{ today }} 現在
    </v-card-subtitle>

    <v-card-text class="px-4 pb-4">
      <div class="d-flex flex-column ga-3">
        <div
          v-for="item in statusItems"
          :key="item.status"
          class="d-flex align-center justify-space-between pa-3 rounded-lg"
          :style="{ background: item.bgColor }"
        >
          <div class="d-flex align-center ga-2">
            <v-icon :color="item.color" size="18">{{ item.icon }}</v-icon>
            <span class="text-body-2">{{ item.label }}</span>
          </div>
          <v-chip :color="item.color" size="small" variant="flat" class="font-weight-bold">
            {{ item.count }}名
          </v-chip>
        </div>
      </div>

      <v-divider class="my-3" />

      <div class="d-flex justify-space-between align-center">
        <span class="text-caption text-medium-emphasis">総シフト人数</span>
        <span class="text-body-2 font-weight-bold">{{ totalCount }}名</span>
      </div>
    </v-card-text>

    <v-card-actions class="px-4 pb-4 pt-0">
      <v-btn
        to="/attendance"
        variant="tonal"
        color="primary"
        size="small"
        block
        rounded="lg"
        append-icon="mdi-arrow-right"
      >
        勤怠一覧を見る
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script setup lang="ts">
import { useMockData } from '~/composables/useMockData'

const { attendanceRecords } = useMockData()

const today = new Date('2026-03-01').toLocaleDateString('ja-JP', {
  year: 'numeric', month: 'long', day: 'numeric',
})

const todayRecords = computed(() =>
  attendanceRecords.filter(r => r.workDate === '2026-03-01')
)

function countStatus(status: string) {
  return todayRecords.value.filter(r => r.status === status).length
}

const statusItems = computed(() => [
  {
    status: 'WORKING',
    label: '勤務中',
    count: countStatus('WORKING'),
    icon: 'mdi-account-clock',
    color: 'success',
    bgColor: '#F0FDF4',
  },
  {
    status: 'ON_BREAK',
    label: '休憩中',
    count: countStatus('ON_BREAK'),
    icon: 'mdi-coffee-outline',
    color: 'warning',
    bgColor: '#FFFBEB',
  },
  {
    status: 'NOT_STARTED',
    label: '未出勤',
    count: countStatus('NOT_STARTED'),
    icon: 'mdi-account-minus-outline',
    color: 'default',
    bgColor: '#F9FAFB',
  },
  {
    status: 'COMPLETED',
    label: '退勤済み',
    count: countStatus('COMPLETED'),
    icon: 'mdi-account-check-outline',
    color: 'primary',
    bgColor: '#EBF3FC',
  },
])

const totalCount = computed(() => todayRecords.value.length)
</script>
