<template>
  <div>
    <div class="d-flex align-center justify-space-between mb-6">
      <div>
        <h1 class="text-h5 font-weight-bold">勤怠一覧</h1>
        <p class="text-body-2 text-medium-emphasis mt-1">スタッフの勤怠記録を確認・管理します</p>
      </div>
    </div>

    <!-- Filters -->
    <v-card rounded="xl" elevation="0" border class="mb-4">
      <v-card-text class="pa-4">
        <v-row dense>
          <v-col cols="12" sm="3">
            <v-text-field
              v-model="filters.dateFrom"
              type="date"
              label="開始日"
              prepend-inner-icon="mdi-calendar"
            />
          </v-col>
          <v-col cols="12" sm="3">
            <v-text-field
              v-model="filters.dateTo"
              type="date"
              label="終了日"
              prepend-inner-icon="mdi-calendar"
            />
          </v-col>
          <v-col cols="12" sm="3">
            <v-select
              v-model="filters.department"
              :items="['全部署', 'キッチン', 'ホール', 'レジ']"
              label="部署"
              prepend-inner-icon="mdi-store-outline"
            />
          </v-col>
          <v-col cols="12" sm="3">
            <v-select
              v-model="filters.status"
              :items="statusOptions"
              item-title="label"
              item-value="value"
              label="ステータス"
            />
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Data table -->
    <v-card rounded="xl" elevation="0" border>
      <v-data-table
        :headers="headers"
        :items="filteredRecords"
        density="compact"
        hover
        @click:row="onRowClick"
        style="cursor: pointer"
      >
        <template #item.employeeName="{ item }">
          <div class="d-flex align-center ga-2">
            <v-avatar color="primary" size="24">
              <span class="text-white" style="font-size: 9px">{{ item.employeeName.charAt(0) }}</span>
            </v-avatar>
            <span class="text-body-2">{{ item.employeeName }}</span>
          </div>
        </template>
        <template #item.status="{ item }">
          <v-chip :color="statusColor(item.rawStatus)" size="small" variant="flat">
            {{ item.status }}
          </v-chip>
        </template>
        <template #item.overtimeMinutes="{ item }">
          <span :class="item.overtimeMinutes > 0 ? 'text-warning font-weight-medium' : ''">
            {{ item.overtimeMinutes > 0 ? `+${item.overtimeMinutes}分` : '—' }}
          </span>
        </template>
        <template #item.actions="{ item }">
          <v-btn
            :to="`/attendance/${item.id}`"
            icon
            size="x-small"
            variant="text"
            @click.stop
          >
            <v-icon size="16">mdi-eye-outline</v-icon>
          </v-btn>
        </template>
      </v-data-table>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import { useMockData } from '~/composables/useMockData'
import type { AttendanceStatus } from '~/types'

const { attendanceRecords, getEmployee } = useMockData()
const router = useRouter()

const filters = reactive({
  dateFrom: '2026-02-23',
  dateTo: '2026-03-01',
  department: '全部署',
  status: 'ALL',
})

const statusOptions = [
  { label: '全ステータス', value: 'ALL' },
  { label: '未出勤', value: 'NOT_STARTED' },
  { label: '勤務中', value: 'WORKING' },
  { label: '休憩中', value: 'ON_BREAK' },
  { label: '退勤済み', value: 'COMPLETED' },
  { label: '承認済み', value: 'APPROVED' },
]

const headers = [
  { title: '従業員', key: 'employeeName', sortable: true },
  { title: '部署', key: 'department', sortable: true },
  { title: '日付', key: 'workDate', sortable: true },
  { title: '出勤', key: 'checkIn', sortable: false },
  { title: '退勤', key: 'checkOut', sortable: false },
  { title: '実労働', key: 'actualHours', sortable: true },
  { title: '残業', key: 'overtimeMinutes', sortable: true },
  { title: 'ステータス', key: 'status', sortable: true },
  { title: '', key: 'actions', sortable: false, width: '48px' },
]

function statusColor(status: AttendanceStatus | string): string {
  const map: Record<string, string> = {
    NOT_STARTED: 'default',
    WORKING: 'success',
    ON_BREAK: 'warning',
    COMPLETED: 'primary',
    APPROVED: 'indigo',
  }
  return map[status] ?? 'default'
}

function statusJa(status: AttendanceStatus | string): string {
  const map: Record<string, string> = {
    NOT_STARTED: '未出勤',
    WORKING: '勤務中',
    ON_BREAK: '休憩中',
    COMPLETED: '退勤済み',
    APPROVED: '承認済み',
  }
  return map[status] ?? status
}

const filteredRecords = computed(() => {
  return attendanceRecords
    .filter(r => {
      if (r.workDate < filters.dateFrom || r.workDate > filters.dateTo) return false
      const emp = getEmployee(r.employeeId)
      if (!emp) return false
      if (filters.department !== '全部署' && emp.department !== filters.department) return false
      if (filters.status !== 'ALL' && r.status !== filters.status) return false
      return true
    })
    .map(r => {
      const emp = getEmployee(r.employeeId)!
      return {
        id: r.id,
        employeeName: emp.name,
        department: emp.department,
        workDate: r.workDate,
        checkIn: r.checkIn ?? '—',
        checkOut: r.checkOut ?? '—',
        actualHours: r.actualMinutes > 0 ? `${Math.floor(r.actualMinutes / 60)}h${r.actualMinutes % 60}m` : '—',
        overtimeMinutes: r.overtimeMinutes,
        status: statusJa(r.status),
        rawStatus: r.status,
      }
    })
})

function onRowClick(_event: Event, { item }: { item: { id: string } }) {
  router.push(`/attendance/${item.id}`)
}
</script>
