<template>
  <div>
    <div class="d-flex align-center justify-space-between mb-6">
      <div>
        <h1 class="text-h5 font-weight-bold">勤怠承認</h1>
        <p class="text-body-2 text-medium-emphasis mt-1">スタッフの勤怠を承認します</p>
      </div>
      <v-btn
        color="primary"
        prepend-icon="mdi-check-all"
        rounded="lg"
        @click="bulkApprove"
      >
        一括承認
      </v-btn>
    </div>

    <!-- Period toggle -->
    <div class="d-flex align-center ga-3 mb-4">
      <v-btn-group density="compact" rounded="lg" elevation="0">
        <v-btn
          :variant="period === 'first' ? 'flat' : 'tonal'"
          :color="period === 'first' ? 'primary' : 'default'"
          @click="period = 'first'"
        >
          1〜15日
        </v-btn>
        <v-btn
          :variant="period === 'second' ? 'flat' : 'tonal'"
          :color="period === 'second' ? 'primary' : 'default'"
          @click="period = 'second'"
        >
          16〜末日
        </v-btn>
      </v-btn-group>
      <div class="text-caption text-medium-emphasis">
        {{ approvedCount }}/{{ totalCount }} 承認済み
      </div>
      <v-progress-linear
        :model-value="(approvedCount / Math.max(totalCount, 1)) * 100"
        color="success"
        bg-color="#E0E1E4"
        height="6"
        rounded
        style="max-width: 160px"
      />
    </div>

    <!-- Approval grid -->
    <v-card rounded="xl" elevation="0" border>
      <div class="approval-grid-wrapper">
        <table class="approval-grid">
          <thead>
            <tr>
              <th class="emp-col">従業員</th>
              <th
                v-for="day in periodDays"
                :key="day"
                class="day-col"
                :class="{ 'weekend-col': isWeekend(day) }"
              >
                {{ day }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="emp in activeEmployees" :key="emp.id">
              <td class="emp-col emp-name">
                <div class="d-flex align-center ga-2">
                  <v-avatar color="primary" size="24">
                    <span class="text-white" style="font-size: 9px">{{ emp.name.charAt(0) }}</span>
                  </v-avatar>
                  <span class="text-caption font-weight-medium">{{ emp.name }}</span>
                </div>
              </td>
              <td
                v-for="day in periodDays"
                :key="`${emp.id}-${day}`"
                class="day-col data-cell"
                :class="getCellClass(emp.id, day)"
                @click="toggleApproval(emp.id, day)"
              >
                <span class="text-caption">{{ getCellContent(emp.id, day) }}</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </v-card>

    <v-snackbar v-model="snackbar" location="top center" color="success" rounded="pill" :timeout="2000">
      {{ snackbarMsg }}
    </v-snackbar>
  </div>
</template>

<script setup lang="ts">
import { useMockData } from '~/composables/useMockData'

const { attendanceRecords, employees } = useMockData()

const period = ref<'first' | 'second'>('first')
const snackbar = ref(false)
const snackbarMsg = ref('')

const activeEmployees = computed(() =>
  employees.filter(e => e.status === 'ACTIVE').slice(0, 12)
)

const periodDays = computed(() => {
  if (period.value === 'first') return Array.from({ length: 15 }, (_, i) => i + 1)
  return Array.from({ length: 16 }, (_, i) => i + 16)
})

function isWeekend(day: number): boolean {
  const date = new Date(`2026-03-${String(day).padStart(2, '0')}`)
  return date.getDay() === 0 || date.getDay() === 6
}

// Local override: track manually approved cells
const approvedOverrides = reactive(new Set<string>())

function getRecord(empId: string, day: number) {
  const dateStr = `2026-03-${String(day).padStart(2, '0')}`
  return attendanceRecords.find(r => r.employeeId === empId && r.workDate === dateStr)
}

function getCellContent(empId: string, day: number): string {
  const key = `${empId}-${day}`
  if (approvedOverrides.has(key)) return '✓'
  const rec = getRecord(empId, day)
  if (!rec) return '—'
  if (rec.status === 'APPROVED' || rec.actualMinutes > 0) {
    const h = Math.floor(rec.actualMinutes / 60)
    const m = rec.actualMinutes % 60
    return m > 0 ? `${h}h${m}m` : `${h}h`
  }
  if (rec.status === 'NOT_STARTED') return '—'
  return rec.checkIn ?? '—'
}

function getCellClass(empId: string, day: number): string {
  const key = `${empId}-${day}`
  if (approvedOverrides.has(key)) return 'approved-cell'
  const rec = getRecord(empId, day)
  if (!rec) return 'empty-cell'
  if (rec.status === 'APPROVED') return 'approved-cell'
  if (rec.overtimeMinutes > 30) return 'anomaly-cell'
  if (rec.actualMinutes > 0) return 'completed-cell'
  return 'empty-cell'
}

function toggleApproval(empId: string, day: number) {
  const key = `${empId}-${day}`
  const rec = getRecord(empId, day)
  if (!rec || rec.actualMinutes === 0) return
  if (approvedOverrides.has(key)) {
    approvedOverrides.delete(key)
  } else {
    approvedOverrides.add(key)
  }
}

const approvedCount = computed(() => {
  let count = 0
  for (const emp of activeEmployees.value) {
    for (const day of periodDays.value) {
      const key = `${emp.id}-${day}`
      if (approvedOverrides.has(key)) { count++; continue }
      const rec = getRecord(emp.id, day)
      if (rec?.status === 'APPROVED') count++
    }
  }
  return count
})

const totalCount = computed(() => {
  let count = 0
  for (const emp of activeEmployees.value) {
    for (const day of periodDays.value) {
      const rec = getRecord(emp.id, day)
      if (rec && rec.actualMinutes > 0) count++
    }
  }
  return count
})

function bulkApprove() {
  for (const emp of activeEmployees.value) {
    for (const day of periodDays.value) {
      const rec = getRecord(emp.id, day)
      if (rec && rec.actualMinutes > 0 && rec.status !== 'APPROVED') {
        approvedOverrides.add(`${emp.id}-${day}`)
      }
    }
  }
  snackbarMsg.value = `${approvedCount.value}件を一括承認しました`
  snackbar.value = true
}
</script>

<style scoped>
.approval-grid-wrapper {
  overflow-x: auto;
}

.approval-grid {
  border-collapse: collapse;
  width: 100%;
  min-width: max-content;
}

.approval-grid th,
.approval-grid td {
  border: 1px solid #E0E1E4;
  padding: 6px 4px;
  text-align: center;
}

.emp-col {
  position: sticky;
  left: 0;
  background: white;
  z-index: 1;
  min-width: 160px;
  text-align: left !important;
  padding: 6px 12px !important;
}

.day-col {
  width: 60px;
  font-size: 12px;
}

.weekend-col {
  background: rgba(230, 39, 62, 0.04);
}

.data-cell {
  cursor: pointer;
  transition: background 0.1s;
}

.data-cell:hover {
  background: #EBF3FC;
}

.approved-cell {
  background: #F0FDF4;
  color: #4bd08b;
  font-weight: 600;
}

.anomaly-cell {
  background: #FEF3C7;
  color: #D97706;
}

.completed-cell {
  background: white;
}

.empty-cell {
  color: #C0C4CC;
}

thead th {
  background: #F8F9FA;
  font-weight: 600;
  font-size: 12px;
}
</style>
