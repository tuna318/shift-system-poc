<template>
  <div>
    <!-- ── Header ──────────────────────────────────────────── -->
    <div class="d-flex align-center justify-space-between mb-5">
      <div>
        <h1 class="text-h5 font-weight-bold">勤怠一覧</h1>
        <p class="text-body-2 text-medium-emphasis mt-1">スタッフの出退勤状況を週単位で確認できます</p>
      </div>
      <div class="d-flex ga-2 align-center">
        <v-chip v-if="attStore.pendingApprovalCount > 0" color="primary" size="small" variant="flat" to="/attendance/approval">
          <v-icon start size="14">mdi-clock-outline</v-icon>
          承認待ち {{ attStore.pendingApprovalCount }}件
        </v-chip>
        <v-chip v-if="attStore.pendingCorrectionCount > 0" color="warning" size="small" variant="flat" to="/attendance/modifications">
          <v-icon start size="14">mdi-pencil-outline</v-icon>
          修正申請 {{ attStore.pendingCorrectionCount }}件
        </v-chip>
      </div>
    </div>

    <!-- ── Controls ────────────────────────────────────────── -->
    <v-card rounded="xl" elevation="0" border class="mb-4">
      <v-card-text class="pa-4">
        <div class="d-flex flex-wrap align-center ga-3">
          <!-- Week navigation -->
          <div class="d-flex align-center ga-1">
            <v-btn icon size="small" variant="text" @click="prevWeek">
              <v-icon>mdi-chevron-left</v-icon>
            </v-btn>
            <div class="week-label text-body-2 font-weight-medium text-center" style="min-width:160px">
              {{ weekLabel }}
            </div>
            <v-btn icon size="small" variant="text" @click="nextWeek">
              <v-icon>mdi-chevron-right</v-icon>
            </v-btn>
            <v-btn size="x-small" variant="tonal" rounded="lg" @click="goToday">今週</v-btn>
          </div>

          <v-divider vertical class="mx-1" />

          <!-- Department filter -->
          <v-chip-group v-model="deptFilter" mandatory>
            <v-chip value="ALL" size="small" rounded="lg" filter>全部署</v-chip>
            <v-chip value="キッチン" size="small" rounded="lg" filter>キッチン</v-chip>
            <v-chip value="ホール" size="small" rounded="lg" filter>ホール</v-chip>
            <v-chip value="レジ" size="small" rounded="lg" filter>レジ</v-chip>
          </v-chip-group>

          <v-divider vertical class="mx-1" />

          <!-- Status filter -->
          <v-select
            v-model="statusFilter"
            :items="statusItems"
            item-title="label"
            item-value="value"
            density="compact"
            variant="outlined"
            hide-details
            rounded="lg"
            style="max-width:140px"
          />

          <!-- Name search -->
          <v-text-field
            v-model="nameSearch"
            placeholder="名前で検索"
            density="compact"
            variant="outlined"
            hide-details
            rounded="lg"
            prepend-inner-icon="mdi-magnify"
            clearable
            style="max-width:160px"
          />
        </div>
      </v-card-text>
    </v-card>

    <!-- ── Legend ──────────────────────────────────────────── -->
    <div class="d-flex align-center ga-3 mb-3 flex-wrap">
      <span class="text-caption text-medium-emphasis">凡例：</span>
      <div v-for="leg in legend" :key="leg.label" class="d-flex align-center ga-1">
        <span class="legend-dot" :style="{ background: leg.color }" />
        <span class="text-caption">{{ leg.label }}</span>
      </div>
    </div>

    <!-- ── Grid ────────────────────────────────────────────── -->
    <v-card rounded="xl" elevation="0" border>
      <div class="week-grid-wrap">
        <table class="week-table">
          <!-- Col definitions for sticky first col -->
          <colgroup>
            <col style="min-width:160px;width:160px">
            <col v-for="d in weekDays" :key="d" style="min-width:90px">
            <col style="min-width:70px;width:70px">
          </colgroup>

          <!-- Header -->
          <thead>
            <tr>
              <th class="th-emp">スタッフ</th>
              <th v-for="d in weekDays" :key="d" class="th-day" :class="{ 'th-today': d === todayStr }">
                <div class="day-header">
                  <span class="day-num" :class="{ 'text-error': dowOf(d) === 0, 'text-primary': dowOf(d) === 6 }">
                    {{ formatDayHeader(d) }}
                  </span>
                  <v-chip v-if="d === todayStr" color="primary" size="x-small" variant="flat">今日</v-chip>
                </div>
              </th>
              <th class="th-total">週計</th>
            </tr>
          </thead>

          <!-- Department groups -->
          <tbody v-for="dept in visibleDepts" :key="dept">
            <!-- Dept header row -->
            <tr class="dept-row">
              <td :colspan="weekDays.length + 2" class="dept-label">
                <v-icon size="14" class="mr-1">mdi-tag-outline</v-icon>{{ dept }}
              </td>
            </tr>

            <!-- Employee rows -->
            <tr
              v-for="emp in filteredEmployees.filter(e => e.department === dept)"
              :key="emp.id"
              class="emp-row"
              :class="{ 'emp-row--highlighted': highlightEmpId === emp.id }"
              @mouseenter="highlightEmpId = emp.id"
              @mouseleave="highlightEmpId = null"
            >
              <!-- Employee name -->
              <td class="td-emp">
                <div class="d-flex align-center ga-2">
                  <v-avatar size="28" color="surface-variant" rounded="lg">
                    <span class="text-caption">{{ emp.name[0] }}</span>
                  </v-avatar>
                  <div>
                    <div class="text-caption font-weight-medium">{{ emp.name }}</div>
                    <div class="text-caption text-medium-emphasis" style="font-size:10px">{{ emp.position }}</div>
                  </div>
                </div>
              </td>

              <!-- Day cells -->
              <td v-for="d in weekDays" :key="d" class="td-cell">
                <AttendanceCellChip
                  v-if="getSummary(emp.id, d) as any"
                  :status="getSummary(emp.id, d)!.status"
                  :total-minutes="getSummary(emp.id, d)!.totalMinutes"
                  :session-count="getSummary(emp.id, d)!.sessionCount"
                  :pending-correction-count="getSummary(emp.id, d)!.pendingCorrectionCount"
                  :compliance-flags="getSummary(emp.id, d)!.complianceFlags"
                  :has-shift="!!getSummary(emp.id, d)!.shiftEntry"
                  @click="navigateToDay(emp.id, d, getSummary(emp.id, d)!)"
                />
                <span v-else class="text-caption text-disabled">—</span>
              </td>

              <!-- Week total -->
              <td class="td-total">
                <div class="text-caption font-weight-bold">{{ weekTotal(emp.id) }}</div>
                <div v-if="weekSessions(emp.id) > 0" class="text-caption text-medium-emphasis" style="font-size:10px">
                  {{ weekSessions(emp.id) }}件
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import type { Employee, DayAttendanceSummary } from '~/types'
import { useAttendanceStore } from '~/stores/attendance.store'
import { useMockData } from '~/composables/useMockData'

const router = useRouter()
const attStore = useAttendanceStore()
const { employees } = useMockData()

// ── Week navigation ──────────────────────────────────────────

function getMondayOf(date: Date): Date {
  const d = new Date(date)
  const dow = d.getDay()
  const diff = dow === 0 ? -6 : 1 - dow
  d.setDate(d.getDate() + diff)
  return d
}

function dateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const today = new Date('2026-04-04')
const todayStr = dateStr(today)
const weekStart = ref(dateStr(getMondayOf(today)))

const weekDays = computed(() => {
  const days: string[] = []
  const start = new Date(weekStart.value)
  for (let i = 0; i < 7; i++) {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    days.push(dateStr(d))
  }
  return days
})

const weekLabel = computed(() => {
  const start = new Date(weekDays.value[0])
  const end = new Date(weekDays.value[6])
  const sm = start.getMonth() + 1
  const sd = start.getDate()
  const em = end.getMonth() + 1
  const ed = end.getDate()
  return sm === em
    ? `${start.getFullYear()}年${sm}月${sd}日〜${ed}日`
    : `${start.getFullYear()}年${sm}月${sd}日〜${em}月${ed}日`
})

function prevWeek() { const d = new Date(weekStart.value); d.setDate(d.getDate() - 7); weekStart.value = dateStr(d) }
function nextWeek() { const d = new Date(weekStart.value); d.setDate(d.getDate() + 7); weekStart.value = dateStr(d) }
function goToday() { weekStart.value = dateStr(getMondayOf(today)) }

function dowOf(d: string): number { return new Date(d).getDay() }

function formatDayHeader(d: string): string {
  const date = new Date(d)
  const dow = ['日', '月', '火', '水', '木', '金', '土'][date.getDay()]
  return `${date.getMonth() + 1}/${date.getDate()}(${dow})`
}

// ── Filters ──────────────────────────────────────────────────

const deptFilter = ref('ALL')
const statusFilter = ref('ALL')
const nameSearch = ref('')
const highlightEmpId = ref<string | null>(null)

const statusItems = [
  { label: 'すべて', value: 'ALL' },
  { label: '承認待ち', value: 'PENDING_APPROVAL' },
  { label: '差戻し中', value: 'CORRECTION_REQUESTED' },
  { label: '未提出', value: 'NOT_SUBMITTED' },
  { label: '承認済み', value: 'APPROVED' },
]

const activeEmployees = computed(() => employees.filter((e: Employee) => e.status === 'ACTIVE'))

const filteredEmployees = computed(() => {
  return activeEmployees.value.filter((e: Employee) => {
    if (deptFilter.value !== 'ALL' && e.department !== deptFilter.value) return false
    if (nameSearch.value && !e.name.includes(nameSearch.value)) return false
    if (statusFilter.value !== 'ALL') {
      const hasStatus = weekDays.value.some(d => getSummary(e.id, d)?.status === statusFilter.value)
      if (!hasStatus) return false
    }
    return true
  })
})

const visibleDepts = computed(() => {
  const depts = new Set(filteredEmployees.value.map((e: Employee) => e.department))
  return ['キッチン', 'ホール', 'レジ'].filter(d => depts.has(d))
})

// ── Summary data ─────────────────────────────────────────────

const weekSummaryMap = computed(() => attStore.getWeekSummaries(weekDays.value))

function getSummary(empId: string, date: string): DayAttendanceSummary | null {
  const daySummaries = weekSummaryMap.value.get(date)
  if (!daySummaries) return null
  return daySummaries.find(s => s.employeeId === empId) ?? null
}

function weekTotal(empId: string): string {
  let total = 0
  weekDays.value.forEach(d => { total += getSummary(empId, d)?.totalMinutes ?? 0 })
  if (total === 0) return '—'
  const h = Math.floor(total / 60)
  const m = total % 60
  return m > 0 ? `${h}h${String(m).padStart(2, '0')}m` : `${h}h`
}

function weekSessions(empId: string): number {
  return weekDays.value.reduce((sum, d) => sum + (getSummary(empId, d)?.sessionCount ?? 0), 0)
}

// ── Navigation ────────────────────────────────────────────────

function navigateToDay(empId: string, date: string, summary: DayAttendanceSummary) {
  if (summary.status === 'NO_RECORD' && !summary.shiftEntry) return
  router.push(`/attendance/${empId}/${date}`)
}

// ── Legend ────────────────────────────────────────────────────

const legend = [
  { label: '承認済み', color: '#c8e6c9' },
  { label: '申請中', color: '#bbdefb' },
  { label: '差戻し', color: '#fff9c4' },
  { label: '未提出', color: '#f5f5f5' },
  { label: '未出勤', color: 'transparent' },
]
</script>

<style scoped>
.week-grid-wrap {
  overflow-x: auto;
  border-radius: 0 0 12px 12px;
}

.week-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
}

.week-table th, .week-table td {
  border-bottom: 1px solid #f0f0f0;
  padding: 6px 4px;
  vertical-align: middle;
}

.th-emp {
  position: sticky;
  left: 0;
  background: #fff;
  z-index: 2;
  text-align: left;
  font-size: 12px;
  font-weight: 600;
  padding: 10px 12px;
  border-right: 1px solid #e0e0e0;
}

.th-day {
  text-align: center;
  font-size: 11px;
  padding: 6px 4px;
  background: #fafafa;
}
.th-today { background: #e3f2fd; }

.th-total {
  text-align: center;
  font-size: 11px;
  font-weight: 600;
  background: #fafafa;
  padding: 6px 4px;
}

.day-header { display: flex; flex-direction: column; align-items: center; gap: 2px; }
.day-num { font-size: 11px; font-weight: 600; }

.dept-row { background: #f8f9fa; }
.dept-label {
  font-size: 11px;
  font-weight: 600;
  color: #616161;
  padding: 4px 12px;
  letter-spacing: 0.03em;
}

.td-emp {
  position: sticky;
  left: 0;
  background: #fff;
  z-index: 1;
  padding: 6px 12px;
  border-right: 1px solid #eeeeee;
  min-width: 160px;
}

.emp-row { transition: background 0.1s; }
.emp-row:hover .td-emp,
.emp-row--highlighted .td-emp { background: #fafafa; }
.emp-row:hover .week-table td,
.emp-row--highlighted td { background: rgba(0,0,0,0.01); }

.td-cell {
  text-align: center;
  padding: 4px;
}

.td-total {
  text-align: center;
  padding: 6px 8px;
  background: #fafafa;
  border-left: 1px solid #eeeeee;
}

.legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 2px;
  border: 1px solid #e0e0e0;
  display: inline-block;
}
</style>
