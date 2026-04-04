<template>
  <div>
    <!-- ── Breadcrumb ──────────────────────────────────────────── -->
    <div class="d-flex align-center ga-2 mb-4">
      <v-btn to="/attendance" icon size="small" variant="text">
        <v-icon>mdi-arrow-left</v-icon>
      </v-btn>
      <v-breadcrumbs
        :items="[{ title: '勤怠一覧', to: '/attendance' }, { title: employee?.name ?? '—' }]"
        density="compact"
        class="pa-0"
      />
    </div>

    <!-- ── Employee header ─────────────────────────────────────── -->
    <div class="d-flex align-center justify-space-between mb-5 flex-wrap gap-3">
      <div class="d-flex align-center ga-3">
        <v-avatar size="52" color="primary" variant="tonal" rounded="xl">
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
          <div class="text-body-2 text-medium-emphasis mt-1">{{ monthLabel }}</div>
        </div>
      </div>

      <!-- Month nav -->
      <div class="d-flex align-center ga-1">
        <v-btn icon size="small" variant="text" @click="prevMonth"><v-icon>mdi-chevron-left</v-icon></v-btn>
        <span class="text-body-2 font-weight-medium px-2" style="min-width:88px;text-align:center">{{ monthLabel }}</span>
        <v-btn icon size="small" variant="text" @click="nextMonth"><v-icon>mdi-chevron-right</v-icon></v-btn>
        <v-btn size="x-small" variant="tonal" rounded="lg" class="ml-1" @click="goCurrentMonth">今月</v-btn>
      </div>
    </div>

    <!-- ── Monthly summary cards ───────────────────────────────── -->
    <v-row dense class="mb-4">
      <v-col cols="6" sm="3">
        <v-card rounded="xl" elevation="0" border>
          <v-card-text class="pa-3 text-center">
            <div class="text-h6 font-weight-bold">{{ stats.workDays }}<span class="text-caption font-weight-regular ml-1">日</span></div>
            <div class="text-caption text-medium-emphasis">出勤日数</div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="6" sm="3">
        <v-card rounded="xl" elevation="0" border>
          <v-card-text class="pa-3 text-center">
            <div class="text-h6 font-weight-bold">{{ stats.totalHours }}<span class="text-caption font-weight-regular ml-1">h</span></div>
            <div class="text-caption text-medium-emphasis">実働時間</div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="6" sm="3">
        <v-card rounded="xl" elevation="0" border :class="{ 'stat-alert': stats.overtimeMins > 0 }">
          <v-card-text class="pa-3 text-center">
            <div class="text-h6 font-weight-bold" :class="{ 'text-error': stats.overtimeMins > 0 }">
              {{ stats.overtimeMins > 0 ? '+' + formatMins(stats.overtimeMins) : '—' }}
            </div>
            <div class="text-caption text-medium-emphasis">残業時間</div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="6" sm="3">
        <v-card rounded="xl" elevation="0" border>
          <v-card-text class="pa-3 text-center">
            <div class="d-flex align-center justify-center ga-1">
              <div class="text-h6 font-weight-bold" :class="stats.pendingCount > 0 ? 'text-primary' : ''">
                {{ stats.pendingCount }}
              </div>
              <v-chip v-if="stats.pendingCount > 0" color="primary" size="x-small" variant="flat">承認待ち</v-chip>
            </div>
            <div class="text-caption text-medium-emphasis">未承認件数</div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- ── Action bar ──────────────────────────────────────────── -->
    <div class="d-flex align-center justify-space-between mb-3 flex-wrap gap-2">
      <div class="d-flex align-center ga-2 flex-wrap">
        <!-- Status filter -->
        <v-btn-toggle v-model="statusFilter" mandatory rounded="lg" density="compact">
          <v-btn value="all" size="small">すべて</v-btn>
          <v-btn value="pending" size="small">
            承認待ち
            <v-chip v-if="stats.pendingCount > 0" size="x-small" color="primary" variant="flat" class="ml-1">
              {{ stats.pendingCount }}
            </v-chip>
          </v-btn>
          <v-btn value="approved" size="small">承認済み</v-btn>
          <v-btn value="other" size="small">その他</v-btn>
        </v-btn-toggle>
        <!-- Show only work days -->
        <v-switch
          v-model="hideEmptyDays"
          label="勤務日のみ表示"
          density="compact"
          hide-details
          color="primary"
          class="ml-2"
        />
      </div>

      <div class="d-flex ga-2">
        <v-btn
          v-if="selectedIds.size > 0"
          color="success"
          rounded="lg"
          size="small"
          :prepend-icon="'mdi-check-all'"
          @click="bulkApproveSelected"
        >
          選択した{{ selectedIds.size }}件を承認
        </v-btn>
        <v-btn
          v-else-if="stats.pendingCount > 0"
          color="success"
          variant="tonal"
          rounded="lg"
          size="small"
          :prepend-icon="'mdi-check-all'"
          @click="approveAllPending"
        >
          承認待ち {{ stats.pendingCount }}件をすべて承認
        </v-btn>
      </div>
    </div>

    <!-- ── Day list ────────────────────────────────────────────── -->
    <div v-if="visibleDays.length === 0" class="text-center py-10 text-medium-emphasis">
      <v-icon size="40" class="mb-2">mdi-calendar-blank-outline</v-icon>
      <div>表示する勤怠データがありません</div>
    </div>

    <div v-else class="day-list">
      <v-card
        v-for="day in visibleDays"
        :key="day.date"
        rounded="xl"
        elevation="0"
        border
        class="day-card"
        :class="dayCardClass(day)"
      >
        <div class="day-card-inner">
          <!-- ── Left: date + checkbox ─────────────────────── -->
          <div class="dc-left">
            <v-checkbox
              v-if="day.record && day.record.status === 'PENDING_APPROVAL'"
              :model-value="selectedIds.has(day.record.id)"
              hide-details
              density="compact"
              class="dc-check"
              @update:model-value="toggleSelect(day.record!.id)"
            />
            <div v-else class="dc-check" />

            <div class="dc-date" :class="{ 'dc-date--today': day.isToday, 'dc-date--sun': day.dow === 0, 'dc-date--sat': day.dow === 6 }">
              <span class="dc-day-num">{{ day.dayNum }}</span>
              <span class="dc-dow">{{ DOW_LABELS[day.dow] }}</span>
            </div>
          </div>

          <!-- ── Center: shift + sessions ─────────────────── -->
          <div class="dc-center">
            <!-- No record, no shift -->
            <template v-if="!day.record && !day.shift">
              <span class="text-caption text-disabled">—</span>
            </template>

            <!-- No record but has shift (absent) -->
            <template v-else-if="!day.record && day.shift">
              <div class="d-flex align-center ga-2 flex-wrap">
                <ShiftChip :shift="day.shift" />
                <v-chip size="x-small" color="error" variant="tonal" prepend-icon="mdi-alert-circle-outline">
                  打刻なし
                </v-chip>
              </div>
            </template>

            <!-- Has record -->
            <template v-else-if="day.record">
              <!-- Shift reference (if any) -->
              <div v-if="day.shift" class="mb-1">
                <ShiftChip :shift="day.shift" />
              </div>

              <!-- Sessions -->
              <div class="sessions-inline">
                <div
                  v-for="(sess, si) in daySessions(day.record)"
                  :key="sess.id ?? si"
                  class="session-row"
                >
                  <!-- Session label (only for split shifts) -->
                  <span v-if="daySessions(day.record).length > 1" class="sess-num">S{{ si + 1 }}</span>

                  <!-- Times -->
                  <div class="sess-times">
                    <span class="sess-time">{{ sess.checkIn ?? '—' }}</span>
                    <v-icon size="12" color="medium-emphasis">mdi-arrow-right</v-icon>
                    <span class="sess-time" :class="{ 'text-error': !sess.checkOut }">
                      {{ sess.checkOut ?? '未打刻' }}
                    </span>
                  </div>

                  <!-- Break -->
                  <span class="sess-break text-medium-emphasis">休憩{{ sess.breakMinutes }}分</span>

                  <!-- Actual -->
                  <span class="sess-actual font-weight-medium">{{ formatMins(sess.actualMinutes) }}</span>

                  <!-- Dept / variant chips -->
                  <v-chip size="x-small" color="surface-variant" variant="flat">{{ sess.department }}</v-chip>
                  <v-chip v-if="sess.punchVariant === 'HELP'" size="x-small" color="orange" variant="tonal">応援</v-chip>
                  <v-chip v-else-if="sess.punchVariant === 'TRAINING'" size="x-small" color="purple" variant="tonal">研修</v-chip>

                  <!-- Shift deviation for this session -->
                  <ShiftDeviation
                    v-if="si === 0 && day.shift"
                    :shift="day.shift"
                    :check-in="sess.checkIn"
                    :check-out="daySessions(day.record).length === 1 ? sess.checkOut : undefined"
                  />
                </div>
              </div>

              <!-- Day total (for multi-session days) -->
              <div v-if="daySessions(day.record).length > 1" class="day-total-line mt-1">
                <v-icon size="12" color="medium-emphasis">mdi-sigma</v-icon>
                <span class="text-caption font-weight-bold ml-1">合計 {{ formatMins(day.record.actualMinutes) }}</span>
                <span v-if="day.record.overtimeMinutes > 0" class="text-caption text-error ml-2">
                  +{{ formatMins(day.record.overtimeMinutes) }} 残業
                </span>
              </div>

              <!-- Compliance / correction alerts -->
              <div v-if="day.flags.length > 0 || day.pendingCorrections.length > 0" class="d-flex flex-wrap ga-1 mt-1">
                <v-chip
                  v-for="f in day.flags"
                  :key="f.key"
                  size="x-small"
                  :color="f.level === 'error' ? 'error' : f.level === 'warning' ? 'warning' : 'info'"
                  variant="tonal"
                  :prepend-icon="f.icon"
                >
                  {{ f.message }}
                </v-chip>
                <v-chip
                  v-if="day.pendingCorrections.length > 0"
                  size="x-small"
                  color="warning"
                  variant="tonal"
                  prepend-icon="mdi-pencil-circle-outline"
                >
                  修正申請 {{ day.pendingCorrections.length }}件
                </v-chip>
              </div>
            </template>
          </div>

          <!-- ── Right: total + status + actions ──────────── -->
          <div class="dc-right">
            <!-- Hours total -->
            <div v-if="day.record" class="dc-hours">
              <span class="hours-val">{{ formatMins(day.record.actualMinutes) }}</span>
            </div>

            <!-- Status chip -->
            <div class="dc-status">
              <v-chip
                v-if="day.record"
                size="small"
                :color="statusColor(day.record.status)"
                variant="flat"
              >
                {{ statusLabel(day.record.status) }}
              </v-chip>
              <v-chip v-else-if="day.shift" size="small" color="error" variant="tonal">未出勤</v-chip>
            </div>

            <!-- Actions -->
            <div class="dc-actions">
              <template v-if="day.record">
                <!-- Pending: approve / return inline -->
                <template v-if="day.record.status === 'PENDING_APPROVAL'">
                  <v-btn
                    icon
                    size="x-small"
                    variant="text"
                    color="warning"
                    :title="'差戻す'"
                    @click="startReturn(day.date)"
                  >
                    <v-icon size="16">mdi-undo</v-icon>
                  </v-btn>
                  <v-btn
                    icon
                    size="x-small"
                    variant="tonal"
                    color="success"
                    :title="'承認する'"
                    @click="approveDay(day.record!.id, day.flags.length > 0, day.flags)"
                  >
                    <v-icon size="16">mdi-check</v-icon>
                  </v-btn>
                </template>

                <!-- Always: link to detail page -->
                <v-btn
                  icon
                  size="x-small"
                  variant="text"
                  :to="`/attendance/${employeeId}/${day.date}`"
                  :title="'詳細'"
                >
                  <v-icon size="16">mdi-open-in-new</v-icon>
                </v-btn>
              </template>
            </div>
          </div>
        </div>

        <!-- Return note input (expands below the row) -->
        <v-expand-transition>
          <div v-if="returningDate === day.date" class="return-area pa-3 pt-0">
            <v-divider class="mb-3" />
            <div class="d-flex align-center ga-2">
              <v-textarea
                v-model="returnNote"
                label="差戻しコメント（従業員に通知されます）"
                variant="outlined"
                density="compact"
                rows="1"
                auto-grow
                hide-details
                rounded="lg"
                class="flex-1-1"
              />
              <v-btn variant="text" size="small" @click="cancelReturn">キャンセル</v-btn>
              <v-btn
                color="warning"
                size="small"
                rounded="lg"
                :disabled="!returnNote.trim()"
                @click="submitReturn(day.record!.id)"
              >
                差戻し確定
              </v-btn>
            </div>
          </div>
        </v-expand-transition>
      </v-card>
    </div>

    <!-- ── Compliance confirm dialog ─────────────────────────── -->
    <v-dialog v-model="complianceDialog.open" max-width="400">
      <v-card rounded="xl">
        <v-card-title class="text-subtitle-1 font-weight-bold pa-4 pb-2">コンプライアンス警告</v-card-title>
        <v-card-text class="pa-4 pt-0">
          <p class="text-body-2 mb-3">以下の警告があります。このまま承認しますか？</p>
          <v-alert
            v-for="f in complianceDialog.flags"
            :key="f.key"
            :type="f.level === 'error' ? 'error' : 'warning'"
            density="compact"
            variant="tonal"
            :icon="f.icon"
            class="mb-2"
          >
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

// ── Sub-components (inline, small) ──────────────────────────────

// ShiftChip — small chip showing shift times
const ShiftChip = defineComponent({
  props: { shift: { type: Object as PropType<ShiftEntry>, required: true } },
  setup(props) {
    return () => h('div', { class: 'd-flex align-center ga-1' }, [
      h(resolveComponent('v-icon'), { size: 12, color: 'primary' }, () => 'mdi-calendar-clock'),
      h('span', { class: 'text-caption text-primary' },
        `シフト ${props.shift.startTime}–${props.shift.endTime} ${props.shift.department}`),
    ])
  },
})

// ShiftDeviation — inline deviation indicator
const ShiftDeviation = defineComponent({
  props: {
    shift: { type: Object as PropType<ShiftEntry>, required: true },
    checkIn: String,
    checkOut: String,
  },
  setup(props) {
    const toM = (t: string) => { const [h, m] = t.split(':').map(Number); return h * 60 + m }
    return () => {
      const parts: ReturnType<typeof h>[] = []
      if (props.checkIn) {
        const diff = toM(props.checkIn) - toM(props.shift.startTime)
        if (Math.abs(diff) >= 5) {
          const label = diff > 0 ? `${diff}分遅刻` : `${-diff}分早出`
          const color = diff > 0 ? 'error' : 'info'
          parts.push(h(resolveComponent('v-chip'), { size: 'x-small', color, variant: 'tonal' }, () => label))
        }
      }
      if (props.checkOut) {
        const diff = toM(props.checkOut) - toM(props.shift.endTime)
        if (Math.abs(diff) >= 5) {
          const label = diff > 0 ? `${diff}分残業` : `${-diff}分早退`
          const color = diff > 0 ? 'warning' : 'info'
          parts.push(h(resolveComponent('v-chip'), { size: 'x-small', color, variant: 'tonal' }, () => label))
        }
      }
      return h('div', { class: 'd-flex ga-1 flex-wrap' }, parts)
    }
  },
})

// ── Page logic ──────────────────────────────────────────────────

const route = useRoute()
const attStore = useAttendanceStore()
const { employees, getEmpShiftsForDate } = useMockData()

const employeeId = computed(() => route.params.employeeId as string)
const employee = computed(() => employees.find(e => e.id === employeeId.value))

const TODAY = new Date('2026-04-04')
const DOW_LABELS = ['日', '月', '火', '水', '木', '金', '土']

function dStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// ── Month navigation ─────────────────────────────────────────

const viewYear  = ref(TODAY.getFullYear())
const viewMonth = ref(TODAY.getMonth() + 1)   // 1-based

const monthLabel = computed(() => `${viewYear.value}年${viewMonth.value}月`)

function prevMonth() {
  if (viewMonth.value === 1) { viewYear.value--; viewMonth.value = 12 }
  else viewMonth.value--
}
function nextMonth() {
  if (viewMonth.value === 12) { viewYear.value++; viewMonth.value = 1 }
  else viewMonth.value++
}
function goCurrentMonth() { viewYear.value = TODAY.getFullYear(); viewMonth.value = TODAY.getMonth() + 1 }

// All dates in the viewed month
const monthDates = computed(() => {
  const days: string[] = []
  const lastDay = new Date(viewYear.value, viewMonth.value, 0).getDate()
  for (let d = 1; d <= lastDay; d++) {
    days.push(`${viewYear.value}-${String(viewMonth.value).padStart(2, '0')}-${String(d).padStart(2, '0')}`)
  }
  return days
})

// ── Filters ──────────────────────────────────────────────────

const statusFilter = ref<'all' | 'pending' | 'approved' | 'other'>('all')
const hideEmptyDays = ref(false)
const selectedIds = ref(new Set<string>())

// ── Day data ─────────────────────────────────────────────────

interface DayData {
  date: string
  dayNum: number
  dow: number
  isToday: boolean
  record: AttendanceRecord | null
  shift: ShiftEntry | null
  flags: ComplianceFlag[]
  pendingCorrections: ReturnType<typeof attStore.getCorrectionsForDay>
}

const allDays = computed<DayData[]>(() =>
  monthDates.value.map((date) => {
    const d = new Date(date)
    const record = attStore.getRecord(employeeId.value, date)
    const shifts = getEmpShiftsForDate(employeeId.value, date)
    const shift = shifts.find(s => s.cellStatus === 'CONFIRMED' || s.cellStatus === 'ADJUSTING') ?? null
    const flags = record ? getComplianceFlags(record) : []
    const pendingCorrections = attStore.getCorrectionsForDay(employeeId.value, date)
      .filter(c => c.status === 'pending')
    return { date, dayNum: d.getDate(), dow: d.getDay(), isToday: date === dStr(TODAY), record, shift, flags, pendingCorrections }
  }),
)

const visibleDays = computed(() => allDays.value.filter((day) => {
  if (hideEmptyDays.value && !day.record && !day.shift) return false
  if (statusFilter.value === 'pending') return day.record?.status === 'PENDING_APPROVAL'
  if (statusFilter.value === 'approved') return day.record?.status === 'APPROVED'
  if (statusFilter.value === 'other') {
    return day.record?.status === 'CORRECTION_REQUESTED'
      || day.record?.status === 'NOT_SUBMITTED'
      || (!day.record && !!day.shift)
  }
  return true
}))

// ── Stats ─────────────────────────────────────────────────────

const stats = computed(() => {
  const days = allDays.value
  const workDays = days.filter(d => d.record).length
  const totalMins = days.reduce((s, d) => s + (d.record?.actualMinutes ?? 0), 0)
  const overtimeMins = days.reduce((s, d) => s + (d.record?.overtimeMinutes ?? 0), 0)
  const pendingCount = days.filter(d => d.record?.status === 'PENDING_APPROVAL').length
  return {
    workDays,
    totalHours: Math.round(totalMins / 60 * 10) / 10,
    overtimeMins,
    pendingCount,
  }
})

// ── Sessions helper ──────────────────────────────────────────

function daySessions(rec: AttendanceRecord): WorkSession[] {
  if (rec.sessions?.length) return rec.sessions
  return [{
    id: rec.id,
    sessionIdx: 0,
    checkIn: rec.checkIn,
    checkOut: rec.checkOut,
    breakMinutes: rec.breakMinutes,
    actualMinutes: rec.actualMinutes,
    department: employee.value?.department,
    punchVariant: 'NORMAL',
    nightMinutes: computeNightMins(rec.checkIn, rec.checkOut),
  }]
}

// ── Visual helpers ───────────────────────────────────────────

function dayCardClass(day: DayData) {
  if (!day.record && !day.shift) return 'day-card--empty'
  if (day.isToday) return 'day-card--today'
  if (day.record?.status === 'PENDING_APPROVAL') return 'day-card--pending'
  if (day.record?.status === 'CORRECTION_REQUESTED') return 'day-card--correction'
  if (!day.record && day.shift) return 'day-card--absent'
  return ''
}

function statusLabel(s: AttendanceStatus): string {
  switch (s) {
    case 'APPROVED': return '承認済み'
    case 'PENDING_APPROVAL': return '申請中'
    case 'CORRECTION_REQUESTED': return '差戻し'
    case 'NOT_SUBMITTED': return '未提出'
    default: return s
  }
}
function statusColor(s: AttendanceStatus): string {
  switch (s) {
    case 'APPROVED': return 'success'
    case 'PENDING_APPROVAL': return 'primary'
    case 'CORRECTION_REQUESTED': return 'warning'
    default: return 'default'
  }
}
function formatMins(m: number): string {
  const h = Math.floor(m / 60)
  const min = m % 60
  return min > 0 ? `${h}h${String(min).padStart(2, '0')}m` : `${h}h`
}

// ── Approval actions ─────────────────────────────────────────

const complianceDialog = ref<{ open: boolean; recordId: string; flags: ComplianceFlag[] }>({
  open: false, recordId: '', flags: [],
})
const returningDate = ref<string | null>(null)
const returnNote = ref('')

function toggleSelect(id: string) {
  const s = new Set(selectedIds.value)
  s.has(id) ? s.delete(id) : s.add(id)
  selectedIds.value = s
}

function approveDay(recordId: string, hasFlags: boolean, flags: ComplianceFlag[]) {
  if (hasFlags) {
    complianceDialog.value = { open: true, recordId, flags }
  } else {
    attStore.approveDay(recordId)
  }
}

function confirmApprove() {
  attStore.approveDay(complianceDialog.value.recordId)
  complianceDialog.value.open = false
}

function startReturn(date: string) {
  returningDate.value = date
  returnNote.value = ''
}
function cancelReturn() { returningDate.value = null; returnNote.value = '' }

function submitReturn(recordId: string) {
  attStore.returnDay(recordId, returnNote.value)
  returningDate.value = null
  returnNote.value = ''
}

function bulkApproveSelected() {
  for (const id of selectedIds.value) { attStore.approveDay(id) }
  selectedIds.value = new Set()
}

function approveAllPending() {
  allDays.value
    .filter(d => d.record?.status === 'PENDING_APPROVAL')
    .forEach(d => attStore.approveDay(d.record!.id))
}
</script>

<style scoped>
/* ── Summary stats ─────────────────────── */
.stat-alert { border-color: #ef9a9a !important; }

/* ── Day card ──────────────────────────── */
.day-list { display: flex; flex-direction: column; gap: 6px; }

.day-card { overflow: hidden; transition: border-color 0.15s; }
.day-card--pending  { border-color: #90caf9 !important; }
.day-card--correction { border-color: #ffd54f !important; }
.day-card--absent   { border-color: #ef9a9a !important; background: #fff8f8; }
.day-card--today    { border-color: #42a5f5 !important; }
.day-card--empty    { opacity: 0.45; }

.day-card-inner {
  display: grid;
  grid-template-columns: 72px 1fr auto;
  align-items: start;
  gap: 8px;
  padding: 10px 12px;
  min-height: 52px;
}

/* ── Left: date ────────────────────────── */
.dc-left {
  display: flex;
  align-items: center;
  gap: 4px;
  padding-top: 2px;
}
.dc-check { width: 28px; flex-shrink: 0; }

.dc-date {
  display: flex;
  flex-direction: column;
  align-items: center;
  line-height: 1.1;
}
.dc-day-num  { font-size: 18px; font-weight: 700; }
.dc-dow      { font-size: 10px; color: #9e9e9e; }
.dc-date--today .dc-day-num  { color: #1976d2; }
.dc-date--today .dc-dow      { color: #1976d2; }
.dc-date--sun .dc-day-num { color: #e53935; }
.dc-date--sun .dc-dow     { color: #e53935; }
.dc-date--sat .dc-day-num { color: #1565c0; }
.dc-date--sat .dc-dow     { color: #1565c0; }

/* ── Center: sessions ─────────────────── */
.dc-center { padding-top: 4px; min-height: 40px; }

.sessions-inline { display: flex; flex-direction: column; gap: 3px; }

.session-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px;
}
.sess-num {
  font-size: 10px;
  font-weight: 700;
  color: #1976d2;
  min-width: 18px;
}
.sess-times { display: flex; align-items: center; gap: 3px; }
.sess-time  { font-size: 13px; font-weight: 500; font-feature-settings: "tnum"; }
.sess-break { font-size: 11px; }
.sess-actual { font-size: 13px; }

.day-total-line { display: flex; align-items: center; }

/* ── Right: status + actions ─────────── */
.dc-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
  padding-top: 2px;
  min-width: 120px;
}
.dc-hours { line-height: 1; }
.hours-val { font-size: 14px; font-weight: 700; font-feature-settings: "tnum"; }

.dc-actions { display: flex; align-items: center; gap: 2px; }

/* ── Return area ──────────────────────── */
.return-area { background: #fffde7; }
</style>
