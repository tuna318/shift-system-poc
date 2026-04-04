<template>
  <div>
    <!-- ── Header ──────────────────────────────────────────── -->
    <div class="d-flex align-center justify-space-between mb-5">
      <div>
        <h1 class="text-h5 font-weight-bold">修正申請</h1>
        <p class="text-body-2 text-medium-emphasis mt-1">
          従業員から提出された打刻修正・追加申請を確認してください
        </p>
      </div>
      <v-chip v-if="pendingCount > 0" color="warning" variant="flat" size="default">
        <v-icon start size="14">mdi-pencil-outline</v-icon>
        未処理 {{ pendingCount }}件
      </v-chip>
    </div>

    <!-- ── Filters ─────────────────────────────────────────── -->
    <v-card rounded="xl" elevation="0" border class="mb-4">
      <v-card-text class="pa-4">
        <div class="d-flex flex-wrap align-center ga-3">
          <!-- Status tabs -->
          <v-btn-toggle v-model="statusFilter" mandatory rounded="lg" density="compact" color="primary">
            <v-btn value="pending" size="small">
              未処理
              <v-chip v-if="pendingCount > 0" size="x-small" color="warning" variant="flat" class="ml-1">
                {{ pendingCount }}
              </v-chip>
            </v-btn>
            <v-btn value="approved" size="small">承認済み</v-btn>
            <v-btn value="rejected" size="small">却下済み</v-btn>
            <v-btn value="all" size="small">すべて</v-btn>
          </v-btn-toggle>

          <v-divider vertical class="mx-1" />

          <!-- Type filter -->
          <v-btn-toggle v-model="typeFilter" mandatory rounded="lg" density="compact">
            <v-btn value="all" size="small">全種別</v-btn>
            <v-btn value="edit" size="small">時刻修正</v-btn>
            <v-btn value="add_missing" size="small">セッション追加</v-btn>
          </v-btn-toggle>

          <v-divider vertical class="mx-1" />

          <!-- Dept filter -->
          <v-chip-group v-model="deptFilter" mandatory>
            <v-chip value="ALL" size="small" rounded="lg" filter>全部署</v-chip>
            <v-chip value="キッチン" size="small" rounded="lg" filter>キッチン</v-chip>
            <v-chip value="ホール" size="small" rounded="lg" filter>ホール</v-chip>
            <v-chip value="レジ" size="small" rounded="lg" filter>レジ</v-chip>
          </v-chip-group>
        </div>
      </v-card-text>
    </v-card>

    <!-- ── Empty state ─────────────────────────────────────── -->
    <template v-if="filteredRequests.length === 0">
      <v-card rounded="xl" elevation="0" border class="text-center py-12">
        <v-icon size="56" color="success">mdi-check-circle-outline</v-icon>
        <div class="text-h6 mt-3">該当する申請はありません</div>
        <div class="text-body-2 text-medium-emphasis mt-1">フィルター条件を変更してお試しください</div>
      </v-card>
    </template>

    <!-- ── Request list ─────────────────────────────────────── -->
    <div class="d-flex flex-column ga-3">
      <v-card
        v-for="req in filteredRequests"
        :key="req.id"
        rounded="xl"
        elevation="0"
        border
        :class="{ 'card--pending': req.status === 'pending' }"
      >
        <v-card-text class="pa-4">
          <!-- Card header: employee + date + type -->
          <div class="d-flex align-center ga-3 mb-4">
            <v-avatar size="36" color="primary" variant="tonal" rounded="lg">
              <span class="text-body-2 font-weight-bold">{{ getEmp(req.employeeId)?.name[0] }}</span>
            </v-avatar>
            <div class="flex-1-1">
              <div class="d-flex align-center gap-2 flex-wrap">
                <span class="text-subtitle-2 font-weight-bold">{{ getEmp(req.employeeId)?.name }}</span>
                <v-chip size="x-small" color="surface-variant" variant="flat">
                  {{ getEmp(req.employeeId)?.department }}
                </v-chip>
                <span class="text-body-2 text-medium-emphasis">{{ formatDate(req.workDate) }}</span>
              </div>
              <div class="text-caption text-medium-emphasis mt-1">
                申請日時：{{ formatDateTime(req.createdAt) }}
              </div>
            </div>
            <div class="d-flex align-center ga-2 flex-shrink-0">
              <v-chip size="small" :color="req.type === 'edit' ? 'blue' : 'teal'" variant="tonal"
                      :prepend-icon="req.type === 'edit' ? 'mdi-pencil-outline' : 'mdi-plus-circle-outline'">
                {{ req.type === 'edit' ? '時刻修正' : 'セッション追加' }}
              </v-chip>
              <v-chip size="small" :color="statusColor(req.status)" variant="flat">
                {{ statusLabel(req.status) }}
              </v-chip>
            </div>
          </div>

          <v-row dense>
            <!-- Left: time comparison + reason -->
            <v-col cols="12" md="7">
              <!-- Time comparison -->
              <div class="time-compare mb-3">
                <template v-if="req.type === 'edit'">
                  <div class="tc-row">
                    <span class="tc-label text-medium-emphasis">修正前</span>
                    <div class="tc-times">
                      <span class="font-weight-medium">{{ req.originalCheckIn ?? '—' }}</span>
                      <v-icon size="12" class="mx-1">mdi-arrow-right</v-icon>
                      <span :class="{ 'text-error': !req.originalCheckOut }" class="font-weight-medium">
                        {{ req.originalCheckOut ?? '未打刻' }}
                      </span>
                    </div>
                  </div>
                  <div class="tc-divider">
                    <v-icon size="14" color="medium-emphasis">mdi-arrow-down</v-icon>
                  </div>
                  <div class="tc-row">
                    <span class="tc-label text-primary font-weight-bold">申請後</span>
                    <div class="tc-times">
                      <span class="font-weight-bold text-primary">{{ req.requestedCheckIn }}</span>
                      <v-icon size="12" class="mx-1">mdi-arrow-right</v-icon>
                      <span class="font-weight-bold text-primary">{{ req.requestedCheckOut }}</span>
                    </div>
                  </div>
                </template>
                <template v-else>
                  <div class="tc-row">
                    <span class="tc-label text-teal font-weight-bold">追加申請</span>
                    <div class="tc-times">
                      <span class="font-weight-bold text-teal">{{ req.requestedCheckIn }}</span>
                      <v-icon size="12" class="mx-1">mdi-arrow-right</v-icon>
                      <span class="font-weight-bold text-teal">{{ req.requestedCheckOut }}</span>
                      <span class="text-caption text-medium-emphasis ml-2">
                        ({{ calcDuration(req.requestedCheckIn, req.requestedCheckOut) }})
                      </span>
                    </div>
                  </div>
                </template>
              </div>

              <!-- Reason -->
              <div class="reason-block">
                <div class="text-caption text-medium-emphasis mb-1">
                  <v-icon size="12">mdi-comment-text-outline</v-icon> 従業員コメント
                </div>
                <div class="text-body-2">{{ req.reason }}</div>
              </div>

              <!-- Manager note (rejected) -->
              <div v-if="req.managerNote" class="manager-note mt-2">
                <div class="text-caption text-medium-emphasis mb-1">
                  <v-icon size="12">mdi-account-tie-outline</v-icon> 管理者コメント
                </div>
                <div class="text-body-2">{{ req.managerNote }}</div>
              </div>
            </v-col>

            <!-- Right: shift reference -->
            <v-col cols="12" md="5">
              <div class="shift-ref">
                <div class="text-caption text-medium-emphasis mb-1">
                  <v-icon size="12">mdi-calendar-clock</v-icon> この日のシフト
                </div>
                <template v-if="getShift(req.employeeId, req.workDate)">
                  <div class="d-flex align-center ga-2">
                    <v-icon size="14" color="primary">mdi-clock-outline</v-icon>
                    <span class="text-body-2 font-weight-medium">
                      {{ getShift(req.employeeId, req.workDate)?.startTime }}
                      –
                      {{ getShift(req.employeeId, req.workDate)?.endTime }}
                    </span>
                    <v-chip size="x-small" color="primary" variant="tonal">
                      {{ getShift(req.employeeId, req.workDate)?.department }}
                    </v-chip>
                  </div>
                </template>
                <template v-else>
                  <span class="text-caption text-medium-emphasis">シフトなし</span>
                </template>
              </div>

              <!-- Actions for pending -->
              <template v-if="req.status === 'pending'">
                <!-- Reject note -->
                <v-expand-transition>
                  <div v-if="rejectingId === req.id" class="mt-3">
                    <v-textarea
                      v-model="rejectNote"
                      label="却下理由（従業員に通知されます）"
                      variant="outlined"
                      density="compact"
                      rows="2"
                      hide-details
                      rounded="lg"
                      class="mb-2"
                    />
                    <div class="d-flex ga-2 justify-end">
                      <v-btn variant="text" size="small" @click="rejectingId = null; rejectNote = ''">
                        キャンセル
                      </v-btn>
                      <v-btn
                        color="error"
                        size="small"
                        rounded="lg"
                        :disabled="!rejectNote.trim()"
                        @click="submitReject(req.id)"
                      >
                        却下を確定
                      </v-btn>
                    </div>
                  </div>
                  <div v-else class="d-flex ga-2 mt-3 justify-end">
                    <v-btn
                      variant="text"
                      size="small"
                      :to="`/attendance/${req.employeeId}/${req.workDate}`"
                    >
                      詳細
                    </v-btn>
                    <v-btn
                      variant="outlined"
                      color="error"
                      size="small"
                      rounded="lg"
                      @click="rejectingId = req.id"
                    >
                      却下
                    </v-btn>
                    <v-btn
                      color="success"
                      size="small"
                      rounded="lg"
                      @click="attStore.approveCorrection(req.id)"
                    >
                      承認
                    </v-btn>
                  </div>
                </v-expand-transition>
              </template>

              <!-- View detail for non-pending -->
              <div v-else class="d-flex justify-end mt-3">
                <v-btn
                  variant="text"
                  size="small"
                  :to="`/attendance/${req.employeeId}/${req.workDate}`"
                >
                  詳細を見る
                </v-btn>
              </div>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { CorrectionRequestStatus } from '~/types'
import { useAttendanceStore } from '~/stores/attendance.store'
import { useMockData } from '~/composables/useMockData'

const attStore = useAttendanceStore()
const { employees, getEmpShiftsForDate } = useMockData()

const statusFilter = ref<'pending' | 'approved' | 'rejected' | 'all'>('pending')
const typeFilter = ref<'all' | 'edit' | 'add_missing'>('all')
const deptFilter = ref('ALL')
const rejectingId = ref<string | null>(null)
const rejectNote = ref('')

const pendingCount = computed(() => attStore.corrections.filter(c => c.status === 'pending').length)

const filteredRequests = computed(() => {
  return attStore.corrections
    .filter((req) => {
      if (statusFilter.value !== 'all' && req.status !== statusFilter.value) return false
      if (typeFilter.value !== 'all' && req.type !== typeFilter.value) return false
      if (deptFilter.value !== 'ALL') {
        const emp = employees.find(e => e.id === req.employeeId)
        if (emp?.department !== deptFilter.value) return false
      }
      return true
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
})

function getEmp(empId: string) { return employees.find(e => e.id === empId) }
function getShift(empId: string, date: string) { return getEmpShiftsForDate(empId, date)[0] ?? null }

function submitReject(id: string) {
  attStore.rejectCorrection(id, rejectNote.value)
  rejectingId.value = null
  rejectNote.value = ''
}

function statusLabel(s: CorrectionRequestStatus): string {
  switch (s) {
    case 'pending': return '承認待ち'
    case 'approved': return '承認済み'
    case 'rejected': return '却下済み'
  }
}
function statusColor(s: CorrectionRequestStatus): string {
  switch (s) {
    case 'pending': return 'warning'
    case 'approved': return 'success'
    case 'rejected': return 'error'
  }
}

function calcDuration(ci: string, co: string): string {
  const [ih, im] = ci.split(':').map(Number)
  const [oh, om] = co.split(':').map(Number)
  const total = (oh * 60 + om) - (ih * 60 + im)
  const h = Math.floor(total / 60)
  const m = total % 60
  return m > 0 ? `${h}h${String(m).padStart(2, '0')}m` : `${h}h`
}

function formatDate(d: string): string {
  const dt = new Date(d)
  const dow = ['日', '月', '火', '水', '木', '金', '土'][dt.getDay()]
  return `${dt.getMonth() + 1}月${dt.getDate()}日（${dow}）`
}

function formatDateTime(iso: string): string {
  const d = new Date(iso)
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}
</script>

<style scoped>
.card--pending { border-color: #ffc107 !important; }

.time-compare {
  background: #f5f5f5;
  border-radius: 8px;
  padding: 10px 12px;
}
.tc-row { display: flex; align-items: center; gap: 8px; }
.tc-label { font-size: 11px; font-weight: 600; min-width: 48px; }
.tc-times { display: flex; align-items: center; font-size: 14px; font-feature-settings: "tnum"; }
.tc-divider { padding-left: 56px; margin: 2px 0; }

.reason-block, .shift-ref {
  background: #fafafa;
  border-radius: 8px;
  padding: 8px 12px;
}
.manager-note { background: #fff3e0; border-radius: 8px; padding: 8px 12px; }

.text-teal { color: #009688; }
</style>
