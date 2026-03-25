<template>
  <div class="collection-page">

    <!-- Header info -->
    <div class="coll-header">
      <div class="coll-header__left">
        <div class="coll-header__month">{{ displayMonth }}</div>
        <div class="coll-header__deadline" :class="daysLeft <= 3 ? 'deadline--urgent' : 'deadline--normal'">
          提出期限: {{ deadlineLabel }}（あと{{ daysLeft }}日）
        </div>
      </div>
      <!-- Slot legend -->
      <div class="coll-header__legend">
        <div v-for="slot in slots" :key="slot.id" class="legend-item">
          <span class="legend-dot" :style="{ background: slot.color }" />
          <span>{{ slot.label }}</span>
        </div>
      </div>
    </div>

    <!-- Calendar -->
    <div class="cal-grid">
      <div v-for="d in DAY_HEADERS" :key="d" class="cal-col-header"
        :class="{ 'col-sun': d === '日', 'col-sat': d === '土' }">{{ d }}</div>
      <div v-for="n in leadingBlanks" :key="`b${n}`" />
      <div
        v-for="day in daysInMonth"
        :key="day"
        class="cal-cell"
        :class="cellClass(day)"
        @click="openSheet(day)"
      >
        <span class="cal-cell__num" :class="{ 'num-sun': isSun(day), 'num-sat': isSat(day) }">{{ day }}</span>
        <div class="cal-cell__dots">
          <span
            v-for="slot in slotsForDay(day)"
            :key="slot.id"
            class="slot-dot"
            :style="dotStyle(day, slot)"
          />
        </div>
      </div>
    </div>

    <!-- Progress bar -->
    <div class="progress-section">
      <div class="progress-section__labels">
        <span class="text-body-2 font-weight-medium">入力済み</span>
        <span class="text-body-2 font-weight-bold text-primary">{{ filledCount }} / {{ totalSlots }} 枠</span>
      </div>
      <v-progress-linear
        :model-value="progress"
        color="primary"
        height="6"
        rounded="pill"
        bg-color="#e3f0fb"
        class="mt-1"
      />
      <div class="progress-section__stats">
        <span class="stat-chip stat-preferred">★ {{ preferredCount }}</span>
        <span class="stat-chip stat-available">○ {{ availableCount }}</span>
        <span class="stat-chip stat-unavailable">× {{ unavailableCount }}</span>
      </div>
    </div>

    <!-- Submit -->
    <div class="submit-area">
      <v-btn
        block
        color="primary"
        size="large"
        rounded="xl"
        :disabled="filledCount === 0 || submitted"
        @click="doSubmit"
      >
        <v-icon start>mdi-send</v-icon>
        {{ submitted ? '提出済み' : '提出する' }}
      </v-btn>
    </div>

    <!-- Day bottom sheet -->
    <v-bottom-sheet v-model="sheet" max-height="80vh">
      <v-card rounded="t-xl">
        <div class="sheet-handle" />
        <div class="sheet-content">
          <div class="sheet-title">{{ sheetDayLabel }}</div>

          <div v-if="sheetSlots.length === 0" class="text-body-2 text-grey text-center py-4">
            この日はシフトがありません
          </div>

          <div v-for="slot in sheetSlots" :key="slot.id" class="slot-row">
            <div class="slot-row__info">
              <span class="slot-badge" :style="{ background: slot.color + '22', color: slot.color, borderColor: slot.color }">
                {{ slot.label }}
              </span>
              <span class="slot-time">{{ slot.startTime }}〜{{ slot.endTime }}</span>
            </div>
            <div class="slot-choices">
              <button
                v-for="choice in CHOICES"
                :key="choice.value"
                class="choice-btn"
                :class="{ 'choice-btn--active': getSlotPref(sheetDay!, slot.id) === choice.value }"
                :style="choiceBtnStyle(choice.value, getSlotPref(sheetDay!, slot.id) === choice.value)"
                @click="setSlotPref(sheetDay!, slot.id, choice.value)"
              >
                {{ choice.label }}
              </button>
              <button
                v-if="getSlotPref(sheetDay!, slot.id)"
                class="choice-btn choice-btn--clear"
                @click="clearSlotPref(sheetDay!, slot.id)"
              >
                <v-icon size="14">mdi-close</v-icon>
              </button>
            </div>
          </div>

          <v-btn block variant="outlined" rounded="lg" class="mt-4" @click="sheet = false">
            閉じる
          </v-btn>
        </div>
      </v-card>
    </v-bottom-sheet>
  </div>
</template>

<script setup lang="ts">
import type { PreferenceAvailability, ShiftSlot } from '~/types'

const route = useRoute()
const shiftStore = useShiftStore()
const appStore = useAppStore()

const collectionId = computed(() => route.params.id as string)
const collection = computed(() => shiftStore.collection?.id === collectionId.value ? shiftStore.collection : null)

const periodDate = computed(() => {
  const d = new Date(collection.value?.periodStart ?? '2026-04-01')
  return { year: d.getFullYear(), month: d.getMonth() + 1 }
})

const displayMonth = computed(() => `${periodDate.value.year}年${periodDate.value.month}月`)

const deadlineLabel = computed(() => {
  if (!collection.value) return ''
  const d = new Date(collection.value.deadline)
  return `${d.getMonth() + 1}月${d.getDate()}日`
})

const daysLeft = computed(() => {
  if (!collection.value) return 0
  const diff = new Date(collection.value.deadline).getTime() - new Date().setHours(0, 0, 0, 0)
  return Math.max(0, Math.ceil(diff / 86400000))
})

// ── Slots & assignments ─────────────────────────────────────────
const slots = computed<ShiftSlot[]>(() => collection.value?.allocationSetup?.slots ?? [])
const assignments = computed(() => collection.value?.allocationSetup?.assignments ?? [])

function slotsForDay(day: number): ShiftSlot[] {
  const date = dateStr(day)
  const assignment = assignments.value.find(a => a.date === date)
  if (!assignment) return []
  return assignment.slotIds.map(id => slots.value.find(s => s.id === id)!).filter(Boolean)
}

// ── Calendar helpers ────────────────────────────────────────────
const DAY_HEADERS = ['日', '月', '火', '水', '木', '金', '土']

const leadingBlanks = computed(() =>
  new Date(periodDate.value.year, periodDate.value.month - 1, 1).getDay()
)
const daysInMonth = computed(() =>
  new Date(periodDate.value.year, periodDate.value.month, 0).getDate()
)

function dateStr(day: number) {
  return `${periodDate.value.year}-${String(periodDate.value.month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function isSun(day: number) { return new Date(periodDate.value.year, periodDate.value.month - 1, day).getDay() === 0 }
function isSat(day: number) { return new Date(periodDate.value.year, periodDate.value.month - 1, day).getDay() === 6 }

function cellClass(day: number) {
  const hasSlots = slotsForDay(day).length > 0
  return { 'cal-cell--no-slots': !hasSlots }
}

// ── Preferences (keyed by `date__slotId`) ──────────────────────
const slotPrefs = ref(new Map<string, PreferenceAvailability>())
const prefKey = (date: string, slotId: string) => `${date}__${slotId}`

function getSlotPref(day: number, slotId: string): PreferenceAvailability | undefined {
  return slotPrefs.value.get(prefKey(dateStr(day), slotId))
}

function setSlotPref(day: number, slotId: string, val: PreferenceAvailability) {
  slotPrefs.value = new Map(slotPrefs.value.set(prefKey(dateStr(day), slotId), val))
}

function clearSlotPref(day: number, slotId: string) {
  const m = new Map(slotPrefs.value)
  m.delete(prefKey(dateStr(day), slotId))
  slotPrefs.value = m
}

// ── Dot styling ─────────────────────────────────────────────────
function dotStyle(day: number, slot: ShiftSlot) {
  const pref = getSlotPref(day, slot.id)
  if (!pref) return `border: 1.5px solid ${slot.color}44; background: transparent;`
  if (pref === 'PREFERRED') return `background: ${slot.color};`
  if (pref === 'AVAILABLE') return `background: ${slot.color}55;`
  return `background: #ccc;`
}

// ── Stats ───────────────────────────────────────────────────────
const totalSlots = computed(() => assignments.value.reduce((s, a) => s + a.slotIds.length, 0))
const filledCount = computed(() => slotPrefs.value.size)
const preferredCount = computed(() => [...slotPrefs.value.values()].filter(v => v === 'PREFERRED').length)
const availableCount = computed(() => [...slotPrefs.value.values()].filter(v => v === 'AVAILABLE').length)
const unavailableCount = computed(() => [...slotPrefs.value.values()].filter(v => v === 'UNAVAILABLE').length)
const progress = computed(() => totalSlots.value ? (filledCount.value / totalSlots.value) * 100 : 0)

// ── Choice buttons ──────────────────────────────────────────────
const CHOICES: { value: PreferenceAvailability; label: string; color: string }[] = [
  { value: 'PREFERRED',  label: '★ 第一希望', color: '#3587dc' },
  { value: 'AVAILABLE',  label: '○ 出勤可能', color: '#4bd08b' },
  { value: 'UNAVAILABLE',label: '× 休み希望', color: '#9e9e9e' },
]

function choiceBtnStyle(val: PreferenceAvailability, active: boolean) {
  const c = CHOICES.find(x => x.value === val)!
  if (active) return `background: ${c.color}; color: white; border-color: ${c.color};`
  return `background: transparent; color: ${c.color}; border-color: ${c.color}44;`
}

// ── Bottom sheet ────────────────────────────────────────────────
const sheet = ref(false)
const sheetDay = ref<number | null>(null)

const sheetSlots = computed(() => sheetDay.value ? slotsForDay(sheetDay.value) : [])

const sheetDayLabel = computed(() => {
  if (!sheetDay.value) return ''
  const d = new Date(periodDate.value.year, periodDate.value.month - 1, sheetDay.value)
  const dow = ['日', '月', '火', '水', '木', '金', '土']
  return `${periodDate.value.month}月${sheetDay.value}日 (${dow[d.getDay()]})`
})

function openSheet(day: number) {
  sheetDay.value = day
  sheet.value = true
}

// ── Submit ──────────────────────────────────────────────────────
const submitted = ref(false)

function doSubmit() {
  shiftStore.submitPreferences(collectionId.value, [])
  submitted.value = true
  appStore.showSnackbar(`${displayMonth.value}の希望シフトを提出しました`, 'success')
  setTimeout(() => navigateTo('/shifts'), 1500)
}
</script>

<style scoped>
.collection-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px;
}

/* ── Header ──────────────────────────────────────────────────── */
.coll-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
}
.coll-header__month {
  font-size: 18px;
  font-weight: 700;
  color: #1a1a1a;
}
.coll-header__deadline {
  font-size: 12px;
  margin-top: 3px;
}
.deadline--urgent { color: #e6273e; font-weight: 600; }
.deadline--normal { color: #757575; }

.coll-header__legend {
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: flex-end;
}
.legend-item {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  color: #757575;
}
.legend-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

/* ── Calendar grid ───────────────────────────────────────────── */
.cal-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
  background: #ffffff;
  border-radius: 16px;
  border: 1px solid #e8e8e8;
  padding: 10px 6px;
}
.cal-col-header {
  text-align: center;
  font-size: 11px;
  font-weight: 600;
  color: #9e9e9e;
  padding: 4px 0;
}
.col-sun { color: #e6273e; }
.col-sat { color: #3587dc; }

.cal-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 4px 2px;
  border-radius: 8px;
  cursor: pointer;
  min-height: 44px;
  transition: background 0.1s;
}
.cal-cell:active { background: #f0f4ff; }
.cal-cell--no-slots { opacity: 0.35; cursor: default; pointer-events: none; }

.cal-cell__num {
  font-size: 13px;
  font-weight: 500;
  line-height: 1;
  margin-bottom: 4px;
}
.num-sun { color: #e6273e; }
.num-sat { color: #3587dc; }

.cal-cell__dots {
  display: flex;
  gap: 2px;
}
.slot-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  display: block;
  transition: background 0.15s;
}

/* ── Progress section ────────────────────────────────────────── */
.progress-section {
  background: #fff;
  border-radius: 16px;
  border: 1px solid #e8e8e8;
  padding: 14px 16px;
}
.progress-section__labels {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.progress-section__stats {
  display: flex;
  gap: 8px;
  margin-top: 10px;
}
.stat-chip {
  font-size: 12px;
  font-weight: 600;
  padding: 3px 10px;
  border-radius: 20px;
}
.stat-preferred  { background: #EBF3FC; color: #3587dc; }
.stat-available  { background: #e8f5e9; color: #2e7d32; }
.stat-unavailable{ background: #f5f5f5; color: #757575; }

/* ── Submit area ─────────────────────────────────────────────── */
.submit-area { padding-bottom: 4px; }

/* ── Bottom sheet ────────────────────────────────────────────── */
.sheet-handle {
  width: 36px;
  height: 4px;
  background: #e0e0e0;
  border-radius: 2px;
  margin: 10px auto 0;
}
.sheet-content {
  padding: 12px 20px 24px;
}
.sheet-title {
  font-size: 16px;
  font-weight: 700;
  color: #1a1a1a;
  margin-bottom: 16px;
}

.slot-row {
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid #f0f0f0;
}
.slot-row:last-of-type { border-bottom: none; margin-bottom: 0; }

.slot-row__info {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}
.slot-badge {
  font-size: 12px;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: 20px;
  border: 1.5px solid;
}
.slot-time {
  font-size: 13px;
  color: #424242;
  font-weight: 500;
}

.slot-choices {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}
.choice-btn {
  flex: 1;
  min-width: 80px;
  padding: 8px 6px;
  border-radius: 10px;
  border: 1.5px solid;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
  text-align: center;
  -webkit-tap-highlight-color: transparent;
}
.choice-btn--clear {
  flex: none;
  min-width: 0;
  width: 36px;
  padding: 8px;
  border-color: #e0e0e0 !important;
  color: #9e9e9e !important;
  background: transparent !important;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
