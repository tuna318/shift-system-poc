<template>
  <div class="shifts-page">

    <!-- ── Tab selector ────────────────────────────────────────── -->
    <div class="tab-bar">
      <button :class="['tab-btn', activeTab==='calendar' && 'tab-btn--active']" @click="activeTab='calendar'">
        <v-icon size="14">mdi-calendar-week-outline</v-icon> カレンダー
      </button>
      <button :class="['tab-btn', activeTab==='board' && 'tab-btn--active']" @click="activeTab='board'">
        <v-icon size="14">mdi-view-grid-outline</v-icon> シフトボード
      </button>
    </div>

    <!-- ════════════════════════════════════════════════════════ -->
    <!-- TAB 1: CALENDAR (Google-Calendar-style weekly time grid) -->
    <!-- ════════════════════════════════════════════════════════ -->
    <template v-if="activeTab==='calendar'">

      <!-- Calendar controls -->
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

      <!-- Date strip -->
      <div class="date-strip">
        <div class="ds-spacer" />
        <div v-for="date in weekDays" :key="toDateStr(date)" class="ds-col">
          <span class="ds-dow" :class="{ 'c-sun': date.getDay()===0, 'c-sat': date.getDay()===6 }">
            {{ DOW[date.getDay()] }}
          </span>
          <span class="ds-num" :class="{ 'ds-today': isToday(toDateStr(date)) }">{{ date.getDate() }}</span>
          <span v-if="confirmedShiftsForDate(toDateStr(date)).length>0" class="ds-dot" />
        </div>
      </div>

      <!-- Time grid -->
      <div class="grid-wrap">
        <div class="time-col">
          <div v-for="h in HOURS" :key="h" class="time-label">{{ h < 10 ? '0'+h : h }}:00</div>
        </div>
        <div class="day-cols">
          <div v-for="date in weekDays" :key="toDateStr(date)" class="day-col">
            <div v-for="h in HOURS" :key="h" class="hour-cell" />
            <!-- now indicator -->
            <div v-if="isToday(toDateStr(date))" class="now-line" :style="nowLineStyle" />
            <!-- shift blocks -->
            <div
              v-for="shift in confirmedShiftsForDate(toDateStr(date))"
              :key="shift.id"
              class="time-block"
              :class="shift.cellStatus==='ADJUSTING' ? 'block-adjusting' : 'block-confirmed'"
              :style="blockStyle(shift.startTime, shift.endTime)"
              @click.stop="openCalSheet(shift)"
            >
              <div class="block-inner">
                <div class="block-time">{{ shift.startTime }}-{{ shift.endTime }}</div>
                <div class="block-dept">{{ shift.department }}</div>
                <div v-if="shift.cellStatus==='ADJUSTING'" class="block-badge">調整中</div>
              </div>
            </div>
          </div>
        </div>
      </div>

    </template>

    <!-- ════════════════════════════════════════════════════════ -->
    <!-- TAB 2: SHIFT BOARD LIST                                 -->
    <!-- ════════════════════════════════════════════════════════ -->
    <template v-else>

      <div v-if="boardListItems.length === 0" class="no-boards">
        <v-icon size="48" color="grey-lighten-2">mdi-view-grid-outline</v-icon>
        <div class="text-body-2 text-grey mt-2">シフトボードがありません</div>
      </div>

      <div class="board-list">
        <div
          v-for="item in boardListItems"
          :key="item.id"
          class="board-list-item"
          @click="navigateTo(`/shifts/board/${item.id}`)"
        >
          <div class="board-list-item__icon" :style="{ background: item.iconBg }">
            <v-icon color="white" size="20">{{ item.icon }}</v-icon>
          </div>
          <div class="board-list-item__body">
            <div class="board-list-item__name">{{ item.name }}</div>
            <div class="board-list-item__period">{{ item.periodLabel }}</div>
            <div v-if="item.deadline" class="board-list-item__deadline">
              <v-icon size="11" color="#e6273e">mdi-clock-outline</v-icon>
              {{ item.deadline }}
            </div>
          </div>
          <div class="board-list-item__right">
            <v-chip :color="item.statusColor" size="x-small" variant="tonal">{{ item.statusLabel }}</v-chip>
            <v-icon size="16" color="grey-lighten-1" class="mt-1">mdi-chevron-right</v-icon>
          </div>
        </div>
      </div>

    </template>

    <!-- ── Month picker (calendar tab) ────────────────────────── -->
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
            v-for="day in pickerDaysInMonth" :key="day"
            class="picker-day"
            :class="{ 'p-today': isPickerToday(day), 'p-selected': isPickerSelected(day), 'p-has-dot': pickerHasShift(day) }"
            @click="jumpToDay(day)"
          >{{ day }}</div>
        </div>
      </v-card>
    </v-dialog>

    <!-- ── Calendar shift detail sheet ────────────────────────── -->
    <v-bottom-sheet v-model="calSheet">
      <v-card rounded="t-xl">
        <div class="sheet-handle" />
        <div class="sheet-body" v-if="calSheetShift">
          <div class="sheet-title">{{ formatDateLabel(calSheetShift.date) }}</div>
          <div class="confirmed-block">
            <div class="confirmed-block__time">{{ calSheetShift.startTime }}〜{{ calSheetShift.endTime }}</div>
            <div class="confirmed-block__dept">{{ calSheetShift.department }}</div>
            <v-chip :color="cellStatusColor(calSheetShift.cellStatus)" size="small" variant="tonal" class="mt-2">
              {{ cellStatusLabel(calSheetShift.cellStatus) }}
            </v-chip>
          </div>
          <v-btn
            v-if="calSheetShift.cellStatus==='ADJUSTING'"
            color="warning" variant="tonal" rounded="lg" block class="mb-2"
            @click="calSheet=false; navigateTo(`/shifts/${calSheetShift.id}`)"
          ><v-icon start size="16">mdi-calendar-edit</v-icon>調整依頼を確認する</v-btn>
          <v-btn block variant="text" size="small" class="mt-2" @click="calSheet=false">閉じる</v-btn>
        </div>
      </v-card>
    </v-bottom-sheet>

  </div>
</template>

<script setup lang="ts">
import type { ShiftEntry, CellStatus } from '~/types'

const shiftStore = useShiftStore()

// ── Constants ─────────────────────────────────────────────────────
const HOUR_HEIGHT = 56
const START_HOUR  = 7
const HOURS = Array.from({ length: 17 }, (_, i) => START_HOUR + i)
const DOW = ['日', '月', '火', '水', '木', '金', '土']

// ── Shared state ──────────────────────────────────────────────────
const today = new Date()
const focusDate = ref(new Date())
const activeTab = ref<'calendar' | 'board'>('calendar')

// ── Week helpers ──────────────────────────────────────────────────
const weekDays = computed<Date[]>(() => {
  const ref = focusDate.value
  const sun = new Date(ref); sun.setDate(ref.getDate() - ref.getDay())
  return Array.from({ length: 7 }, (_, i) => { const d = new Date(sun); d.setDate(sun.getDate() + i); return d })
})

function toDateStr(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}
function isToday(s: string) { return s === toDateStr(today) }
function prevWeek() { const d = new Date(focusDate.value); d.setDate(d.getDate()-7); focusDate.value=d }
function nextWeek() { const d = new Date(focusDate.value); d.setDate(d.getDate()+7); focusDate.value=d }
function goToToday() { focusDate.value = new Date() }
function formatDateLabel(date: string) {
  const d = new Date(date)
  return `${d.getMonth()+1}月${d.getDate()}日 (${DOW[d.getDay()]})`
}

// ── Calendar helpers ──────────────────────────────────────────────
const calMonthLabel = computed(() => {
  const [f, l] = [weekDays.value[0], weekDays.value[6]]
  return f.getMonth()===l.getMonth() ? `${f.getFullYear()}年${f.getMonth()+1}月` : `${f.getMonth()+1}月〜${l.getMonth()+1}月`
})

function confirmedShiftsForDate(date: string): ShiftEntry[] {
  return shiftStore.entries.filter(e => e.date === date)
}

function blockStyle(start: string, end: string) {
  const toMin = (t: string) => { const [h,m] = t.split(':').map(Number); return h*60+m }
  const top    = ((toMin(start) - START_HOUR*60) / 60) * HOUR_HEIGHT
  const height = Math.max(((toMin(end) - toMin(start)) / 60) * HOUR_HEIGHT, 24)
  return { top: `${top}px`, height: `${height}px` }
}

const nowLineStyle = computed(() => {
  const n = new Date()
  return { top: `${((n.getHours()*60 + n.getMinutes() - START_HOUR*60) / 60) * HOUR_HEIGHT}px` }
})

function cellStatusLabel(s?: CellStatus|null) {
  return ({CONFIRMED:'確定',ADJUSTING:'調整中',SHIFT_REQUESTED:'希望提出済み',DAY_OFF_REQUESTED:'休み希望',DAY_OFF_CONFIRMED:'休み確定'} as Record<string,string>)[s??'CONFIRMED']??'確定'
}
function cellStatusColor(s?: CellStatus|null) {
  return ({CONFIRMED:'success',ADJUSTING:'warning',SHIFT_REQUESTED:'primary',DAY_OFF_REQUESTED:'grey',DAY_OFF_CONFIRMED:'grey'} as Record<string,string>)[s??'CONFIRMED']??'success'
}

// Calendar sheet
const calSheet = ref(false)
const calSheetShift = ref<ShiftEntry|null>(null)
function openCalSheet(shift: ShiftEntry) { calSheetShift.value=shift; calSheet.value=true }

// ── Month picker ──────────────────────────────────────────────────
const pickerOpen  = ref(false)
const pickerFocus = ref(new Date())
const pickerMonthLabel  = computed(() => `${pickerFocus.value.getFullYear()}年${pickerFocus.value.getMonth()+1}月`)
const pickerLeading     = computed(() => new Date(pickerFocus.value.getFullYear(), pickerFocus.value.getMonth(), 1).getDay())
const pickerDaysInMonth = computed(() => new Date(pickerFocus.value.getFullYear(), pickerFocus.value.getMonth()+1, 0).getDate())
function pickerPrev() { const d=new Date(pickerFocus.value); d.setMonth(d.getMonth()-1); pickerFocus.value=d }
function pickerNext() { const d=new Date(pickerFocus.value); d.setMonth(d.getMonth()+1); pickerFocus.value=d }
function pickerDateStr(day: number) { return `${pickerFocus.value.getFullYear()}-${String(pickerFocus.value.getMonth()+1).padStart(2,'0')}-${String(day).padStart(2,'0')}` }
function isPickerToday(day: number)    { return pickerDateStr(day)===toDateStr(today) }
function isPickerSelected(day: number) { return pickerDateStr(day)===toDateStr(focusDate.value) }
function pickerHasShift(day: number)   { return confirmedShiftsForDate(pickerDateStr(day)).length>0 }
function jumpToDay(day: number) { focusDate.value=new Date(pickerFocus.value.getFullYear(), pickerFocus.value.getMonth(), day); pickerOpen.value=false }

// ── Board list ────────────────────────────────────────────────────
const boardListItems = computed(() => {
  const items: {
    id: string; name: string; periodLabel: string
    statusLabel: string; statusColor: string
    icon: string; iconBg: string; deadline: string | null
  }[] = []

  const b = shiftStore.board
  if (b) {
    const s = new Date(b.periodStart); const e = new Date(b.periodEnd)
    items.push({
      id: b.id,
      name: b.name,
      periodLabel: `${s.getFullYear()}年${s.getMonth()+1}月${s.getDate()}日 〜 ${e.getMonth()+1}月${e.getDate()}日`,
      statusLabel: b.status === 'PUBLISHED' ? '公開中' : '作成中',
      statusColor: b.status === 'PUBLISHED' ? 'success' : 'grey',
      icon: 'mdi-calendar-check-outline',
      iconBg: b.status === 'PUBLISHED' ? '#3587dc' : '#9e9e9e',
      deadline: null,
    })
  }

  const c = shiftStore.collection
  if (c && (c.status === 'COLLECTING' || c.status === 'SENT')) {
    const s = new Date(c.periodStart); const e = new Date(c.periodEnd)
    const d = new Date(c.deadline)
    const daysLeft = Math.max(0, Math.ceil((d.getTime() - new Date().setHours(0,0,0,0)) / 86400000))
    items.push({
      id: c.id,
      name: c.name,
      periodLabel: `${s.getFullYear()}年${s.getMonth()+1}月${s.getDate()}日 〜 ${e.getMonth()+1}月${e.getDate()}日`,
      statusLabel: '収集中',
      statusColor: 'warning',
      icon: 'mdi-calendar-edit-outline',
      iconBg: '#f59e0b',
      deadline: `提出期限 ${d.getMonth()+1}/${d.getDate()}（あと${daysLeft}日）`,
    })
  }

  return items
})
</script>

<style scoped>
.shifts-page { display: flex; flex-direction: column; background: #fff; min-height: 100%; }

/* ── Tab bar ──────────────────────────────────────────────────── */
.tab-bar {
  display: flex;
  background: #fff;
  border-bottom: 1px solid #e8e8e8;
  position: sticky; top: 0; z-index: 11;
}
.tab-btn {
  flex: 1; padding: 12px 8px;
  border: none; background: none;
  font-size: 13px; font-weight: 500; color: #9e9e9e;
  cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 5px;
  border-bottom: 2.5px solid transparent;
  transition: all 0.15s;
}
.tab-btn--active { color: #3587dc; border-bottom-color: #3587dc; font-weight: 700; }

/* ── Controls bar ─────────────────────────────────────────────── */
.controls-bar {
  display: flex; align-items: center;
  padding: 8px 12px 6px;
  background: #fff; border-bottom: 1px solid #f0f0f0;
  position: sticky; top: 45px; z-index: 10;
  gap: 6px;
}
.controls-bar--board {
  border-bottom: none;
  padding: 8px 12px 4px;
}
.week-nav   { display: flex; align-items: center; flex: 1; gap: 2px; }
.nav-arrow  {
  width: 28px; height: 28px; border: none; background: none; cursor: pointer;
  border-radius: 6px; color: #424242; display: flex; align-items: center; justify-content: center;
  transition: background 0.1s;
}
.nav-arrow:active { background: #f0f0f0; }
.month-pill {
  display: flex; align-items: center; padding: 4px 8px;
  border: none; background: none; cursor: pointer;
  font-size: 13px; font-weight: 700; color: #1a1a1a; border-radius: 6px;
}
.month-pill:active { background: #f0f0f0; }
.board-week-label { font-size: 13px; font-weight: 700; color: #1a1a1a; flex: 1; text-align: center; }
.today-btn  {
  padding: 4px 10px; border: 1px solid #3587dc; border-radius: 6px;
  background: none; font-size: 11px; font-weight: 600; color: #3587dc; cursor: pointer;
}
.ml-auto { margin-left: auto; }

/* ── Calendar date strip ──────────────────────────────────────── */
.date-strip {
  display: flex; padding: 6px 0 4px;
  background: #fff; border-bottom: 1px solid #e8e8e8;
  position: sticky; top: 90px; z-index: 9;
}
.ds-spacer { width: 40px; flex-shrink: 0; }
.ds-col    { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 2px; }
.ds-dow    { font-size: 10px; font-weight: 600; color: #9e9e9e; }
.ds-num    { font-size: 14px; font-weight: 600; color: #1a1a1a; width: 26px; height: 26px; display: flex; align-items: center; justify-content: center; border-radius: 50%; }
.ds-today  { background: #3587dc; color: #fff !important; font-weight: 700; }
.ds-dot    { width: 4px; height: 4px; border-radius: 50%; background: #3587dc; }

/* ── Time grid ────────────────────────────────────────────────── */
.grid-wrap  { display: flex; }
.time-col   { width: 40px; flex-shrink: 0; }
.time-label {
  height: 56px; font-size: 9px; color: #bdbdbd;
  display: flex; align-items: flex-start; justify-content: flex-end;
  padding: 2px 5px 0 0; box-sizing: border-box;
}
.day-cols   { display: flex; flex: 1; }
.day-col    { flex: 1; position: relative; border-left: 1px solid #f0f0f0; min-width: 0; }
.hour-cell  { height: 56px; border-top: 1px solid #f0f0f0; box-sizing: border-box; }
.hour-cell:first-child { border-top: none; }
.now-line   {
  position: absolute; left: 0; right: 0; height: 2px;
  background: #e6273e; z-index: 3; pointer-events: none;
}
.now-line::before {
  content: ''; position: absolute; left: -3px; top: -3px;
  width: 8px; height: 8px; border-radius: 50%; background: #e6273e;
}
.time-block {
  position: absolute; left: 2px; right: 2px;
  border-radius: 5px; overflow: hidden; cursor: pointer; z-index: 2;
  transition: filter 0.1s;
}
.time-block:active { filter: brightness(.9); }
.block-confirmed { background: #3587dc; }
.block-adjusting { background: #f8c076; }
.block-inner { padding: 3px 5px; height: 100%; display: flex; flex-direction: column; }
.block-time  { font-size: 9px; color: rgba(255,255,255,.8); line-height: 1.2; }
.block-dept  { font-size: 10px; color: #fff; font-weight: 700; line-height: 1.3; }
.block-badge { margin-top: auto; font-size: 8px; background: rgba(0,0,0,.2); border-radius: 3px; padding: 1px 4px; color: #fff; align-self: flex-start; }

/* ── Board list tab ───────────────────────────────────────────── */
.no-boards {
  text-align: center; padding: 60px 16px;
  display: flex; flex-direction: column; align-items: center;
}

.board-list {
  padding: 12px;
  display: flex; flex-direction: column; gap: 10px;
}

.board-list-item {
  background: #fff;
  border-radius: 16px;
  border: 1px solid #e8e8e8;
  padding: 14px;
  display: flex; align-items: center; gap: 12px;
  cursor: pointer;
  box-shadow: 0 1px 3px rgba(0,0,0,0.06);
  transition: box-shadow 0.15s;
  -webkit-tap-highlight-color: transparent;
}
.board-list-item:active { box-shadow: none; background: #fafafa; }

.board-list-item__icon {
  width: 44px; height: 44px; border-radius: 12px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}

.board-list-item__body { flex: 1; min-width: 0; }
.board-list-item__name { font-size: 14px; font-weight: 700; color: #1a1a1a; }
.board-list-item__period { font-size: 11px; color: #9e9e9e; margin-top: 3px; }
.board-list-item__deadline {
  display: flex; align-items: center; gap: 3px;
  font-size: 11px; color: #e6273e; font-weight: 600; margin-top: 4px;
}

.board-list-item__right {
  display: flex; flex-direction: column; align-items: flex-end; gap: 2px; flex-shrink: 0;
}

/* ── Common ───────────────────────────────────────────────────── */
.c-sun { color: #e6273e !important; }
.c-sat { color: #3587dc !important; }

/* Month picker */
.picker-grid    { display: grid; grid-template-columns: repeat(7,1fr); gap: 2px; text-align: center; }
.picker-header  { font-size: 10px; font-weight: 600; color: #9e9e9e; padding: 4px 0; }
.picker-day     { font-size: 13px; padding: 7px 0; border-radius: 50%; cursor: pointer; position: relative; }
.picker-day:active { background: #f0f4ff; }
.p-today    { background: #EBF3FC; color: #3587dc; font-weight: 700; }
.p-selected { background: #3587dc !important; color: #fff !important; border-radius: 50%; }
.p-has-dot::after { content: ''; position: absolute; bottom: 1px; left: 50%; transform: translateX(-50%); width: 4px; height: 4px; border-radius: 50%; background: #3587dc; }
.p-selected::after { background: rgba(255,255,255,.6) !important; }

/* Bottom sheet */
.sheet-handle  { width: 36px; height: 4px; background: #e0e0e0; border-radius: 2px; margin: 10px auto 0; }
.sheet-body    { padding: 12px 20px 28px; }
.sheet-title   { font-size: 16px; font-weight: 700; color: #1a1a1a; margin-bottom: 16px; }
.confirmed-block { background: #f8f8f8; border-radius: 12px; padding: 14px; margin-bottom: 14px; }
.confirmed-block__time { font-size: 22px; font-weight: 700; color: #1a1a1a; }
.confirmed-block__dept { font-size: 12px; color: #757575; margin-top: 2px; }
</style>
