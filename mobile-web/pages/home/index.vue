<template>
  <div class="pa-4">
    <!-- Greeting card -->
    <v-card rounded="xl" color="primary" class="mb-4" elevation="2">
      <v-card-text class="pa-4">
        <div class="text-white" style="opacity: 0.85; font-size: 13px;">
          {{ greeting }}
        </div>
        <div class="text-h6 font-weight-bold text-white mt-1">
          {{ employeeName }} さん
        </div>
        <div class="text-white mt-1" style="opacity: 0.7; font-size: 13px;">
          {{ todayLabel }}
        </div>
      </v-card-text>
    </v-card>

    <!-- Clock status (quick punch) -->
    <div class="text-subtitle-2 font-weight-bold text-grey-darken-2 mb-2">打刻状況</div>
    <ClockStatusCard
      :status="punchStatus.status"
      :check-in-time="punchStatus.checkInTime"
      :break-minutes="punchStatus.breakMinutes"
      class="mb-4"
      @action="handleQuickAction"
    />

    <!-- Today's shift -->
    <div class="text-subtitle-2 font-weight-bold text-grey-darken-2 mb-2">本日のシフト</div>
    <v-card rounded="xl" elevation="0" variant="outlined" class="mb-4">
      <v-card-text class="pa-4">
        <template v-if="todayShift">
          <div class="d-flex align-center justify-space-between">
            <div>
              <div class="text-h6 font-weight-bold">
                {{ todayShift.startTime }} 〜 {{ todayShift.endTime }}
              </div>
              <div class="text-body-2 text-grey mt-1">{{ todayShift.department }}</div>
            </div>
            <v-chip color="success" size="small" variant="tonal">
              <v-icon start size="14">mdi-check-circle-outline</v-icon>
              確定済み
            </v-chip>
          </div>
        </template>
        <template v-else>
          <div class="text-body-2 text-grey text-center py-2">本日のシフトはありません</div>
        </template>
      </v-card-text>
    </v-card>

    <!-- Upcoming shifts -->
    <div class="text-subtitle-2 font-weight-bold text-grey-darken-2 mb-2">今後のシフト</div>
    <div class="d-flex flex-column gap-2 mb-4">
      <ShiftDayCard
        v-for="shift in upcomingShifts"
        :key="shift.id"
        :date="shift.date"
        :entry="shift"
      />
      <div v-if="upcomingShifts.length === 0" class="text-body-2 text-grey text-center py-2">
        今後のシフトはありません
      </div>
    </div>

    <!-- Alerts -->
    <div v-if="hasAlerts" class="mb-4">
      <div class="text-subtitle-2 font-weight-bold text-grey-darken-2 mb-2">お知らせ</div>
      <v-alert type="warning" density="compact" rounded="lg" variant="tonal">
        <div class="text-body-2">修正依頼が届いています。勤怠履歴を確認してください。</div>
        <template #append>
          <v-btn size="x-small" color="warning" variant="text" @click="navigateTo('/attendance')">
            確認する
          </v-btn>
        </template>
      </v-alert>
    </div>

    <!-- Weekly summary -->
    <div class="text-subtitle-2 font-weight-bold text-grey-darken-2 mb-2">今週の勤務</div>
    <v-card rounded="xl" elevation="0" variant="outlined" class="mb-4">
      <v-card-text class="pa-4">
        <div class="d-flex justify-space-between align-center mb-2">
          <span class="text-body-2 text-grey">今月の勤務時間</span>
          <span class="text-h6 font-weight-bold text-primary">{{ monthTotalLabel }}</span>
        </div>
        <v-progress-linear
          :model-value="monthProgress"
          color="primary"
          height="8"
          rounded="pill"
          bg-color="#e3f0fb"
        />
        <div class="text-caption text-grey mt-1 text-right">目標: 80時間</div>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup lang="ts">
const { loggedInEmployee, currentPunchStatus, getShiftForDate, getUpcomingShifts, getMonthTotalMinutes, formatMinutes } = useMockData()
const authStore = useAuthStore()
const appStore = useAppStore()

const today = '2026-03-01'
const punchStatus = currentPunchStatus

const employeeName = computed(() => {
  const emp = authStore.currentEmployee ?? loggedInEmployee.value
  return emp?.name ?? 'スタッフ'
})

const greeting = computed(() => {
  const h = 9 // fixed for prototype
  if (h < 12) return 'おはようございます'
  if (h < 17) return 'こんにちは'
  return 'おつかれさまです'
})

const todayLabel = computed(() => {
  const d = new Date(today)
  const dow = ['日', '月', '火', '水', '木', '金', '土']
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 (${dow[d.getDay()]})`
})

const todayShift = computed(() => getShiftForDate(today))
const upcomingShifts = computed(() => getUpcomingShifts(today, 3))

const hasAlerts = computed(() =>
  punchStatus.value.status === 'COMPLETED' &&
  appStore.unreadCount > 0
)

const monthTotalLabel = computed(() => formatMinutes(getMonthTotalMinutes(2026, 3)))
const monthProgress = computed(() => Math.min(100, (getMonthTotalMinutes(2026, 3) / (80 * 60)) * 100))

function handleQuickAction(_type: string) {
  navigateTo('/clock')
}
</script>

<style scoped>
.gap-2 { gap: 8px; }
</style>
