<template>
  <div class="daily-view">
    <!-- Date navigation -->
    <div class="d-flex align-center ga-3 mb-4">
      <v-btn icon size="small" variant="text" :disabled="!canGoPrev" @click="prevDay">
        <v-icon>mdi-chevron-left</v-icon>
      </v-btn>

      <div class="date-display" @click="datePickerOpen = true">
        <span class="date-label">{{ formattedDateLong }}</span>
        <v-icon size="16" class="ml-1 text-medium-emphasis">mdi-calendar</v-icon>
      </div>

      <v-btn icon size="small" variant="text" :disabled="!canGoNext" @click="nextDay">
        <v-icon>mdi-chevron-right</v-icon>
      </v-btn>

      <!-- Hidden date input for picker -->
      <input
        v-if="datePickerOpen"
        ref="dateInputRef"
        type="date"
        class="hidden-date-input"
        :value="selectedDate"
        :min="periodStart"
        :max="periodEnd"
        @change="onDatePick"
        @blur="datePickerOpen = false"
      >

      <v-spacer />

      <!-- Day summary chips -->
      <div class="d-flex align-center ga-2 flex-wrap">
        <v-chip size="small" variant="tonal" color="primary" prepend-icon="mdi-account-group">
          {{ workingEntries.length }}名出勤
        </v-chip>
        <v-chip
          v-for="dept in deptSummary"
          :key="dept.name"
          size="small"
          variant="tonal"
          :color="dept.color"
        >
          {{ dept.name }} {{ dept.count }}名
        </v-chip>
        <v-chip
          v-if="dayCost > 0"
          size="small"
          variant="tonal"
          color="default"
          prepend-icon="mdi-currency-jpy"
        >
          {{ dayCost.toLocaleString() }}
        </v-chip>
      </div>
    </div>

    <!-- Empty state -->
    <div v-if="dayEntries.length === 0" class="empty-state">
      <v-icon size="48" color="medium-emphasis" class="mb-3">mdi-calendar-blank-outline</v-icon>
      <p class="text-body-2 text-medium-emphasis">この日のシフトはありません</p>
    </div>

    <!-- Timeline -->
    <div v-else class="timeline-outer">
      <!-- Sticky left column header -->
      <div class="timeline-header-row">
        <div class="emp-col" />
        <div ref="scrollRef" class="scroll-area scroll-area--header">
          <div class="timeline-inner">
            <!-- Time axis ticks -->
            <div class="time-axis">
              <div
                v-for="h in ALL_HOURS"
                :key="h"
                class="time-tick"
                :style="{ width: `${PX_PER_HOUR}px` }"
              >
                {{ String(h).padStart(2, '0') }}:00
              </div>
            </div>
          </div>
        </div>
        <div class="stat-col stat-col--header">
          <span class="stat-header-label">勤務時間 / 賃金</span>
        </div>
      </div>

      <!-- Scrollable body -->
      <div class="timeline-body-wrap">
        <div class="emp-col-spacer" />
        <div ref="bodyScrollRef" class="scroll-area scroll-area--body" @scroll="syncHeaderScroll">
          <div class="timeline-inner timeline-inner--body">
            <!-- Hour grid lines -->
            <div class="grid-bg" aria-hidden="true">
              <div
                v-for="h in ALL_HOURS"
                :key="h"
                class="grid-col"
                :style="{ width: `${PX_PER_HOUR}px` }"
                :class="{ 'grid-col--now': isToday && isNowHour(h) }"
              />
            </div>

            <!-- Department groups -->
            <div
              v-for="dept in deptGroups"
              :key="dept.name"
              class="dept-group"
            >
              <!-- Dept separator -->
              <div class="dept-sep">
                <span class="dept-sep__label">
                  {{ dept.name }}
                  <span class="dept-sep__count">{{ dept.rows.length }}名</span>
                </span>
                <div class="dept-sep__line" />
              </div>

              <!-- Employee rows -->
              <div
                v-for="row in dept.rows"
                :key="row.entry.id"
                class="emp-row-timeline"
              >
                <!-- Shift bar -->
                <div
                  v-if="!isDayOff(row.entry.cellStatus)"
                  class="shift-bar"
                  :style="barStyle(row.entry)"
                  :class="barClass(row.entry.cellStatus)"
                  @click="openEditor(row.entry)"
                >
                  <div class="shift-bar__inner">
                    <span class="shift-bar__time">{{ row.entry.startTime }}–{{ row.entry.endTime }}</span>
                  </div>
                </div>

                <!-- Day-off (shown at slot position on timeline) -->
                <div
                  v-else
                  class="shift-bar"
                  :class="row.entry.cellStatus === 'DAY_OFF_CONFIRMED' ? 'shift-bar--dayoff-conf' : 'shift-bar--dayoff-req'"
                  :style="barStyle(row.entry)"
                  style="cursor: pointer"
                  @click="openEditor(row.entry)"
                >
                  <div class="shift-bar__inner">
                    <v-icon size="10" style="opacity:0.75">mdi-sleep</v-icon>
                    <span class="shift-bar__time">{{ row.entry.startTime }}–{{ row.entry.endTime }}</span>
                  </div>
                </div>

                <!-- Pending substitution badge on shift bar -->
                <div
                  v-if="hasPendingSub(row.entry)"
                  class="sub-bar-badge"
                  :style="{ left: `${toMinutes(row.entry.startTime) / 60 * PX_PER_HOUR + 4}px` }"
                >
                  <v-icon size="11" color="warning">mdi-account-replace</v-icon>
                </div>

                <!-- Adjusting warning dot -->
                <div
                  v-if="row.entry.cellStatus === 'ADJUSTING'"
                  class="adj-dot"
                  :style="adjDotStyle(row.entry)"
                >
                  <v-icon size="13" color="warning">mdi-alert-circle</v-icon>
                </div>

                <!-- Now line -->
                <div
                  v-if="isToday && nowLineLeft !== null"
                  class="now-line"
                  :style="{ left: `${nowLineLeft}px` }"
                />
              </div>
            </div>

            <!-- Now line label at bottom -->
            <div
              v-if="isToday && nowLineLeft !== null"
              class="now-label"
              :style="{ left: `${nowLineLeft}px` }"
            >
              {{ nowTimeLabel }}
            </div>
          </div>
        </div>

        <!-- Stat column (right side, no scroll) -->
        <div class="stat-col-body">
          <div
            v-for="dept in deptGroups"
            :key="dept.name"
          >
            <!-- Spacer for dept-sep -->
            <div class="stat-dept-sep-spacer" />
            <!-- Stat cells per employee -->
            <div
              v-for="row in dept.rows"
              :key="row.entry.id"
              class="stat-cell"
            >
              <template v-if="!isDayOff(row.entry.cellStatus)">
                <div class="stat-hours">{{ empTotalHours(row.entry.employeeId) }}h</div>
                <div class="stat-wage">¥{{ empTotalWage(row.entry.employeeId).toLocaleString() }}</div>
              </template>
              <template v-else>
                <div class="stat-dayoff">休</div>
              </template>
            </div>
          </div>
        </div>
      </div>

      <!-- Left: employee info column (absolutely positioned, overlays scroll area) -->
      <div class="emp-col-overlay">
        <div
          v-for="dept in deptGroups"
          :key="dept.name"
        >
          <!-- Dept sep row -->
          <div class="emp-dept-sep-row">
            <v-icon size="12" class="mr-1" :color="DEPT_ICON_COLORS[dept.name]">mdi-circle</v-icon>
            {{ dept.name }}
            <span class="dept-count-label">{{ dept.rows.filter(r => !isDayOff(r.entry.cellStatus)).length }}名</span>
          </div>
          <!-- Employee rows -->
          <div
            v-for="row in dept.rows"
            :key="row.entry.id"
            class="emp-info-row emp-info-row--clickable"
            @click="openEditor(row.entry)"
          >
            <div class="emp-avatar" :class="avatarClass(row.employee.department)">
              {{ avatarInitial(row.employee.name) }}
            </div>
            <div class="emp-text">
              <div class="emp-name">{{ row.employee.name }}</div>
              <div class="emp-pos">{{ row.employee.position }}</div>
            </div>
            <v-icon size="14" class="emp-chevron text-medium-emphasis">mdi-chevron-right</v-icon>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Shift entry editor dialog -->
  <ShiftEntryEditor
    v-model="editorOpen"
    :employee-id="editorState.employeeId"
    :shift-date="editorState.shiftDate"
    :entry="editorState.entry"
    :board-status="boardStatus"
    @save="handleEditorSave"
    @delete="handleEditorDelete"
  />
</template>

<script setup lang="ts">
import type { ShiftEntry } from '~/types'
import { useMockData } from '~/composables/useMockData'
import { useShiftStore } from '~/stores/shift.store'
import { useSubstitutionStore } from '~/stores/substitution.store'

const props = defineProps<{
  boardId: string
  periodStart: string
  periodEnd: string
  entries: ShiftEntry[]
}>()

const { getEmployee } = useMockData()
const shiftStore = useShiftStore()
const subStore   = useSubstitutionStore()
const boardStatus = computed(() => shiftStore.currentBoard?.status ?? 'DRAFT')

function hasPendingSub(entry: ShiftEntry): boolean {
  return !!subStore.requestsForEntry(entry.id)
}

// ─── Layout constants ─────────────────────────────────────────
const PX_PER_HOUR = 64          // pixels per hour across the 24h timeline
const EMP_COL_PX  = 176         // left employee info column width (px)
const STAT_COL_PX = 88          // right stat column width (px)

const ALL_HOURS = Array.from({ length: 24 }, (_, i) => i)  // 0..23

// ─── Date state ───────────────────────────────────────────────
const selectedDate = ref(props.periodStart)
const datePickerOpen = ref(false)
const dateInputRef = ref<HTMLInputElement | null>(null)

watch(datePickerOpen, (open) => {
  if (open) nextTick(() => dateInputRef.value?.showPicker?.())
})

function onDatePick(e: Event) {
  const val = (e.target as HTMLInputElement).value
  if (val) selectedDate.value = val
  datePickerOpen.value = false
}

const canGoPrev = computed(() => selectedDate.value > props.periodStart)
const canGoNext = computed(() => selectedDate.value < props.periodEnd)

function prevDay() {
  if (!canGoPrev.value) return
  const d = new Date(selectedDate.value)
  d.setDate(d.getDate() - 1)
  selectedDate.value = d.toISOString().slice(0, 10)
}

function nextDay() {
  if (!canGoNext.value) return
  const d = new Date(selectedDate.value)
  d.setDate(d.getDate() + 1)
  selectedDate.value = d.toISOString().slice(0, 10)
}

const DOW_LABELS = ['日', '月', '火', '水', '木', '金', '土']

const formattedDateLong = computed(() => {
  const d = new Date(selectedDate.value)
  const dow = DOW_LABELS[d.getDay()]
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日（${dow}）`
})

const isToday = computed(() => new Date().toISOString().slice(0, 10) === selectedDate.value)

// ─── Day entries ──────────────────────────────────────────────
const dayEntries = computed(() =>
  props.entries.filter(e => e.shiftDate === selectedDate.value),
)

const workingEntries = computed(() =>
  dayEntries.value.filter(e => !isDayOff(e.cellStatus)),
)

function isDayOff(status: string) {
  return status === 'DAY_OFF_REQUESTED' || status === 'DAY_OFF_CONFIRMED'
}

// ─── Dept groups ──────────────────────────────────────────────
const DEPT_ORDER = ['キッチン', 'ホール', 'レジ']

interface EmpRow {
  entry: ShiftEntry
  employee: { id: string; name: string; position: string; department: string }
}

const deptGroups = computed(() => {
  const groups = new Map<string, EmpRow[]>()
  for (const dept of DEPT_ORDER) groups.set(dept, [])

  for (const entry of dayEntries.value) {
    const emp = getEmployee(entry.employeeId)
    if (!emp) continue
    const dept = entry.department
    if (!groups.has(dept)) groups.set(dept, [])
    groups.get(dept)!.push({ entry, employee: emp })
  }

  for (const [, rows] of groups) {
    rows.sort((a, b) => a.entry.startTime.localeCompare(b.entry.startTime))
  }

  return Array.from(groups.entries())
    .filter(([, rows]) => rows.length > 0)
    .map(([name, rows]) => ({ name, rows }))
})

// ─── Summary chips ────────────────────────────────────────────
const DEPT_COLORS: Record<string, string> = { キッチン: 'orange', ホール: 'blue', レジ: 'purple' }
const DEPT_ICON_COLORS: Record<string, string> = { キッチン: '#f97316', ホール: '#3587dc', レジ: '#7c3aed' }

const deptSummary = computed(() =>
  deptGroups.value
    .filter(g => g.rows.some(r => !isDayOff(r.entry.cellStatus)))
    .map(g => ({
      name: g.name,
      count: g.rows.filter(r => !isDayOff(r.entry.cellStatus)).length,
      color: DEPT_COLORS[g.name] ?? 'default',
    })),
)

const dayCost = computed(() =>
  workingEntries.value.reduce((sum, e) => sum + (e.estimatedWage ?? 0), 0),
)

// ─── Per-employee totals ──────────────────────────────────────
function toMinutes(time: string) {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

function empTotalHours(empId: string): number | string {
  const mins = dayEntries.value
    .filter(e => e.employeeId === empId && !isDayOff(e.cellStatus))
    .reduce((sum, e) => sum + toMinutes(e.endTime) - toMinutes(e.startTime), 0)
  const h = mins / 60
  return h % 1 === 0 ? h : h.toFixed(1)
}

function empTotalWage(empId: string): number {
  return dayEntries.value
    .filter(e => e.employeeId === empId && !isDayOff(e.cellStatus))
    .reduce((sum, e) => sum + (e.estimatedWage ?? 0), 0)
}

// ─── Bar positioning (pixel-based, 0-24h space) ───────────────
function barStyle(entry: ShiftEntry) {
  const startMins = toMinutes(entry.startTime)
  const endMins   = toMinutes(entry.endTime)
  return {
    left:  `${startMins / 60 * PX_PER_HOUR}px`,
    width: `${Math.max(4, (endMins - startMins) / 60 * PX_PER_HOUR)}px`,
  }
}

function adjDotStyle(entry: ShiftEntry) {
  const endMins = toMinutes(entry.endTime)
  return { left: `${endMins / 60 * PX_PER_HOUR - 6}px` }
}

function barClass(status: string) {
  return {
    'shift-bar--confirmed': status === 'CONFIRMED',
    'shift-bar--requested': status === 'SHIFT_REQUESTED',
    'shift-bar--adjusting': status === 'ADJUSTING',
  }
}

// ─── Default scroll: center on active shifts ──────────────────
const scrollRef     = ref<HTMLElement | null>(null)
const bodyScrollRef = ref<HTMLElement | null>(null)

const activeRange = computed(() => {
  if (workingEntries.value.length === 0) return { startH: 8, endH: 20 }
  const startMins = Math.min(...workingEntries.value.map(e => toMinutes(e.startTime)))
  const endMins   = Math.max(...workingEntries.value.map(e => toMinutes(e.endTime)))
  return {
    startH: Math.max(0,  Math.floor(startMins / 60) - 1),
    endH:   Math.min(24, Math.ceil(endMins   / 60) + 1),
  }
})

watch([selectedDate, bodyScrollRef], () => {
  nextTick(() => {
    if (!bodyScrollRef.value) return
    bodyScrollRef.value.scrollLeft = activeRange.value.startH * PX_PER_HOUR
  })
}, { immediate: true })

function syncHeaderScroll(e: Event) {
  if (scrollRef.value)
    scrollRef.value.scrollLeft = (e.target as HTMLElement).scrollLeft
}

// ─── Current time ─────────────────────────────────────────────
const now = ref(new Date())
onMounted(() => {
  const id = setInterval(() => { now.value = new Date() }, 60_000)
  onUnmounted(() => clearInterval(id))
})

const nowLineLeft = computed(() => {
  if (!isToday.value) return null
  const mins = now.value.getHours() * 60 + now.value.getMinutes()
  return mins / 60 * PX_PER_HOUR
})

const nowTimeLabel = computed(() => {
  const h = String(now.value.getHours()).padStart(2, '0')
  const m = String(now.value.getMinutes()).padStart(2, '0')
  return `${h}:${m}`
})

function isNowHour(h: number) {
  return now.value.getHours() === h
}

// ─── Employee display helpers ─────────────────────────────────
const DEPT_AVATAR_COLORS: Record<string, string> = {
  キッチン: 'avatar--kitchen',
  ホール:   'avatar--hall',
  レジ:     'avatar--register',
}

function avatarClass(dept: string) {
  return DEPT_AVATAR_COLORS[dept] ?? ''
}

function avatarInitial(name: string) {
  // Use last kanji character of family name for a compact 1-char initial
  return name.replace(/\s/g, '').charAt(0)
}

// ─── Entry editor ─────────────────────────────────────────────
const editorOpen = ref(false)
const editorState = reactive({
  employeeId: '',
  shiftDate: '',
  entry: null as ShiftEntry | null,
})

function openEditor(entry: ShiftEntry) {
  editorState.employeeId = entry.employeeId
  editorState.shiftDate = entry.shiftDate
  editorState.entry = entry
  editorOpen.value = true
}

function handleEditorSave(changes: Partial<ShiftEntry>) {
  if (editorState.entry) {
    shiftStore.updateEntry(editorState.entry.id, changes)
  }
}

function handleEditorDelete(entryId: string) {
  shiftStore.deleteEntry(entryId)
}

// v-bind CSS vars
const empColPx  = `${EMP_COL_PX}px`
const statColPx = `${STAT_COL_PX}px`
</script>

<style scoped>
.daily-view { position: relative; font-size: 13px; }

/* ─── Date display ─────────────────────────────────────────── */
.date-display {
  display: flex; align-items: center; cursor: pointer;
  padding: 4px 10px; border-radius: 8px; transition: background 0.1s;
}
.date-display:hover { background: rgba(0,0,0,0.05); }
.date-label { font-size: 15px; font-weight: 700; }
.hidden-date-input { position: absolute; opacity: 0; pointer-events: none; width: 1px; height: 1px; }

/* ─── Empty state ──────────────────────────────────────────── */
.empty-state {
  display: flex; flex-direction: column; align-items: center;
  justify-content: center; padding: 64px 0;
}

/* ─── Timeline outer ───────────────────────────────────────── */
.timeline-outer { position: relative; }

/* ─── Header row (time axis) ───────────────────────────────── */
.timeline-header-row {
  display: flex;
  align-items: flex-end;
  padding-bottom: 2px;
  border-bottom: 1px solid rgba(0,0,0,0.1);
  margin-bottom: 0;
}
.scroll-area--header {
  flex: 1;
  overflow: hidden;   /* header doesn't show scrollbar; synced via JS */
  pointer-events: none;
}

/* ─── Body wrap ────────────────────────────────────────────── */
.timeline-body-wrap {
  display: flex;
  position: relative;
}
.emp-col-spacer { flex-shrink: 0; width: v-bind(empColPx); }
.scroll-area--body {
  flex: 1;
  overflow-x: auto;
  overflow-y: visible;
  min-width: 0;
}
.scroll-area--body::-webkit-scrollbar { height: 5px; }
.scroll-area--body::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.15); border-radius: 3px; }

/* ─── Shared inner timeline width ──────────────────────────── */
.timeline-inner { width: 1536px; /* 24 * 64px */ position: relative; }
.timeline-inner--body { min-height: 10px; }

/* ─── Time axis ────────────────────────────────────────────── */
.time-axis { display: flex; }
.time-tick {
  flex-shrink: 0;
  font-size: 10px;
  color: rgba(0,0,0,0.4);
  padding-left: 3px;
  white-space: nowrap;
  line-height: 1.6;
}

/* ─── Stat column header ───────────────────────────────────── */
.stat-col { flex-shrink: 0; width: v-bind(statColPx); }
.stat-col--header {
  display: flex; align-items: flex-end;
  padding-bottom: 3px; padding-left: 8px;
}
.stat-header-label {
  font-size: 9px; font-weight: 700;
  color: rgba(0,0,0,0.35); text-transform: uppercase; letter-spacing: 0.05em;
  white-space: nowrap;
}

/* ─── Grid background ──────────────────────────────────────── */
.grid-bg {
  position: absolute; top: 0; left: 0; right: 0; bottom: 0;
  display: flex; pointer-events: none; z-index: 0;
}
.grid-col {
  flex-shrink: 0; height: 100%;
  border-left: 1px solid rgba(0,0,0,0.055);
}
.grid-col:nth-child(even) { background: rgba(0,0,0,0.008); }
.grid-col--now { border-left-color: rgba(239,68,68,0.18); background: rgba(239,68,68,0.03); }

/* ─── Dept separator ───────────────────────────────────────── */
.dept-group { position: relative; }
.dept-sep {
  display: flex; align-items: center; height: 26px;
  padding: 0 8px; position: relative; z-index: 1;
}
.dept-sep__label {
  font-size: 10px; font-weight: 700;
  color: rgba(0,0,0,0.35); text-transform: uppercase; letter-spacing: 0.06em;
  white-space: nowrap; padding-right: 8px;
  /* invisible in timeline area — shown only via the overlay */
  opacity: 0;
}
.dept-sep__line { flex: 1; height: 1px; background: rgba(0,0,0,0.07); }

/* ─── Employee row in timeline ─────────────────────────────── */
.emp-row-timeline {
  position: relative; height: 46px;
  border-bottom: 1px solid rgba(0,0,0,0.04);
  z-index: 1;
}
.emp-row-timeline:last-child { border-bottom: none; }

/* ─── Shift bar ────────────────────────────────────────────── */
.shift-bar {
  position: absolute; top: 50%; transform: translateY(-50%);
  height: 28px; border-radius: 6px;
  display: flex; align-items: center; overflow: hidden;
  transition: filter 0.1s, box-shadow 0.1s; cursor: pointer;
}
.shift-bar:hover { filter: brightness(0.93); box-shadow: 0 2px 6px rgba(0,0,0,0.18); }

.shift-bar--confirmed    { background: #3587dc; color: #fff; }
.shift-bar--requested    { background: rgba(53,135,220,0.12); border: 1.5px solid #3587dc; color: #1d4ed8; }
.shift-bar--adjusting    { background: #f59e0b; color: #1c1917; }
.shift-bar--dayoff-req   { background: rgba(100,116,139,0.10); border: 1.5px dashed #94a3b8; color: #64748b; }
.shift-bar--dayoff-conf  { background: #64748b; border: 1.5px solid #64748b; color: #fff; }

.shift-bar__inner { display: flex; align-items: center; gap: 4px; padding: 0 8px; overflow: hidden; white-space: nowrap; }
.shift-bar__time  { font-size: 10px; font-weight: 600; }

/* ─── Pending substitution badge on bar ────────────────────── */
.sub-bar-badge { position: absolute; top: 2px; pointer-events: none; }

/* ─── Adjusting dot ────────────────────────────────────────── */
.adj-dot { position: absolute; top: 5px; }

/* ─── Now line ─────────────────────────────────────────────── */
.now-line {
  position: absolute; top: 0; bottom: 0; width: 2px;
  background: rgba(239,68,68,0.65); pointer-events: none; z-index: 2;
}
.now-label {
  position: absolute; bottom: 2px;
  transform: translateX(-50%);
  font-size: 9px; font-weight: 700;
  color: rgba(239,68,68,0.75);
  background: white; padding: 0 3px; border-radius: 3px;
  pointer-events: none; z-index: 3; white-space: nowrap;
}

/* ─── Left: employee info overlay ──────────────────────────── */
.emp-col-overlay {
  position: absolute;
  top: 0; left: 0;
  width: v-bind(empColPx);
  pointer-events: none;
  background: white;
  z-index: 10;
}

.emp-dept-sep-row {
  height: 26px;
  display: flex; align-items: center;
  padding: 0 0 0 2px;
  font-size: 10px; font-weight: 700;
  color: rgba(0,0,0,0.45); text-transform: uppercase; letter-spacing: 0.06em;
}

.emp-info-row {
  height: 46px;
  display: flex; align-items: center;
  gap: 8px;
  padding-right: 6px;
  border-bottom: 1px solid rgba(0,0,0,0.04);
}
.emp-info-row:last-child { border-bottom: none; }

.emp-info-row--clickable {
  pointer-events: auto;
  cursor: pointer;
  transition: background 0.1s;
}
.emp-info-row--clickable:hover { background: rgba(0,0,0,0.035); }

.emp-chevron {
  flex-shrink: 0;
  opacity: 0;
  transition: opacity 0.1s;
}
.emp-info-row--clickable:hover .emp-chevron { opacity: 1; }

.emp-avatar {
  width: 28px; height: 28px; border-radius: 50%;
  font-size: 12px; font-weight: 700;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.avatar--kitchen  { background: rgba(251,146,60,0.15);  color: #ea580c; }
.avatar--hall     { background: rgba(53,135,220,0.13);  color: #3587dc; }
.avatar--register { background: rgba(139,92,246,0.13);  color: #7c3aed; }

.emp-text { min-width: 0; }
.emp-name {
  font-size: 12px; font-weight: 600;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis; line-height: 1.35;
}
.emp-pos {
  font-size: 10px; color: rgba(0,0,0,0.45);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis; line-height: 1.2;
}

/* ─── Right: stat column ───────────────────────────────────── */
.stat-col-body {
  flex-shrink: 0;
  width: v-bind(statColPx);
  border-left: 1px solid rgba(0,0,0,0.08);
  padding-left: 10px;
}

.stat-dept-sep-spacer { height: 26px; }

.stat-cell {
  height: 46px;
  display: flex; flex-direction: column;
  justify-content: center; gap: 2px;
  border-bottom: 1px solid rgba(0,0,0,0.04);
}
.stat-cell:last-child { border-bottom: none; }

.stat-hours {
  font-size: 13px; font-weight: 700; line-height: 1.2;
  color: rgba(0,0,0,0.8);
}
.stat-wage {
  font-size: 10px; color: rgba(0,0,0,0.45); line-height: 1.2;
}
.stat-dayoff {
  font-size: 11px; color: rgba(0,0,0,0.3); font-weight: 600;
}

.dept-count-label {
  font-size: 9px; font-weight: 500;
  color: rgba(0,0,0,0.35); margin-left: 4px;
}
</style>
