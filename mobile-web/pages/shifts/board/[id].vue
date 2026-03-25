<template>
  <div class="board-cal-page">

    <!-- Board info header (scrolls away) -->
    <div class="board-hdr">
      <div class="board-hdr__left">
        <div class="board-hdr__name">{{ boardName }}</div>
        <div class="board-hdr__period">{{ periodLabel }}</div>
      </div>
      <v-chip :color="statusColor" size="x-small" variant="tonal">
        <v-icon start size="11">{{ statusIcon }}</v-icon>
        {{ statusLabel }}
      </v-chip>
    </div>

    <!-- Week nav (sticky) -->
    <div class="controls-bar">
      <div class="week-nav">
        <button class="nav-arrow" @click="prevWeek"><v-icon size="18">mdi-chevron-left</v-icon></button>
        <button class="month-pill" @click="pickerOpen=true">
          {{ calMonthLabel }}<v-icon size="13" class="ml-1">mdi-chevron-down</v-icon>
        </button>
        <button class="nav-arrow" @click="nextWeek"><v-icon size="18">mdi-chevron-right</v-icon></button>
      </div>
      <button class="today-btn" @click="goToToday">今日</button>
    </div>

    <!-- Date strip (sticky) -->
    <div class="date-strip">
      <div class="ds-spacer" />
      <div v-for="date in weekDays" :key="toDateStr(date)" class="ds-col">
        <span class="ds-dow" :class="{ 'c-sun': date.getDay()===0, 'c-sat': date.getDay()===6 }">
          {{ DOW[date.getDay()] }}
        </span>
        <span
          class="ds-num"
          :class="{
            'ds-today': isToday(toDateStr(date)),
            'ds-out': !isInPeriod(toDateStr(date)),
          }"
        >{{ date.getDate() }}</span>
        <span v-if="slotsForDate(toDateStr(date)).length > 0" class="ds-dot" />
      </div>
    </div>

    <!-- Time grid -->
    <div class="grid-wrap">
      <div class="time-col">
        <div v-for="h in HOURS" :key="h" class="time-label">{{ h < 10 ? '0'+h : h }}:00</div>
      </div>
      <div class="day-cols">
        <div
          v-for="date in weekDays"
          :key="toDateStr(date)"
          class="day-col"
          :class="{ 'day-col--out': !isInPeriod(toDateStr(date)) }"
        >
          <div v-for="h in HOURS" :key="h" class="hour-cell" />
          <div v-if="isToday(toDateStr(date))" class="now-line" :style="nowLineStyle" />
          <!-- Slot allocation blocks -->
          <div
            v-for="slot in slotsForDate(toDateStr(date))"
            :key="slot.id"
            class="slot-block"
            :style="{ ...blockStyle(slot.startTime, slot.endTime), background: slot.color }"
            @click.stop="openSlotSheet(toDateStr(date), slot)"
          >
            <div class="slot-block__inner">
              <div class="slot-block__label">{{ slot.label }}</div>
              <div class="slot-block__time">{{ slot.startTime }}-{{ slot.endTime }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ── Month picker ──────────────────────────────────────── -->
    <v-dialog v-model="pickerOpen" max-width="320">
      <v-card rounded="xl" class="pa-4">
        <div class="d-flex align-center justify-space-between mb-3">
          <v-btn icon size="small" variant="text" @click="pickerPrev"><v-icon>mdi-chevron-left</v-icon></v-btn>
          <span class="text-subtitle-2 font-weight-bold">{{ pickerMonthLabel }}</span>
          <v-btn icon size="small" variant="text" @click="pickerNext"><v-icon>mdi-chevron-right</v-icon></v-btn>
        </div>
        <div class="picker-grid">
          <div v-for="d in DOW" :key="d" class="picker-header">{{ d }}</div>
          <div v-for="n in pickerLeading" :key="`b${n}`" />
          <div
            v-for="day in pickerDaysInMonth"
            :key="day"
            class="picker-day"
            :class="{
              'p-today': isPickerToday(day),
              'p-selected': isPickerSelected(day),
              'p-has-dot': pickerHasSlot(day),
              'p-out': !pickerIsInPeriod(day),
            }"
            @click="jumpToDay(day)"
          >{{ day }}</div>
        </div>
      </v-card>
    </v-dialog>

    <!-- ── Slot detail bottom sheet ─────────────────────────── -->
    <v-bottom-sheet v-model="slotSheet">
      <v-card rounded="t-xl">
        <div class="sheet-handle" />
        <div v-if="sheetData" class="sheet-body">

          <div class="sheet-date">{{ formatDateLabel(sheetData.date) }}</div>

          <!-- Slot header -->
          <div class="slot-detail-hdr">
            <span
              class="slot-detail-badge"
              :style="{ background: sheetData.slot.color+'22', color: sheetData.slot.color, borderColor: sheetData.slot.color }"
            >{{ sheetData.slot.label }}</span>
            <span class="slot-detail-time">{{ sheetData.slot.startTime }}〜{{ sheetData.slot.endTime }}</span>
          </div>

          <!-- Lineup -->
          <div class="sheet-section-label">メンバー</div>
          <div class="lineup-wrap">
            <div
              v-for="entry in sheetLineup"
              :key="entry.employeeId"
              class="lineup-row"
              :class="{ 'lineup-row--me': entry.isCurrentUser }"
            >
              <div class="lineup-avatar" :class="entry.isCurrentUser ? 'avatar-me' : 'avatar-other'">
                <v-icon size="14" :color="entry.isCurrentUser ? 'white' : '#757575'">mdi-account</v-icon>
              </div>
              <div class="lineup-info">
                <span class="lineup-name">
                  {{ entry.name }}
                  <span v-if="entry.isCurrentUser" class="me-tag">あなた</span>
                </span>
                <span class="lineup-role">{{ entry.department }} · {{ entry.role }}</span>
              </div>
            </div>
            <div v-if="sheetLineup.length === 0" class="lineup-empty">
              <v-icon size="16" color="grey-lighten-2">mdi-account-off-outline</v-icon>
              メンバー未割当
            </div>
          </div>

          <!-- Collection CTA (only for collecting boards) -->
          <v-btn
            v-if="isCollection"
            block color="primary" variant="tonal" rounded="lg" class="mt-3 mb-1"
            @click="slotSheet=false; navigateTo(`/shifts/collection/${id}`)"
          >
            <v-icon start size="16">mdi-calendar-edit-outline</v-icon>
            希望シフトを提出する
          </v-btn>

          <v-btn block variant="text" size="small" class="mt-2" @click="slotSheet=false">閉じる</v-btn>
        </div>
      </v-card>
    </v-bottom-sheet>

  </div>
</template>

<script setup lang="ts">
import type { ShiftSlot } from '~/types'

const route = useRoute()
const id = route.params.id as string
const shiftStore = useShiftStore()

// ── Determine if this is a published board or a collection ─────
const board      = computed(() => shiftStore.board?.id === id ? shiftStore.board : null)
const collection = computed(() => shiftStore.collection?.id === id ? shiftStore.collection : null)

const allocationSetup = computed(() => board.value?.allocationSetup ?? collection.value?.allocationSetup ?? null)
const periodStart     = computed(() => board.value?.periodStart ?? collection.value?.periodStart ?? '')
const periodEnd       = computed(() => board.value?.periodEnd   ?? collection.value?.periodEnd   ?? '')
const isCollection    = computed(() => !board.value && !!collection.value)

const boardName   = computed(() => board.value?.name ?? collection.value?.name ?? 'シフトボード')
const statusLabel = computed(() => {
  if (board.value)      return board.value.status === 'PUBLISHED' ? '公開中' : '作成中'
  if (collection.value) return '収集中'
  return ''
})
const statusColor = computed(() => {
  if (board.value)      return board.value.status === 'PUBLISHED' ? 'success' : 'grey'
  if (collection.value) return 'warning'
  return 'grey'
})
const statusIcon = computed(() => {
  if (board.value)      return board.value.status === 'PUBLISHED' ? 'mdi-check-circle-outline' : 'mdi-pencil-outline'
  if (collection.value) return 'mdi-calendar-edit-outline'
  return 'mdi-calendar'
})
const periodLabel = computed(() => {
  if (!periodStart.value || !periodEnd.value) return ''
  const s = new Date(periodStart.value); const e = new Date(periodEnd.value)
  return `${s.getFullYear()}年${s.getMonth()+1}月${s.getDate()}日 〜 ${e.getMonth()+1}月${e.getDate()}日`
})

// ── Constants ─────────────────────────────────────────────────
const HOUR_HEIGHT = 56
const START_HOUR  = 7
const HOURS = Array.from({ length: 17 }, (_, i) => START_HOUR + i)
const DOW = ['日', '月', '火', '水', '木', '金', '土']

// ── Focus date: start from board period start or today ────────
const today = new Date()
const initialFocus = computed(() => {
  if (!periodStart.value) return today
  const ps = new Date(periodStart.value)
  return ps > today ? ps : today
})
const focusDate = ref(new Date(initialFocus.value))

// ── Week helpers ──────────────────────────────────────────────
const weekDays = computed<Date[]>(() => {
  const r = focusDate.value
  const sun = new Date(r); sun.setDate(r.getDate() - r.getDay())
  return Array.from({ length: 7 }, (_, i) => { const d = new Date(sun); d.setDate(sun.getDate() + i); return d })
})

function toDateStr(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}
function isToday(s: string)    { return s === toDateStr(today) }
function isInPeriod(date: string) { return !!periodStart.value && date >= periodStart.value && date <= periodEnd.value }
function prevWeek() { const d = new Date(focusDate.value); d.setDate(d.getDate()-7); focusDate.value=d }
function nextWeek() { const d = new Date(focusDate.value); d.setDate(d.getDate()+7); focusDate.value=d }
function goToToday() { focusDate.value = new Date() }

function formatDateLabel(date: string) {
  const d = new Date(date)
  return `${d.getMonth()+1}月${d.getDate()}日 (${DOW[d.getDay()]})`
}

const calMonthLabel = computed(() => {
  const [f, l] = [weekDays.value[0], weekDays.value[6]]
  return f.getMonth()===l.getMonth()
    ? `${f.getFullYear()}年${f.getMonth()+1}月`
    : `${f.getMonth()+1}月〜${l.getMonth()+1}月`
})

// ── Slot helpers ──────────────────────────────────────────────
function slotsForDate(date: string): ShiftSlot[] {
  const setup = allocationSetup.value
  if (!setup || !isInPeriod(date)) return []
  const a = setup.assignments.find(x => x.date === date)
  if (!a) return []
  return a.slotIds.map(id => setup.slots.find(s => s.id === id)!).filter(Boolean)
}

function blockStyle(start: string, end: string) {
  const toMin = (t: string) => { const [h,m] = t.split(':').map(Number); return h*60+m }
  const top    = ((toMin(start) - START_HOUR * 60) / 60) * HOUR_HEIGHT
  const height = Math.max(((toMin(end) - toMin(start)) / 60) * HOUR_HEIGHT, 24)
  return { top: `${top}px`, height: `${height}px` }
}

const nowLineStyle = computed(() => {
  const n = new Date()
  return { top: `${((n.getHours()*60 + n.getMinutes() - START_HOUR*60) / 60) * HOUR_HEIGHT}px` }
})

// ── Month picker ──────────────────────────────────────────────
const pickerOpen  = ref(false)
const pickerFocus = ref(new Date(initialFocus.value))

const pickerMonthLabel  = computed(() => `${pickerFocus.value.getFullYear()}年${pickerFocus.value.getMonth()+1}月`)
const pickerLeading     = computed(() => new Date(pickerFocus.value.getFullYear(), pickerFocus.value.getMonth(), 1).getDay())
const pickerDaysInMonth = computed(() => new Date(pickerFocus.value.getFullYear(), pickerFocus.value.getMonth()+1, 0).getDate())

function pickerPrev() { const d=new Date(pickerFocus.value); d.setMonth(d.getMonth()-1); pickerFocus.value=d }
function pickerNext() { const d=new Date(pickerFocus.value); d.setMonth(d.getMonth()+1); pickerFocus.value=d }
function pickerDateStr(day: number) {
  return `${pickerFocus.value.getFullYear()}-${String(pickerFocus.value.getMonth()+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`
}
function isPickerToday(day: number)    { return pickerDateStr(day) === toDateStr(today) }
function isPickerSelected(day: number) { return pickerDateStr(day) === toDateStr(focusDate.value) }
function pickerHasSlot(day: number)    { return slotsForDate(pickerDateStr(day)).length > 0 }
function pickerIsInPeriod(day: number) { return isInPeriod(pickerDateStr(day)) }
function jumpToDay(day: number) {
  focusDate.value = new Date(pickerFocus.value.getFullYear(), pickerFocus.value.getMonth(), day)
  pickerOpen.value = false
}

// ── Slot detail sheet ─────────────────────────────────────────
const slotSheet = ref(false)
const sheetData = ref<{ date: string; slot: ShiftSlot } | null>(null)
const sheetLineup = computed(() =>
  sheetData.value ? shiftStore.getBoardLineup(sheetData.value.date, sheetData.value.slot.id) : []
)

function openSlotSheet(date: string, slot: ShiftSlot) {
  sheetData.value = { date, slot }
  slotSheet.value = true
}
</script>

<style scoped>
.board-cal-page { display: flex; flex-direction: column; background: #fff; min-height: 100%; }

/* ── Board header ────────────────────────────────────────────── */
.board-hdr {
  display: flex; align-items: flex-start; justify-content: space-between;
  padding: 14px 14px 12px;
  border-bottom: 1px solid #f0f0f0;
}
.board-hdr__name   { font-size: 15px; font-weight: 700; color: #1a1a1a; }
.board-hdr__period { font-size: 11px; color: #9e9e9e; margin-top: 3px; }

/* ── Controls bar (sticky) ──────────────────────────────────── */
.controls-bar {
  display: flex; align-items: center;
  padding: 8px 12px 6px;
  background: #fff; border-bottom: 1px solid #f0f0f0;
  position: sticky; top: 0; z-index: 10;
  gap: 6px;
}
.week-nav   { display: flex; align-items: center; flex: 1; gap: 2px; }
.nav-arrow  {
  width: 28px; height: 28px; border: none; background: none; cursor: pointer;
  border-radius: 6px; color: #424242; display: flex; align-items: center; justify-content: center;
}
.nav-arrow:active { background: #f0f0f0; }
.month-pill {
  display: flex; align-items: center; padding: 4px 8px;
  border: none; background: none; cursor: pointer;
  font-size: 13px; font-weight: 700; color: #1a1a1a; border-radius: 6px;
}
.month-pill:active { background: #f0f0f0; }
.today-btn {
  padding: 4px 10px; border: 1px solid #3587dc; border-radius: 6px;
  background: none; font-size: 11px; font-weight: 600; color: #3587dc; cursor: pointer;
}

/* ── Date strip (sticky) ────────────────────────────────────── */
.date-strip {
  display: flex; padding: 6px 0 4px;
  background: #fff; border-bottom: 1px solid #e8e8e8;
  position: sticky; top: 43px; z-index: 9;
}
.ds-spacer { width: 40px; flex-shrink: 0; }
.ds-col    { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 2px; }
.ds-dow    { font-size: 10px; font-weight: 600; color: #9e9e9e; }
.ds-num    {
  font-size: 14px; font-weight: 600; color: #1a1a1a;
  width: 26px; height: 26px; display: flex; align-items: center; justify-content: center; border-radius: 50%;
}
.ds-today  { background: #3587dc; color: #fff !important; font-weight: 700; }
.ds-out    { opacity: 0.25; }
.ds-dot    { width: 4px; height: 4px; border-radius: 50%; background: #9e9e9e; }
.c-sun { color: #e6273e !important; }
.c-sat { color: #3587dc !important; }

/* ── Time grid ──────────────────────────────────────────────── */
.grid-wrap  { display: flex; }
.time-col   { width: 40px; flex-shrink: 0; }
.time-label {
  height: 56px; font-size: 9px; color: #bdbdbd;
  display: flex; align-items: flex-start; justify-content: flex-end;
  padding: 2px 5px 0 0; box-sizing: border-box;
}
.day-cols  { display: flex; flex: 1; }
.day-col   { flex: 1; position: relative; border-left: 1px solid #f0f0f0; min-width: 0; }
.day-col--out { background: #fafafa; }
.hour-cell { height: 56px; border-top: 1px solid #f0f0f0; box-sizing: border-box; }
.hour-cell:first-child { border-top: none; }

/* Now line */
.now-line {
  position: absolute; left: 0; right: 0; height: 2px;
  background: #e6273e; z-index: 3; pointer-events: none;
}
.now-line::before {
  content: ''; position: absolute; left: -3px; top: -3px;
  width: 8px; height: 8px; border-radius: 50%; background: #e6273e;
}

/* Slot allocation blocks */
.slot-block {
  position: absolute; left: 2px; right: 2px;
  border-radius: 5px; overflow: hidden; cursor: pointer; z-index: 2;
  opacity: 0.92; transition: opacity 0.1s;
}
.slot-block:active { opacity: 0.75; }
.slot-block__inner {
  padding: 4px 6px; height: 100%;
  display: flex; flex-direction: column; justify-content: center;
}
.slot-block__label { font-size: 11px; font-weight: 700; color: #fff; }
.slot-block__time  { font-size: 9px; color: rgba(255,255,255,.8); margin-top: 2px; }

/* ── Month picker ───────────────────────────────────────────── */
.picker-grid    { display: grid; grid-template-columns: repeat(7,1fr); gap: 2px; text-align: center; }
.picker-header  { font-size: 10px; font-weight: 600; color: #9e9e9e; padding: 4px 0; }
.picker-day     { font-size: 13px; padding: 7px 0; border-radius: 50%; cursor: pointer; position: relative; }
.picker-day:active { background: #f0f4ff; }
.p-today    { background: #EBF3FC; color: #3587dc; font-weight: 700; }
.p-selected { background: #3587dc !important; color: #fff !important; }
.p-has-dot::after {
  content: ''; position: absolute; bottom: 1px; left: 50%; transform: translateX(-50%);
  width: 4px; height: 4px; border-radius: 50%; background: #9e9e9e;
}
.p-selected::after { background: rgba(255,255,255,.6) !important; }
.p-out      { opacity: 0.25; pointer-events: none; }

/* ── Bottom sheet ───────────────────────────────────────────── */
.sheet-handle  { width: 36px; height: 4px; background: #e0e0e0; border-radius: 2px; margin: 10px auto 0; }
.sheet-body    { padding: 12px 20px 28px; }
.sheet-date    { font-size: 16px; font-weight: 700; color: #1a1a1a; margin-bottom: 10px; }

.slot-detail-hdr {
  display: flex; align-items: center; gap: 10px;
  margin-bottom: 14px;
}
.slot-detail-badge {
  font-size: 12px; font-weight: 700;
  padding: 4px 12px; border-radius: 20px; border: 1.5px solid;
  flex-shrink: 0;
}
.slot-detail-time { font-size: 14px; font-weight: 600; color: #424242; }

.sheet-section-label {
  font-size: 11px; font-weight: 700; color: #9e9e9e;
  letter-spacing: 0.5px; text-transform: uppercase; margin-bottom: 8px;
}

.lineup-wrap { display: flex; flex-direction: column; border: 1px solid #e8e8e8; border-radius: 12px; overflow: hidden; margin-bottom: 4px; }
.lineup-row {
  display: flex; align-items: center; gap: 10px;
  padding: 10px 14px;
  border-bottom: 1px solid #f5f5f5;
}
.lineup-row:last-child { border-bottom: none; }
.lineup-row--me { background: #EBF3FC; }

.lineup-avatar {
  width: 30px; height: 30px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.avatar-me    { background: #3587dc; }
.avatar-other { background: #f0f0f0; }

.lineup-info   { flex: 1; min-width: 0; }
.lineup-name   { font-size: 13px; font-weight: 600; color: #1a1a1a; display: flex; align-items: center; gap: 6px; }
.lineup-role   { font-size: 11px; color: #9e9e9e; margin-top: 1px; }
.me-tag        { font-size: 10px; font-weight: 700; color: #3587dc; background: #EBF3FC; padding: 1px 6px; border-radius: 10px; }
.lineup-empty  { font-size: 12px; color: #bdbdbd; padding: 14px; display: flex; align-items: center; gap: 6px; }
</style>
