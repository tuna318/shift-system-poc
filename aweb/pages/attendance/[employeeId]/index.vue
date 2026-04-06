<template>
  <div>
    <!-- ── Breadcrumb ──────────────────────────────────────────── -->
    <div class="d-flex align-center ga-2 mb-4">
      <v-btn to="/attendance" icon size="small" variant="text">
        <v-icon>mdi-arrow-left</v-icon>
      </v-btn>
      <v-breadcrumbs
        :items="[{ title: '勤怠一覧', to: '/attendance' }, { title: employee?.name ?? '—' }]"
        density="compact" class="pa-0"
      />
    </div>

    <!-- ── Employee header ─────────────────────────────────────── -->
    <div class="d-flex align-center justify-space-between mb-4 flex-wrap gap-3">
      <div class="d-flex align-center ga-3">
        <v-avatar size="48" color="primary" variant="tonal" rounded="xl">
          <span class="text-h6 font-weight-bold">{{ employee?.name[0] }}</span>
        </v-avatar>
        <div>
          <div class="d-flex align-center ga-2 flex-wrap">
            <h1 class="text-h6 font-weight-bold">{{ employee?.name }}</h1>
            <v-chip size="small" color="surface-variant" variant="flat">{{ employee?.department }}</v-chip>
            <v-chip size="small" color="surface-variant" variant="flat">{{ employee?.position }}</v-chip>
            <v-chip size="x-small" :color="employee?.employmentType === 'FULL_TIME' ? 'primary' : 'default'" variant="tonal">
              {{ employee?.employmentType === 'FULL_TIME' ? '正社員' : 'パート' }}
            </v-chip>
          </div>
        </div>
      </div>
      <div class="d-flex align-center ga-1">
        <v-btn icon size="small" variant="text" @click="prevMonth"><v-icon>mdi-chevron-left</v-icon></v-btn>
        <span class="text-body-2 font-weight-bold px-2" style="min-width:88px;text-align:center">{{ monthLabel }}</span>
        <v-btn icon size="small" variant="text" @click="nextMonth"><v-icon>mdi-chevron-right</v-icon></v-btn>
        <v-btn size="x-small" variant="tonal" rounded="lg" class="ml-1" @click="goCurrentMonth">今月</v-btn>
      </div>
    </div>

    <!-- ── Monthly summary ─────────────────────────────────────── -->
    <div class="summary-wrap mb-4">
      <!-- Row 1: Attendance counts -->
      <div class="sum-counts">
        <div class="sc-item">
          <span class="sc-val">{{ ms.workDays }}<small>日</small></span>
          <span class="sc-lbl">出勤日数</span>
        </div>
        <div class="sc-sep" />
        <div class="sc-item" :class="{ 'sc-alert': ms.absentDays > 0 }">
          <span class="sc-val">{{ ms.absentDays }}<small>日</small></span>
          <span class="sc-lbl">欠勤</span>
        </div>
        <div class="sc-sep" />
        <div class="sc-item" :class="{ 'sc-alert': ms.lateDays > 0 }">
          <span class="sc-val">{{ ms.lateDays }}<small>回</small></span>
          <span class="sc-lbl">遅刻</span>
        </div>
        <div class="sc-sep" />
        <div class="sc-item" :class="{ 'sc-alert': ms.earlyLeaveDays > 0 }">
          <span class="sc-val">{{ ms.earlyLeaveDays }}<small>回</small></span>
          <span class="sc-lbl">早退</span>
        </div>
        <div class="sc-sep" />
        <div class="sc-item">
          <span class="sc-val" :class="ms.pendingCount > 0 ? 'text-primary' : ''">
            {{ ms.pendingCount }}<small>件</small>
          </span>
          <span class="sc-lbl">承認待ち</span>
        </div>
      </div>

      <!-- Row 2: Hours breakdown -->
      <div class="sum-hours">
        <div class="sh-item sh-item--primary">
          <span class="sh-val">{{ fmtMins(ms.totalMins) }}</span>
          <span class="sh-lbl">総労働時間</span>
        </div>
        <div class="sh-sep" />
        <div class="sh-item">
          <span class="sh-val">{{ fmtMins(ms.scheduledMins) }}</span>
          <span class="sh-lbl">所定時間</span>
        </div>
        <div class="sh-sep" />
        <div class="sh-item" :class="{ 'sh-alert': ms.beyondScheduleMins > 0 }">
          <span class="sh-val">{{ ms.beyondScheduleMins > 0 ? fmtMins(ms.beyondScheduleMins) : '—' }}</span>
          <span class="sh-lbl">所定外時間</span>
        </div>
        <div class="sh-sep" />
        <div class="sh-item" :class="{ 'sh-alert': ms.legalOvertimeMins > 0 }">
          <span class="sh-val">{{ ms.legalOvertimeMins > 0 ? fmtMins(ms.legalOvertimeMins) : '—' }}</span>
          <span class="sh-lbl">法定外時間</span>
        </div>
        <div class="sh-sep" />
        <div class="sh-item">
          <span class="sh-val">{{ ms.nightMins > 0 ? fmtMins(ms.nightMins) : '—' }}</span>
          <span class="sh-lbl">深夜時間</span>
        </div>
        <div class="sh-sep" />
        <div class="sh-item" :class="{ 'sh-alert': ms.lateMins > 0 }">
          <span class="sh-val">{{ ms.lateMins > 0 ? fmtMins(ms.lateMins) : '—' }}</span>
          <span class="sh-lbl">遅刻時間</span>
        </div>
        <div class="sh-sep" />
        <div class="sh-item" :class="{ 'sh-alert': ms.earlyLeaveMins > 0 }">
          <span class="sh-val">{{ ms.earlyLeaveMins > 0 ? fmtMins(ms.earlyLeaveMins) : '—' }}</span>
          <span class="sh-lbl">早退時間</span>
        </div>
      </div>
    </div>

    <!-- ── Action bar ──────────────────────────────────────────── -->
    <div class="d-flex align-center justify-space-between mb-3 flex-wrap gap-2">
      <!-- Left: selection controls -->
      <div class="d-flex align-center ga-2">
        <v-btn
          v-if="ms.pendingCount > 0"
          variant="tonal" color="primary" rounded="lg" size="small"
          prepend-icon="mdi-checkbox-multiple-marked-outline"
          @click="selectAllPending"
        >
          申請中をすべて選択
          <span class="ml-1 text-caption opacity-70">({{ ms.pendingCount }}件)</span>
        </v-btn>
        <v-btn
          v-if="selectedIds.size > 0"
          variant="text" size="small" rounded="lg"
          @click="selectedIds.value = new Set()"
        >選択解除</v-btn>
      </div>

      <!-- Right: approve selected -->
      <v-btn
        v-if="selectedIds.size > 0"
        color="success" rounded="lg" size="small"
        prepend-icon="mdi-check-circle-outline"
        @click="bulkApproveSelected"
      >
        選択中 {{ selectedIds.size }} 件を承認
      </v-btn>
    </div>

    <!-- ── Attendance table ─────────────────────────────────────── -->
    <div class="tbl-outer">
      <div class="tbl-scroll">
        <table class="att-tbl">
          <thead>
            <tr>
              <th class="th-date">日付</th>
              <th class="th-punch">出退勤 / 休憩</th>
              <th class="th-shift">シフト</th>
              <th class="th-num">総労働</th>
              <th class="th-num">所定</th>
              <th class="th-num">所定外</th>
              <th class="th-num">法定外</th>
              <th class="th-num">深夜</th>
              <th class="th-num th-alert">遅刻</th>
              <th class="th-num th-alert">早退</th>
              <th class="th-status">申請状況</th>
              <th class="th-actions">操作</th>
            </tr>
          </thead>
          <tbody>
            <template v-if="visibleDays.length === 0">
              <tr>
                <td colspan="12" class="td-empty">表示するデータがありません</td>
              </tr>
            </template>

            <tr
              v-for="day in visibleDays"
              :key="day.date"
              class="att-row"
              :class="[rowClass(day), { 'att-row--selected': day.record && selectedIds.has(day.record.id) }]"
            >
              <!-- Date — doubles as selection toggle for pending rows -->
              <td
                class="td-date"
                :class="{ 'td-date--pending': day.record?.status === 'PENDING_APPROVAL' }"
                @click="day.record?.status === 'PENDING_APPROVAL' ? toggleSelect(day.record.id) : undefined"
              >
                <div class="date-cell">
                  <div
                    v-if="day.record?.status === 'PENDING_APPROVAL'"
                    class="date-badge"
                    :class="{ 'date-badge--on': selectedIds.has(day.record.id) }"
                  >
                    <v-icon v-if="selectedIds.has(day.record.id)" size="13" color="#2563eb">mdi-check-bold</v-icon>
                    <span v-else class="date-num" :class="dateCls(day)">{{ day.dayNum }}</span>
                  </div>
                  <span v-else class="date-num" :class="dateCls(day)">{{ day.dayNum }}</span>
                  <span class="date-dow" :class="dateCls(day)">{{ DOW_LABELS[day.dow] }}</span>
                </div>
              </td>

              <!-- Clock in/out per session -->
              <td class="td-punch">
                <template v-if="!day.record && day.shifts.length === 0">
                  <span class="td-nil">—</span>
                </template>
                <template v-else-if="!day.record && day.shifts.length > 0">
                  <span class="punch-absent">打刻なし</span>
                </template>
                <template v-else-if="day.record">
                  <div v-for="(sess, si) in daySessions(day.record)" :key="si" class="punch-row">
                    <span v-if="daySessions(day.record).length > 1" class="punch-idx">{{ si + 1 }}</span>
                    <span class="punch-time">{{ fmt12(sess.checkIn) }}</span>
                    <span class="punch-arrow">→</span>
                    <span class="punch-time" :class="{ 'punch-time--missing': !sess.checkOut }">{{ fmt12(sess.checkOut) }}</span>
                    <span class="punch-break">休{{ sess.breakMinutes }}分</span>
                    <span v-if="sess.department && sess.department !== employee?.department" class="punch-dept">{{ sess.department }}</span>
                    <span v-if="sess.helpStore" class="punch-store">{{ sess.helpStore }}</span>
                    <span v-if="sess.punchVariant === 'HELP'" class="punch-tag punch-tag--help">応援</span>
                    <span v-if="sess.punchVariant === 'TRAINING'" class="punch-tag punch-tag--train">研修</span>
                  </div>
                  <div v-if="day.flags.length > 0" class="punch-flags">
                    <span v-for="f in day.flags" :key="f.key" class="flag-chip" :class="`flag-${f.level}`">{{ f.message }}</span>
                  </div>
                </template>
              </td>

              <!-- Shift reference -->
              <td class="td-shift">
                <template v-if="day.shifts.length > 0">
                  <div class="shift-stack">
                    <div v-for="sh in day.shifts" :key="sh.id" class="shift-chip">
                      <span class="shift-chip__time">{{ sh.startTime }}<span class="shift-chip__sep">–</span>{{ sh.endTime }}</span>
                      <span v-if="sh.department !== employee?.department" class="shift-chip__dept">{{ sh.department }}</span>
                    </div>
                  </div>
                </template>
                <span v-else class="td-nil">—</span>
              </td>

              <!-- 総労働時間 -->
              <td class="td-num">
                <span v-if="day.record">{{ fmtMins(day.record.actualMinutes) }}</span>
                <span v-else class="td-nil">—</span>
              </td>

              <!-- 所定時間 -->
              <td class="td-num">
                <span v-if="day.record && dayScheduled(day) > 0">{{ fmtMins(dayScheduled(day)) }}</span>
                <span v-else class="td-nil">—</span>
              </td>

              <!-- 所定外時間 -->
              <td class="td-num td-num--ot">
                <span v-if="day.record && dayBeyondSchedule(day) > 0">{{ fmtMins(dayBeyondSchedule(day)) }}</span>
                <span v-else class="td-nil">—</span>
              </td>

              <!-- 法定外時間 -->
              <td class="td-num td-num--ot">
                <span v-if="day.record && (day.record.overtimeMinutes ?? 0) > 0">{{ fmtMins(day.record.overtimeMinutes) }}</span>
                <span v-else class="td-nil">—</span>
              </td>

              <!-- 深夜時間 -->
              <td class="td-num">
                <span v-if="day.record && dayNight(day) > 0">{{ fmtMins(dayNight(day)) }}</span>
                <span v-else class="td-nil">—</span>
              </td>

              <!-- 遅刻 -->
              <td class="td-num td-num--late">
                <span v-if="dayLate(day) > 0" class="val-late">{{ fmtMins(dayLate(day)) }}</span>
                <span v-else class="td-nil">—</span>
              </td>

              <!-- 早退 -->
              <td class="td-num td-num--early">
                <span v-if="dayEarlyLeave(day) > 0" class="val-early">{{ fmtMins(dayEarlyLeave(day)) }}</span>
                <span v-else class="td-nil">—</span>
              </td>

              <!-- Status -->
              <td class="td-status">
                <span v-if="day.record" class="status-chip" :class="`status-${day.record.status.toLowerCase().replace('_','-')}`">
                  {{ statusLabel(day.record.status) }}
                </span>
                <span v-else-if="day.shifts.length > 0 && !day.record" class="status-chip status-absent">欠勤</span>
              </td>

              <!-- Actions -->
              <td class="td-actions">
                <div v-if="day.record" class="act-group">
                  <!-- Status transition menu -->
                  <v-menu v-if="statusActions(day).length > 0" location="bottom end" :close-on-content-click="true">
                    <template #activator="{ props: menuProps }">
                      <button class="act-btn act-btn--status" v-bind="menuProps">
                        <v-icon size="13">mdi-chevron-down</v-icon>
                        <span>{{ statusActionLabel(day.record.status) }}</span>
                      </button>
                    </template>
                    <v-list density="compact" rounded="lg" elevation="3" min-width="160">
                      <v-list-item
                        v-for="action in statusActions(day)"
                        :key="action.key"
                        :title="action.label"
                        @click="action.handler()"
                      >
                        <template #prepend>
                          <v-icon size="15" :color="action.color" class="mr-1">{{ action.icon }}</v-icon>
                        </template>
                      </v-list-item>
                    </v-list>
                  </v-menu>

                  <!-- Detail link -->
                  <button class="act-btn act-btn--detail" @click="$router.push(`/attendance/${employeeId}/${day.date}`)">
                    <v-icon size="12">mdi-open-in-new</v-icon>
                    <span>詳細</span>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ── Return dialog ───────────────────────────────────────── -->
    <v-dialog v-model="returnDialog.open" max-width="440">
      <v-card rounded="xl">
        <v-card-title class="text-subtitle-1 font-weight-bold pa-4 pb-2">差戻しコメント</v-card-title>
        <v-card-text class="pa-4 pt-0">
          <v-textarea
            v-model="returnNote"
            label="従業員に通知されます"
            variant="outlined"
            density="compact"
            rows="3"
            auto-grow
            hide-details
            rounded="lg"
          />
        </v-card-text>
        <v-card-actions class="pa-4 pt-0 ga-2">
          <v-spacer />
          <v-btn variant="text" @click="returnDialog.open = false">キャンセル</v-btn>
          <v-btn color="warning" :disabled="!returnNote.trim()" @click="submitReturn">差戻し確定</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- ── Compliance dialog ───────────────────────────────────── -->
    <v-dialog v-model="complianceDialog.open" max-width="400">
      <v-card rounded="xl">
        <v-card-title class="text-subtitle-1 font-weight-bold pa-4 pb-2">コンプライアンス警告</v-card-title>
        <v-card-text class="pa-4 pt-0">
          <p class="text-body-2 mb-3">以下の警告があります。このまま承認しますか？</p>
          <v-alert v-for="f in complianceDialog.flags" :key="f.key" :type="f.level === 'error' ? 'error' : 'warning'" density="compact" variant="tonal" :icon="f.icon" class="mb-2">
            <span class="text-caption">{{ f.message }}</span>
          </v-alert>
        </v-card-text>
        <v-card-actions class="pa-4 pt-0 ga-2">
          <v-spacer />
          <v-btn variant="text" @click="complianceDialog.open = false">キャンセル</v-btn>
          <v-btn color="success" @click="confirmApprove">承認する</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import type { AttendanceRecord, WorkSession, ShiftEntry, AttendanceStatus, ComplianceFlag } from '~/types'
import { useAttendanceStore } from '~/stores/attendance.store'
import { useMockData, getComplianceFlags, computeNightMins } from '~/composables/useMockData'

const router = useRouter()
const route = useRoute()
const attStore = useAttendanceStore()
const { employees, getEmpShiftsForDate } = useMockData()

const employeeId = computed(() => route.params.employeeId as string)
const employee   = computed(() => employees.find(e => e.id === employeeId.value))

const TODAY      = new Date('2026-04-05')
const todayStr   = `${TODAY.getFullYear()}-${String(TODAY.getMonth()+1).padStart(2,'0')}-${String(TODAY.getDate()).padStart(2,'0')}`
const DOW_LABELS = ['日', '月', '火', '水', '木', '金', '土']

// ── Month navigation ──────────────────────────────────────────

const viewYear  = ref(TODAY.getFullYear())
const viewMonth = ref(TODAY.getMonth() + 1)
const monthLabel = computed(() => `${viewYear.value}年${viewMonth.value}月`)

function prevMonth() { if (viewMonth.value === 1) { viewYear.value--; viewMonth.value = 12 } else viewMonth.value-- }
function nextMonth() { if (viewMonth.value === 12) { viewYear.value++; viewMonth.value = 1 } else viewMonth.value++ }
function goCurrentMonth() { viewYear.value = TODAY.getFullYear(); viewMonth.value = TODAY.getMonth() + 1 }

const monthDates = computed(() => {
  const last = new Date(viewYear.value, viewMonth.value, 0).getDate()
  return Array.from({ length: last }, (_, i) => {
    const d = i + 1
    return `${viewYear.value}-${String(viewMonth.value).padStart(2,'0')}-${String(d).padStart(2,'0')}`
  })
})

// ── Day data ──────────────────────────────────────────────────

interface DayData {
  date: string
  dayNum: number
  dow: number
  isToday: boolean
  record: AttendanceRecord | null
  shifts: ShiftEntry[]
  flags: ComplianceFlag[]
  pendingCorrections: ReturnType<typeof attStore.getCorrectionsForDay>
}

const allDays = computed<DayData[]>(() =>
  monthDates.value.map((date) => {
    const d = new Date(date)
    const record = attStore.getRecord(employeeId.value, date)
    const shifts = getEmpShiftsForDate(employeeId.value, date)
      .filter(s => s.cellStatus === 'CONFIRMED' || s.cellStatus === 'ADJUSTING')
    const flags = record ? getComplianceFlags(record) : []
    const pendingCorrections = attStore.getCorrectionsForDay(employeeId.value, date).filter(c => c.status === 'pending')
    return { date, dayNum: d.getDate(), dow: d.getDay(), isToday: date === todayStr, record, shifts, flags, pendingCorrections }
  })
)

// ── Filters ───────────────────────────────────────────────────

const selectedIds = ref(new Set<string>())

const visibleDays = computed(() => allDays.value)

// All pending record IDs in the current view
const pendingIds = computed(() =>
  allDays.value
    .filter(d => d.record?.status === 'PENDING_APPROVAL')
    .map(d => d.record!.id),
)

const allPendingSelected = computed(() =>
  pendingIds.value.length > 0 && pendingIds.value.every(id => selectedIds.value.has(id)),
)

// ── Per-day calculations ──────────────────────────────────────

function toMins(t?: string): number {
  if (!t) return 0
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

function daySessions(rec: AttendanceRecord): WorkSession[] {
  if (rec.sessions?.length) return rec.sessions
  return [{
    id: rec.id, sessionIdx: 0,
    checkIn: rec.checkIn, checkOut: rec.checkOut,
    breakMinutes: rec.breakMinutes, actualMinutes: rec.actualMinutes,
    department: employee.value?.department, punchVariant: 'NORMAL',
    nightMinutes: computeNightMins(rec.checkIn, rec.checkOut),
  }]
}

function dayScheduled(day: DayData): number {
  return day.shifts.reduce((s, sh) => s + Math.max(0, toMins(sh.endTime) - toMins(sh.startTime)), 0)
}

function dayBeyondSchedule(day: DayData): number {
  if (!day.record) return 0
  const sched = dayScheduled(day)
  if (sched === 0) return 0
  return Math.max(0, day.record.actualMinutes - sched)
}

function dayNight(day: DayData): number {
  if (!day.record) return 0
  return daySessions(day.record).reduce((s, sess) => s + (sess.nightMinutes ?? 0), 0)
}

function dayLate(day: DayData): number {
  if (!day.record || day.shifts.length === 0) return 0
  const sess = daySessions(day.record)
  if (!sess[0]?.checkIn) return 0
  return Math.max(0, toMins(sess[0].checkIn) - toMins(day.shifts[0].startTime))
}

function dayEarlyLeave(day: DayData): number {
  if (!day.record || day.shifts.length === 0) return 0
  const sess = daySessions(day.record)
  const last = sess[sess.length - 1]
  if (!last?.checkOut) return 0
  const lastShift = day.shifts[day.shifts.length - 1]
  return Math.max(0, toMins(lastShift.endTime) - toMins(last.checkOut))
}

// ── Monthly summary ───────────────────────────────────────────

const ms = computed(() => {
  const days = allDays.value
  return {
    workDays:         days.filter(d => (d.record?.actualMinutes ?? 0) > 0).length,
    absentDays:       days.filter(d => !d.record && d.shifts.length > 0).length,
    lateDays:         days.filter(d => dayLate(d) > 0).length,
    earlyLeaveDays:   days.filter(d => dayEarlyLeave(d) > 0).length,
    pendingCount:     days.filter(d => d.record?.status === 'PENDING_APPROVAL').length,
    totalMins:        days.reduce((s, d) => s + (d.record?.actualMinutes ?? 0), 0),
    scheduledMins:    days.reduce((s, d) => s + (d.record ? dayScheduled(d) : 0), 0),
    beyondScheduleMins: days.reduce((s, d) => s + dayBeyondSchedule(d), 0),
    legalOvertimeMins:  days.reduce((s, d) => s + (d.record?.overtimeMinutes ?? 0), 0),
    nightMins:        days.reduce((s, d) => s + dayNight(d), 0),
    lateMins:         days.reduce((s, d) => s + dayLate(d), 0),
    earlyLeaveMins:   days.reduce((s, d) => s + dayEarlyLeave(d), 0),
  }
})

// ── Display helpers ───────────────────────────────────────────

function fmtMins(m: number): string {
  const h = Math.floor(m / 60); const min = m % 60
  return min > 0 ? `${h}h${String(min).padStart(2,'0')}` : `${h}h`
}

function fmt12(t?: string): string { return t ?? '—' }

function statusLabel(s: AttendanceStatus): string {
  switch (s) {
    case 'APPROVED':             return '承認済み'
    case 'PENDING_APPROVAL':     return '申請済み'
    case 'CORRECTION_REQUESTED': return '差し戻し'
    case 'NOT_SUBMITTED':        return '未申請'
    default: return s
  }
}

function rowClass(day: DayData): string {
  if (day.isToday) return 'row-today'
  if (day.record?.status === 'PENDING_APPROVAL') return 'row-pending'
  if (day.record?.status === 'CORRECTION_REQUESTED') return 'row-correction'
  if (!day.record && day.shifts.length > 0) return 'row-absent'
  if (!day.record && day.shifts.length === 0) return 'row-empty'
  return ''
}

function dateCls(day: DayData): string {
  if (day.isToday) return 'date--today'
  if (day.dow === 0) return 'date--sun'
  if (day.dow === 6) return 'date--sat'
  return ''
}

// ── Approval actions ──────────────────────────────────────────

const complianceDialog = ref<{ open: boolean; recordId: string; flags: ComplianceFlag[] }>({ open: false, recordId: '', flags: [] })
const returnDialog     = ref<{ open: boolean; recordId: string; date: string }>({ open: false, recordId: '', date: '' })
const returnNote       = ref('')

function toggleSelect(id: string) {
  const s = new Set(selectedIds.value)
  s.has(id) ? s.delete(id) : s.add(id)
  selectedIds.value = s
}

function selectAllPending() {
  selectedIds.value = new Set(pendingIds.value)
}


// ── Status transition helpers ─────────────────────────────────

interface StatusAction {
  key: string
  label: string
  icon: string
  color: string
  handler: () => void
}

function statusActions(day: DayData): StatusAction[] {
  if (!day.record) return []
  const rec = day.record
  switch (rec.status) {
    case 'PENDING_APPROVAL':
      return [
        { key: 'approve', label: '承認する', icon: 'mdi-check-circle-outline', color: '#16a34a',
          handler: () => approveDay(rec.id, day.flags.length > 0, day.flags) },
        { key: 'return', label: '差し戻す', icon: 'mdi-undo-variant', color: '#d97706',
          handler: () => openReturn(rec.id, day.date) },
      ]
    case 'APPROVED':
      return [
        { key: 'revert', label: '承認を取消す', icon: 'mdi-close-circle-outline', color: '#dc2626',
          handler: () => attStore.revertApproval(rec.id) },
      ]
    case 'CORRECTION_REQUESTED':
      return [
        { key: 'approve', label: 'このまま承認する', icon: 'mdi-check-circle-outline', color: '#16a34a',
          handler: () => approveDay(rec.id, day.flags.length > 0, day.flags) },
        { key: 'cancel-return', label: '差し戻しを取消す', icon: 'mdi-arrow-u-left-top', color: '#2563eb',
          handler: () => attStore.cancelReturn(rec.id) },
      ]
    default:
      return []
  }
}

function statusActionLabel(_status: AttendanceStatus): string {
  return '操作'
}


function approveDay(recordId: string, hasFlags: boolean, flags: ComplianceFlag[]) {
  if (hasFlags) { complianceDialog.value = { open: true, recordId, flags } }
  else { attStore.approveDay(recordId) }
}

function confirmApprove() { attStore.approveDay(complianceDialog.value.recordId); complianceDialog.value.open = false }

function openReturn(recordId: string, date: string) {
  returnDialog.value = { open: true, recordId, date }
  returnNote.value = ''
}
function submitReturn() {
  attStore.returnDay(returnDialog.value.recordId, returnNote.value)
  returnDialog.value.open = false
  returnNote.value = ''
}

function bulkApproveSelected() {
  for (const id of selectedIds.value) attStore.approveDay(id)
  selectedIds.value = new Set()
}
</script>

<style scoped>
/* ── Summary wrap ───────────────────── */
.summary-wrap {
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  overflow: hidden;
  background: #fff;
}

/* Counts row */
.sum-counts {
  display: flex;
  align-items: stretch;
  padding: 12px 16px;
  gap: 0;
  border-bottom: 1px solid #f1f5f9;
}
.sc-item {
  display: flex; flex-direction: column; align-items: center;
  padding: 0 20px; gap: 2px; flex: 1;
}
.sc-sep { width: 1px; background: #e5e7eb; flex-shrink: 0; }
.sc-val {
  font-size: 22px; font-weight: 800; color: #111827; line-height: 1;
  font-feature-settings: "tnum";
}
.sc-val small { font-size: 12px; font-weight: 500; margin-left: 1px; }
.sc-lbl { font-size: 10px; color: #9ca3af; font-weight: 500; }
.sc-alert .sc-val { color: #dc2626; }

/* Hours row */
.sum-hours {
  display: flex; align-items: stretch;
  padding: 10px 16px;
  background: #f8fafc;
  gap: 0;
  overflow-x: auto;
}
.sh-item {
  display: flex; flex-direction: column; align-items: center;
  padding: 0 16px; gap: 2px; flex: 1; min-width: 80px;
}
.sh-item--primary .sh-val { color: #111827; font-size: 15px; }
.sh-sep { width: 1px; background: #e5e7eb; flex-shrink: 0; }
.sh-val {
  font-size: 13px; font-weight: 700; color: #374151;
  font-feature-settings: "tnum"; white-space: nowrap;
}
.sh-lbl { font-size: 10px; color: #9ca3af; font-weight: 500; white-space: nowrap; }
.sh-alert .sh-val { color: #dc2626; }

/* ── Table ──────────────────────────── */
.tbl-outer {
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  overflow: hidden;
}
.tbl-scroll { overflow-x: auto; -webkit-overflow-scrolling: touch; }
.tbl-scroll::-webkit-scrollbar { height: 5px; }
.tbl-scroll::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }

.att-tbl {
  border-collapse: collapse;
  table-layout: fixed;
  width: 100%;
  min-width: 900px;
  white-space: nowrap;
  font-size: 12px;
}

/* Column widths */
.th-date    { width: 64px; }
.th-punch   { width: 260px; white-space: normal; }
.th-shift   { width: 120px; white-space: normal; }
.th-num     { width: 58px; }
.th-status  { width: 80px; }
.th-actions { width: 130px; }

thead th {
  padding: 7px 8px;
  font-size: 10px; font-weight: 700; color: #6b7280;
  background: #f8fafc;
  border-bottom: 2px solid #e5e7eb;
  text-align: center;
  letter-spacing: 0.02em;
}
.th-date  { text-align: center; }
.th-punch { text-align: left; }
.th-alert { color: #dc2626; }


/* ── Rows ───────────────────────────── */
.att-row td {
  padding: 6px 8px;
  border-bottom: 1px solid #f1f5f9;
  vertical-align: top;
}
.att-row:last-child td { border-bottom: none; }
.att-row:hover td { background: #fafafa; }

.row-pending    td { background: #eff6ff; }
.row-pending:hover td { background: #dbeafe; }
.row-correction td { background: #fefce8; }
.row-correction:hover td { background: #fef9c3; }
.row-absent     td { background: #fff8f8; }
.row-today      td { background: #f0f9ff; }
.row-empty      { opacity: 0.4; }

/* Date cell */
.td-date { text-align: center; padding-left: 8px !important; padding-right: 8px !important; }
.td-date--pending { cursor: pointer; }
.date-cell { display: flex; flex-direction: column; align-items: center; padding-top: 2px; gap: 1px; }
.date-num { font-size: 15px; font-weight: 700; line-height: 1.1; color: #111827; }
.date-dow { font-size: 9px; color: #9ca3af; line-height: 1; }
.date--today { color: #2563eb !important; }
.date--sun   { color: #dc2626 !important; }
.date--sat   { color: #2563eb !important; }

/* Selection badge — replaces the date number for pending rows */
.date-badge {
  width: 28px; height: 28px; border-radius: 50%;
  border: 1.5px solid #d1d5db;
  display: flex; align-items: center; justify-content: center;
  transition: border-color 0.12s, background 0.12s;
}
.td-date--pending:hover .date-badge { border-color: #93c5fd; background: #eff6ff; }
.date-badge--on { border-color: #2563eb !important; background: #dbeafe !important; }

/* Punch cell */
.td-punch { white-space: normal; }
.punch-row {
  display: flex; align-items: center; flex-wrap: wrap;
  gap: 4px; padding: 1px 0;
}
.punch-idx    { font-size: 9px; font-weight: 700; color: #2563eb; min-width: 10px; }
.punch-time   { font-size: 12px; font-weight: 600; font-feature-settings: "tnum"; color: #111827; }
.punch-time--missing { color: #dc2626; }
.punch-arrow  { color: #9ca3af; font-size: 10px; }
.punch-break  { font-size: 10px; color: #9ca3af; }
.punch-dept   { font-size: 10px; background: #f3f4f6; color: #4b5563; border-radius: 3px; padding: 0 4px; }
.punch-store  { font-size: 10px; background: #fef3c7; color: #92400e; border-radius: 3px; padding: 0 4px; }
.punch-tag    { font-size: 9px; border-radius: 3px; padding: 0 4px; font-weight: 600; }
.punch-tag--help  { background: #fff7ed; color: #c2410c; }
.punch-tag--train { background: #f5f3ff; color: #6d28d9; }
.punch-absent { font-size: 11px; color: #dc2626; font-weight: 600; }
.punch-flags  { display: flex; flex-wrap: wrap; gap: 3px; margin-top: 2px; }
.flag-chip    { font-size: 9px; border-radius: 3px; padding: 1px 5px; font-weight: 600; }
.flag-error   { background: #fee2e2; color: #991b1b; }
.flag-warning { background: #fef9c3; color: #854d0e; }

/* Shift cell */
.td-shift { text-align: center; white-space: normal; vertical-align: middle; }
.shift-stack { display: flex; flex-direction: column; align-items: center; gap: 3px; }
.shift-chip {
  display: inline-flex; align-items: center; gap: 3px;
  background: #f1f5f9; border: 1px solid #e2e8f0; border-radius: 5px;
  padding: 2px 6px; white-space: nowrap;
}
.shift-chip__time {
  font-size: 11px; font-weight: 600; color: #334155;
  font-feature-settings: "tnum"; letter-spacing: -0.2px;
}
.shift-chip__sep { color: #94a3b8; margin: 0 1px; font-weight: 400; }
.shift-chip__dept {
  font-size: 9px; color: #7c3aed; font-weight: 600;
  background: #ede9fe; border-radius: 3px; padding: 0 3px; margin-left: 2px;
}

/* Number cells */
.td-num { text-align: center; font-feature-settings: "tnum"; font-weight: 600; color: #374151; font-size: 12px; }
.td-num--ot  .val-ot    { color: #dc2626; }
.val-late  { color: #dc2626; font-weight: 700; }
.val-early { color: #ea580c; font-weight: 700; }
.td-nil    { color: #d1d5db; font-weight: 400; }

/* Status */
.td-status { text-align: center; }
.status-chip {
  font-size: 10px; font-weight: 700;
  padding: 2px 7px; border-radius: 4px;
  display: inline-block; white-space: nowrap;
}
.status-approved             { background: #dcfce7; color: #15803d; }
.status-pending-approval     { background: #dbeafe; color: #1d4ed8; }
.status-correction-requested { background: #fef9c3; color: #854d0e; }
.status-not-submitted        { background: #e5e7eb; color: #374151; }
.status-absent               { background: #fee2e2; color: #991b1b; }

/* Selected row highlight */
.att-row--selected td { background: #eff6ff !important; }
.att-row--selected .date-badge { border-color: #2563eb !important; background: #dbeafe !important; }

/* Actions */
.td-actions { text-align: center; padding: 6px 8px !important; vertical-align: middle; }
.act-group { display: flex; align-items: center; justify-content: center; gap: 5px; }
.act-btn {
  display: inline-flex; align-items: center; gap: 3px;
  border: 1px solid #e2e8f0; background: #fff; cursor: pointer;
  font-size: 11px; font-weight: 600; padding: 3px 8px; border-radius: 5px;
  transition: all 0.12s; white-space: nowrap; color: #374151;
}
.act-btn:hover { background: #f8fafc; border-color: #cbd5e1; }

.act-btn--detail:hover { color: #2563eb; border-color: #bfdbfe; background: #eff6ff; }

/* Empty state */
.td-empty { text-align: center; padding: 40px; color: #9ca3af; font-size: 13px; }
</style>
