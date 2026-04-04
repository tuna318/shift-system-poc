<template>
  <div>
    <h1 class="text-h5 font-weight-bold mb-3">勤怠確認</h1>

    <!-- Main tabs -->
    <v-tabs v-model="activeTab" color="primary" class="mb-0 att-tabs">
      <v-tab value="punch" class="text-body-2 font-weight-medium">打刻状況</v-tab>
      <v-tab value="summary" class="text-body-2 font-weight-medium">勤怠項目別集計</v-tab>
    </v-tabs>
    <v-divider class="mb-4" />

    <!-- Filters -->
    <v-card rounded="xl" elevation="0" border class="mb-4">
      <v-card-text class="pa-4">
        <v-row dense>
          <v-col cols="12" sm="4" md="2">
            <v-select
              v-model="filters.closingDay"
              :items="['月末', '15日', '20日']"
              label="勤怠締め日"
              density="compact"
              variant="outlined"
              hide-details
            />
          </v-col>
          <v-col cols="12" sm="4" md="3">
            <v-autocomplete
              v-model="filters.employeeId"
              :items="employeeItems"
              item-title="label"
              item-value="id"
              label="従業員"
              clearable
              placeholder="選択してください"
              density="compact"
              variant="outlined"
              hide-details
            />
          </v-col>
          <v-col cols="12" sm="4" md="2">
            <v-select
              v-model="filters.department"
              :items="['全部署', 'キッチン', 'ホール', 'レジ']"
              label="部署"
              density="compact"
              variant="outlined"
              hide-details
            />
          </v-col>
          <v-col cols="12" sm="4" md="2">
            <v-select
              v-model="filters.status"
              :items="statusFilterOptions"
              item-title="label"
              item-value="value"
              label="勤怠ステータス"
              placeholder="選択してください"
              density="compact"
              variant="outlined"
              hide-details
            />
          </v-col>
          <v-col cols="12" sm="4" md="3">
            <v-select
              v-model="filters.alert"
              :items="alertFilterOptions"
              item-title="label"
              item-value="value"
              label="勤怠アラート"
              placeholder="選択してください"
              density="compact"
              variant="outlined"
              hide-details
            />
          </v-col>
        </v-row>
        <div class="d-flex justify-center ga-3 mt-4">
          <v-btn variant="outlined" rounded="lg" min-width="100" @click="clearFilters">クリア</v-btn>
          <v-btn color="primary" variant="flat" rounded="lg" min-width="100" @click="applyFilters">検索</v-btn>
        </div>
      </v-card-text>
    </v-card>

    <!-- Month nav + action buttons -->
    <div class="d-flex align-center flex-wrap ga-2 mb-3">
      <v-btn icon size="small" variant="text" @click="prevMonth">
        <v-icon size="18">mdi-chevron-left</v-icon>
      </v-btn>
      <span class="text-body-1 font-weight-bold tracking-tight">
        {{ monthStart }}　〜　{{ monthEnd }}
      </span>
      <v-btn icon size="small" variant="text" @click="nextMonth">
        <v-icon size="18">mdi-chevron-right</v-icon>
      </v-btn>
      <v-btn size="small" variant="text" color="primary" class="text-none px-1" @click="goCurrentMonth">
        今月に戻る
      </v-btn>
      <v-spacer />
      <div class="d-flex ga-2 flex-wrap">
        <v-btn
          size="small"
          variant="outlined"
          rounded="lg"
          :disabled="selectedEmpArr.length === 0"
          @click="cancelApproval"
        >承認取消</v-btn>
        <v-btn
          size="small"
          color="primary"
          variant="flat"
          rounded="lg"
          :disabled="selectedEmpArr.length === 0"
          @click="doApprove"
        >承認</v-btn>
        <v-btn
          size="small"
          color="success"
          variant="tonal"
          rounded="lg"
          :disabled="selectedEmpArr.length === 0"
          @click="releaseClose"
        >勤怠締め解除</v-btn>
        <v-btn
          size="small"
          color="success"
          variant="flat"
          rounded="lg"
          :disabled="selectedEmpArr.length === 0"
          @click="doClose"
        >勤怠締め</v-btn>
      </div>
    </div>

    <!-- ── 打刻状況 ────────────────────────────────────────── -->
    <v-tabs-window v-model="activeTab">
      <v-tabs-window-item value="punch">
        <v-card rounded="xl" elevation="0" border style="overflow: hidden">
          <div class="att-scroll">
            <table class="att-table">
              <thead>
                <tr>
                  <th class="col-cb th-sticky">
                    <v-checkbox-btn v-model="selectAll" density="compact" hide-details />
                  </th>
                  <th class="col-name th-sticky">氏名</th>
                  <th class="col-link">日次<br>勤怠</th>
                  <th
                    v-for="d in monthDays"
                    :key="d.date"
                    class="col-day"
                    :class="{ 'col-we': d.isWeekend, 'col-today': d.date === CTX_TODAY }"
                  >
                    <div class="day-num">{{ d.num }}</div>
                    <div class="day-dow" :class="d.isWeekend ? 'text-red-darken-1' : 'text-medium-emphasis'">{{ d.dow }}</div>
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="emp in appliedEmps"
                  :key="emp.id"
                  class="emp-row"
                  :class="{ 'row-selected': selectedEmpArr.includes(emp.id) }"
                >
                  <td class="col-cb td-sticky">
                    <v-checkbox-btn v-model="selectedEmpArr" :value="emp.id" density="compact" hide-details />
                  </td>
                  <td class="col-name td-sticky emp-name-cell">
                    <div class="d-flex align-center ga-2">
                      <v-avatar color="primary" size="24" rounded="sm" class="flex-shrink-0">
                        <span class="avatar-init">{{ emp.name.charAt(0) }}</span>
                      </v-avatar>
                      <span class="text-body-2 font-weight-medium text-no-wrap">{{ emp.name }}</span>
                    </div>
                  </td>
                  <td class="col-link">
                    <router-link
                      v-if="empLatestRecordId(emp.id)"
                      :to="`/attendance/${empLatestRecordId(emp.id)}`"
                      class="detail-link"
                    >一覧</router-link>
                    <span v-else class="text-medium-emphasis text-caption">—</span>
                  </td>
                  <!-- Day cells -->
                  <td
                    v-for="d in monthDays"
                    :key="d.date"
                    class="col-day day-cell"
                    :class="dayTdClass(emp.id, d)"
                    @click="navigateToDay(emp.id, d.date)"
                  >
                    <!-- v-for trick: binds local variable `dd` from dayData() -->
                    <template v-for="dd in [dayData(emp.id, d.date)]" :key="0">
                      <template v-if="dd">
                        <!-- Shift schedule reference line -->
                        <div v-if="dd.scheduledStart" class="shift-sched">
                          {{ dd.scheduledStart }}〜{{ dd.scheduledEnd }}
                        </div>
                        <!-- Absent: shift scheduled but no attendance -->
                        <template v-if="dd.isAbsent">
                          <div class="punch-absent">欠勤</div>
                        </template>
                        <!-- Normal: show actual punch sessions -->
                        <template v-else>
                          <div v-for="(sess, si) in dd.sessions" :key="si" class="session-line">
                            <span class="sess-time">{{ sess.checkIn ?? '—' }}〜{{ sess.checkOut ?? '—' }}</span>
                            <span v-if="sess.department && dd.sessions.length > 1" class="sess-dept">{{ sess.department.charAt(0) }}</span>
                          </div>
                          <!-- Deviation tags -->
                          <div v-if="dd.lateMinutes > 0 || dd.earlyMins > 0 || dd.schedOvertimeMins > 30" class="deviation-row">
                            <span v-if="dd.lateMinutes > 0" class="dev-tag dev-late">遅{{ dd.lateMinutes }}分</span>
                            <span v-if="dd.earlyMins > 0" class="dev-tag dev-early">早{{ dd.earlyMins }}分</span>
                            <span v-if="dd.schedOvertimeMins > 30" class="dev-tag dev-ot">+{{ dd.schedOvertimeMins }}分</span>
                          </div>
                          <!-- Approval status tag -->
                          <div v-if="dd.status === 'PENDING_APPROVAL'" class="day-status-tag ds-pending">申請中</div>
                          <div v-else-if="dd.status === 'CORRECTION_REQUESTED'" class="day-status-tag ds-correction">修正中</div>
                          <div v-else-if="dd.status === 'APPROVED'" class="day-status-tag ds-approved">承認済</div>
                          <div v-else-if="dd.status === 'NOT_SUBMITTED'" class="day-status-tag ds-not-submitted">未申請</div>
                          <div v-else-if="dd.isUnscheduled" class="day-status-tag ds-unscheduled">シフト外</div>
                        </template>
                      </template>
                    </template>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </v-card>
      </v-tabs-window-item>

      <!-- ── 勤怠項目別集計 ──────────────────────────────────── -->
      <v-tabs-window-item value="summary">
        <v-card rounded="xl" elevation="0" border style="overflow: hidden">
          <div class="att-scroll">
            <table class="att-table">
              <thead>
                <tr>
                  <th class="col-cb th-sticky" rowspan="2">
                    <v-checkbox-btn v-model="selectAll" density="compact" hide-details />
                  </th>
                  <th class="col-name th-sticky" rowspan="2">氏名</th>
                  <th class="col-link" rowspan="2">日次<br>勤怠</th>
                  <!-- 日数集計 -->
                  <th colspan="4" class="sum-group-header">平日</th>
                  <th class="sum-group-header" rowspan="2">所定休日<br>出勤</th>
                  <th class="sum-group-header" rowspan="2">法定休日<br>出勤</th>
                  <!-- 時間集計 -->
                  <th colspan="6" class="sum-group-header">平日</th>
                </tr>
                <tr>
                  <th class="sum-sub-th">出勤</th>
                  <th class="sum-sub-th">欠勤</th>
                  <th class="sum-sub-th">遅刻</th>
                  <th class="sum-sub-th">早退</th>
                  <th class="sum-sub-th">総労働</th>
                  <th class="sum-sub-th">所定</th>
                  <th class="sum-sub-th">所定外</th>
                  <th class="sum-sub-th">深夜</th>
                  <th class="sum-sub-th">遅刻</th>
                  <th class="sum-sub-th">早退</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="emp in appliedEmps"
                  :key="emp.id"
                  class="emp-row"
                  :class="{ 'row-selected': selectedEmpArr.includes(emp.id) }"
                >
                  <td class="col-cb td-sticky">
                    <v-checkbox-btn v-model="selectedEmpArr" :value="emp.id" density="compact" hide-details />
                  </td>
                  <td class="col-name td-sticky emp-name-cell">
                    <div class="d-flex align-center ga-2">
                      <v-avatar color="primary" size="24" rounded="sm" class="flex-shrink-0">
                        <span class="avatar-init">{{ emp.name.charAt(0) }}</span>
                      </v-avatar>
                      <span class="text-body-2 font-weight-medium text-no-wrap">{{ emp.name }}</span>
                    </div>
                  </td>
                  <td class="col-link">
                    <router-link
                      v-if="empLatestRecordId(emp.id)"
                      :to="`/attendance/${empLatestRecordId(emp.id)}`"
                      class="detail-link"
                    >一覧</router-link>
                    <span v-else class="text-medium-emphasis text-caption">—</span>
                  </td>
                  <!-- Counts -->
                  <td class="sum-td">{{ getSummary(emp.id).workdays }}回</td>
                  <td class="sum-td">{{ getSummary(emp.id).absent }}回</td>
                  <td class="sum-td">0回</td>
                  <td class="sum-td">0回</td>
                  <td class="sum-td">0回</td>
                  <td class="sum-td">0回</td>
                  <!-- Hours -->
                  <td class="sum-td font-weight-medium">{{ fmtH(getSummary(emp.id).totalMins) }}</td>
                  <td class="sum-td">{{ fmtH(getSummary(emp.id).scheduledMins) }}</td>
                  <td class="sum-td" :class="getSummary(emp.id).overtimeMins > 0 ? 'text-warning font-weight-medium' : ''">
                    {{ fmtH(getSummary(emp.id).overtimeMins) }}
                  </td>
                  <td class="sum-td" :class="getSummary(emp.id).nightMins > 0 ? 'text-indigo font-weight-medium' : ''">
                    {{ fmtH(getSummary(emp.id).nightMins) }}
                  </td>
                  <td class="sum-td">00:00h</td>
                  <td class="sum-td">00:00h</td>
                </tr>
              </tbody>
            </table>
          </div>
        </v-card>
      </v-tabs-window-item>
    </v-tabs-window>

    <v-snackbar v-model="snack.show" location="top center" :color="snack.color" rounded="pill" :timeout="2500">
      {{ snack.msg }}
    </v-snackbar>
  </div>
</template>

<script setup lang="ts">
import { useMockData } from '~/composables/useMockData'

const {
  attendanceRecords, employees,
  getCorrectionRequestsForDate,
  computeNightMins,
  getEmpShiftsForDate,
} = useMockData()

function toMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

const router = useRouter()

// ── Context ───────────────────────────────────────────────────────────────────
// Mock data covers 2026-03-09 to 2026-03-15; use that as "today" for context
const CTX_TODAY = '2026-03-15'

// ── Tabs ──────────────────────────────────────────────────────────────────────
const activeTab = ref<'punch' | 'summary'>('punch')

// ── Month state ───────────────────────────────────────────────────────────────
const year  = ref(2026)
const month = ref(3)

const DOW = ['日', '月', '火', '水', '木', '金', '土']

const monthDays = computed(() => {
  const days: Array<{ date: string; num: number; dow: string; isWeekend: boolean; isPast: boolean }> = []
  const total = new Date(year.value, month.value, 0).getDate()
  for (let i = 1; i <= total; i++) {
    const d = new Date(year.value, month.value - 1, i)
    const date = `${year.value}-${String(month.value).padStart(2, '0')}-${String(i).padStart(2, '0')}`
    const dow = d.getDay()
    days.push({
      date,
      num: i,
      dow: DOW[dow],
      isWeekend: dow === 0 || dow === 6,
      isPast: date <= CTX_TODAY,
    })
  }
  return days
})

const pad = (n: number) => String(n).padStart(2, '0')
const monthStart = computed(() => `${year.value}/${pad(month.value)}/01`)
const monthEnd   = computed(() => `${year.value}/${pad(month.value)}/${monthDays.value.length}`)

function prevMonth() {
  if (month.value === 1) { year.value--; month.value = 12 }
  else month.value--
}
function nextMonth() {
  if (month.value === 12) { year.value++; month.value = 1 }
  else month.value++
}
function goCurrentMonth() { year.value = 2026; month.value = 3 }

// ── Filters ───────────────────────────────────────────────────────────────────
const filters = reactive({
  closingDay:  '月末',
  employeeId:  null as string | null,
  department:  '全部署',
  status:      'ALL',
  alert:       'ALL',
})
// Applied separately on 検索 click
const applied = reactive({ ...filters })

const statusFilterOptions = [
  { label: '全ステータス',    value: 'ALL' },
  { label: '未申請',         value: 'NOT_SUBMITTED' },
  { label: '承認待ち',        value: 'PENDING_APPROVAL' },
  { label: '修正依頼中',      value: 'CORRECTION_REQUESTED' },
  { label: '承認済み',        value: 'APPROVED' },
  { label: '締め済み',        value: 'CLOSED' },
  { label: '欠勤あり',        value: 'HAS_ABSENT' },
]
const alertFilterOptions = [
  { label: 'アラートなし', value: 'ALL' },
  { label: '休憩なし', value: 'NO_BREAK' },
  { label: '残業あり', value: 'OVERTIME' },
]

const activeEmployees = computed(() => employees.filter(e => e.status === 'ACTIVE'))
const employeeItems   = computed(() =>
  activeEmployees.value.map(e => ({ id: e.id, label: `${e.name}（${e.department}）` }))
)

function clearFilters() {
  Object.assign(filters, { closingDay: '月末', employeeId: null, department: '全部署', status: 'ALL', alert: 'ALL' })
  Object.assign(applied, { ...filters })
}
function applyFilters() {
  Object.assign(applied, { ...filters })
}

// ── Record lookup ─────────────────────────────────────────────────────────────
const recordMap = computed(() => {
  const m = new Map<string, typeof attendanceRecords[0]>()
  for (const r of attendanceRecords) m.set(`${r.employeeId}-${r.workDate}`, r)
  return m
})

function getDayRecord(empId: string, date: string) {
  return recordMap.value.get(`${empId}-${date}`) ?? null
}

// DayData shape for template
interface DayCell {
  checkIn?: string
  checkOut?: string
  hasAlert: boolean
  hasCorrection: boolean
  status: string
  scheduledStart?: string
  scheduledEnd?: string
  isAbsent: boolean        // has shift, no attendance, past date
  isUnscheduled: boolean   // has attendance, no shift
  lateMinutes: number      // actual checkIn minus scheduled start (>0 = late)
  earlyMins: number        // scheduled end minus actual checkOut (>0 = left early)
  schedOvertimeMins: number // actual checkOut minus scheduled end (>0 = overtime)
  sessions: Array<{ checkIn?: string; checkOut?: string; department?: string }>
}

function dayData(empId: string, date: string): DayCell | null {
  const rec    = getDayRecord(empId, date)
  const shifts = getEmpShiftsForDate(empId, date)
  const hasShift = shifts.length > 0
  if (!rec && !hasShift) return null

  const scheduledStart = shifts[0]?.startTime
  const scheduledEnd   = shifts[shifts.length - 1]?.endTime
  const isAbsent       = hasShift && !rec && date <= CTX_TODAY
  const isUnscheduled  = !!rec && !hasShift

  let lateMinutes = 0, earlyMins = 0, schedOvertimeMins = 0
  if (rec?.checkIn && scheduledStart) {
    lateMinutes = Math.max(0, toMinutes(rec.checkIn) - toMinutes(scheduledStart) - 5)
  }
  if (rec?.checkOut && scheduledEnd) {
    earlyMins         = Math.max(0, toMinutes(scheduledEnd) - toMinutes(rec.checkOut) - 5)
    schedOvertimeMins = Math.max(0, toMinutes(rec.checkOut) - toMinutes(scheduledEnd))
  }

  const sessions = rec?.sessions
    ? rec.sessions.map(s => ({ checkIn: s.checkIn, checkOut: s.checkOut, department: s.department }))
    : (rec?.checkIn ? [{ checkIn: rec.checkIn, checkOut: rec.checkOut, department: undefined }] : [])

  return {
    checkIn:  sessions[0]?.checkIn ?? rec?.checkIn,
    checkOut: sessions[sessions.length - 1]?.checkOut ?? rec?.checkOut,
    hasAlert: !!rec && ((rec.actualMinutes >= 360 && rec.breakMinutes === 0) || rec.actualMinutes > 600),
    hasCorrection: getCorrectionRequestsForDate(empId, date).some(c => c.status === 'pending'),
    status: rec?.status ?? '',
    scheduledStart,
    scheduledEnd,
    isAbsent,
    isUnscheduled,
    lateMinutes,
    earlyMins,
    schedOvertimeMins,
    sessions,
  }
}

// ── Workflow status ───────────────────────────────────────────────────────────
const approvedEmps = reactive(new Set<string>())
const closedEmps   = reactive(new Set<string>())

function empWf(empId: string) {
  const recs = monthDays.value.map(d => getDayRecord(empId, d.date)).filter(Boolean)
  const hasPending    = recs.some(r => r!.status === 'PENDING_APPROVAL')
  const hasCorrection = recs.some(r => r!.status === 'CORRECTION_REQUESTED')
  const allApproved   = recs.length > 0 && recs.every(r => r!.status === 'APPROVED')
  return {
    // submitted = employee sent records for approval (or already approved)
    submitted: hasPending || hasCorrection || allApproved || approvedEmps.has(empId),
    approved:  (allApproved || approvedEmps.has(empId)) && !hasPending && !hasCorrection,
    closed:    closedEmps.has(empId),
    hasPending,
    hasCorrection,
  }
}

function empLatestRecordId(empId: string): string | null {
  const recs = monthDays.value
    .map(d => getDayRecord(empId, d.date))
    .filter(Boolean)
    .sort((a, b) => b!.workDate.localeCompare(a!.workDate))
  return recs[0]?.id ?? null
}

// ── Filtered employees list ───────────────────────────────────────────────────
const appliedEmps = computed(() => {
  return activeEmployees.value.filter(emp => {
    if (applied.employeeId && emp.id !== applied.employeeId) return false
    if (applied.department !== '全部署' && emp.department !== applied.department) return false
    if (applied.status !== 'ALL') {
      const wf = empWf(emp.id)
      if (applied.status === 'PENDING_APPROVAL'     && !wf.hasPending)    return false
      if (applied.status === 'CORRECTION_REQUESTED' && !wf.hasCorrection) return false
      if (applied.status === 'APPROVED'             && !wf.approved)      return false
      if (applied.status === 'CLOSED'               && !wf.closed)        return false
      if (applied.status === 'NOT_SUBMITTED') {
        if (wf.submitted) return false
      }
      if (applied.status === 'HAS_ABSENT') {
        const hasAbsent = monthDays.value.some(d => dayData(emp.id, d.date)?.isAbsent)
        if (!hasAbsent) return false
      }
    }
    if (applied.alert !== 'ALL') {
      const hasNoBreak = monthDays.value.some(d => {
        const rec = getDayRecord(emp.id, d.date)
        return rec && rec.actualMinutes >= 360 && rec.breakMinutes === 0
      })
      const hasOT = monthDays.value.some(d => (getDayRecord(emp.id, d.date)?.overtimeMinutes ?? 0) > 0)
      if (applied.alert === 'NO_BREAK'  && !hasNoBreak) return false
      if (applied.alert === 'OVERTIME'  && !hasOT)      return false
    }
    return true
  })
})

// ── Row selection ─────────────────────────────────────────────────────────────
const selectedEmpArr = ref<string[]>([])

const selectAll = computed({
  get: () =>
    appliedEmps.value.length > 0 &&
    appliedEmps.value.every(e => selectedEmpArr.value.includes(e.id)),
  set: (v: boolean) => {
    selectedEmpArr.value = v ? appliedEmps.value.map(e => e.id) : []
  },
})

// ── Actions ───────────────────────────────────────────────────────────────────
const snack = reactive({ show: false, msg: '', color: 'success' })
function showSnack(msg: string, color = 'success') {
  snack.msg = msg; snack.color = color; snack.show = true
}

function doApprove() {
  selectedEmpArr.value.forEach(id => approvedEmps.add(id))
  showSnack(`${selectedEmpArr.value.length}名を承認しました`)
  selectedEmpArr.value = []
}
function cancelApproval() {
  selectedEmpArr.value.forEach(id => approvedEmps.delete(id))
  showSnack('承認を取り消しました', 'warning')
  selectedEmpArr.value = []
}
function doClose() {
  selectedEmpArr.value.forEach(id => { approvedEmps.add(id); closedEmps.add(id) })
  showSnack(`${selectedEmpArr.value.length}名の勤怠を締めました`)
  selectedEmpArr.value = []
}
function releaseClose() {
  selectedEmpArr.value.forEach(id => closedEmps.delete(id))
  showSnack('勤怠締めを解除しました', 'warning')
  selectedEmpArr.value = []
}

// ── Day cell styling ──────────────────────────────────────────────────────────
function dayTdClass(empId: string, d: typeof monthDays.value[0]) {
  const dd = dayData(empId, d.date)
  return {
    'col-we':               d.isWeekend,
    'col-today':            d.date === CTX_TODAY,
    'day-cell--alert':      dd?.hasAlert ?? false,
    'day-cell--correction': dd?.hasCorrection ?? false,
    'day-cell--absent':     dd?.isAbsent ?? false,
    'day-cell--has-record': !!dd,
    'day-cell--clickable':  !!dd && !dd.isAbsent,
  }
}

function navigateToDay(empId: string, date: string) {
  const rec = getDayRecord(empId, date)
  if (rec) router.push(`/attendance/${rec.id}`)
}

// ── Summary computation ───────────────────────────────────────────────────────
function getSummary(empId: string) {
  const recs = monthDays.value
    .map(d => getDayRecord(empId, d.date))
    .filter(Boolean) as typeof attendanceRecords

  const totalMins    = recs.reduce((s, r) => s + r.actualMinutes, 0)
  const overtimeMins = recs.reduce((s, r) => s + r.overtimeMinutes, 0)
  const nightMins    = recs.reduce((s, r) => s + computeNightMins(r.checkIn, r.checkOut), 0)

  return {
    workdays:      recs.filter(r => r.actualMinutes > 0).length,
    absent:        0,   // no shift data to compute
    totalMins,
    scheduledMins: 0,   // would need shift schedule
    overtimeMins,
    nightMins,
  }
}

function fmtH(mins: number): string {
  if (mins <= 0) return '00:00h'
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}h`
}
</script>

<style scoped>
/* ── Tab underline ────────────────────────────────────────── */
.att-tabs :deep(.v-tab) { text-transform: none; letter-spacing: 0; }

/* ── Table scroll wrapper ─────────────────────────────────── */
.att-scroll {
  overflow-x: auto;
  overflow-y: visible;
  -webkit-overflow-scrolling: touch;
}

/* ── Base table ───────────────────────────────────────────── */
.att-table {
  border-collapse: collapse;
  width: max-content;
  min-width: 100%;
  font-size: 12px;
}
.att-table th,
.att-table td {
  border: 1px solid #E5E7EB;
  padding: 6px 8px;
  white-space: nowrap;
  vertical-align: middle;
  text-align: center;
}
.att-table thead th {
  background: #F8FAFC;
  font-weight: 600;
  color: #4B5563;
  font-size: 11px;
  line-height: 1.3;
}
.att-table tbody td { background: #ffffff; }

/* ── Sticky columns ───────────────────────────────────────── */
.col-cb  {
  position: sticky;
  left: 0;
  width: 40px;
  min-width: 40px;
  z-index: 3;
}
.col-name {
  position: sticky;
  left: 40px;
  min-width: 160px;
  text-align: left;
  z-index: 3;
}
.th-sticky { background: #F8FAFC !important; z-index: 4; }
.td-sticky { background: #ffffff !important; z-index: 2; }

/* Separator shadow for sticky area */
.col-name.td-sticky,
.col-name.th-sticky {
  box-shadow: 2px 0 4px rgba(0,0,0,0.06);
}

/* ── Fixed-width columns ──────────────────────────────────── */
.col-link       { width: 40px; min-width: 40px; font-size: 11px; }
.col-day        { width: 72px; min-width: 72px; padding: 4px 3px; }

/* ── Day header ───────────────────────────────────────────── */
.day-num  { font-size: 12px; font-weight: 600; color: #374151; line-height: 1; }
.day-dow  { font-size: 10px; margin-top: 2px; }

/* ── Weekend + today ──────────────────────────────────────── */
.col-we.th-sticky,
.col-we {
  background: #FFF5F5 !important;
}
.att-table thead .col-we { background: #FEE2E2 !important; }
.col-today { background: #EFF6FF !important; }
.att-table thead .col-today { background: #DBEAFE !important; }

/* ── Employee row ─────────────────────────────────────────── */
.emp-row:hover td { background: #F9FAFB; }
.emp-row:hover .td-sticky { background: #F9FAFB !important; }
.emp-row:hover .col-we { background: #FEF2F2 !important; }

.row-selected td { background: #EFF6FF !important; }
.row-selected .td-sticky { background: #EFF6FF !important; }

.emp-name-cell { text-align: left; }

.avatar-init {
  font-size: 9px;
  color: white;
  font-weight: 700;
}

/* ── Detail link ──────────────────────────────────────────── */
.detail-link {
  color: #3587dc;
  text-decoration: none;
  font-size: 11px;
  font-weight: 600;
}
.detail-link:hover { text-decoration: underline; }

/* ── Day data cells ───────────────────────────────────────── */
.day-cell { cursor: default; font-size: 11px; }
.day-cell--clickable { cursor: pointer; }
.day-cell--clickable:hover { background: #EBF3FC !important; }

.session-line {
  display: flex;
  align-items: center;
  gap: 2px;
  line-height: 1.5;
}
.sess-time {
  font-size: 10px;
  color: #374151;
  font-variant-numeric: tabular-nums;
}
.sess-dept {
  font-size: 8px;
  background: #E0E7FF;
  color: #3730A3;
  border-radius: 2px;
  padding: 0 2px;
  font-weight: 600;
  flex-shrink: 0;
}

.day-cell--alert      { background: #FEF9C3 !important; }
.day-cell--correction { outline: 1.5px solid #F59E0B; outline-offset: -1.5px; }
.day-cell--absent     { background: #FFF1F2 !important; }
.day-cell--has-record { }

/* ── Shift reference line ─────────────────────────────────── */
.shift-sched { font-size: 8px; color: #94A3B8; line-height: 1.3; margin-bottom: 1px; }
.punch-absent { font-size: 10px; color: #DC2626; font-weight: 600; margin-top: 2px; }

/* ── Deviation tags ───────────────────────────────────────── */
.deviation-row { display: flex; gap: 1px; flex-wrap: wrap; margin-top: 1px; }
.dev-tag  { font-size: 7px; padding: 0 2px; border-radius: 2px; font-weight: 600; line-height: 1.5; }
.dev-late  { background: #FEF3C7; color: #92400E; }
.dev-early { background: #FFE4E6; color: #9F1239; }
.dev-ot    { background: #DCFCE7; color: #166534; }

/* ── Day status tags ──────────────────────────────────────── */
.day-status-tag {
  font-size: 8px;
  padding: 1px 3px;
  border-radius: 3px;
  margin-top: 2px;
  text-align: center;
  font-weight: 600;
  line-height: 1.4;
}
.ds-pending       { background: #DBEAFE; color: #1D4ED8; }
.ds-correction    { background: #FEF3C7; color: #92400E; }
.ds-approved      { background: #D1FAE5; color: #065F46; }
.ds-not-submitted { background: #F3F4F6; color: #6B7280; }
.ds-unscheduled   { background: #FFF7ED; color: #C2410C; }

/* ── Summary tab ──────────────────────────────────────────── */
.sum-group-header {
  background: #F0F9FF !important;
  color: #0369A1;
  text-align: center;
  font-size: 11px;
}
.sum-sub-th { font-size: 10px; min-width: 56px; }
.sum-td {
  font-size: 12px;
  text-align: right;
  padding-right: 10px;
  color: #374151;
}
</style>
