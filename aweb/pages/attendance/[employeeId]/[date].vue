<template>
  <div>
    <!-- ── Breadcrumb ───────────────────────────────────────── -->
    <div class="d-flex align-center ga-2 mb-4">
      <v-btn to="/attendance" icon size="small" variant="text">
        <v-icon>mdi-arrow-left</v-icon>
      </v-btn>
      <v-breadcrumbs :items="breadcrumbs" density="compact" class="pa-0" />
    </div>

    <!-- ── Employee + Date header ───────────────────────────── -->
    <div class="d-flex align-center justify-space-between mb-5">
      <div class="d-flex align-center ga-3">
        <v-avatar size="44" color="primary" variant="tonal" rounded="lg">
          <span class="text-subtitle-1 font-weight-bold">{{ employee?.name[0] }}</span>
        </v-avatar>
        <div>
          <div class="d-flex align-center ga-2">
            <h1 class="text-h6 font-weight-bold">{{ employee?.name }}</h1>
            <v-chip size="small" color="surface-variant" variant="flat">{{ employee?.department }}</v-chip>
            <v-chip size="small" color="surface-variant" variant="flat">{{ employee?.position }}</v-chip>
          </div>
          <div class="text-body-2 text-medium-emphasis">{{ dateLabel }}</div>
        </div>
      </div>
      <v-chip v-if="record" :color="statusColor" size="default" variant="flat">
        <v-icon start size="14">{{ statusIcon }}</v-icon>
        {{ statusLabel }}
      </v-chip>
    </div>

    <!-- Not found state -->
    <template v-if="!record && !shiftEntry">
      <v-card rounded="xl" elevation="0" border class="text-center py-10">
        <v-icon size="48" color="medium-emphasis">mdi-calendar-remove-outline</v-icon>
        <div class="text-h6 mt-3">記録なし</div>
        <div class="text-body-2 text-medium-emphasis mt-1">この日の勤怠データもシフトもありません</div>
        <v-btn to="/attendance" variant="tonal" rounded="lg" class="mt-4">一覧に戻る</v-btn>
      </v-card>
    </template>

    <template v-else>
      <v-row>
        <!-- ── Left: Sessions ─────────────────────────────── -->
        <v-col cols="12" lg="7">
          <!-- No record but has shift (absent / not clocked in) -->
          <v-alert v-if="!record" type="warning" variant="tonal" rounded="xl" class="mb-4">
            <div class="font-weight-medium">打刻記録がありません</div>
            <div class="text-body-2 mt-1">シフトが組まれていますが、この日の出退勤記録が見当たりません。</div>
          </v-alert>

          <template v-if="record">
            <!-- Sessions -->
            <div class="text-subtitle-2 font-weight-bold mb-2">
              勤務セッション
              <v-chip size="x-small" class="ml-1">{{ sessions.length }}件</v-chip>
            </div>

            <SessionCard
              v-for="(sess, i) in sessions"
              :key="sess.id ?? i"
              :session="sess"
              :idx="i"
              :punch-events="punchEventsForSession(i)"
              :flags="sessionFlags(sess)"
            />

            <!-- Total summary -->
            <v-card rounded="xl" elevation="0" border class="mb-4">
              <v-card-text class="pa-4">
                <div class="text-subtitle-2 font-weight-bold mb-3">日次集計</div>
                <div class="d-flex ga-6 flex-wrap">
                  <div class="summary-stat">
                    <div class="ss-value">{{ formatMins(record.actualMinutes) }}</div>
                    <div class="ss-label">実働時間</div>
                  </div>
                  <div class="summary-stat">
                    <div class="ss-value">{{ record.breakMinutes }}分</div>
                    <div class="ss-label">休憩合計</div>
                  </div>
                  <div class="summary-stat" :class="{ 'text-error': record.overtimeMinutes > 0 }">
                    <div class="ss-value">{{ record.overtimeMinutes > 0 ? '+' + formatMins(record.overtimeMinutes) : '—' }}</div>
                    <div class="ss-label">残業</div>
                  </div>
                  <div class="summary-stat" :class="{ 'text-purple': totalNightMins > 0 }">
                    <div class="ss-value">{{ totalNightMins > 0 ? totalNightMins + '分' : '—' }}</div>
                    <div class="ss-label">深夜帯</div>
                  </div>
                  <div class="summary-stat">
                    <div class="ss-value">{{ sessions.length }}</div>
                    <div class="ss-label">セッション数</div>
                  </div>
                </div>

                <!-- Submitted at -->
                <div v-if="record.submittedAt" class="text-caption text-medium-emphasis mt-3">
                  <v-icon size="12">mdi-send-outline</v-icon>
                  {{ formatDateTime(record.submittedAt) }} に従業員が申請
                </div>
              </v-card-text>
            </v-card>
          </template>
        </v-col>

        <!-- ── Right: Shift + Corrections + Approval ──────── -->
        <v-col cols="12" lg="5">
          <!-- Shift vs Actual -->
          <ShiftVsActualPanel
            :shift="shiftEntry ? { id: shiftEntry.id, startTime: shiftEntry.startTime, endTime: shiftEntry.endTime, department: shiftEntry.department } : null"
            :sessions="sessions"
            class="mb-4"
          />

          <!-- Correction requests -->
          <template v-if="corrections.length > 0">
            <div class="text-subtitle-2 font-weight-bold mb-2">
              修正申請
              <v-chip
                v-if="pendingCorrections.length > 0"
                size="x-small"
                color="warning"
                variant="flat"
                class="ml-1"
              >
                {{ pendingCorrections.length }}件 承認待ち
              </v-chip>
            </div>
            <CorrectionRequestPanel
              v-for="cr in corrections"
              :key="cr.id"
              :request="cr"
              @approve="attStore.approveCorrection(cr.id)"
              @reject="(id, note) => attStore.rejectCorrection(id, note)"
            />
          </template>

          <!-- Approval panel (only if there's a record) -->
          <ApprovalPanel
            v-if="record"
            :record="record"
            @approve="attStore.approveDay(record!.id)"
            @return="(note) => attStore.returnDay(record!.id, note)"
            @revert="attStore.returnDay(record!.id, '')"
          />
        </v-col>
      </v-row>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { WorkSession, PunchEvent, ComplianceFlag } from '~/types'
import { useAttendanceStore } from '~/stores/attendance.store'
import { useMockData, getComplianceFlags, computeNightMins } from '~/composables/useMockData'

const route = useRoute()
const attStore = useAttendanceStore()
const { employees, getEmpShiftsForDate } = useMockData()

const employeeId = computed(() => route.params.employeeId as string)
const date = computed(() => route.params.date as string)

const employee = computed(() => employees.find(e => e.id === employeeId.value))
const record = computed(() => attStore.getRecord(employeeId.value, date.value))
const corrections = computed(() => attStore.getCorrectionsForDay(employeeId.value, date.value))
const pendingCorrections = computed(() => corrections.value.filter(c => c.status === 'pending'))

const shiftEntries = computed(() => getEmpShiftsForDate(employeeId.value, date.value))
const shiftEntry = computed(() => shiftEntries.value[0] ?? null)

const sessions = computed<WorkSession[]>(() => {
  if (!record.value) return []
  if (record.value.sessions?.length) return record.value.sessions
  // Fallback: synthesise single session from top-level fields
  return [{
    id: record.value.id,
    sessionIdx: 0,
    checkIn: record.value.checkIn,
    checkOut: record.value.checkOut,
    breakMinutes: record.value.breakMinutes,
    actualMinutes: record.value.actualMinutes,
    department: employee.value?.department,
    punchVariant: 'NORMAL',
    nightMinutes: computeNightMins(record.value.checkIn, record.value.checkOut),
  }]
})

const totalNightMins = computed(() =>
  sessions.value.reduce((sum, s) => sum + (s.nightMinutes ?? computeNightMins(s.checkIn, s.checkOut)), 0),
)

// Assign punch events to sessions by timestamp order
function punchEventsForSession(sessionIdx: number): PunchEvent[] {
  if (!record.value) return []
  const all = record.value.punchEvents
  const sessCount = sessions.value.length
  if (sessCount <= 1) return all

  // Split punch events into groups per session (CHECK_IN..CHECK_OUT pairs)
  const groups: PunchEvent[][] = []
  let cur: PunchEvent[] = []
  for (const ev of all) {
    cur.push(ev)
    if (ev.punchType === 'CHECK_OUT') { groups.push(cur); cur = [] }
  }
  return groups[sessionIdx] ?? []
}

function sessionFlags(sess: WorkSession): ComplianceFlag[] {
  const flags: ComplianceFlag[] = []
  if (sess.actualMinutes >= 360 && sess.breakMinutes === 0) {
    flags.push({ key: 'no_break', level: 'error', icon: 'mdi-coffee-off-outline', message: '6時間以上休憩なし（労基法違反の可能性）' })
  }
  const night = sess.nightMinutes ?? computeNightMins(sess.checkIn, sess.checkOut)
  if (night > 0) {
    flags.push({ key: 'night', level: 'info', icon: 'mdi-moon-waning-crescent', message: `深夜時間帯 ${night}分（割増対象）` })
  }
  return flags
}

// ── Display helpers ──────────────────────────────────────────

const dateLabel = computed(() => {
  const d = new Date(date.value)
  const dow = ['日', '月', '火', '水', '木', '金', '土'][d.getDay()]
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日（${dow}）`
})

const breadcrumbs = computed(() => [
  { title: '勤怠一覧', to: '/attendance' },
  { title: employee.value?.name ?? '—' },
  { title: dateLabel.value },
])

const statusLabel = computed(() => {
  switch (record.value?.status) {
    case 'APPROVED': return '承認済み'
    case 'PENDING_APPROVAL': return '承認待ち'
    case 'CORRECTION_REQUESTED': return '差戻し中'
    default: return '未提出'
  }
})
const statusColor = computed(() => {
  switch (record.value?.status) {
    case 'APPROVED': return 'success'
    case 'PENDING_APPROVAL': return 'primary'
    case 'CORRECTION_REQUESTED': return 'warning'
    default: return 'default'
  }
})
const statusIcon = computed(() => {
  switch (record.value?.status) {
    case 'APPROVED': return 'mdi-check-circle'
    case 'PENDING_APPROVAL': return 'mdi-clock-outline'
    case 'CORRECTION_REQUESTED': return 'mdi-alert-circle-outline'
    default: return 'mdi-circle-outline'
  }
})

function formatMins(m: number): string {
  const h = Math.floor(m / 60)
  const min = m % 60
  return `${h}h${String(min).padStart(2, '0')}m`
}

function formatDateTime(iso: string): string {
  const d = new Date(iso)
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}
</script>

<style scoped>
.text-purple { color: #7e57c2; }

.summary-stat { display: flex; flex-direction: column; align-items: center; }
.ss-value { font-size: 15px; font-weight: 700; font-feature-settings: "tnum"; }
.ss-label { font-size: 11px; color: #9e9e9e; margin-top: 2px; }
</style>
