<template>
  <div v-if="record && employee">
    <!-- Header -->
    <div class="d-flex align-center ga-3 mb-6">
      <v-btn to="/attendance" icon size="small" variant="text">
        <v-icon>mdi-arrow-left</v-icon>
      </v-btn>
      <div class="flex-1-1">
        <div class="d-flex align-center ga-2">
          <h1 class="text-h6 font-weight-bold">{{ employee.name }} の勤怠詳細</h1>
          <v-chip :color="statusColor(localStatus)" size="small" variant="flat">
            {{ statusJa(localStatus) }}
          </v-chip>
        </div>
        <p class="text-caption text-medium-emphasis">
          {{ record.workDate }} ／ {{ employee.department }}
        </p>
      </div>
      <!-- Manager actions for PENDING_APPROVAL records -->
      <template v-if="localStatus === 'PENDING_APPROVAL'">
        <v-btn
          color="warning"
          variant="tonal"
          prepend-icon="mdi-pencil-circle-outline"
          rounded="lg"
          size="small"
          @click="correctionDialog = true"
        >
          修正依頼
        </v-btn>
        <v-btn
          color="success"
          variant="flat"
          prepend-icon="mdi-check-circle-outline"
          rounded="lg"
          size="small"
          @click="approveRecord"
        >
          承認
        </v-btn>
      </template>
      <v-chip v-else-if="localStatus === 'APPROVED'" color="indigo" variant="tonal">
        <v-icon start size="14">mdi-check-decagram</v-icon>
        承認済み
      </v-chip>
      <v-chip v-else-if="localStatus === 'CORRECTION_REQUESTED'" color="warning" variant="tonal">
        <v-icon start size="14">mdi-pencil-circle-outline</v-icon>
        修正依頼中
      </v-chip>
    </div>

    <!-- Correction requested banner (manager sent back to employee) -->
    <v-alert
      v-if="record?.correctionComment && localStatus === 'CORRECTION_REQUESTED'"
      type="warning"
      icon="mdi-pencil-circle-outline"
      variant="tonal"
      rounded="xl"
      density="compact"
      class="mb-4"
    >
      <div class="text-body-2 font-weight-medium mb-1">修正依頼コメント</div>
      <div class="text-body-2">{{ record.correctionComment }}</div>
    </v-alert>

    <!-- Compliance alerts -->
    <div v-if="complianceAlerts.length > 0" class="mb-4">
      <v-alert
        v-for="alert in complianceAlerts"
        :key="alert.key"
        :type="alert.type"
        :icon="alert.icon"
        variant="tonal"
        rounded="xl"
        density="compact"
        class="mb-2"
      >
        {{ alert.message }}
      </v-alert>
    </div>

    <!-- Pending correction requests from employee -->
    <v-card
      v-if="pendingCorrections.length > 0"
      rounded="xl"
      elevation="0"
      border
      class="mb-4"
      style="border-color: #F59E0B"
    >
      <v-card-title class="pa-4 pb-2 text-subtitle-2 font-weight-bold d-flex align-center ga-2">
        <v-icon color="warning" size="18">mdi-pencil-circle-outline</v-icon>
        修正申請 — 対応待ち ({{ pendingCorrections.length }}件)
      </v-card-title>
      <v-card-text class="px-4 pb-2">
        <ModificationCard
          v-for="cr in pendingCorrections"
          :key="cr.id"
          :modification="toCardMod(cr)"
          @approve="approveCorrectionRequest"
          @reject="rejectCorrectionRequest"
        />
      </v-card-text>
    </v-card>

    <v-row>
      <!-- Summary cards -->
      <v-col cols="12" md="8">
        <v-row class="mb-4">
          <v-col v-for="card in summaryCards" :key="card.label" cols="6" sm="3">
            <v-card rounded="xl" elevation="0" border class="pa-3 text-center">
              <v-icon :color="card.color" size="24" class="mb-1">{{ card.icon }}</v-icon>
              <div class="text-h6 font-weight-bold">{{ card.value }}</div>
              <div class="text-caption text-medium-emphasis">{{ card.label }}</div>
            </v-card>
          </v-col>
        </v-row>

        <!-- Employee info card -->
        <v-card rounded="xl" elevation="0" border class="mb-4">
          <v-card-title class="pa-4 pb-2 text-subtitle-2 font-weight-bold">従業員情報</v-card-title>
          <v-card-text class="px-4 pb-4">
            <v-row dense>
              <v-col cols="6">
                <div class="text-caption text-medium-emphasis">部署</div>
                <div class="text-body-2 font-weight-medium">{{ employee.department }}</div>
              </v-col>
              <v-col cols="6">
                <div class="text-caption text-medium-emphasis">ポジション</div>
                <div class="text-body-2 font-weight-medium">{{ employee.position }}</div>
              </v-col>
              <v-col cols="6" class="mt-2">
                <div class="text-caption text-medium-emphasis">時給</div>
                <div class="text-body-2 font-weight-medium">¥{{ employee.hourlyWage.toLocaleString() }}</div>
              </v-col>
              <v-col cols="6" class="mt-2">
                <div class="text-caption text-medium-emphasis">雇用形態</div>
                <div class="text-body-2 font-weight-medium">{{ employmentTypeJa(employee.employmentType) }}</div>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>

        <!-- Sessions (split-shift) -->
        <v-card v-if="record.sessions && record.sessions.length > 1" rounded="xl" elevation="0" border class="mb-4">
          <v-card-title class="pa-4 pb-2 text-subtitle-2 font-weight-bold d-flex align-center ga-2">
            <v-icon size="16" color="primary">mdi-clock-time-eight-outline</v-icon>
            セッション（{{ record.sessions.length }}本）
          </v-card-title>
          <v-card-text class="px-4 pb-4">
            <div
              v-for="(s, si) in record.sessions"
              :key="si"
              class="d-flex align-center ga-3 pa-2 rounded-lg mb-2"
              style="background: #F8FAFC; border: 1px solid #E2E8F0"
            >
              <v-chip size="x-small" color="primary" variant="tonal" class="flex-shrink-0">
                {{ si + 1 }}本目
              </v-chip>
              <div class="text-body-2 font-weight-medium">
                {{ s.checkIn ?? '—' }} 〜 {{ s.checkOut ?? '—' }}
              </div>
              <div class="text-caption text-medium-emphasis">
                実働 {{ s.actualMinutes > 0 ? `${Math.floor(s.actualMinutes/60)}h${s.actualMinutes%60}m` : '—' }}
              </div>
              <v-chip v-if="s.department" size="x-small" variant="tonal" color="default">{{ s.department }}</v-chip>
            </div>
          </v-card-text>
        </v-card>

        <!-- Punch events -->
        <v-card rounded="xl" elevation="0" border>
          <v-card-title class="pa-4 pb-2 text-subtitle-2 font-weight-bold">打刻履歴</v-card-title>
          <v-card-text class="px-4 pb-4">
            <PunchTimeline :punch-events="record.punchEvents" />
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Right column -->
      <v-col cols="12" md="4">
        <!-- Estimated wage -->
        <v-card rounded="xl" elevation="0" border class="mb-4">
          <v-card-text class="pa-4 text-center">
            <v-icon color="success" size="32" class="mb-2">mdi-currency-jpy</v-icon>
            <div class="text-h4 font-weight-bold text-success">
              ¥{{ estimatedWage.toLocaleString() }}
            </div>
            <div class="text-caption text-medium-emphasis">今日の見込み賃金</div>
            <v-divider class="my-3" />
            <div class="text-caption text-medium-emphasis">
              {{ employee.hourlyWage.toLocaleString() }}円/h × {{ (record.actualMinutes / 60).toFixed(1) }}h
            </div>
            <div v-if="scheduledMinutes > 0" class="text-caption text-medium-emphasis mt-1">
              予定 {{ Math.floor(scheduledMinutes / 60) }}h{{ scheduledMinutes % 60 > 0 ? `${scheduledMinutes % 60}m` : '' }}
              → 実績 {{ Math.floor(record.actualMinutes / 60) }}h{{ record.actualMinutes % 60 > 0 ? `${record.actualMinutes % 60}m` : '' }}
            </div>
          </v-card-text>
        </v-card>

        <!-- Shift vs Actual comparison -->
        <v-card rounded="xl" elevation="0" border class="mb-4">
          <v-card-title class="pa-4 pb-2 text-subtitle-2 font-weight-bold d-flex align-center ga-2">
            <v-icon size="16" color="primary">mdi-calendar-clock-outline</v-icon>
            シフト対比
          </v-card-title>
          <v-card-text class="px-4 pb-4">
            <div v-if="shiftComparison.length === 0" class="text-caption text-medium-emphasis">シフト情報なし</div>
            <div
              v-for="(row, i) in shiftComparison"
              :key="i"
              class="shift-cmp-row"
              :class="{ 'mt-3': i > 0 }"
            >
              <!-- Scheduled -->
              <div class="d-flex align-center ga-2 mb-1">
                <span class="scr-label text-medium-emphasis">予定</span>
                <span class="text-body-2 font-weight-medium text-primary">
                  {{ row.shift.startTime }}〜{{ row.shift.endTime }}
                </span>
                <v-chip size="x-small" variant="tonal" color="default">{{ row.shift.department }}</v-chip>
              </div>
              <!-- Actual -->
              <div class="d-flex align-center ga-2">
                <span class="scr-label text-medium-emphasis">実績</span>
                <span class="text-body-2 font-weight-medium">
                  {{ row.session?.checkIn ?? '—' }}〜{{ row.session?.checkOut ?? '—' }}
                </span>
                <v-chip v-if="row.lateMin > 5" size="x-small" color="warning" variant="tonal">
                  遅刻 {{ row.lateMin }}分
                </v-chip>
                <v-chip v-if="row.otMin > 30" size="x-small" color="success" variant="tonal">
                  残業 {{ row.otMin }}分
                </v-chip>
                <v-chip v-if="row.earlyMin > 5" size="x-small" color="error" variant="tonal">
                  早退 {{ row.earlyMin }}分
                </v-chip>
                <v-chip v-if="row.earlyOutMin > 5" size="x-small" color="info" variant="tonal">
                  早出 {{ row.earlyOutMin }}分
                </v-chip>
              </div>
              <v-divider v-if="i < shiftComparison.length - 1" class="mt-3" />
            </div>
          </v-card-text>
        </v-card>

        <!-- Correction history for this record -->
        <v-card v-if="allCorrections.length > 0" rounded="xl" elevation="0" border>
          <v-card-title class="pa-4 pb-2 text-subtitle-2 font-weight-bold">修正申請履歴</v-card-title>
          <v-card-text class="px-4 pb-4">
            <div v-for="cr in allCorrections" :key="cr.id" class="mb-2 pa-2 rounded-lg" style="background: #F9FAFB">
              <div class="d-flex align-center justify-space-between">
                <span class="text-caption font-weight-medium">{{ cr.requestedCheckIn }} 〜 {{ cr.requestedCheckOut }}</span>
                <v-chip
                  :color="cr.status === 'approved' ? 'success' : cr.status === 'rejected' ? 'error' : 'warning'"
                  size="x-small"
                  variant="flat"
                >
                  {{ cr.status === 'approved' ? '承認' : cr.status === 'rejected' ? '拒否' : '申請中' }}
                </v-chip>
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-snackbar v-model="snackbar" location="top center" color="success" rounded="pill" :timeout="2000">
      {{ snackbarMsg }}
    </v-snackbar>

    <!-- Correction request dialog -->
    <v-dialog v-model="correctionDialog" max-width="420">
      <v-card rounded="xl">
        <v-card-title class="pa-4 pb-2 text-subtitle-2 font-weight-bold d-flex align-center ga-2">
          <v-icon color="warning" size="18">mdi-pencil-circle-outline</v-icon>
          修正依頼
        </v-card-title>
        <v-card-text class="px-4 pb-2">
          <p class="text-body-2 text-medium-emphasis mb-3">
            スタッフに修正を依頼します。コメントを入力してください。
          </p>
          <v-textarea
            v-model="correctionNote"
            placeholder="例：退勤打刻が確認できません。正確な退勤時刻を入力して再申請してください。"
            variant="outlined"
            rounded="lg"
            rows="3"
            hide-details
            auto-grow
          />
        </v-card-text>
        <v-card-actions class="pa-4 pt-2 d-flex ga-2">
          <v-btn variant="outlined" rounded="lg" class="flex-1-1" @click="correctionDialog = false">キャンセル</v-btn>
          <v-btn color="warning" variant="flat" rounded="lg" class="flex-1-1" :disabled="!correctionNote.trim()" @click="requestCorrection">送信</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>

  <div v-else class="text-center py-16">
    <v-icon size="48" color="medium-emphasis">mdi-account-off-outline</v-icon>
    <p class="text-body-1 text-medium-emphasis mt-3">記録が見つかりません</p>
    <v-btn to="/attendance" variant="tonal" color="primary" class="mt-3" rounded="lg">
      一覧に戻る
    </v-btn>
  </div>
</template>

<script setup lang="ts">
import { useMockData } from '~/composables/useMockData'
import type { AttendanceStatus, EmploymentType, CorrectionRequest } from '~/types'

const route = useRoute()
const {
  attendanceRecords, getEmployee, currentBoard,
  getCorrectionRequestsForDate, computeNightMins, getComplianceFlags,
} = useMockData()

const recordId = computed(() => route.params.id as string)
const record = computed(() => attendanceRecords.find(r => r.id === recordId.value))
const employee = computed(() => record.value ? getEmployee(record.value.employeeId) : undefined)

// Local mutable status so approval/correction can be toggled
const localStatus = ref<AttendanceStatus>('NOT_SUBMITTED')
watch(record, (r) => { if (r) localStatus.value = r.status }, { immediate: true })

function toMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

const shiftComparison = computed(() => {
  if (!record.value) return []
  const entries = currentBoard.entries.filter(
    e => e.employeeId === record.value!.employeeId && e.shiftDate === record.value!.workDate
      && e.cellStatus !== 'DAY_OFF_CONFIRMED' && e.cellStatus !== 'DAY_OFF_REQUESTED',
  )
  if (entries.length === 0) return []
  // Use sessions if available (split shifts), otherwise single session from checkIn/checkOut
  const sessions: Array<{ checkIn?: string; checkOut?: string; department?: string }> =
    record.value.sessions
      ?? (record.value.checkIn ? [{ checkIn: record.value.checkIn, checkOut: record.value.checkOut }] : [])

  return entries.map((shift, i) => {
    const sess = sessions[i]
    const lateMin    = sess?.checkIn  ? Math.max(0, toMinutes(sess.checkIn)  - toMinutes(shift.startTime)) : 0
    const earlyOutMin = sess?.checkIn ? Math.max(0, toMinutes(shift.startTime) - toMinutes(sess.checkIn))  : 0
    const otMin      = sess?.checkOut ? Math.max(0, toMinutes(sess.checkOut) - toMinutes(shift.endTime))   : 0
    const earlyMin   = sess?.checkOut ? Math.max(0, toMinutes(shift.endTime) - toMinutes(sess.checkOut))   : 0
    return { shift, session: sess, lateMin, earlyOutMin, otMin, earlyMin }
  })
})

const estimatedWage = computed(() => {
  if (!employee.value || !record.value) return 0
  return Math.round(employee.value.hourlyWage * record.value.actualMinutes / 60)
})

const scheduledMinutes = computed(() => {
  if (!record.value) return 0
  const entries = currentBoard.entries.filter(
    e => e.employeeId === record.value!.employeeId && e.shiftDate === record.value!.workDate
      && e.cellStatus !== 'DAY_OFF_CONFIRMED' && e.cellStatus !== 'DAY_OFF_REQUESTED',
  )
  return entries.reduce((s, e) => s + toMinutes(e.endTime) - toMinutes(e.startTime), 0)
})

const nightMinutes = computed(() => computeNightMins(record.value?.checkIn, record.value?.checkOut))

const summaryCards = computed(() => {
  if (!record.value) return []
  return [
    {
      label: '実労働時間',
      value: record.value.actualMinutes > 0
        ? `${Math.floor(record.value.actualMinutes / 60)}h${record.value.actualMinutes % 60}m`
        : '—',
      icon: 'mdi-timer-outline',
      color: 'primary',
    },
    {
      label: '休憩時間',
      value: record.value.breakMinutes > 0 ? `${record.value.breakMinutes}分` : '—',
      icon: 'mdi-coffee-outline',
      color: 'warning',
    },
    {
      label: '残業時間',
      value: record.value.overtimeMinutes > 0 ? `+${record.value.overtimeMinutes}分` : '—',
      icon: 'mdi-clock-alert-outline',
      color: record.value.overtimeMinutes > 0 ? 'warning' : 'default',
    },
    {
      label: '深夜時間',
      value: nightMinutes.value > 0 ? `${nightMinutes.value}分` : '—',
      icon: 'mdi-moon-waning-crescent',
      color: nightMinutes.value > 0 ? 'indigo' : 'default',
    },
  ]
})

// ── Compliance alerts ───────────────────────────────────────────────────────
const complianceAlerts = computed(() => record.value ? getComplianceFlags(record.value) : [])

// ── Correction requests ─────────────────────────────────────────────────────
const localCorrections = ref<CorrectionRequest[]>([])

watch([record], () => {
  if (record.value) {
    localCorrections.value = getCorrectionRequestsForDate(record.value.employeeId, record.value.workDate)
      .map(r => ({ ...r }))
  }
}, { immediate: true })

const pendingCorrections = computed(() => localCorrections.value.filter(r => r.status === 'pending'))
const allCorrections = computed(() => localCorrections.value)

function toCardMod(r: CorrectionRequest) {
  return {
    id: r.id,
    type: r.type,
    employeeName: employee.value?.name ?? r.employeeId,
    workDate: r.workDate,
    originalCheckIn: r.originalCheckIn,
    originalCheckOut: r.originalCheckOut,
    requestedCheckIn: r.requestedCheckIn,
    requestedCheckOut: r.requestedCheckOut,
    reason: r.reason,
  }
}

function approveCorrectionRequest(id: string) {
  const cr = localCorrections.value.find(r => r.id === id)
  if (cr) cr.status = 'approved'
  snackbarMsg.value = '修正申請を承認しました'
  snackbar.value = true
}

function rejectCorrectionRequest(id: string, note?: string) {
  const cr = localCorrections.value.find(r => r.id === id)
  if (cr) {
    cr.status = 'rejected'
    cr.managerNote = note || undefined
  }
  snackbarMsg.value = '修正申請を拒否しました'
  snackbar.value = true
}

// ── Record approval ─────────────────────────────────────────────────────────
function approveRecord() {
  localStatus.value = 'APPROVED'
  snackbarMsg.value = '勤怠記録を承認しました'
  snackbar.value = true
}

// ── Correction request dialog ────────────────────────────────────────────────
const correctionDialog = ref(false)
const correctionNote   = ref('')

function requestCorrection() {
  localStatus.value = 'CORRECTION_REQUESTED'
  correctionDialog.value = false
  correctionNote.value = ''
  snackbarMsg.value = 'スタッフに修正依頼を送りました'
  snackbar.value = true
}

const snackbar = ref(false)
const snackbarMsg = ref('')

function statusColor(status: AttendanceStatus | string): string {
  const map: Record<string, string> = {
    NOT_SUBMITTED: 'default',
    PENDING_APPROVAL: 'primary',
    CORRECTION_REQUESTED: 'warning',
    APPROVED: 'indigo',
    // legacy clock-in states kept for backwards compat
    NOT_STARTED: 'default', WORKING: 'success', ON_BREAK: 'warning', COMPLETED: 'primary',
  }
  return map[status] ?? 'default'
}

function statusJa(status: AttendanceStatus | string): string {
  const map: Record<string, string> = {
    NOT_SUBMITTED: '未申請',
    PENDING_APPROVAL: '承認待ち',
    CORRECTION_REQUESTED: '修正依頼中',
    APPROVED: '承認済み',
    NOT_STARTED: '未出勤', WORKING: '勤務中', ON_BREAK: '休憩中', COMPLETED: '退勤済み',
  }
  return map[status] ?? status
}

function employmentTypeJa(type: EmploymentType): string {
  const map: Record<EmploymentType, string> = {
    FULL_TIME: '正社員', PART_TIME: 'アルバイト', FLEX: 'フレックス', DISCRETIONARY: '裁量労働',
  }
  return map[type] ?? type
}
</script>

<style scoped>
.scr-label {
  font-size: 11px;
  min-width: 28px;
  font-weight: 600;
}
.shift-cmp-row {
  border-left: 3px solid #DBEAFE;
  padding-left: 10px;
}
</style>
