<template>
  <div>
    <div class="d-flex align-center justify-space-between mb-6">
      <div>
        <h1 class="text-h5 font-weight-bold">勤怠承認</h1>
        <p class="text-body-2 text-medium-emphasis mt-1">期間ごとにスタッフの勤怠を承認します</p>
      </div>
      <div class="d-flex align-center ga-3">
        <div class="text-caption text-medium-emphasis">
          {{ approvedCount }}/{{ totalCount }} 承認済み
        </div>
        <v-progress-linear
          :model-value="totalCount > 0 ? (approvedCount / totalCount) * 100 : 0"
          color="success"
          bg-color="#E0E1E4"
          height="6"
          rounded
          style="min-width: 120px"
        />
        <v-btn
          color="primary"
          prepend-icon="mdi-check-all"
          rounded="lg"
          :disabled="approvedCount === totalCount && totalCount > 0"
          @click="bulkApprove"
        >
          一括承認
        </v-btn>
      </div>
    </div>

    <!-- Period selector -->
    <div class="d-flex align-center ga-3 mb-5">
      <v-btn-group density="compact" rounded="lg" elevation="0">
        <v-btn
          :variant="period === 'first' ? 'flat' : 'tonal'"
          :color="period === 'first' ? 'primary' : 'default'"
          @click="period = 'first'"
        >1〜15日</v-btn>
        <v-btn
          :variant="period === 'second' ? 'flat' : 'tonal'"
          :color="period === 'second' ? 'primary' : 'default'"
          @click="period = 'second'"
        >16〜末日</v-btn>
      </v-btn-group>
      <v-chip size="small" variant="tonal" color="default">2026年3月</v-chip>
    </div>

    <!-- Period summary stats -->
    <v-row dense class="mb-5">
      <v-col cols="6" sm="3">
        <v-card rounded="xl" elevation="0" border class="pa-3 text-center">
          <div class="text-h6 font-weight-bold text-success">{{ approvedCount }}</div>
          <div class="text-caption text-medium-emphasis">承認済み</div>
        </v-card>
      </v-col>
      <v-col cols="6" sm="3">
        <v-card rounded="xl" elevation="0" border class="pa-3 text-center">
          <div class="text-h6 font-weight-bold text-warning">{{ unapprovedCount }}</div>
          <div class="text-caption text-medium-emphasis">未承認</div>
        </v-card>
      </v-col>
      <v-col cols="6" sm="3">
        <v-card rounded="xl" elevation="0" border class="pa-3 text-center">
          <div class="text-h6 font-weight-bold text-error">{{ alertCount }}</div>
          <div class="text-caption text-medium-emphasis">アラートあり</div>
        </v-card>
      </v-col>
      <v-col cols="6" sm="3">
        <v-card rounded="xl" elevation="0" border class="pa-3 text-center">
          <div class="text-h6 font-weight-bold text-primary">¥{{ totalLaborCost.toLocaleString() }}</div>
          <div class="text-caption text-medium-emphasis">人件費見込み</div>
        </v-card>
      </v-col>
    </v-row>

    <!-- Approval table -->
    <v-card rounded="xl" elevation="0" border>
      <v-data-table
        :headers="headers"
        :items="periodRows"
        :no-data-text="'この期間の勤怠記録はありません'"
        density="comfortable"
        hover
      >
        <template #item.employeeName="{ item }">
          <div class="d-flex align-center ga-2">
            <v-avatar color="primary" size="28">
              <span class="text-white" style="font-size: 10px">{{ item.employeeName.charAt(0) }}</span>
            </v-avatar>
            <div>
              <div class="text-body-2 font-weight-medium">{{ item.employeeName }}</div>
              <div class="text-caption text-medium-emphasis">{{ item.department }}</div>
            </div>
          </div>
        </template>

        <template #item.scheduledMins="{ item }">
          <span class="text-medium-emphasis">{{ fmtM(item.scheduledMins) }}</span>
        </template>

        <template #item.totalActualMins="{ item }">
          <div>
            <span class="font-weight-medium">{{ fmtM(item.totalActualMins) }}</span>
            <span
              v-if="item.scheduledMins > 0"
              class="text-caption ml-1"
              :class="item.totalActualMins > item.scheduledMins ? 'text-warning' : item.totalActualMins < item.scheduledMins ? 'text-error' : 'text-success'"
            >
              {{ item.totalActualMins > item.scheduledMins ? `+${fmtM(item.totalActualMins - item.scheduledMins)}` : item.totalActualMins < item.scheduledMins ? `-${fmtM(item.scheduledMins - item.totalActualMins)}` : '±0' }}
            </span>
          </div>
        </template>

        <template #item.totalOvertimeMins="{ item }">
          <span :class="item.totalOvertimeMins > 0 ? 'text-warning font-weight-medium' : 'text-medium-emphasis'">
            {{ item.totalOvertimeMins > 0 ? `+${fmtM(item.totalOvertimeMins)}` : '—' }}
          </span>
        </template>

        <template #item.totalNightMins="{ item }">
          <span :class="item.totalNightMins > 0 ? 'text-indigo font-weight-medium' : 'text-medium-emphasis'">
            {{ item.totalNightMins > 0 ? fmtM(item.totalNightMins) : '—' }}
          </span>
        </template>

        <template #item.alerts="{ item }">
          <div class="d-flex align-center ga-1">
            <v-tooltip v-if="item.hasBreakAlert" text="6時間以上休憩なし" location="top">
              <template #activator="{ props: tp }">
                <v-icon v-bind="tp" color="error" size="16">mdi-coffee-off-outline</v-icon>
              </template>
            </v-tooltip>
            <v-tooltip v-if="item.hasOvertimeAlert" text="過重労働" location="top">
              <template #activator="{ props: tp }">
                <v-icon v-bind="tp" color="warning" size="16">mdi-clock-alert-outline</v-icon>
              </template>
            </v-tooltip>
            <v-tooltip v-if="item.hasNightAlert" text="深夜割増" location="top">
              <template #activator="{ props: tp }">
                <v-icon v-bind="tp" color="indigo" size="16">mdi-moon-waning-crescent</v-icon>
              </template>
            </v-tooltip>
            <span v-if="!item.hasBreakAlert && !item.hasOvertimeAlert && !item.hasNightAlert" class="text-medium-emphasis">—</span>
          </div>
        </template>

        <template #item.pendingCorrectionCount="{ item }">
          <v-chip
            v-if="item.pendingCorrectionCount > 0"
            color="warning"
            size="x-small"
            variant="tonal"
            :to="'/attendance/modifications'"
            @click.stop
          >
            {{ item.pendingCorrectionCount }}件
          </v-chip>
          <span v-else class="text-medium-emphasis">—</span>
        </template>

        <template #item.actions="{ item }">
          <div class="d-flex align-center ga-2">
            <v-tooltip v-if="item.hasCorrectionRequested && !item.isApproved" text="修正依頼中の記録があります" location="top">
              <template #activator="{ props: tp }">
                <v-icon v-bind="tp" color="warning" size="16">mdi-pencil-circle-outline</v-icon>
              </template>
            </v-tooltip>
            <v-btn
              v-if="!item.isApproved"
              size="small"
              color="success"
              variant="tonal"
              rounded="lg"
              :disabled="item.pendingCorrectionCount > 0"
              @click.stop="approveEmployee(item.employeeId)"
            >
              <v-icon start size="14">mdi-check</v-icon>
              承認
            </v-btn>
            <v-chip v-else color="success" size="small" variant="flat">
              <v-icon start size="12">mdi-check-decagram</v-icon>
              承認済み
            </v-chip>
            <v-btn
              v-if="item.latestRecordId"
              :to="`/attendance/${item.latestRecordId}`"
              icon
              size="x-small"
              variant="text"
              @click.stop
            >
              <v-icon size="16">mdi-eye-outline</v-icon>
            </v-btn>
          </div>
        </template>
      </v-data-table>
    </v-card>

    <v-snackbar v-model="snackbar" location="top center" color="success" rounded="pill" :timeout="2000">
      {{ snackbarMsg }}
    </v-snackbar>
  </div>
</template>

<script setup lang="ts">
import { useMockData } from '~/composables/useMockData'

const {
  attendanceRecords, employees, getEmployee,
  getCorrectionRequestsForDate, computeNightMins, getEmpShiftsForDate,
} = useMockData()

function toMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

const period = ref<'first' | 'second'>('first')
const snackbar = ref(false)
const snackbarMsg = ref('')

// Per-employee approval overrides (local state)
const approvedOverrides = reactive(new Set<string>())

const periodDates = computed((): string[] => {
  const days = period.value === 'first'
    ? Array.from({ length: 15 }, (_, i) => i + 1)
    : Array.from({ length: 16 }, (_, i) => i + 16)
  return days.map(d => `2026-03-${String(d).padStart(2, '0')}`)
})

const activeEmployees = computed(() => employees.filter(e => e.status === 'ACTIVE'))

function fmtM(mins: number): string {
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return m > 0 ? `${h}h${m}m` : `${h}h`
}

const periodRows = computed(() => {
  return activeEmployees.value.map(emp => {
    const recs = attendanceRecords.filter(
      r => r.employeeId === emp.id && periodDates.value.includes(r.workDate)
    )
    // Include all records that have gone through the submission workflow
    const completedRecs = recs.filter(r =>
      r.status === 'PENDING_APPROVAL' || r.status === 'APPROVED' || r.status === 'CORRECTION_REQUESTED'
    )
    if (completedRecs.length === 0) return null

    const totalActualMins   = completedRecs.reduce((s, r) => s + r.actualMinutes, 0)
    const totalOvertimeMins = completedRecs.reduce((s, r) => s + r.overtimeMinutes, 0)
    const totalNightMins    = completedRecs.reduce((s, r) => s + computeNightMins(r.checkIn, r.checkOut), 0)

    const pendingCorrections = periodDates.value.flatMap(d =>
      getCorrectionRequestsForDate(emp.id, d).filter(c => c.status === 'pending')
    )

    const hasBreakAlert    = completedRecs.some(r => r.actualMinutes >= 360 && r.breakMinutes === 0)
    const hasOvertimeAlert = completedRecs.some(r => r.actualMinutes > 600)
    const hasNightAlert    = totalNightMins > 0

    const hasCorrectionRequested = completedRecs.some(r => r.status === 'CORRECTION_REQUESTED')
    const allAlreadyApproved = completedRecs.every(r => r.status === 'APPROVED')

    return {
      employeeId: emp.id,
      employeeName: emp.name,
      department: emp.department,
      daysWorked: completedRecs.length,
      totalActualMins,
      totalOvertimeMins,
      totalNightMins,
      pendingCorrectionCount: pendingCorrections.length,
      hasBreakAlert,
      hasOvertimeAlert,
      hasNightAlert,
      hasCorrectionRequested,
      isApproved: allAlreadyApproved || approvedOverrides.has(emp.id),
      scheduledMins: periodDates.value.reduce((sum, date) => {
        const shifts = getEmpShiftsForDate(emp.id, date)
        return sum + shifts.reduce((s, sh) => s + toMinutes(sh.endTime) - toMinutes(sh.startTime), 0)
      }, 0),
      latestRecordId: [...completedRecs].sort((a, b) => b.workDate.localeCompare(a.workDate))[0]?.id,
      laborCost: Math.round((getEmployee(emp.id)?.hourlyWage ?? 0) * totalActualMins / 60),
    }
  }).filter(Boolean) as NonNullable<ReturnType<typeof activeEmployees.value.map>[number]>[]
})

const approvedCount   = computed(() => periodRows.value.filter(r => r.isApproved).length)
const unapprovedCount = computed(() => periodRows.value.filter(r => !r.isApproved).length)
const totalCount      = computed(() => periodRows.value.length)
const alertCount      = computed(() => periodRows.value.filter(r => r.hasBreakAlert || r.hasOvertimeAlert).length)
const totalLaborCost  = computed(() => periodRows.value.reduce((s, r) => s + r.laborCost, 0))

function approveEmployee(empId: string) {
  approvedOverrides.add(empId)
  snackbarMsg.value = '承認しました'
  snackbar.value = true
}

function bulkApprove() {
  let count = 0
  for (const row of periodRows.value) {
    if (!row.isApproved && row.pendingCorrectionCount === 0) {
      approvedOverrides.add(row.employeeId)
      count++
    }
  }
  snackbarMsg.value = `${count}名を一括承認しました`
  snackbar.value = true
}

const headers = [
  { title: '従業員', key: 'employeeName', sortable: true },
  { title: '出勤日数', key: 'daysWorked', sortable: true },
  { title: '予定時間', key: 'scheduledMins', sortable: true },
  { title: '総実労働', key: 'totalActualMins', sortable: true },
  { title: '残業', key: 'totalOvertimeMins', sortable: true },
  { title: '深夜', key: 'totalNightMins', sortable: true },
  { title: 'アラート', key: 'alerts', sortable: false },
  { title: '修正申請', key: 'pendingCorrectionCount', sortable: true },
  { title: 'アクション', key: 'actions', sortable: false, width: '160px' },
]
</script>
