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
          <v-chip :color="statusColor(record.status)" size="small" variant="flat">
            {{ statusJa(record.status) }}
          </v-chip>
        </div>
        <p class="text-caption text-medium-emphasis">
          {{ record.workDate }} ／ {{ employee.department }}
        </p>
      </div>
      <v-btn
        color="warning"
        variant="tonal"
        prepend-icon="mdi-pencil-outline"
        rounded="lg"
        @click="modifyDialog = true"
      >
        修正依頼
      </v-btn>
    </div>

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

        <!-- Punch events -->
        <v-card rounded="xl" elevation="0" border>
          <v-card-title class="pa-4 pb-2 text-subtitle-2 font-weight-bold">打刻履歴</v-card-title>
          <v-card-text class="px-4 pb-4">
            <PunchTimeline :punch-events="record.punchEvents" />
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Estimated wage -->
      <v-col cols="12" md="4">
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
          </v-card-text>
        </v-card>

        <v-card rounded="xl" elevation="0" border>
          <v-card-title class="pa-4 pb-2 text-subtitle-2 font-weight-bold">シフト予定</v-card-title>
          <v-card-text class="px-4 pb-4">
            <div v-if="shiftEntry" class="pa-2 rounded-lg" style="background: #DBEAFE">
              <div class="text-body-2 font-weight-medium text-primary">
                {{ shiftEntry.startTime }}〜{{ shiftEntry.endTime }}
              </div>
              <div class="text-caption text-medium-emphasis">{{ shiftEntry.department }}</div>
            </div>
            <div v-else class="text-caption text-medium-emphasis">シフト情報なし</div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Modification dialog -->
    <v-dialog v-model="modifyDialog" max-width="440">
      <v-card rounded="xl">
        <v-card-title class="pa-4 text-subtitle-1 font-weight-bold">打刻修正依頼</v-card-title>
        <v-divider />
        <v-card-text class="pa-4">
          <div class="d-flex ga-3 mb-3">
            <v-text-field v-model="modifyForm.checkIn" type="time" label="修正後 出勤時刻" />
            <v-text-field v-model="modifyForm.checkOut" type="time" label="修正後 退勤時刻" />
          </div>
          <v-textarea v-model="modifyForm.reason" label="修正理由" rows="2" />
        </v-card-text>
        <v-card-actions class="pa-4 pt-0">
          <v-spacer />
          <v-btn variant="text" @click="modifyDialog = false">キャンセル</v-btn>
          <v-btn color="warning" variant="flat" @click="submitModify">申請</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snackbar" location="top center" color="warning" rounded="pill" :timeout="2000">
      修正依頼を送信しました
    </v-snackbar>
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
import type { AttendanceStatus, EmploymentType } from '~/types'

const route = useRoute()
const { attendanceRecords, getEmployee, currentBoard } = useMockData()

const recordId = computed(() => route.params.id as string)
const record = computed(() => attendanceRecords.find(r => r.id === recordId.value))
const employee = computed(() => record.value ? getEmployee(record.value.employeeId) : undefined)

const shiftEntry = computed(() => {
  if (!record.value) return null
  return currentBoard.entries.find(
    e => e.employeeId === record.value!.employeeId && e.shiftDate === record.value!.workDate
  ) ?? null
})

const estimatedWage = computed(() => {
  if (!employee.value || !record.value) return 0
  return Math.round(employee.value.hourlyWage * record.value.actualMinutes / 60)
})

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
      value: record.value.overtimeMinutes > 0 ? `${record.value.overtimeMinutes}分` : '—',
      icon: 'mdi-clock-alert-outline',
      color: record.value.overtimeMinutes > 0 ? 'warning' : 'default',
    },
    {
      label: '深夜時間',
      value: '—',
      icon: 'mdi-moon-waning-crescent',
      color: 'default',
    },
  ]
})

function statusColor(status: AttendanceStatus | string): string {
  const map: Record<string, string> = {
    NOT_STARTED: 'default', WORKING: 'success', ON_BREAK: 'warning',
    COMPLETED: 'primary', APPROVED: 'indigo',
  }
  return map[status] ?? 'default'
}

function statusJa(status: AttendanceStatus | string): string {
  const map: Record<string, string> = {
    NOT_STARTED: '未出勤', WORKING: '勤務中', ON_BREAK: '休憩中',
    COMPLETED: '退勤済み', APPROVED: '承認済み',
  }
  return map[status] ?? status
}

function employmentTypeJa(type: EmploymentType): string {
  const map: Record<EmploymentType, string> = {
    FULL_TIME: '正社員', PART_TIME: 'アルバイト', FLEX: 'フレックス', DISCRETIONARY: '裁量労働',
  }
  return map[type] ?? type
}

const modifyDialog = ref(false)
const snackbar = ref(false)
const modifyForm = reactive({
  checkIn: record.value?.checkIn ?? '',
  checkOut: record.value?.checkOut ?? '',
  reason: '',
})

function submitModify() {
  modifyDialog.value = false
  snackbar.value = true
}
</script>
