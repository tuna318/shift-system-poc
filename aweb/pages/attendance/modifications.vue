<template>
  <div>
    <div class="d-flex align-center justify-space-between mb-6">
      <div>
        <h1 class="text-h5 font-weight-bold">修正申請</h1>
        <p class="text-body-2 text-medium-emphasis mt-1">スタッフからの打刻修正申請を確認・対応します</p>
      </div>
      <v-chip color="warning" variant="flat">{{ pendingCount }}件 対応待ち</v-chip>
    </div>

    <div v-if="modifications.length === 0" class="text-center py-12">
      <v-icon size="48" color="success">mdi-check-circle-outline</v-icon>
      <p class="text-body-1 text-medium-emphasis mt-3">未対応の修正申請はありません</p>
    </div>

    <ModificationCard
      v-for="mod in modifications"
      :key="mod.id"
      :modification="mod"
      @approve="handleApprove"
      @reject="handleReject"
    />

    <v-snackbar v-model="snackbar.show" location="top center" :color="snackbar.color" rounded="pill" :timeout="2000">
      {{ snackbar.message }}
    </v-snackbar>
  </div>
</template>

<script setup lang="ts">
import { useMockData } from '~/composables/useMockData'

const { getEmployee } = useMockData()

const modifications = ref([
  {
    id: 'mod-001',
    employeeId: 'emp-006',
    employeeName: '佐藤 花子',
    workDate: '2026-02-28',
    originalCheckIn: '10:00',
    originalCheckOut: '18:00',
    requestedCheckIn: '09:45',
    requestedCheckOut: '18:15',
    reason: '打刻を忘れたため、実際の勤務時間への修正をお願いします',
  },
  {
    id: 'mod-002',
    employeeId: 'emp-004',
    employeeName: '渡辺 健司',
    workDate: '2026-02-27',
    originalCheckIn: '09:00',
    originalCheckOut: '—',
    requestedCheckIn: '09:00',
    requestedCheckOut: '17:30',
    reason: '退勤打刻を忘れてしまいました',
  },
  {
    id: 'mod-003',
    employeeId: 'emp-012',
    employeeName: '松本 幸子',
    workDate: '2026-02-26',
    originalCheckIn: '11:00',
    originalCheckOut: '20:00',
    requestedCheckIn: '10:00',
    requestedCheckOut: '20:00',
    reason: '早出対応があり、打刻漏れがありました',
  },
])

const pendingCount = computed(() => modifications.value.length)
const snackbar = reactive({ show: false, message: '', color: 'success' })

function handleApprove(id: string) {
  const idx = modifications.value.findIndex(m => m.id === id)
  if (idx !== -1) modifications.value.splice(idx, 1)
  snackbar.message = '修正申請を承認しました'
  snackbar.color = 'success'
  snackbar.show = true
}

function handleReject(id: string) {
  const idx = modifications.value.findIndex(m => m.id === id)
  if (idx !== -1) modifications.value.splice(idx, 1)
  snackbar.message = '修正申請を拒否しました'
  snackbar.color = 'error'
  snackbar.show = true
}
</script>
