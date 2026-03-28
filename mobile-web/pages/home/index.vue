<template>
  <div class="home-page">

    <!-- Greeting row -->
    <div class="home-greeting">
      <div>
        <div class="greeting-sub">{{ greeting }}</div>
        <div class="greeting-name">{{ employeeName }} さん</div>
      </div>
      <div class="greeting-right">
        <div class="greeting-date">
          <div class="greeting-date__day">{{ dateDay }}</div>
          <div class="greeting-date__label">{{ dateMonthLabel }}</div>
        </div>
        <v-btn icon variant="text" size="small" @click="navigateTo('/notifications')">
          <v-badge
            v-if="appStore.unreadCount > 0"
            :content="appStore.unreadCount"
            color="error"
            floating
          >
            <v-icon size="22">mdi-bell-outline</v-icon>
          </v-badge>
          <v-icon v-else size="22">mdi-bell-outline</v-icon>
        </v-btn>
      </div>
    </div>

    <!-- Clock hero -->
    <div class="home-section">
      <ClockStatusCard
        :status="clockStore.status"
        :check-in-time="clockStore.checkInTime"
        :break-minutes="clockStore.breakMinutes"
        :today-shift="todayShift"
        @punch="doPunch"
      />
    </div>

    <!-- Shift collection CTA — only when collecting -->
    <div v-if="collection" class="home-section">
      <div class="collection-cta" @click="navigateTo(`/shifts/collection/${collection.id}`)">
        <div class="collection-cta__left">
          <div class="collection-cta__icon">
            <v-icon color="white" size="20">mdi-calendar-edit-outline</v-icon>
          </div>
          <div>
            <div class="collection-cta__month">{{ collection.monthLabel }}</div>
            <div class="collection-cta__sub">希望シフトの提出をお願いします</div>
          </div>
        </div>
        <div class="collection-cta__right">
          <div class="collection-cta__deadline" :class="collection.urgent ? 'deadline--urgent' : 'deadline--normal'">
            あと{{ collection.daysLeft }}日
          </div>
          <v-icon size="18" color="#3587dc">mdi-chevron-right</v-icon>
        </div>
      </div>
    </div>

    <!-- Next shift -->
    <div class="home-section">
      <div class="section-label">次のシフト</div>
      <div v-if="nextShift" class="next-shift-card" @click="navigateTo(`/shifts/${nextShift.id}`)">
        <div class="next-shift-card__when">
          <span class="when-badge" :class="nextShift.whenClass">{{ nextShift.whenLabel }}</span>
          <span class="when-date">{{ nextShift.dateLabel }}</span>
        </div>
        <div class="next-shift-card__time">{{ nextShift.startTime }}〜{{ nextShift.endTime }}</div>
        <div class="next-shift-card__footer">
          <span class="dept-chip">{{ nextShift.department }}</span>
          <span class="duration-label">{{ nextShift.durationLabel }}</span>
          <button class="calendar-link" @click.stop="navigateTo('/shifts')">
            <v-icon size="14">mdi-calendar-outline</v-icon>
            カレンダーを見る
          </button>
        </div>
      </div>
      <div v-else class="empty-card">
        <v-icon size="32" color="grey-lighten-2">mdi-calendar-blank-outline</v-icon>
        <div class="text-body-2 text-grey mt-1">予定されているシフトはありません</div>
      </div>
    </div>

    <!-- Monthly hours (compact single card) -->
    <div class="home-section">
      <div class="hours-card">
        <div class="hours-card__header">
          <span class="text-body-2 text-grey">今月の勤務時間</span>
          <span class="hours-card__total">{{ monthTotalLabel }}
            <span class="text-caption text-grey"> / {{ maxHoursLabel }}</span>
          </span>
        </div>
        <v-progress-linear
          :model-value="monthProgress"
          color="primary"
          height="6"
          rounded="pill"
          bg-color="#e3f0fb"
          class="mt-2"
        />
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import type { PunchType } from '~/types'

const { loggedInEmployee, getMonthTotalMinutes, formatMinutes } = useMockData()
const authStore = useAuthStore()
const appStore = useAppStore()
const clockStore = useClockStore()
const shiftStore = useShiftStore()
const timeNow = useTimeNow()

onMounted(() => {
  clockStore.checkNewDay(timeNow.todayStr.value)
})

const employeeName = computed(() => (authStore.currentEmployee ?? loggedInEmployee.value)?.name ?? 'スタッフ')
const employee = computed(() => authStore.currentEmployee ?? loggedInEmployee.value)

const greeting = computed(() => {
  const h = timeNow.now.value.getHours()
  if (h < 12) return 'おはようございます'
  if (h < 17) return 'こんにちは'
  return 'おつかれさまです'
})

const DOW = ['日', '月', '火', '水', '木', '金', '土']
const dateDay = computed(() => {
  const d = timeNow.now.value
  return `${d.getDate()}`
})
const dateMonthLabel = computed(() => {
  const d = timeNow.now.value
  return `${d.getMonth() + 1}月 ${DOW[d.getDay()]}曜日`
})

// ── Today's shift (for clock hero) ───────────────────────────────
const todayShift = computed(() => shiftStore.getShiftForDate(timeNow.todayStr.value))

// ── Shift collection CTA ─────────────────────────────────────────
const collection = computed(() => {
  const c = shiftStore.collection
  if (!c || c.status !== 'COLLECTING') return null
  const deadline = new Date(c.deadline)
  const diffMs = deadline.getTime() - new Date().setHours(0, 0, 0, 0)
  const daysLeft = Math.max(0, Math.ceil(diffMs / 86400000))
  const mo = deadline.getMonth() + 1
  return {
    id: c.id,
    monthLabel: c.name.replace('シフト収集', '').trim(),
    daysLeft,
    urgent: daysLeft <= 3,
  }
})

// ── Next shift ───────────────────────────────────────────────────
function shiftDurationLabel(start: string, end: string) {
  const [sh, sm] = start.split(':').map(Number)
  const [eh, em] = end.split(':').map(Number)
  const mins = (eh * 60 + em) - (sh * 60 + sm)
  if (mins <= 0) return ''
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return m > 0 ? `${h}時間${m}分` : `${h}時間`
}

function formatShiftDate(dateStr: string) {
  const d = new Date(dateStr)
  return `${d.getMonth() + 1}/${d.getDate()} (${DOW[d.getDay()]})`
}

function whenLabel(dateStr: string): { label: string; cls: string } {
  const today = timeNow.todayStr.value
  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10)
  const dayAfter = new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10)
  if (dateStr === today)     return { label: '今日',   cls: 'when--today' }
  if (dateStr === tomorrow)  return { label: '明日',   cls: 'when--tomorrow' }
  if (dateStr === dayAfter)  return { label: '明後日', cls: 'when--soon' }
  return { label: formatShiftDate(dateStr), cls: 'when--future' }
}

const allFuture = computed(() =>
  shiftStore.entries
    .filter((e) => e.date >= timeNow.todayStr.value && e.cellStatus !== 'DAY_OFF_CONFIRMED')
    .sort((a, b) => a.date.localeCompare(b.date))
)

const nextShift = computed(() => {
  const s = allFuture.value[0]
  if (!s) return null
  const { label, cls } = whenLabel(s.date)
  return {
    ...s,
    whenLabel: label,
    whenClass: cls,
    dateLabel: formatShiftDate(s.date),
    durationLabel: shiftDurationLabel(s.startTime, s.endTime),
  }
})


// ── Monthly hours ────────────────────────────────────────────────
const maxHours = computed(() => employee.value?.employmentType === 'FULL_TIME' ? 176 : 120)
const maxHoursLabel = computed(() => `${maxHours.value}h`)
const now = new Date()
const monthTotalMinutes = computed(() => getMonthTotalMinutes(now.getFullYear(), now.getMonth() + 1))
const monthTotalLabel = computed(() => formatMinutes(monthTotalMinutes.value))
const monthProgress = computed(() => Math.min(100, (monthTotalMinutes.value / (maxHours.value * 60)) * 100))

// ── Punch ────────────────────────────────────────────────────────
function doPunch(type: string) {
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
.home-page {
  padding: 16px 16px 8px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* ── Greeting ─────────────────────────────────────────────────── */
.home-greeting {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.greeting-sub  { font-size: 12px; color: #9e9e9e; }
.greeting-name { font-size: 17px; font-weight: 700; color: #1a1a1a; margin-top: 2px; }
.greeting-right { display: flex; align-items: center; gap: 4px; }
.greeting-date { text-align: right; }
.greeting-date__day   { font-size: 28px; font-weight: 700; color: #1a1a1a; line-height: 1; }
.greeting-date__label { font-size: 11px; color: #9e9e9e; margin-top: 2px; }

/* ── Section wrapper ──────────────────────────────────────────── */
.home-section { display: flex; flex-direction: column; gap: 8px; }
.section-label { font-size: 12px; font-weight: 700; color: #757575; letter-spacing: 0.5px; text-transform: uppercase; }

/* ── Collection CTA ───────────────────────────────────────────── */
.collection-cta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #EBF3FC;
  border: 1.5px solid #3587dc;
  border-radius: 16px;
  padding: 14px 16px;
  cursor: pointer;
  transition: background 0.15s;
}
.collection-cta:active { background: #dbeaf8; }
.collection-cta__left  { display: flex; align-items: center; gap: 12px; }
.collection-cta__icon  {
  width: 36px; height: 36px; border-radius: 10px;
  background: #3587dc;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.collection-cta__month { font-size: 14px; font-weight: 700; color: #1a1a1a; }
.collection-cta__sub   { font-size: 12px; color: #757575; margin-top: 2px; }
.collection-cta__right { display: flex; align-items: center; gap: 4px; }
.collection-cta__deadline { font-size: 13px; font-weight: 700; }
.deadline--urgent  { color: #e6273e; }
.deadline--normal  { color: #3587dc; }

/* ── Next shift card ──────────────────────────────────────────── */
.next-shift-card {
  background: #ffffff;
  border-radius: 16px;
  border: 1px solid #e8e8e8;
  padding: 16px;
  cursor: pointer;
  transition: box-shadow 0.15s;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
}
.next-shift-card:active { box-shadow: 0 1px 2px rgba(0,0,0,0.04); }

.next-shift-card__when {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}
.when-badge {
  font-size: 11px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 20px;
}
.when--today    { background: #fce4e7; color: #e6273e; }
.when--tomorrow { background: #e8f5e9; color: #2e7d32; }
.when--soon     { background: #fff3e0; color: #e65100; }
.when--future   { background: #f0f0f0; color: #757575; }
.when-date { font-size: 13px; color: #757575; }

.next-shift-card__time {
  font-size: 28px;
  font-weight: 700;
  color: #1a1a1a;
  letter-spacing: -0.5px;
  line-height: 1;
  margin-bottom: 10px;
}
.next-shift-card__footer {
  display: flex;
  align-items: center;
  gap: 8px;
}
.dept-chip {
  font-size: 12px;
  background: #f0f4ff;
  color: #3587dc;
  font-weight: 600;
  padding: 3px 10px;
  border-radius: 20px;
}
.duration-label {
  font-size: 12px;
  color: #9e9e9e;
  flex: 1;
}
.calendar-link {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 12px;
  font-weight: 600;
  color: #3587dc;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  white-space: nowrap;
}

.empty-card {
  background: #fff;
  border-radius: 16px;
  border: 1px solid #e8e8e8;
  padding: 28px 16px;
  text-align: center;
}

/* ── Monthly hours ────────────────────────────────────────────── */
.hours-card {
  background: #ffffff;
  border-radius: 16px;
  border: 1px solid #e8e8e8;
  padding: 14px 16px;
}
.hours-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.hours-card__total {
  font-size: 16px;
  font-weight: 700;
  color: #3587dc;
}
</style>
