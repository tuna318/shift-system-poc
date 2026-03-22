<template>
  <div class="pa-4">
    <!-- Collection banner -->
    <v-alert
      v-if="shiftStore.collection?.status === 'COLLECTING'"
      type="info"
      variant="tonal"
      density="compact"
      rounded="xl"
      class="mb-4 cursor-pointer"
      icon="mdi-calendar-clock"
      @click="navigateTo(`/shifts/collection/${shiftStore.collection!.id}`)"
    >
      <div class="d-flex align-center justify-space-between">
        <div>
          <div class="text-body-2 font-weight-medium">{{ shiftStore.collection!.name }}</div>
          <div class="text-caption">提出期限: {{ deadlineLabel }}</div>
        </div>
        <v-btn size="x-small" color="info" variant="flat" rounded="lg" @click.stop="navigateTo(`/shifts/collection/${shiftStore.collection!.id}`)">
          提出する
        </v-btn>
      </div>
    </v-alert>

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
            <span class="day-chip" :style="shiftChipStyle(day)">
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
    <div class="d-flex gap-3 mb-4 flex-wrap">
      <div class="d-flex align-center gap-1">
        <span style="width:10px;height:10px;border-radius:3px;background:#e3f0fb;display:inline-block;border:1px solid #3587dc;"></span>
        <span class="text-caption text-grey">確定シフト</span>
      </div>
      <div class="d-flex align-center gap-1">
        <span style="width:10px;height:10px;border-radius:3px;background:#FEF3C7;display:inline-block;border:1px solid #f8c076;"></span>
        <span class="text-caption text-grey">調整中</span>
      </div>
      <div class="d-flex align-center gap-1">
        <span style="width:10px;height:10px;border-radius:3px;background:#3587dc;display:inline-block;"></span>
        <span class="text-caption text-grey">第一希望</span>
      </div>
      <div class="d-flex align-center gap-1">
        <span style="width:10px;height:10px;border-radius:3px;background:#EBF3FC;display:inline-block;border:1px solid #3587dc;"></span>
        <span class="text-caption text-grey">出勤可能</span>
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
          <v-chip :color="cellStatusColor(selectedShift.cellStatus)" size="small" variant="tonal" class="mb-3">
            <v-icon start size="14">{{ cellStatusIcon(selectedShift.cellStatus) }}</v-icon>
            {{ cellStatusLabel(selectedShift.cellStatus) }}
          </v-chip>
          <div v-if="selectedShift.cellStatus === 'ADJUSTING'" class="text-caption text-warning mb-3">
            ⚠ 店長から調整依頼があります
          </div>
          <v-btn
            v-if="selectedShift.cellStatus === 'ADJUSTING'"
            color="warning"
            variant="tonal"
            rounded="lg"
            block
            class="mb-2"
            @click="bottomSheet = false; navigateTo(`/shifts/${selectedShift.id}`)"
          >
            調整依頼を確認する
          </v-btn>
        </template>
        <template v-else>
          <div class="text-body-2 text-grey">シフトはありません</div>
        </template>
        <v-btn block variant="outlined" rounded="lg" class="mt-3" @click="bottomSheet = false">
          閉じる
        </v-btn>
      </v-card>
    </v-bottom-sheet>
  </div>
</template>

<script setup lang="ts">
import type { ShiftEntry, ShiftPreference, CellStatus } from '~/types'

const shiftStore = useShiftStore()

const today = new Date()
const currentYear = ref(today.getFullYear())
const currentMonth = ref(today.getMonth() + 1)

const displayMonth = computed(() => `${currentYear.value}年${currentMonth.value}月`)

const dayHeaders = ['日', '月', '火', '水', '木', '金', '土']

const leadingBlanks = computed(() =>
  new Date(currentYear.value, currentMonth.value - 1, 1).getDay()
)

const daysInMonth = computed(() =>
  new Date(currentYear.value, currentMonth.value, 0).getDate()
)

function dateStr(day: number) {
  return `${currentYear.value}-${String(currentMonth.value).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function getShiftForDay(day: number): ShiftEntry | null {
  return shiftStore.getShiftForDate(dateStr(day))
}

function getPreferenceForDay(day: number): ShiftPreference | null {
  return shiftStore.getPreferenceForDate(dateStr(day))
}

function getDayClass(day: number) {
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
  const shift = getShiftForDay(day)
  return {
    'today-cell': dateStr(day) === todayStr,
    'adjusting-cell': shift?.cellStatus === 'ADJUSTING',
  }
}

function shiftChipStyle(day: number) {
  const shift = getShiftForDay(day)
  if (shift?.cellStatus === 'ADJUSTING') return 'background: #FEF3C7; color: #b45309;'
  return 'background: #e3f0fb; color: #3587dc;'
}

function isWeekend(day: number, targetDay: number) {
  return new Date(currentYear.value, currentMonth.value - 1, day).getDay() === targetDay
}

function prefLabel(day: number) {
  const p = getPreferenceForDay(day)
  if (!p) return ''
  return p.availability === 'PREFERRED' ? '★' : p.availability === 'AVAILABLE' ? '○' : '×'
}

function prefChipStyle(day: number) {
  const p = getPreferenceForDay(day)
  if (!p) return ''
  if (p.availability === 'PREFERRED') return 'background: #3587dc; color: white;'
  if (p.availability === 'AVAILABLE') return 'background: #EBF3FC; color: #3587dc;'
  return 'background: #F3F4F6; color: #9e9e9e;'
}

function cellStatusLabel(status?: CellStatus | null) {
  const m: Record<string, string> = {
    CONFIRMED: '確定済み', ADJUSTING: '調整中',
    SHIFT_REQUESTED: '希望提出済み', DAY_OFF_REQUESTED: '休み希望', DAY_OFF_CONFIRMED: '休み確定',
  }
  return m[status ?? 'CONFIRMED'] ?? '確定済み'
}

function cellStatusColor(status?: CellStatus | null) {
  const m: Record<string, string> = {
    CONFIRMED: 'success', ADJUSTING: 'warning', SHIFT_REQUESTED: 'primary',
    DAY_OFF_REQUESTED: 'grey', DAY_OFF_CONFIRMED: 'grey',
  }
  return m[status ?? 'CONFIRMED'] ?? 'success'
}

function cellStatusIcon(status?: CellStatus | null) {
  const m: Record<string, string> = {
    CONFIRMED: 'mdi-check-circle-outline', ADJUSTING: 'mdi-calendar-edit',
    SHIFT_REQUESTED: 'mdi-calendar-clock', DAY_OFF_REQUESTED: 'mdi-home-outline', DAY_OFF_CONFIRMED: 'mdi-home-check-outline',
  }
  return m[status ?? 'CONFIRMED'] ?? 'mdi-check-circle-outline'
}

function prevMonth() {
  if (currentMonth.value === 1) { currentMonth.value = 12; currentYear.value-- }
  else currentMonth.value--
}

function nextMonth() {
  if (currentMonth.value === 12) { currentMonth.value = 1; currentYear.value++ }
  else currentMonth.value++
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

const deadlineLabel = computed(() => {
  if (!shiftStore.collection) return ''
  const d = new Date(shiftStore.collection.deadline)
  return `${d.getMonth() + 1}月${d.getDate()}日`
})
</script>

<style scoped>
.today-cell {
  background: #e3f0fb;
  border-radius: 8px;
}
.adjusting-cell {
  background: #FEF9C3;
  border-radius: 8px;
}
.cursor-pointer { cursor: pointer; }
.gap-1 { gap: 4px; }
.gap-3 { gap: 12px; }
</style>
