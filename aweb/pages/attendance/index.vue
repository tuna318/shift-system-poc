<template>
  <div class="att-overview">

    <!-- ── Header ──────────────────────────────────────────── -->
    <div class="d-flex align-center justify-space-between mb-4">
      <div>
        <h1 class="text-h5 font-weight-bold">勤怠一覧</h1>
        <p class="text-body-2 text-medium-emphasis mt-1">スタッフの出退勤状況を月単位で管理します</p>
      </div>
      <div class="d-flex ga-2">
        <v-btn v-if="attStore.pendingApprovalCount > 0" to="/attendance/approval" color="primary" variant="flat" size="small" rounded="lg" prepend-icon="mdi-check-circle-outline">
          申請済み {{ attStore.pendingApprovalCount }}件
        </v-btn>
        <v-btn v-if="attStore.pendingCorrectionCount > 0" to="/attendance/modifications" color="warning" variant="tonal" size="small" rounded="lg" prepend-icon="mdi-pencil-outline">
          修正申請 {{ attStore.pendingCorrectionCount }}件
        </v-btn>
      </div>
    </div>

    <!-- ── Toolbar ──────────────────────────────────────────── -->
    <div class="toolbar mb-3">
      <div class="month-nav">
        <v-btn icon size="small" variant="text" @click="prevMonth"><v-icon size="18">mdi-chevron-left</v-icon></v-btn>
        <span class="month-label">{{ viewYear }}年{{ viewMonth }}月</span>
        <v-btn icon size="small" variant="text" @click="nextMonth"><v-icon size="18">mdi-chevron-right</v-icon></v-btn>
        <v-btn size="x-small" variant="tonal" color="primary" rounded="lg" @click="goCurrentMonth">今月</v-btn>
      </div>

      <div class="toolbar-sep" />

      <v-chip-group v-model="deptFilter" mandatory>
        <v-chip value="ALL"    size="small" rounded="lg" filter variant="tonal">全部署</v-chip>
        <v-chip value="キッチン" size="small" rounded="lg" filter variant="tonal" color="orange">キッチン</v-chip>
        <v-chip value="ホール"   size="small" rounded="lg" filter variant="tonal" color="teal">ホール</v-chip>
        <v-chip value="レジ"     size="small" rounded="lg" filter variant="tonal" color="purple">レジ</v-chip>
      </v-chip-group>

      <div style="flex:1" />

      <v-text-field v-model="nameSearch" placeholder="名前で検索" density="compact" variant="outlined" hide-details rounded="lg" prepend-inner-icon="mdi-magnify" clearable style="max-width:150px" />
    </div>

    <!-- ── Legend ──────────────────────────────────────────── -->
    <div class="legend-row mb-2">
      <span class="leg-title">凡例</span>
      <span v-for="l in LEGEND" :key="l.label" class="leg-item">
        <span class="leg-swatch" :style="{ background: l.bg }" />{{ l.label }}
      </span>
      <div style="flex:1" />
      <!-- Cell format guide -->
      <div class="cell-guide">
        <div class="cg-cell">
          <span class="cg-actual">8h30</span>
          <span class="cg-planned">予 8h</span>
        </div>
        <div class="cg-labels">
          <span class="cg-label-actual">実績</span>
          <span class="cg-label-planned">予定</span>
        </div>
      </div>
      <span class="leg-count">{{ filteredEmployees.length }}名 · {{ monthDays.length }}日間</span>
    </div>

    <!-- ── Grid ─────────────────────────────────────────────── -->
    <div class="grid-outer">
      <div class="grid-scroll">
        <table class="att-table">
          <colgroup>
            <col class="col-emp">
            <col v-for="d in monthDays" :key="d" class="col-day">
            <col class="col-total">
          </colgroup>

          <!-- Header -->
          <thead>
            <tr>
              <th class="th-emp">スタッフ</th>
              <th
                v-for="d in monthDays"
                :key="d"
                class="th-day"
                :class="{
                  'th-today': d === todayStr,
                  'th-sun':   dowOf(d) === 0,
                  'th-sat':   dowOf(d) === 6,
                }"
              >
                <span class="th-dn">{{ dayNum(d) }}</span>
                <span class="th-dw">{{ DOW[dowOf(d)] }}</span>
              </th>
              <th class="th-total">月計 / 詳細</th>
            </tr>
          </thead>

          <!-- Department groups -->
          <tbody v-for="dept in visibleDepts" :key="dept">
            <tr>
              <td :colspan="monthDays.length + 2" class="dept-td">
                <span class="dept-dot" :style="{ background: DEPT_COLOR[dept] }" />
                {{ dept }}
                <span class="dept-count">{{ filteredEmployees.filter(e => e.department === dept).length }}名</span>
              </td>
            </tr>

            <tr v-for="emp in filteredEmployees.filter(e => e.department === dept)" :key="emp.id" class="emp-row">
              <!-- Staff name -->
              <td class="td-emp">
                <div class="emp-cell">
                  <v-avatar size="28" :color="DEPT_COLOR[emp.department]" rounded="md">
                    <span class="emp-initial">{{ emp.name[0] }}</span>
                  </v-avatar>
                  <div>
                    <div class="emp-name">{{ emp.name }}</div>
                    <div class="emp-pos">{{ emp.position }}</div>
                  </div>
                </div>
              </td>

              <!-- Day cells -->
              <td
                v-for="d in monthDays"
                :key="d"
                class="td-day"
                :class="[
                  cellStatusClass(emp.id, d),
                  {
                    'td-today':   d === todayStr,
                    'td-weekend': isWeekend(d),
                    'td-corr':    hasPendingCorr(emp.id, d),
                  }
                ]"
                :title="cellTooltip(emp.id, d)"
                @click="onCellClick(emp.id, d)"
              >
                <div class="cell-wrap">
                  <span class="dc-main">{{ cellText(emp.id, d) }}</span>
                  <span v-if="shiftSubText(emp.id, d)" class="dc-sub">{{ shiftSubText(emp.id, d) }}</span>
                </div>
              </td>

              <!-- Monthly total -->
              <td class="td-total">
                <div class="tc-r1">{{ monthWorkDays(emp.id) }}日 · {{ monthTotalHours(emp.id) }}</div>
                <div v-if="monthPending(emp.id) > 0" class="tc-r2">申請済み {{ monthPending(emp.id) }}件</div>
                <v-btn :to="`/attendance/${emp.id}`" size="x-small" variant="tonal" color="primary" rounded="lg" block class="tc-btn">詳細</v-btn>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import type { Employee, DayAttendanceSummary } from '~/types'
import { useAttendanceStore } from '~/stores/attendance.store'
import { useMockData } from '~/composables/useMockData'

const router = useRouter()
const attStore = useAttendanceStore()
const mock = useMockData()
const { employees } = mock

const DOW = ['日', '月', '火', '水', '木', '金', '土']

const DEPT_COLOR: Record<string, string> = {
  キッチン: '#f97316',
  ホール:   '#0d9488',
  レジ:     '#8b5cf6',
}

const LEGEND = [
  { label: '未申請',   bg: '#e5e7eb' },
  { label: '申請済み', bg: '#bfdbfe' },
  { label: '承認済み', bg: '#bbf7d0' },
  { label: '差し戻し', bg: '#fde68a' },
]

// ── Date helpers ──────────────────────────────────────────────

function dStr(y: number, m: number, d: number) {
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}
function dowOf(d: string) { return new Date(d).getDay() }
function dayNum(d: string) { return new Date(d).getDate() }
function isWeekend(d: string) { const w = dowOf(d); return w === 0 || w === 6 }

function fmtMins(mins: number): string {
  const h = Math.floor(mins / 60); const m = mins % 60
  return m > 0 ? `${h}h${String(m).padStart(2, '0')}` : `${h}h`
}

// ── Month navigation ──────────────────────────────────────────

const TODAY = new Date('2026-04-05')
const todayStr = dStr(TODAY.getFullYear(), TODAY.getMonth() + 1, TODAY.getDate())
const viewYear  = ref(TODAY.getFullYear())
const viewMonth = ref(TODAY.getMonth() + 1)

const monthDays = computed<string[]>(() => {
  const last = new Date(viewYear.value, viewMonth.value, 0).getDate()
  return Array.from({ length: last }, (_, i) => dStr(viewYear.value, viewMonth.value, i + 1))
})

function prevMonth() {
  if (viewMonth.value === 1) { viewYear.value--; viewMonth.value = 12 } else viewMonth.value--
}
function nextMonth() {
  if (viewMonth.value === 12) { viewYear.value++; viewMonth.value = 1 } else viewMonth.value++
}
function goCurrentMonth() {
  viewYear.value = TODAY.getFullYear(); viewMonth.value = TODAY.getMonth() + 1
}

// ── Filters ───────────────────────────────────────────────────

const deptFilter = ref('ALL')
const nameSearch = ref('')

const filteredEmployees = computed(() =>
  employees.filter((e: Employee) => {
    if (e.status !== 'ACTIVE') return false
    if (deptFilter.value !== 'ALL' && e.department !== deptFilter.value) return false
    if (nameSearch.value && !e.name.includes(nameSearch.value)) return false
    return true
  })
)

const visibleDepts = computed(() => {
  const s = new Set(filteredEmployees.value.map((e: Employee) => e.department))
  return ['キッチン', 'ホール', 'レジ'].filter(d => s.has(d))
})

// ── Summary data ──────────────────────────────────────────────

const monthSummaryMap = computed(() => attStore.getWeekSummaries(monthDays.value))

function getSummary(empId: string, date: string): DayAttendanceSummary | null {
  return monthSummaryMap.value.get(date)?.find(s => s.employeeId === empId) ?? null
}

// ── Shift info ────────────────────────────────────────────────

// ── Shift helpers ─────────────────────────────────────────────

const DAY_OFF_STATUSES = new Set(['DAY_OFF_CONFIRMED', 'DAY_OFF_REQUESTED'])

/** Total expected hours from working shifts (excludes day-off entries). Returns '' if none. */
function shiftHours(empId: string, date: string): string {
  const shifts = mock.getEmpShiftsForDate(empId, date)
    .filter(s => !DAY_OFF_STATUSES.has(s.cellStatus))
  if (shifts.length === 0) return ''
  const totalMins = shifts.reduce((sum, s) => {
    const [sh, sm] = s.startTime.split(':').map(Number)
    const [eh, em] = s.endTime.split(':').map(Number)
    return sum + Math.max(0, (eh * 60 + em) - (sh * 60 + sm))
  }, 0)
  return fmtMins(totalMins)
}

/** Text shown in the sub row: "予 8h" / "予 —" (past, no shift) / '' (future, no shift) */
function shiftSubText(empId: string, date: string): string {
  const hours = shiftHours(empId, date)
  if (hours) return `予 ${hours}`
  // Past date with an attendance record but no shift → show 予 — as a signal
  if (date <= todayStr) {
    const s = getSummary(empId, date)
    if (s && s.status !== 'NO_RECORD') return '予 —'
  }
  return ''
}

// ── Cell text (actual) ────────────────────────────────────────

function cellText(empId: string, date: string): string {
  const s = getSummary(empId, date)
  if (!s) return ''
  if (s.totalMinutes > 0) return fmtMins(s.totalMinutes)
  if (s.status === 'NOT_SUBMITTED') return '未申請'
  return ''
}

// ── Status class ──────────────────────────────────────────────

function cellStatusClass(empId: string, date: string): string {
  const s = getSummary(empId, date)
  if (!s || (s.status === 'NO_RECORD' && !s.shiftEntry)) return ''
  switch (s.status) {
    case 'APPROVED':             return 'st-approved'
    case 'PENDING_APPROVAL':     return 'st-pending'
    case 'CORRECTION_REQUESTED': return 'st-correction'
    case 'NOT_SUBMITTED':        return 'st-ns'
  }
  return ''
}

function hasPendingCorr(empId: string, date: string): boolean {
  return (getSummary(empId, date)?.pendingCorrectionCount ?? 0) > 0
}

// ── Tooltip ───────────────────────────────────────────────────

function cellTooltip(empId: string, date: string): string {
  const s = getSummary(empId, date)
  if (!s) return ''
  const dt = new Date(date)
  const labels: Record<string, string> = {
    APPROVED: '承認済み', PENDING_APPROVAL: '申請済み',
    CORRECTION_REQUESTED: '差し戻し', NOT_SUBMITTED: '未申請',
  }
  const actual = s.totalMinutes > 0 ? `  実績 ${fmtMins(s.totalMinutes)}` : ''
  const sh = shiftHours(empId, date)
  const shift = sh ? `  シフト ${sh}` : ''
  const corr = s.pendingCorrectionCount > 0 ? `  修正申請${s.pendingCorrectionCount}件` : ''
  return `${dt.getMonth() + 1}/${dt.getDate()}(${DOW[dt.getDay()]})  ${labels[s.status] ?? ''}${shift}${actual}${corr}`
}

function onCellClick(empId: string, date: string) {
  const s = getSummary(empId, date)
  if (!s || (s.status === 'NO_RECORD' && !s.shiftEntry)) return
  router.push(`/attendance/${empId}/${date}`)
}

// ── Monthly aggregates ────────────────────────────────────────

function monthWorkDays(empId: string) {
  return monthDays.value.filter(d => (getSummary(empId, d)?.totalMinutes ?? 0) > 0).length
}
function monthTotalMins(empId: string) {
  return monthDays.value.reduce((s, d) => s + (getSummary(empId, d)?.totalMinutes ?? 0), 0)
}
function monthTotalHours(empId: string) {
  const m = monthTotalMins(empId)
  return m === 0 ? '—' : fmtMins(m)
}
function monthPending(empId: string) {
  return monthDays.value.filter(d => getSummary(empId, d)?.status === 'PENDING_APPROVAL').length
}
</script>

<style scoped>
/* ── Toolbar ─────────────────────────── */
.toolbar {
  display: flex; align-items: center; flex-wrap: wrap; gap: 10px;
  padding: 8px 12px;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
}
.toolbar-sep { width: 1px; height: 22px; background: #e5e7eb; flex-shrink: 0; }
.month-nav   { display: flex; align-items: center; gap: 2px; }
.month-label { font-size: 14px; font-weight: 700; min-width: 90px; text-align: center; }

/* ── Legend ─────────────────────────── */
.legend-row  { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.leg-title   { font-size: 11px; color: #9ca3af; font-weight: 600; }
.leg-item    { display: flex; align-items: center; gap: 3px; font-size: 11px; color: #6b7280; }
.leg-swatch  { width: 10px; height: 10px; border-radius: 2px; flex-shrink: 0; }
.leg-count   { font-size: 11px; color: #9ca3af; }

/* Cell format guide */
.cell-guide {
  display: flex; align-items: center; gap: 6px;
  padding: 3px 8px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  background: #fafafa;
}
.cg-cell {
  display: flex; flex-direction: column; align-items: center;
  gap: 1px; min-width: 30px;
}
.cg-actual  { font-size: 11px; font-weight: 800; color: #374151; line-height: 1; font-feature-settings: "tnum"; }
.cg-planned { font-size: 8px;  font-weight: 500; color: #9ca3af;  line-height: 1; font-feature-settings: "tnum"; }
.cg-labels  { display: flex; flex-direction: column; gap: 2px; }
.cg-label-actual  { font-size: 9px; color: #374151; font-weight: 600; line-height: 1; }
.cg-label-planned { font-size: 9px; color: #9ca3af; font-weight: 500; line-height: 1; }

/* ── Grid ───────────────────────────── */
.grid-outer {
  border: 1px solid #d1d5db;
  border-radius: 10px;
  overflow: hidden;
  background: #fff;
}
.grid-scroll {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}
.grid-scroll::-webkit-scrollbar { height: 5px; }
.grid-scroll::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }

/* ── Table ──────────────────────────── */
.att-table {
  border-collapse: collapse;
  table-layout: fixed;
  white-space: nowrap;
}
.col-emp   { width: 160px; }
.col-day   { width: 58px; }
.col-total { width: 120px; }

/* ── Header ─────────────────────────── */
.th-emp {
  position: sticky; left: 0; z-index: 3;
  background: #f8fafc;
  text-align: left; padding: 7px 12px;
  font-size: 11px; font-weight: 600; color: #9ca3af;
  border-bottom: 2px solid #e5e7eb;
  border-right: 2px solid #d1d5db;
  box-shadow: 2px 0 4px rgba(0,0,0,0.05);
}
.th-day {
  text-align: center; padding: 4px 0;
  background: #f8fafc;
  border-bottom: 2px solid #e5e7eb;
  border-right: 1px solid #e5e7eb;
}
.th-today { background: #f8fafc !important; box-shadow: inset 0 0 0 2px #2563eb; }
.th-sun   { background: #fef2f2 !important; }
.th-sat   { background: #f0f4ff !important; }

.th-dn { display: block; font-size: 13px; font-weight: 700; color: #374151; line-height: 1.3; }
.th-dw { display: block; font-size: 9px; font-weight: 500; color: #9ca3af; line-height: 1; }
.th-today .th-dn { color: #2563eb; }
.th-today .th-dw { color: #93c5fd; }
.th-sun .th-dn   { color: #dc2626; }
.th-sun .th-dw   { color: #fca5a5; }
.th-sat .th-dn   { color: #2563eb; }
.th-sat .th-dw   { color: #93c5fd; }

.th-total {
  position: sticky; right: 0; z-index: 3;
  background: #f8fafc;
  text-align: center; padding: 7px 10px;
  font-size: 11px; font-weight: 600; color: #9ca3af;
  border-bottom: 2px solid #e5e7eb;
  border-left: 2px solid #d1d5db;
  box-shadow: -2px 0 4px rgba(0,0,0,0.05);
}

/* ── Dept separator ─────────────────── */
.dept-td {
  padding: 4px 12px;
  font-size: 11px; font-weight: 700; color: #64748b;
  background: #f1f5f9;
  border-top: 1px solid #e2e8f0;
  border-bottom: 1px solid #e2e8f0;
}
.dept-dot {
  display: inline-block; width: 6px; height: 6px;
  border-radius: 50%; margin-right: 5px; vertical-align: middle;
}
.dept-count { color: #94a3b8; font-weight: 500; margin-left: 3px; }

/* ── Employee td ────────────────────── */
.td-emp {
  position: sticky; left: 0; z-index: 2;
  background: #fff;
  padding: 0 10px;
  border-bottom: 1px solid #f1f5f9;
  border-right: 2px solid #d1d5db;
  box-shadow: 2px 0 4px rgba(0,0,0,0.05);
  vertical-align: middle;
  height: 52px;
}
.emp-row:hover .td-emp { background: #f8fafc; }
.emp-cell   { display: flex; align-items: center; gap: 7px; }
.emp-initial{ font-size: 11px; font-weight: 700; color: #fff; }
.emp-name   { font-size: 12px; font-weight: 600; color: #111827; }
.emp-pos    { font-size: 10px; color: #9ca3af; }

/* ── Day cells ──────────────────────── */
.td-day {
  text-align: center;
  vertical-align: middle;
  height: 52px;
  border-bottom: 1px solid #f1f5f9;
  border-right: 1px solid #f1f5f9;
  padding: 3px 2px;
  cursor: default;
  background: #fff;
  /* two-row flex layout */
  display: table-cell; /* keep default */
}

/* Cell flex wrapper */
.cell-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 52px;
  gap: 0;
  padding: 2px 1px;
}

/* Actual hours — dominant */
.dc-main {
  font-size: 13px;
  font-weight: 800;
  line-height: 1.1;
  font-feature-settings: "tnum";
  letter-spacing: -0.03em;
  color: transparent; /* overridden by status classes */
  min-height: 1em;   /* keeps layout stable when empty */
}

/* Planned hours — clearly secondary */
.dc-sub {
  font-size: 9px;
  font-weight: 500;
  line-height: 1;
  color: rgba(0, 0, 0, 0.38);
  letter-spacing: 0;
  font-feature-settings: "tnum";
}

/* Status variants */
.st-approved   { background: #f0fdf4; cursor: pointer; }
.st-approved   .dc-main { color: #15803d; }

.st-pending    { background: #eff6ff; cursor: pointer; }
.st-pending    .dc-main { color: #1d4ed8; }

.st-correction { background: #fefce8; cursor: pointer; }
.st-correction .dc-main { color: #92400e; }

.st-ns         { background: #e5e7eb; cursor: pointer; }
.st-ns         .dc-main { color: #374151; }

/* Weekend tint for empty/nil cells only */
.td-weekend:not([class*="st-"]) { background: #fafafa; }

/* Today column — left/right inset shadow only, backgrounds stay normal */
.td-today { box-shadow: inset 2px 0 0 #2563eb, inset -2px 0 0 #2563eb; }

/* Pending correction — amber bottom border */
.td-corr { border-bottom: 2px solid #fbbf24 !important; }

.td-day[class*="st-"]:hover { filter: brightness(0.94); }

/* ── Monthly total td ───────────────── */
.td-total {
  position: sticky; right: 0; z-index: 2;
  background: #fff;
  padding: 5px 10px;
  border-bottom: 1px solid #f1f5f9;
  border-left: 2px solid #d1d5db;
  box-shadow: -2px 0 4px rgba(0,0,0,0.05);
  vertical-align: middle;
  text-align: center;
  height: 52px;
}
.emp-row:hover .td-total { background: #f8fafc; }

.tc-r1 {
  font-size: 11px; font-weight: 700; color: #111827;
  font-feature-settings: "tnum"; white-space: nowrap; line-height: 1.4;
}
.tc-r2 {
  font-size: 10px; font-weight: 600; color: #2563eb;
  line-height: 1.4;
}
.tc-btn { margin-top: 4px !important; }
</style>
