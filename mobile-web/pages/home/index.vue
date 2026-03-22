<template>
  <div class="pa-4">
    <!-- Greeting (slim, not a card) -->
    <div class="d-flex align-center justify-space-between mb-3">
      <div>
        <div class="text-caption text-grey">{{ greeting }}</div>
        <div class="text-subtitle-1 font-weight-bold">{{ employeeName }} さん</div>
      </div>
      <div class="text-caption text-grey text-right">{{ todayLabel }}</div>
    </div>

    <!-- Clock hero — dominant element -->
    <ClockStatusCard
      :status="clockStore.status"
      :check-in-time="clockStore.checkInTime"
      :break-minutes="clockStore.breakMinutes"
      :today-shift="todayShift"
      class="mb-4"
      @punch="openConfirm"
    />

    <!-- Action banners (below clock, not above) -->
    <div v-if="actionBanners.length > 0" class="d-flex flex-column gap-2 mb-4">
      <v-alert
        v-for="banner in actionBanners"
        :key="banner.key"
        :type="banner.type"
        density="compact"
        rounded="xl"
        variant="tonal"
        :icon="banner.icon"
        class="cursor-pointer"
        @click="navigateTo(banner.route)"
      >
        <div class="d-flex align-center justify-space-between">
          <span class="text-body-2 font-weight-medium">{{ banner.text }}</span>
          <v-icon size="16">mdi-chevron-right</v-icon>
        </div>
      </v-alert>
    </div>

    <!-- Upcoming shifts -->
    <div class="text-subtitle-2 font-weight-bold text-grey-darken-2 mb-2">今後のシフト</div>
    <div class="d-flex flex-column gap-2 mb-4">
      <ShiftDayCard
        v-for="shift in upcomingShifts"
        :key="shift.id"
        :date="shift.date"
        :entry="shift"
        @click="navigateTo(`/shifts/${shift.id}`)"
      />
      <div v-if="upcomingShifts.length === 0" class="text-body-2 text-grey text-center py-2">
        今後のシフトはありません
      </div>
    </div>

    <!-- Monthly summary -->
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
        <div class="text-caption text-grey mt-1 text-right">上限: {{ maxHoursLabel }}</div>
      </v-card-text>
    </v-card>

    <!-- Quick actions -->
    <div class="d-flex gap-2">
      <v-btn
        variant="outlined"
        rounded="lg"
        class="flex-1-1"
        prepend-icon="mdi-calendar-plus"
        @click="navigateTo('/shifts/submit')"
      >
        希望提出
      </v-btn>
      <v-btn
        variant="outlined"
        rounded="lg"
        class="flex-1-1"
        prepend-icon="mdi-swap-horizontal"
        @click="navigateTo('/substitutions/new')"
      >
        代打依頼
      </v-btn>
    </div>

  </div>
</template>

<script setup lang="ts">
import type { CellStatus, PunchType } from '~/types'

const { loggedInEmployee, getMonthTotalMinutes, formatMinutes } = useMockData()
const authStore = useAuthStore()
const appStore = useAppStore()
const clockStore = useClockStore()
const shiftStore = useShiftStore()
const substitutionStore = useSubstitutionStore()
const messageStore = useMessageStore()
const timeNow = useTimeNow()

onMounted(() => {
  clockStore.checkNewDay(timeNow.todayStr.value)
})

const employeeName = computed(() => {
  const emp = authStore.currentEmployee ?? loggedInEmployee.value
  return emp?.name ?? 'スタッフ'
})

const employee = computed(() => authStore.currentEmployee ?? loggedInEmployee.value)

const greeting = computed(() => {
  const h = timeNow.now.value.getHours()
  if (h < 12) return 'おはようございます'
  if (h < 17) return 'こんにちは'
  return 'おつかれさまです'
})

const todayLabel = computed(() => {
  const d = timeNow.now.value
  const dow = ['日', '月', '火', '水', '木', '金', '土']
  return `${d.getMonth() + 1}月${d.getDate()}日 (${dow[d.getDay()]})`
})

const todayShift = computed(() => shiftStore.getShiftForDate(timeNow.todayStr.value))
const upcomingShifts = computed(() =>
  shiftStore.entries
    .filter((e) => e.date > timeNow.todayStr.value)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 3)
)

const now = new Date()
const maxHours = computed(() => employee.value?.employmentType === 'FULL_TIME' ? 176 : 120)
const maxHoursLabel = computed(() => `${maxHours.value}時間`)
const monthTotalMinutes = computed(() => getMonthTotalMinutes(now.getFullYear(), now.getMonth() + 1))
const monthTotalLabel = computed(() => formatMinutes(monthTotalMinutes.value))
const monthProgress = computed(() => Math.min(100, (monthTotalMinutes.value / (maxHours.value * 60)) * 100))

// Action banners
const actionBanners = computed(() => {
  const banners: Array<{ key: string; type: 'warning' | 'info' | 'error'; icon: string; text: string; route: string }> = []

  if (shiftStore.adjustingEntries.length > 0) {
    banners.push({
      key: 'adjusting',
      type: 'warning',
      icon: 'mdi-calendar-edit',
      text: `シフト調整依頼があります (${shiftStore.adjustingEntries.length}件)`,
      route: `/shifts/${shiftStore.adjustingEntries[0].id}`,
    })
  }

  if (substitutionStore.pendingReceived.length > 0) {
    banners.push({
      key: 'substitution',
      type: 'warning',
      icon: 'mdi-account-switch-outline',
      text: `代打依頼が届いています (${substitutionStore.pendingReceived.length}件)`,
      route: '/substitutions',
    })
  }

  if (shiftStore.collection?.status === 'COLLECTING') {
    const deadline = new Date(shiftStore.collection.deadline)
    const mo = deadline.getMonth() + 1
    const da = deadline.getDate()
    banners.push({
      key: 'collection',
      type: 'info',
      icon: 'mdi-calendar-clock',
      text: `${shiftStore.collection.name.replace(' シフト収集', '')}の希望提出期限: ${mo}/${da}まで`,
      route: `/shifts/collection/${shiftStore.collection.id}`,
    })
  }

  if (messageStore.pendingAdjustments.length > 0) {
    banners.push({
      key: 'chat',
      type: 'warning',
      icon: 'mdi-message-alert-outline',
      text: `店長からメッセージが届いています`,
      route: '/chat/emp-003',
    })
  }

  return banners
})

function openConfirm(type: string) {
  const result = clockStore.punch(type as PunchType, timeNow.now.value)
  if (!result.success) {
    appStore.showSnackbar('5分以内に同じ打刻が行われました', 'error')
    return
  }
  const labels: Record<string, string> = {
    CHECK_IN: '出勤しました', CHECK_OUT: '退勤しました',
    BREAK_START: '休憩を開始しました', BREAK_END: '休憩を終了しました',
  }
  appStore.showSnackbar(labels[type] ?? '打刻しました', 'success')
}
</script>

<style scoped>
.gap-2 { gap: 8px; }
.cursor-pointer { cursor: pointer; }
</style>
