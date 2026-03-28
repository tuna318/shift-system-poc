<template>
  <div class="att-page">

    <!-- ── Month header ──────────────────────────────────────── -->
    <div class="att-header">
      <v-btn icon="mdi-chevron-left" variant="text" size="small" density="compact" @click="prevMonth" />
      <div class="att-header__month">
        <div class="att-header__month-label">{{ displayMonth }}</div>
        <div class="att-header__period">{{ periodLabel }}</div>
      </div>
      <v-btn icon="mdi-chevron-right" variant="text" size="small" density="compact" @click="nextMonth" />
      <v-btn
        v-if="pendingCount > 0"
        color="primary"
        size="small"
        variant="tonal"
        rounded="lg"
        class="ml-2"
        @click="showBulkDialog = true"
      >
        月次申請&nbsp;
        <v-chip size="x-small" color="error" class="ml-1 pa-1" style="min-width:20px;height:18px;">{{ pendingCount }}</v-chip>
      </v-btn>
    </div>

    <!-- ── Calendar grid ─────────────────────────────────────── -->
    <div class="cal-wrap px-3 pb-2">
      <div class="cal-grid">
        <div v-for="(d, di) in DOW_LABELS" :key="d" class="cal-header"
             :class="di === 0 ? 'text-error' : di === 6 ? 'cal-sat' : 'text-grey'">
          {{ d }}
        </div>
      </div>
      <div class="cal-grid">
        <div
          v-for="cell in calendarGrid"
          :key="cell.date"
          class="cal-cell"
          :class="{
            'cal-cell--today': cell.isToday,
            'cal-cell--selected': selectedDate === cell.date,
            'cal-cell--other': !cell.isCurrentMonth,
          }"
          @click="cell.isCurrentMonth && onCalendarTap(cell.date)"
        >
          <span class="cal-day"
            :class="{
              'text-error':          cell.dow === 0 && cell.isCurrentMonth,
              'cal-sat':             cell.dow === 6 && cell.isCurrentMonth,
              'text-grey-lighten-2': !cell.isCurrentMonth,
            }"
          >{{ cell.day }}</span>
          <div v-if="cell.isCurrentMonth" class="cal-ind">
            <v-icon v-if="calStatusMap[cell.date] === 'approved'"   size="9" color="#4caf50">mdi-check</v-icon>
            <v-icon v-else-if="calStatusMap[cell.date] === 'correction'" size="9" color="#f59e0b">mdi-alert</v-icon>
            <span v-else-if="calStatusMap[cell.date] === 'pending'"    class="ind-dot ind-blue" />
            <span v-else-if="calStatusMap[cell.date] === 'has_record'" class="ind-dot ind-grey" />
          </div>
        </div>
      </div>
    </div>

    <!-- ── Summary stats ──────────────────────────────────────── -->
    <div class="summary-row">
      <div v-for="stat in summaryStats" :key="stat.label" class="summary-item">
        <div class="summary-value" :class="stat.alert ? 'text-error' : ''">{{ stat.value }}</div>
        <div class="summary-label">{{ stat.label }}</div>
      </div>
    </div>

    <!-- ── Daily list ─────────────────────────────────────────── -->
    <div class="daily-section">

      <!-- Header row -->
      <div class="att-grid att-thead">
        <div class="th">日付</div>
        <div class="th">出勤区分</div>
        <div class="th tc">出勤</div>
        <div class="th tc">退勤</div>
        <div class="th tc">休憩</div>
        <div class="th tc">申請</div>
        <div class="th tc">編集</div>
      </div>

      <template v-for="row in flatRows" :key="`${row.kind}-${row.date}-${row.sessionIdx}`">

        <!-- ── Day header row (multi-session days) ──────────────── -->
        <template v-if="row.kind === 'day-header'">
          <div
            :id="`dayrow-${row.date}`"
            class="att-grid att-row row-day-header"
            :class="{
              'row--today':    row.dayInfo.isToday,
              'row--selected': selectedDate === row.date,
            }"
          >
            <div class="cell-date">
              <span class="d-num" :class="row.dayInfo.dow===0?'c-sun':row.dayInfo.dow===6?'c-sat':row.dayInfo.isToday?'c-today':'c-normal'">{{ row.dayInfo.dayNum }}</span>
              <span class="d-dow" :class="row.dayInfo.dow===0?'c-sun':row.dayInfo.dow===6?'c-sat':''">{{ row.dayInfo.dowLabel }}</span>
            </div>
            <div class="cell-type">
              <span class="type-label tl--work">{{ workTypeLabel(row.dayInfo) }}</span>
              <span class="split-badge">分割</span>
            </div>
            <div class="cell-time tc">
              <span class="t-val">{{ row.dailyFirstIn ?? '—' }}</span>
            </div>
            <div class="cell-time tc">
              <span class="t-val">{{ row.dailyLastOut ? fmtCheckOut(row.dailyFirstIn, row.dailyLastOut) : '—' }}</span>
            </div>
            <div class="cell-time tc">
              <span class="t-val">{{ row.dailyBreakMins ? fmtBreak(row.dailyBreakMins) : '—' }}</span>
            </div>
            <div class="cell-btn tc">
              <button v-if="canApply(row.dayInfo)" class="btn-apply" :class="row.dayInfo.record?.status==='CORRECTION_REQUESTED'?'btn-apply--err':''" @click="navigateTo(`/attendance/${row.date}`)">申請</button>
              <button v-else-if="showApplyDisabled(row.dayInfo)" class="btn-apply btn-apply--disabled" disabled>申請</button>
              <span v-else-if="row.dayInfo.record?.status==='APPROVED'" class="st st--ok">承認済</span>
              <span v-else-if="row.dayInfo.record?.status==='PENDING_APPROVAL'" class="st st--pending">申請中</span>
              <span v-else class="st st--none">—</span>
            </div>
            <div class="cell-btn tc">
              <button class="btn-edit" @click="navigateTo(`/attendance/${row.date}`)">編集</button>
            </div>
          </div>
        </template>

        <!-- ── Session sub-row ──────────────────────────────────── -->
        <template v-else-if="row.kind === 'session'">
          <div
            class="att-grid att-row row-session"
            :class="{ 'row-session--alert': row.sd?.sixHourAlert }"
          >
            <div class="cell-date cell-session-lbl">
              <span class="session-lbl">{{ row.sessionLabel }}</span>
            </div>
            <div class="cell-type">
              <span v-if="row.sd?.department" class="dept-badge">{{ row.sd.department }}</span>
              <span v-if="row.sd?.punchVariant === 'HELP'" class="variant-badge variant-help">{{ row.sd.helpStore ? row.sd.helpStore : 'ヘルプ' }}</span>
              <span v-else-if="row.sd?.punchVariant === 'TRAINING'" class="variant-badge variant-train">研修</span>
              <span v-if="row.sd?.sixHourAlert" class="badge-warn">要休憩</span>
              <span v-else-if="row.sd && row.sd.nightMins > 0" class="badge-night">深夜</span>
            </div>
            <div class="cell-time tc">
              <span v-if="row.sd?.checkIn" class="t-val">{{ row.sd.checkIn }}</span>
              <span v-else class="t-empty">—</span>
            </div>
            <div class="cell-time tc">
              <span v-if="row.sd?.checkOut" class="t-val">{{ fmtCheckOut(row.sd.checkIn, row.sd.checkOut) }}</span>
              <span v-else-if="row.sd?.checkIn && !row.sd.checkOut && row.date <= TODAY" class="t-alert">未退勤</span>
              <span v-else class="t-empty">—</span>
            </div>
            <div class="cell-time tc">
              <span class="t-val">{{ row.sd?.breakMins ? fmtBreak(row.sd.breakMins) : '—' }}</span>
            </div>
            <div class="cell-btn tc" />
            <div class="cell-btn tc" />
          </div>
        </template>

        <!-- ── Single row ────────────────────────────────────────── -->
        <template v-else>
          <div
            :id="`dayrow-${row.date}`"
            class="att-grid att-row"
            :class="{
              'row--today':    row.dayInfo.isToday,
              'row--holiday':  row.dayInfo.isWeekend && !row.dayInfo.record,
              'row--alert':    row.dayInfo.alertType !== null,
              'row--selected': selectedDate === row.date,
            }"
          >
            <div class="cell-date">
              <span class="d-num" :class="row.dayInfo.dow===0?'c-sun':row.dayInfo.dow===6?'c-sat':row.dayInfo.isToday?'c-today':'c-normal'">{{ row.dayInfo.dayNum }}</span>
              <span class="d-dow" :class="row.dayInfo.dow===0?'c-sun':row.dayInfo.dow===6?'c-sat':''">{{ row.dayInfo.dowLabel }}</span>
            </div>
            <div class="cell-type">
              <span class="type-label" :class="row.dayInfo.isWeekend?'tl--off':row.dayInfo.alertType?'tl--alert':'tl--work'">{{ workTypeLabel(row.dayInfo) }}</span>
              <span v-if="row.dayInfo.record?.department" class="dept-badge">{{ row.dayInfo.record.department }}</span>
              <span v-if="row.dayInfo.record?.punchVariant === 'HELP'" class="variant-badge variant-help">{{ row.dayInfo.record.helpStore ?? 'ヘルプ' }}</span>
              <span v-else-if="row.dayInfo.record?.punchVariant === 'TRAINING'" class="variant-badge variant-train">研修</span>
            </div>
            <div class="cell-time tc">
              <span v-if="row.dayInfo.record?.checkIn" class="t-val">{{ row.dayInfo.record.checkIn }}</span>
              <span v-else-if="row.dayInfo.alertType==='absent'" class="t-alert">要申告</span>
              <span v-else class="t-empty">—</span>
            </div>
            <div class="cell-time tc">
              <span v-if="row.dayInfo.record?.checkOut" class="t-val">{{ fmtCheckOut(row.dayInfo.record.checkIn, row.dayInfo.record.checkOut) }}</span>
              <span v-else-if="row.dayInfo.alertType==='missing_checkout'" class="t-alert">未退勤</span>
              <span v-else class="t-empty">—</span>
            </div>
            <div class="cell-time tc">
              <span class="t-val">{{ row.dayInfo.record?.breakMinutes ? fmtBreak(row.dayInfo.record.breakMinutes) : '—' }}</span>
            </div>
            <div class="cell-btn tc">
              <button v-if="canApply(row.dayInfo)" class="btn-apply" :class="row.dayInfo.record?.status==='CORRECTION_REQUESTED'?'btn-apply--err':''" @click="navigateTo(`/attendance/${row.date}`)">申請</button>
              <button v-else-if="showApplyDisabled(row.dayInfo)" class="btn-apply btn-apply--disabled" disabled>申請</button>
              <span v-else-if="row.dayInfo.record?.status==='APPROVED'" class="st st--ok">承認済</span>
              <span v-else-if="row.dayInfo.record?.status==='PENDING_APPROVAL'" class="st st--pending">申請中</span>
              <span v-else class="st st--none">—</span>
            </div>
            <div class="cell-btn tc">
              <button class="btn-edit" @click="navigateTo(`/attendance/${row.date}`)">編集</button>
            </div>
          </div>
        </template>

      </template>
    </div>

    <!-- ── Bulk apply bar ────────────────────────────────────── -->
    <div v-if="pendingCount > 0" class="bulk-bar">
      <v-btn block color="primary" size="large" rounded="xl" elevation="0" @click="showBulkDialog = true">
        <v-icon start>mdi-send-outline</v-icon>
        {{ pendingCount }}件をまとめて月次申請
      </v-btn>
    </div>

    <!-- ── 月次申請 dialog ────────────────────────────────────── -->
    <v-dialog v-model="showBulkDialog" max-width="360">
      <v-card rounded="xl">
        <v-card-text class="pa-6 text-center">
          <v-icon size="52" color="primary" class="mb-3">mdi-send-circle-outline</v-icon>
          <div class="text-subtitle-1 font-weight-bold mb-1">月次申請</div>
          <div class="text-body-2 text-grey mb-1">{{ displayMonth }}の勤怠をまとめて申請します。</div>
          <div class="text-h6 font-weight-bold text-primary mb-4">{{ pendingCount }}件</div>
          <div class="d-flex gap-2">
            <v-btn variant="outlined" rounded="lg" class="flex-1-1" @click="showBulkDialog = false">キャンセル</v-btn>
            <v-btn color="primary" rounded="lg" class="flex-1-1" @click="submitBulk">申請する</v-btn>
          </div>
        </v-card-text>
      </v-card>
    </v-dialog>

  </div>
</template>

<script setup lang="ts">
import type { AttendanceRecord, WorkSession } from '~/types'

const { myAttendance, getShiftForDate, getShiftsForDate } = useMockData()
const appStore = useAppStore()

// ── Types ─────────────────────────────────────────────────────────
interface DayInfo {
  day: number
  dayNum: string
  date: string
  dow: number
  dowLabel: string
  isWeekend: boolean
  isToday: boolean
  record: AttendanceRecord | null
  workType: string
  dateLabel: string
  nightMins: number
  holidayMins: number
  regularMins: number
  alertType: 'absent' | 'missing_checkout' | null
  sessionCount: number
}

// ── Constants ─────────────────────────────────────────────────────
const DOW_LABELS = ['日', '月', '火', '水', '木', '金', '土']
const TODAY = '2026-03-28'

const STATUS_LABELS: Record<string, string> = {
  APPROVED: '承認済み',
  PENDING_APPROVAL: '申請中',
  CORRECTION_REQUESTED: '修正依頼',
  NOT_SUBMITTED: '未提出',
  ABSENT: '欠勤',
}
const STATUS_COLORS: Record<string, string> = {
  APPROVED: 'success',
  PENDING_APPROVAL: 'primary',
  CORRECTION_REQUESTED: 'error',
  NOT_SUBMITTED: 'grey',
  ABSENT: 'warning',
}

// ── Month navigation ──────────────────────────────────────────────
const currentYear  = ref(2026)
const currentMonth = ref(3)

const displayMonth = computed(() => `${currentYear.value}年${currentMonth.value}月`)
const periodLabel  = computed(() => {
  const y = currentYear.value, m = currentMonth.value
  const last = new Date(y, m, 0).getDate()
  return `${y}/${String(m).padStart(2,'0')}/01 〜 ${y}/${String(m).padStart(2,'0')}/${last}`
})

function prevMonth() {
  if (currentMonth.value === 1) { currentMonth.value = 12; currentYear.value-- }
  else currentMonth.value--
  selectedDate.value = null
}
function nextMonth() {
  if (currentMonth.value === 12) { currentMonth.value = 1; currentYear.value++ }
  else currentMonth.value++
  selectedDate.value = null
}

// ── Calendar ──────────────────────────────────────────────────────
const calendarGrid = computed(() => {
  const y = currentYear.value, m = currentMonth.value
  const first = new Date(y, m - 1, 1)
  const last  = new Date(y, m, 0)
  const cells: { date: string; day: number; dow: number; isCurrentMonth: boolean; isToday: boolean }[] = []

  for (let i = first.getDay() - 1; i >= 0; i--) {
    const d = new Date(y, m - 1, -i)
    cells.push({ date: d.toISOString().slice(0, 10), day: d.getDate(), dow: d.getDay(), isCurrentMonth: false, isToday: false })
  }
  for (let i = 1; i <= last.getDate(); i++) {
    const d  = new Date(y, m - 1, i)
    const ds = d.toISOString().slice(0, 10)
    cells.push({ date: ds, day: i, dow: d.getDay(), isCurrentMonth: true, isToday: ds === TODAY })
  }
  const rem = (7 - (cells.length % 7)) % 7
  for (let i = 1; i <= rem; i++) {
    const d = new Date(y, m, i)
    cells.push({ date: d.toISOString().slice(0, 10), day: d.getDate(), dow: d.getDay(), isCurrentMonth: false, isToday: false })
  }
  return cells
})

const calStatusMap = computed(() => {
  const map: Record<string, string> = {}
  for (const r of myAttendance) {
    if      (r.status === 'APPROVED')             map[r.date] = 'approved'
    else if (r.status === 'CORRECTION_REQUESTED') map[r.date] = 'correction'
    else if (r.status === 'PENDING_APPROVAL')     map[r.date] = 'pending'
    else                                          map[r.date] = 'has_record'
  }
  return map
})

// ── Selected / expanded state ─────────────────────────────────────
const selectedDate = ref<string | null>(null)

async function onCalendarTap(date: string) {
  selectedDate.value = date
  const info = allDayInfos.value.find(d => d.date === date)
  if (info) {
    await nextTick()
    document.getElementById(`dayrow-${date}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }
}

function onRowTap(info: DayInfo) {
  navigateTo(`/attendance/${info.date}`)
}

// ── Display helpers ───────────────────────────────────────────────
function workTypeLabel(info: DayInfo): string {
  if (info.isWeekend)        return info.record ? '休日出勤' : '公休'
  if (info.record)           return '出勤'
  if (info.workType === '所定労働日') return '出勤'   // scheduled but absent
  return '公休'
}

function fmtBreak(mins: number): string {
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return `${h}:${String(m).padStart(2, '0')}`
}

function canApply(info: DayInfo): boolean {
  if (info.alertType !== null) return false              // warning state → disable
  const st = info.record?.status
  return st === 'NOT_SUBMITTED' || st === 'CORRECTION_REQUESTED'
}

function showApplyDisabled(info: DayInfo): boolean {
  return info.alertType !== null
}

// ── Multi-session flat rows ───────────────────────────────────────
const SESSION_LABELS = ['朝番', '夕番', '深夜番']

interface SessionDetail {
  checkIn: string | null
  checkOut: string | null
  breakMins: number
  totalMins: number
  nightMins: number
  sixHourAlert: boolean
  department: string | null
  punchVariant: string | null
  helpStore: string | null
}

interface FlatRow {
  kind: 'single' | 'day-header' | 'session'
  date: string
  dayInfo: DayInfo
  sessionIdx: number
  sessionLabel: string
  sd: SessionDetail | null
  dailyTotalMins: number
  dailyFirstIn: string | null
  dailyLastOut: string | null
  dailyBreakMins: number
}

function sessionBreakMinsCalc(s: WorkSession): number {
  return (s.breaks ?? []).reduce((sum, b) => {
    if (!b.start || !b.end) return sum
    const bIn  = toMins(b.start)
    const bOut = toMins(b.end, b.start)
    return sum + Math.max(0, bOut - bIn)
  }, 0)
}

function computeSessionMins(s: WorkSession): number {
  if (!s.checkIn || !s.checkOut) return 0
  const inM  = toMins(s.checkIn)
  const outM = toMins(s.checkOut, s.checkIn)
  return Math.max(0, outM - inM - sessionBreakMinsCalc(s))
}

// ── Night-shift helpers ───────────────────────────────────────────
/** Minutes from 00:00 for a HH:MM string; if the time is before checkIn it's next-day (+1440). */
function toMins(time: string, referenceTime?: string): number {
  const [h, m] = time.split(':').map(Number)
  let total = h * 60 + m
  if (referenceTime) {
    const [rh, rm] = referenceTime.split(':').map(Number)
    if (total < rh * 60 + rm) total += 24 * 60  // crossed midnight
  }
  return total
}

function computeNightMins(checkIn: string | null, checkOut: string | null): number {
  if (!checkIn || !checkOut) return 0
  const inMins  = toMins(checkIn)
  const outMins = toMins(checkOut, checkIn) // handles midnight crossing

  // Night bands: 22:00–24:00 and 24:00–29:00 (i.e. 00:00–05:00 next day)
  const bands = [
    { s: 22 * 60, e: 24 * 60 },
    { s: 24 * 60, e: 29 * 60 },
  ]
  return bands.reduce((sum, b) => {
    const overlap = Math.min(outMins, b.e) - Math.max(inMins, b.s)
    return sum + Math.max(0, overlap)
  }, 0)
}

/** Display checkout with (翌) suffix when it crosses midnight */
function fmtCheckOut(checkIn: string | null, checkOut: string | null): string {
  if (!checkOut) return '未退勤⚠'
  if (!checkIn)  return checkOut
  const [ih, im] = checkIn.split(':').map(Number)
  const [oh, om] = checkOut.split(':').map(Number)
  return oh * 60 + om < ih * 60 + im ? `${checkOut}(翌)` : checkOut
}

function fmtM(mins: number): string {
  if (!mins) return '0分'
  const h = Math.floor(mins / 60), m = mins % 60
  return m > 0 ? `${h}時間${m}分` : `${h}時間`
}
function fmtStat(mins: number): string {
  if (!mins) return '0時間\n0分'
  return `${Math.floor(mins / 60)}時間\n${mins % 60}分`
}


// ── All day infos ─────────────────────────────────────────────────
const allDayInfos = computed((): DayInfo[] => {
  const y = currentYear.value, m = currentMonth.value
  const lastDay = new Date(y, m, 0).getDate()

  return Array.from({ length: lastDay }, (_, i) => {
    const day  = i + 1
    const d    = new Date(y, m - 1, day)
    const date = d.toISOString().slice(0, 10)
    const dow  = d.getDay()
    const isWeekend = dow === 0 || dow === 6

    const record   = myAttendance.find(a => a.date === date) ?? null
    const shifts   = getShiftsForDate(date)
    const shift    = shifts[0] ?? null
    const isPast   = date < TODAY

    let workType: string
    if (isWeekend)         workType = record ? '休日出勤' : '公休'
    else if (shifts.length) workType = '所定労働日'
    else                   workType = '公休'

    const nightMins   = computeNightMins(record?.checkIn ?? null, record?.checkOut ?? null)
    const holidayMins = isWeekend ? (record?.totalMinutes ?? 0) : 0
    const regularMins = Math.max(0, (record?.totalMinutes ?? 0) - (record?.overtimeMinutes ?? 0) - holidayMins - nightMins)

    // Alert detection
    const alertType: 'absent' | 'missing_checkout' | null =
      (isPast && shifts.length > 0 && !record)                    ? 'absent' :
      (record?.checkIn && !record?.checkOut && date <= TODAY)      ? 'missing_checkout' :
      null

    // Number of work sessions (split shift)
    const sessionCount = record?.sessions?.length ?? (record?.checkIn ? 1 : 0)

    return {
      day, dayNum: String(day).padStart(2, '0'),
      date, dow, dowLabel: DOW_LABELS[dow],
      isWeekend, isToday: date === TODAY,
      record, workType,
      dateLabel: `${m}/${day}(${DOW_LABELS[dow]})`,
      nightMins, holidayMins, regularMins,
      alertType, sessionCount,
    }
  })
})

// ── Flat row list (expands multi-session days) ────────────────────
const flatRows = computed((): FlatRow[] => {
  const rows: FlatRow[] = []
  for (const dayInfo of allDayInfos.value) {
    const sessions = dayInfo.record?.sessions
    if (sessions && sessions.length > 1) {
      const dailyTotalMins = sessions.reduce((s, sess) => s + computeSessionMins(sess), 0)
      const dailyBreakMins = sessions.reduce((s, sess) => s + sessionBreakMinsCalc(sess), 0)
      const dailyFirstIn   = sessions[0]?.checkIn ?? null
      const dailyLastOut   = sessions[sessions.length - 1]?.checkOut ?? null
      rows.push({
        kind: 'day-header', date: dayInfo.date, dayInfo,
        sessionIdx: -1, sessionLabel: '', sd: null,
        dailyTotalMins, dailyFirstIn, dailyLastOut, dailyBreakMins,
      })
      sessions.forEach((s, idx) => {
        const breakMins    = sessionBreakMinsCalc(s)
        const totalMins    = computeSessionMins(s)
        const nightMins    = computeNightMins(s.checkIn, s.checkOut)
        const sixHourAlert = totalMins >= 360 && breakMins === 0
        rows.push({
          kind: 'session', date: dayInfo.date, dayInfo,
          sessionIdx: idx,
          sessionLabel: idx < SESSION_LABELS.length ? SESSION_LABELS[idx] : `第${idx + 1}`,
          sd: {
            checkIn: s.checkIn, checkOut: s.checkOut, breakMins, totalMins, nightMins, sixHourAlert,
            department: s.department ?? null,
            punchVariant: s.punchVariant ?? null,
            helpStore: s.helpStore ?? null,
          },
          dailyTotalMins: 0, dailyFirstIn: null, dailyLastOut: null, dailyBreakMins: 0,
        })
      })
    } else {
      rows.push({
        kind: 'single', date: dayInfo.date, dayInfo,
        sessionIdx: 0, sessionLabel: '', sd: null,
        dailyTotalMins: 0, dailyFirstIn: null, dailyLastOut: null, dailyBreakMins: 0,
      })
    }
  }
  return rows
})

// ── Summary stats ─────────────────────────────────────────────────
const monthlySums = computed(() => {
  const days = allDayInfos.value
  return {
    totalMinutes:    days.reduce((s, d) => s + (d.record?.totalMinutes    ?? 0), 0),
    regularMinutes:  days.reduce((s, d) => s + d.regularMins,                    0),
    overtimeMinutes: days.reduce((s, d) => s + (d.record?.overtimeMinutes ?? 0), 0),
    holidayMinutes:  days.reduce((s, d) => s + d.holidayMins,                    0),
    nightMinutes:    days.reduce((s, d) => s + d.nightMins,                      0),
  }
})
const summaryStats = computed(() => {
  const s = monthlySums.value
  return [
    { label: '総勤務', value: fmtStat(s.totalMinutes),    alert: false },
    { label: '所定内', value: fmtStat(s.regularMinutes),  alert: false },
    { label: '時間外', value: fmtStat(s.overtimeMinutes), alert: s.overtimeMinutes > 45 * 60 },
    { label: '休日',   value: fmtStat(s.holidayMinutes),  alert: false },
    { label: '深夜',   value: fmtStat(s.nightMinutes),    alert: false },
  ]
})

// ── Bulk 申請 ─────────────────────────────────────────────────────
const showBulkDialog = ref(false)

const pendingCount = computed(() =>
  allDayInfos.value.filter(d => {
    if (d.date > TODAY) return false
    if (d.record?.status === 'NOT_SUBMITTED' || d.record?.status === 'CORRECTION_REQUESTED') return true
    if (!d.record && d.workType === '所定労働日') return true
    return false
  }).length
)

function submitBulk() {
  showBulkDialog.value = false
  appStore.showSnackbar(`${pendingCount.value}件の月次申請を送信しました`, 'success')
}
</script>

<style scoped>
/* ── Page ──────────────────────────────────────────────────────── */
.att-page { padding-bottom: 24px; }

/* ── Header ────────────────────────────────────────────────────── */
.att-header {
  display: flex;
  align-items: center;
  padding: 12px 12px 8px;
  gap: 4px;
}
.att-header__month { flex: 1; text-align: center; }
.att-header__month-label { font-size: 16px; font-weight: 700; color: #1a1a1a; }
.att-header__period      { font-size: 11px; color: #9e9e9e; margin-top: 1px; }

/* ── Calendar ──────────────────────────────────────────────────── */
.cal-wrap { background: #fff; }
.cal-grid { display: grid; grid-template-columns: repeat(7, 1fr); }
.cal-header {
  text-align: center; font-size: 11px; font-weight: 700;
  padding: 4px 0; letter-spacing: 0.3px;
}
.cal-sat { color: #3587dc; }
.cal-cell {
  display: flex; flex-direction: column; align-items: center;
  justify-content: center; padding: 4px 2px; min-height: 44px;
  cursor: pointer; border-radius: 8px; transition: background 0.12s;
}
.cal-cell:active { background: #f0f4ff; }
.cal-cell--other { pointer-events: none; }
.cal-cell--today    { background: #EBF3FC; border: 1.5px solid #3587dc; border-radius: 8px; }
.cal-cell--selected { background: #3587dc; border-radius: 8px; }
.cal-cell--selected .cal-day { color: #fff !important; }
.cal-cell--selected .cal-ind { filter: brightness(5); }
.cal-day { font-size: 14px; font-weight: 600; line-height: 1; }
.cal-ind {
  height: 11px; display: flex; align-items: center;
  justify-content: center; margin-top: 2px;
}
.ind-dot  { display: inline-block; width: 6px; height: 6px; border-radius: 50%; }
.ind-blue { background: #3587dc; }
.ind-grey { background: #bdbdbd; }

/* ── Summary row ───────────────────────────────────────────────── */
.summary-row {
  display: flex;
  border-top: 1px solid #f0f0f0; border-bottom: 1px solid #f0f0f0;
  background: #fafafa; padding: 10px 8px;
}
.summary-item { flex: 1; text-align: center; }
.summary-value {
  font-size: 12px; font-weight: 700; color: #1a1a1a;
  white-space: pre-line; line-height: 1.4;
}
.summary-label { font-size: 10px; color: #9e9e9e; margin-top: 2px; letter-spacing: 0.3px; }

/* ── Daily list table ──────────────────────────────────────────── */
.daily-section { background: #fff; border-top: 1px solid #e8e8e8; }

/* 7 equal columns, full container width */
.att-grid {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 4px;
  padding: 0 8px;
  align-items: center;
  width: 100%;
  box-sizing: border-box;
}

/* ── Header ── */
.att-thead {
  background: #f5f7fa;
  border-bottom: 2px solid #e4e4e4;
  padding-top: 7px; padding-bottom: 7px;
}
.th {
  font-size: 10px; font-weight: 700; color: #aaa;
  letter-spacing: 0.4px; white-space: nowrap; overflow: hidden;
}
.tc { text-align: center; }

/* ── Row ── */
.att-row {
  min-height: 52px;
  border-bottom: 1px solid #f0f0f0;
  transition: background 0.1s;
}
.att-row:active  { background: #f0f4ff; }
.row--holiday    { background: #fdf5f5; }
.row--today      { background: #eff7ff; box-shadow: inset 3px 0 0 #3587dc; }
.row--alert      { background: #fffbeb; }
.row--selected   { background: #e8f2fd; }

/* ① Date cell */
.cell-date {
  display: flex; flex-direction: column; align-items: center;
  justify-content: center; gap: 0; padding: 4px 0;
}
.d-num   { font-size: 16px; font-weight: 700; line-height: 1.1; }
.d-dow   { font-size: 10px; color: #aaa; line-height: 1.3; }
.c-normal{ color: #1a1a1a; }
.c-sun   { color: #e6273e; }
.c-sat   { color: #3587dc; }
.c-today { color: #3587dc; font-weight: 900; }

/* ② Type cell */
.cell-type {
  display: flex; flex-direction: column; gap: 3px;
  padding: 4px 0;
}
.type-label   { font-size: 11px; font-weight: 600; line-height: 1.3; word-break: keep-all; }
.tl--work     { color: #1a1a1a; }
.tl--off      { color: #aaa; }
.tl--alert    { color: #d97706; }
.split-badge  {
  font-size: 9px; color: #3587dc; background: #e3f0fb;
  padding: 1px 4px; border-radius: 3px; align-self: flex-start;
  font-weight: 700;
}

/* ③④⑤ Time cells */
.cell-time { display: flex; align-items: center; justify-content: center; }
.t-val   { font-size: 13px; font-weight: 600; color: #1a1a1a; font-variant-numeric: tabular-nums; }
.t-alert { font-size: 10px; font-weight: 700; color: #d97706; }
.t-empty { font-size: 13px; color: #d8d8d8; }

/* ⑥⑦ Button cells */
.cell-btn {
  display: flex; align-items: center; justify-content: center;
  padding: 4px 0;
}
.btn-edit {
  background: #fff; border: 1.5px solid #3587dc; color: #3587dc;
  font-size: 11px; font-weight: 700;
  width: 100%; height: 26px; border-radius: 5px; cursor: pointer;
  transition: background 0.1s; white-space: nowrap;
}
.btn-edit:active { background: #EBF3FC; }

.btn-apply {
  background: #3587dc; color: #fff; border: none;
  font-size: 11px; font-weight: 700;
  width: 100%; height: 26px; border-radius: 5px; cursor: pointer;
  transition: background 0.1s;
}
.btn-apply:active      { background: #2a6cb5; }
.btn-apply--err        { background: #e6273e; }
.btn-apply--err:active { background: #c01e31; }
.btn-apply--disabled   { background: #e5e7eb; color: #9ca3af; cursor: not-allowed; }

.st         { font-size: 10px; font-weight: 700; white-space: nowrap; }
.st--ok     { color: #2e7d32; }
.st--pending{ color: #3587dc; }
.st--none   { color: #d0d0d0; }

/* ── Bulk bar ──────────────────────────────────────────────────── */
.bulk-bar {
  position: sticky; bottom: 0;
  background: rgba(255,255,255,0.95);
  backdrop-filter: blur(8px);
  border-top: 1px solid #f0f0f0;
  padding: 12px 16px;
}

.gap-2 { gap: 8px; }

/* ── Multi-session row types ───────────────────────────────────── */
.row-day-header {
  background: #edf3fa;
  border-bottom: none;
  min-height: 48px;
}

.row-session {
  background: #f7fafd;
  border-bottom: 1px solid #eaeff6;
  box-shadow: inset 3px 0 0 #a8c5e8;
  min-height: 40px;
}
.row-session--alert { background: #fffbeb; }
.row-session:last-child { border-bottom: 1px solid #e0e0e0; }

.cell-session-lbl {
  display: flex;
  align-items: center;
  justify-content: center;
}
.session-lbl {
  font-size: 9px;
  font-weight: 700;
  color: #3587dc;
  background: #dceeff;
  padding: 2px 5px;
  border-radius: 3px;
  text-align: center;
  line-height: 1.4;
}

.badge-night {
  font-size: 9px; font-weight: 700;
  color: #4338ca; background: #e0e7ff;
  padding: 1px 4px; border-radius: 3px;
}
.badge-warn {
  font-size: 9px; font-weight: 700;
  color: #d97706; background: #fef3c7;
  padding: 1px 4px; border-radius: 3px;
}
.dept-badge {
  font-size: 9px; font-weight: 700;
  color: #374151; background: #f3f4f6;
  padding: 1px 4px; border-radius: 3px;
}
.variant-badge {
  font-size: 9px; font-weight: 700;
  padding: 1px 4px; border-radius: 3px;
}
.variant-help  { color: #92400e; background: #fef3c7; }
.variant-train { color: #065f46; background: #d1fae5; }
</style>
