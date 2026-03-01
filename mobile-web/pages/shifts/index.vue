<template>
  <div class="pa-4">
    <!-- Month navigation -->
    <div class="d-flex align-center justify-space-between mb-4">
      <v-btn icon="mdi-chevron-left" variant="text" size="small" @click="prevMonth" />
      <span class="text-subtitle-1 font-weight-bold">{{ displayMonth }}</span>
      <v-btn icon="mdi-chevron-right" variant="text" size="small" @click="nextMonth" />
    </div>

    <!-- Calendar -->
    <v-card rounded="xl" elevation="0" variant="outlined" class="mb-4 overflow-hidden">
      <div class="shift-calendar pa-3">
        <!-- Day headers -->
        <div v-for="d in dayHeaders" :key="d" class="cal-header" :class="{ 'text-error': d === '日', 'text-primary': d === '土' }">
          {{ d }}
        </div>

        <!-- Empty leading cells -->
        <div v-for="n in leadingBlanks" :key="`blank-${n}`" />

        <!-- Day cells -->
        <div
          v-for="day in daysInMonth"
          :key="day"
          class="cal-day"
          :class="getDayClass(day)"
          @click="selectDay(day)"
        >
          <span class="day-num" :class="{ 'text-error': isWeekend(day, 0), 'text-primary': isWeekend(day, 6) }">
            {{ day }}
          </span>
          <template v-if="getShiftForDay(day)">
            <span class="day-chip" style="background: #e3f0fb; color: #3587dc;">
              {{ getShiftForDay(day)!.startTime.slice(0, 5) }}
            </span>
          </template>
          <template v-else-if="getPreferenceForDay(day)">
            <span class="day-chip" :style="prefChipStyle(day)">
              {{ prefLabel(day) }}
            </span>
          </template>
        </div>
      </div>
    </v-card>

    <!-- Legend -->
    <div class="d-flex gap-4 mb-4 flex-wrap">
      <div class="d-flex align-center gap-1">
        <span style="width:10px;height:10px;border-radius:3px;background:#e3f0fb;display:inline-block;border:1px solid #3587dc;"></span>
        <span class="text-caption text-grey">確定シフト</span>
      </div>
      <div class="d-flex align-center gap-1">
        <span style="width:10px;height:10px;border-radius:3px;background:#fff8e1;display:inline-block;border:1px solid #f8c076;"></span>
        <span class="text-caption text-grey">希望提出済み</span>
      </div>
    </div>

    <!-- Submit preference FAB area -->
    <div class="text-center">
      <v-btn
        color="primary"
        rounded="xl"
        size="large"
        prepend-icon="mdi-calendar-plus"
        @click="navigateTo('/shifts/submit')"
      >
        希望シフトを提出する
      </v-btn>
    </div>

    <!-- Day detail bottom sheet -->
    <v-bottom-sheet v-model="bottomSheet">
      <v-card rounded="t-xl" class="pa-4">
        <div class="text-subtitle-1 font-weight-bold mb-3">{{ selectedDayLabel }}</div>
        <template v-if="selectedShift">
          <div class="d-flex align-center gap-3 mb-3">
            <v-icon color="primary">mdi-clock-outline</v-icon>
            <div>
              <div class="text-body-1 font-weight-bold">{{ selectedShift.startTime }} 〜 {{ selectedShift.endTime }}</div>
              <div class="text-caption text-grey">{{ selectedShift.department }}</div>
            </div>
          </div>
          <v-chip color="success" size="small" variant="tonal">
            <v-icon start size="14">mdi-check-circle</v-icon>
            確定済み
          </v-chip>
        </template>
        <template v-else>
          <div class="text-body-2 text-grey">シフトはありません</div>
        </template>
        <v-btn block variant="outlined" rounded="lg" class="mt-4" @click="bottomSheet = false">
          閉じる
        </v-btn>
      </v-card>
    </v-bottom-sheet>
  </div>
</template>

<script setup lang="ts">
import type { ShiftEntry, ShiftPreference } from '~/types'

const { myShifts, myPreferences, getShiftForDate, getPreferenceForDate } = useMockData()

const today = new Date('2026-03-01')
const currentYear = ref(today.getFullYear())
const currentMonth = ref(today.getMonth() + 1)

const displayMonth = computed(() => `${currentYear.value}年${currentMonth.value}月`)

const dayHeaders = ['日', '月', '火', '水', '木', '金', '土']

const leadingBlanks = computed(() => {
  const firstDay = new Date(currentYear.value, currentMonth.value - 1, 1).getDay()
  return firstDay
})

const daysInMonth = computed(() => {
  return new Date(currentYear.value, currentMonth.value, 0).getDate()
})

function dateStr(day: number) {
  return `${currentYear.value}-${String(currentMonth.value).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function getShiftForDay(day: number): ShiftEntry | null {
  return getShiftForDate(dateStr(day))
}

function getPreferenceForDay(day: number): ShiftPreference | null {
  return getPreferenceForDate(dateStr(day))
}

function getDayClass(day: number) {
  const today2 = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
  return {
    'today-cell': dateStr(day) === today2,
  }
}

function isWeekend(day: number, targetDay: number) {
  const d = new Date(currentYear.value, currentMonth.value - 1, day)
  return d.getDay() === targetDay
}

function prefLabel(day: number) {
  const p = getPreferenceForDay(day)
  if (!p) return ''
  return p.type === 'WORK' ? '希望' : '休み'
}

function prefChipStyle(day: number) {
  const p = getPreferenceForDay(day)
  if (!p) return ''
  return p.type === 'WORK'
    ? 'background: #fff8e1; color: #f57c00;'
    : 'background: #f5f5f5; color: #9e9e9e;'
}

function prevMonth() {
  if (currentMonth.value === 1) {
    currentMonth.value = 12
    currentYear.value--
  } else {
    currentMonth.value--
  }
}

function nextMonth() {
  if (currentMonth.value === 12) {
    currentMonth.value = 1
    currentYear.value++
  } else {
    currentMonth.value++
  }
}

const bottomSheet = ref(false)
const selectedDay = ref<number | null>(null)

const selectedDayLabel = computed(() => {
  if (!selectedDay.value) return ''
  const d = new Date(currentYear.value, currentMonth.value - 1, selectedDay.value)
  const dow = ['日', '月', '火', '水', '木', '金', '土']
  return `${currentMonth.value}月${selectedDay.value}日 (${dow[d.getDay()]})`
})

const selectedShift = computed((): ShiftEntry | null => {
  if (!selectedDay.value) return null
  return getShiftForDay(selectedDay.value)
})

function selectDay(day: number) {
  selectedDay.value = day
  bottomSheet.value = true
}
</script>

<style scoped>
.today-cell {
  background: #e3f0fb;
  border-radius: 8px;
}
.gap-1 { gap: 4px; }
.gap-3 { gap: 12px; }
.gap-4 { gap: 16px; }
</style>
