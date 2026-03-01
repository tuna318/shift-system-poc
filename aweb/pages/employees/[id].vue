<template>
  <div v-if="employee">
    <!-- Header -->
    <div class="d-flex align-center ga-3 mb-6">
      <v-btn to="/employees" icon size="small" variant="text">
        <v-icon>mdi-arrow-left</v-icon>
      </v-btn>
      <v-avatar :color="deptColor(employee.department)" size="48">
        <span class="text-white text-h6 font-weight-bold">{{ employee.name.charAt(0) }}</span>
      </v-avatar>
      <div class="flex-1-1">
        <div class="d-flex align-center ga-2">
          <h1 class="text-h6 font-weight-bold">{{ employee.name }}</h1>
          <span class="text-caption text-medium-emphasis">{{ employee.nameKana }}</span>
          <v-chip :color="employee.status === 'ACTIVE' ? 'success' : 'default'" size="small" variant="flat">
            {{ employee.status === 'ACTIVE' ? '在籍中' : '退職' }}
          </v-chip>
        </div>
        <p class="text-caption text-medium-emphasis">
          {{ employee.department }} ／ {{ employee.position }} ／ {{ employmentTypeJa(employee.employmentType) }}
        </p>
      </div>
      <v-btn variant="tonal" prepend-icon="mdi-pencil-outline" rounded="lg" size="small">
        編集
      </v-btn>
    </div>

    <!-- Tabs -->
    <v-tabs v-model="tab" color="primary" density="compact" class="mb-4">
      <v-tab value="profile">プロフィール</v-tab>
      <v-tab value="employment">雇用情報</v-tab>
      <v-tab value="attendance">勤怠実績</v-tab>
      <v-tab value="shifts">シフト</v-tab>
      <v-tab value="labor">労働時間</v-tab>
    </v-tabs>

    <v-tabs-window v-model="tab">
      <!-- Profile tab -->
      <v-tabs-window-item value="profile">
        <v-card rounded="xl" elevation="0" border>
          <v-card-text class="pa-6">
            <v-row>
              <v-col cols="12" md="6">
                <div class="d-flex flex-column ga-4">
                  <div>
                    <div class="text-caption text-medium-emphasis mb-1">従業員ID</div>
                    <div class="text-body-1 font-weight-medium">{{ employee.id }}</div>
                  </div>
                  <div>
                    <div class="text-caption text-medium-emphasis mb-1">氏名</div>
                    <div class="text-body-1 font-weight-medium">{{ employee.name }}</div>
                  </div>
                  <div>
                    <div class="text-caption text-medium-emphasis mb-1">氏名（カナ）</div>
                    <div class="text-body-1 font-weight-medium">{{ employee.nameKana }}</div>
                  </div>
                  <div>
                    <div class="text-caption text-medium-emphasis mb-1">部署</div>
                    <div class="d-flex align-center ga-2">
                      <v-avatar :color="deptColor(employee.department)" size="20">
                        <span class="text-white" style="font-size: 9px">{{ employee.department.charAt(0) }}</span>
                      </v-avatar>
                      <div class="text-body-1 font-weight-medium">{{ employee.department }}</div>
                    </div>
                  </div>
                </div>
              </v-col>
              <v-col cols="12" md="6">
                <div class="d-flex flex-column ga-4">
                  <div>
                    <div class="text-caption text-medium-emphasis mb-1">ポジション</div>
                    <div class="text-body-1 font-weight-medium">{{ employee.position }}</div>
                  </div>
                  <div>
                    <div class="text-caption text-medium-emphasis mb-1">入社日</div>
                    <div class="text-body-1 font-weight-medium">{{ employee.hireDate }}</div>
                  </div>
                  <div>
                    <div class="text-caption text-medium-emphasis mb-1">PINコード</div>
                    <div class="text-body-1 font-weight-medium">****</div>
                  </div>
                </div>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-tabs-window-item>

      <!-- Employment tab -->
      <v-tabs-window-item value="employment">
        <v-card rounded="xl" elevation="0" border>
          <v-card-text class="pa-6">
            <v-row>
              <v-col cols="12" md="6">
                <div class="d-flex flex-column ga-4">
                  <div>
                    <div class="text-caption text-medium-emphasis mb-1">雇用形態</div>
                    <div class="text-body-1 font-weight-medium">{{ employmentTypeJa(employee.employmentType) }}</div>
                  </div>
                  <div>
                    <div class="text-caption text-medium-emphasis mb-1">時給</div>
                    <div class="text-h6 font-weight-bold text-success">¥{{ employee.hourlyWage.toLocaleString() }}</div>
                  </div>
                </div>
              </v-col>
              <v-col cols="12" md="6">
                <div class="d-flex flex-column ga-4">
                  <div>
                    <div class="text-caption text-medium-emphasis mb-1">所定労働時間</div>
                    <div class="text-body-1 font-weight-medium">{{ employee.employmentType === 'FULL_TIME' ? '8時間/日' : 'シフト制' }}</div>
                  </div>
                  <div>
                    <div class="text-caption text-medium-emphasis mb-1">残業上限</div>
                    <div class="text-body-1 font-weight-medium">45時間/月</div>
                  </div>
                </div>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-tabs-window-item>

      <!-- Attendance tab -->
      <v-tabs-window-item value="attendance">
        <v-card rounded="xl" elevation="0" border>
          <v-data-table
            :headers="attHeaders"
            :items="empAttendance"
            density="compact"
            hover
          >
            <template #item.status="{ item }">
              <v-chip :color="statusColor(item.rawStatus)" size="x-small" variant="flat">
                {{ item.status }}
              </v-chip>
            </template>
          </v-data-table>
        </v-card>
      </v-tabs-window-item>

      <!-- Shifts tab -->
      <v-tabs-window-item value="shifts">
        <v-card rounded="xl" elevation="0" border>
          <v-card-text class="pa-4">
            <div v-if="empShifts.length === 0" class="text-center py-8 text-medium-emphasis text-body-2">
              シフトデータなし
            </div>
            <div v-else class="d-flex flex-column ga-2">
              <div
                v-for="entry in empShifts"
                :key="entry.id"
                class="d-flex align-center justify-space-between pa-3 rounded-xl"
                style="background: #F8F9FA"
              >
                <div>
                  <div class="text-body-2 font-weight-medium">{{ entry.shiftDate }}</div>
                  <div class="text-caption text-medium-emphasis">{{ entry.department }}</div>
                </div>
                <div class="text-right">
                  <div class="text-body-2 font-weight-medium text-primary">{{ entry.startTime }}〜{{ entry.endTime }}</div>
                  <v-chip :color="cellStatusColor(entry.cellStatus)" size="x-small" variant="flat">
                    {{ cellStatusLabel(entry.cellStatus) }}
                  </v-chip>
                </div>
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-tabs-window-item>

      <!-- Labor tab -->
      <v-tabs-window-item value="labor">
        <v-row>
          <v-col cols="12" md="6">
            <v-card rounded="xl" elevation="0" border class="mb-4">
              <v-card-title class="pa-4 pb-2 text-subtitle-2 font-weight-bold">月次労働時間</v-card-title>
              <v-card-text class="px-4 pb-4">
                <div class="d-flex justify-space-between align-center mb-1">
                  <span class="text-caption text-medium-emphasis">今月の残業時間</span>
                  <span class="text-body-2 font-weight-bold">
                    {{ monthlyOT.toFixed(0) }}h / 45h
                  </span>
                </div>
                <v-progress-linear
                  :model-value="(monthlyOT / 45) * 100"
                  :color="monthlyOT >= 40 ? 'error' : monthlyOT >= 35 ? 'warning' : 'primary'"
                  bg-color="#E0E1E4"
                  height="10"
                  rounded
                  class="mb-1"
                />
                <p v-if="monthlyOT >= 40" class="text-caption text-error">
                  残業時間が上限に近づいています
                </p>
              </v-card-text>
            </v-card>
          </v-col>
          <v-col cols="12" md="6">
            <v-card rounded="xl" elevation="0" border>
              <v-card-title class="pa-4 pb-2 text-subtitle-2 font-weight-bold">年次労働時間</v-card-title>
              <v-card-text class="px-4 pb-4">
                <div class="d-flex justify-space-between align-center mb-1">
                  <span class="text-caption text-medium-emphasis">今年度の残業時間</span>
                  <span class="text-body-2 font-weight-bold">{{ yearlyOT }}h / 360h</span>
                </div>
                <v-progress-linear
                  :model-value="(yearlyOT / 360) * 100"
                  :color="yearlyOT >= 320 ? 'error' : 'primary'"
                  bg-color="#E0E1E4"
                  height="10"
                  rounded
                  class="mb-1"
                />
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-tabs-window-item>
    </v-tabs-window>
  </div>

  <div v-else class="text-center py-16">
    <v-icon size="48" color="medium-emphasis">mdi-account-off-outline</v-icon>
    <p class="text-body-1 text-medium-emphasis mt-3">スタッフが見つかりません</p>
    <v-btn to="/employees" variant="tonal" color="primary" class="mt-3" rounded="lg">
      一覧に戻る
    </v-btn>
  </div>
</template>

<script setup lang="ts">
import { useMockData } from '~/composables/useMockData'
import type { EmploymentType, AttendanceStatus, CellStatus } from '~/types'

const route = useRoute()
const { employees, attendanceRecords, currentBoard, getEmployee } = useMockData()

const empId = computed(() => route.params.id as string)
const employee = computed(() => employees.find(e => e.id === empId.value))

const tab = ref('profile')

const empAttendance = computed(() =>
  attendanceRecords
    .filter(r => r.employeeId === empId.value)
    .map(r => ({
      id: r.id,
      workDate: r.workDate,
      checkIn: r.checkIn ?? '—',
      checkOut: r.checkOut ?? '—',
      actualHours: r.actualMinutes > 0 ? `${Math.floor(r.actualMinutes / 60)}h` : '—',
      status: statusJa(r.status),
      rawStatus: r.status,
    }))
)

const empShifts = computed(() =>
  currentBoard.entries.filter(e => e.employeeId === empId.value)
)

const monthlyOT = computed(() => {
  const total = attendanceRecords
    .filter(r => r.employeeId === empId.value && r.workDate.startsWith('2026-02'))
    .reduce((sum, r) => sum + r.overtimeMinutes, 0)
  return Math.round((total / 60) * 10) / 10 + 32 // Mock base
})

const yearlyOT = computed(() => Math.round(monthlyOT.value * 8))

const attHeaders = [
  { title: '日付', key: 'workDate', sortable: true },
  { title: '出勤', key: 'checkIn', sortable: false },
  { title: '退勤', key: 'checkOut', sortable: false },
  { title: '実労働', key: 'actualHours', sortable: false },
  { title: 'ステータス', key: 'status', sortable: true },
]

function deptColor(dept: string) {
  const map: Record<string, string> = { 'キッチン': '#3587dc', 'ホール': '#4bd08b', 'レジ': '#f8c076' }
  return map[dept] ?? '#80848e'
}

function employmentTypeJa(type: EmploymentType): string {
  const map: Record<EmploymentType, string> = {
    FULL_TIME: '正社員', PART_TIME: 'アルバイト', FLEX: 'フレックス', DISCRETIONARY: '裁量労働',
  }
  return map[type] ?? type
}

function statusJa(status: AttendanceStatus | string): string {
  const map: Record<string, string> = {
    NOT_STARTED: '未出勤', WORKING: '勤務中', ON_BREAK: '休憩中',
    COMPLETED: '退勤済み', APPROVED: '承認済み',
  }
  return map[status] ?? status
}

function statusColor(status: string): string {
  const map: Record<string, string> = {
    NOT_STARTED: 'default', WORKING: 'success', ON_BREAK: 'warning',
    COMPLETED: 'primary', APPROVED: 'indigo',
  }
  return map[status] ?? 'default'
}

function cellStatusColor(status: CellStatus): string {
  const map: Record<CellStatus, string> = {
    SHIFT_REQUESTED: 'indigo', CONFIRMED: 'primary', DAY_OFF_REQUESTED: 'orange', DAY_OFF_CONFIRMED: 'default', ADJUSTING: 'warning',
  }
  return map[status]
}

function cellStatusLabel(status: CellStatus): string {
  const map: Record<CellStatus, string> = {
    SHIFT_REQUESTED: 'シフト希望', CONFIRMED: 'シフト確定', DAY_OFF_REQUESTED: '休み希望', DAY_OFF_CONFIRMED: '休み確定', ADJUSTING: '調整中',
  }
  return map[status]
}
</script>
