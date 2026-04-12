<template>
  <div>
    <!-- Page header -->
    <div class="d-flex align-center justify-space-between mb-6">
      <div>
        <h1 class="text-h5 font-weight-bold">ダッシュボード</h1>
        <p class="text-body-2 text-medium-emphasis mt-1">渋谷本店</p>
      </div>
      <v-btn
        to="/shifts/board/board-2026-03"
        color="primary"
        prepend-icon="mdi-table-large"
        rounded="lg"
      >
        シフトボード
      </v-btn>
    </div>

    <!-- KPI Strip -->
    <v-row class="mb-4">
      <v-col cols="12" sm="6" md="3">
        <v-card
          to="/attendance/modifications"
          rounded="xl"
          elevation="0"
          border
          class="pa-4 kpi-card"
        >
          <div class="d-flex align-center justify-space-between mb-2">
            <span class="text-caption text-medium-emphasis">未処理の修正申請</span>
            <v-icon color="warning" size="20">mdi-pencil-clock</v-icon>
          </div>
          <div class="text-h4 font-weight-bold kpi-value--warning">
            {{ attStore.pendingCorrectionCount }}<span class="text-h6 font-weight-regular">件</span>
          </div>
          <div class="text-caption mt-1">
            <span v-if="attStore.pendingCorrectionCount > 0" class="kpi-value--warning">要対応</span>
            <span v-else class="text-success">問題なし</span>
          </div>
        </v-card>
      </v-col>

      <v-col cols="12" sm="6" md="3">
        <v-card
          to="/attendance"
          rounded="xl"
          elevation="0"
          border
          class="pa-4 kpi-card"
        >
          <div class="d-flex align-center justify-space-between mb-2">
            <span class="text-caption text-medium-emphasis">承認待ち勤怠</span>
            <v-icon color="primary" size="20">mdi-clock-check-outline</v-icon>
          </div>
          <div class="text-h4 font-weight-bold kpi-value--primary">
            {{ attStore.pendingApprovalCount }}<span class="text-h6 font-weight-regular">件</span>
          </div>
          <div class="text-caption text-medium-emphasis mt-1">提出済み・未承認</div>
        </v-card>
      </v-col>

      <v-col cols="12" sm="6" md="3">
        <v-card
          to="/reports"
          rounded="xl"
          elevation="0"
          border
          class="pa-4 kpi-card"
        >
          <div class="d-flex align-center justify-space-between mb-2">
            <span class="text-caption text-medium-emphasis">コンプライアンス警告</span>
            <v-icon color="error" size="20">mdi-alert-circle-outline</v-icon>
          </div>
          <div class="text-h4 font-weight-bold kpi-value--error">
            {{ alerts.length }}<span class="text-h6 font-weight-regular">件</span>
          </div>
          <div class="text-caption mt-1">
            <span v-if="criticalCount > 0" class="kpi-value--error font-weight-medium">{{ criticalCount }}件 重要</span>
            <span v-else class="text-medium-emphasis">重要なし</span>
          </div>
        </v-card>
      </v-col>

      <v-col cols="12" sm="6" md="3">
        <v-card
          to="/shifts/board"
          rounded="xl"
          elevation="0"
          border
          class="pa-4 kpi-card"
        >
          <div class="d-flex align-center justify-space-between mb-2">
            <span class="text-caption text-medium-emphasis">シフト収集</span>
            <v-icon color="primary" size="20">mdi-calendar-import</v-icon>
          </div>
          <template v-if="activeCollection">
            <div class="text-h4 font-weight-bold kpi-value--primary">
              {{ activeCollection.submittedCount }}<span class="text-h6 font-weight-regular text-medium-emphasis">/{{ activeCollection.totalTargets }}名</span>
            </div>
            <v-progress-linear
              :model-value="(activeCollection.submittedCount / activeCollection.totalTargets) * 100"
              color="primary"
              rounded
              height="4"
              class="mt-2"
            />
          </template>
          <template v-else>
            <div class="text-h4 font-weight-bold text-medium-emphasis">—</div>
            <div class="text-caption text-medium-emphasis mt-1">収集中の申請なし</div>
          </template>
        </v-card>
      </v-col>
    </v-row>

    <!-- Action section: correction mini-list + alerts -->
    <v-row class="mb-4">
      <v-col cols="12" md="8">
        <v-card rounded="xl" elevation="0" border>
          <!-- Section header -->
          <div class="d-flex align-center justify-space-between px-4 py-3">
            <div class="d-flex align-center ga-2">
              <v-icon color="warning" size="20">mdi-pencil-clock</v-icon>
              <span class="text-subtitle-2 font-weight-bold">未処理の修正申請</span>
              <v-chip
                v-if="attStore.pendingCorrectionCount > 0"
                color="warning"
                size="x-small"
                variant="flat"
              >
                {{ attStore.pendingCorrectionCount }}
              </v-chip>
            </div>
            <v-btn
              to="/attendance/modifications"
              variant="text"
              size="small"
              color="primary"
              append-icon="mdi-arrow-right"
            >
              すべて見る
            </v-btn>
          </div>
          <v-divider />

          <!-- Empty state -->
          <div v-if="topPendingCorrections.length === 0" class="py-8 text-center">
            <v-icon color="success" size="36" class="mb-2">mdi-check-circle-outline</v-icon>
            <div class="text-body-2 text-medium-emphasis">未処理の申請はありません</div>
          </div>

          <!-- Correction mini-cards -->
          <div v-else class="pa-3 d-flex flex-column ga-2">
            <div
              v-for="cr in topPendingCorrections"
              :key="cr.id"
              class="cr-card"
            >
              <!-- Identity row -->
              <div class="d-flex align-center ga-2 mb-2">
                <v-avatar color="primary" size="26">
                  <span class="text-caption text-white font-weight-bold">{{ empName(cr.employeeId).charAt(0) }}</span>
                </v-avatar>
                <span class="text-body-2 font-weight-medium">{{ empName(cr.employeeId) }}</span>
                <v-chip :color="deptColor(empDept(cr.employeeId))" size="x-small" variant="tonal">
                  {{ empDept(cr.employeeId) }}
                </v-chip>
                <v-chip :color="cr.type === 'add_missing' ? 'teal' : 'blue'" size="x-small" variant="tonal">
                  {{ cr.type === 'add_missing' ? '漏れ追加' : '時刻修正' }}
                </v-chip>
                <span class="text-caption text-medium-emphasis ml-auto">{{ cr.workDate }}</span>
              </div>

              <!-- Time comparison -->
              <div class="d-flex align-center ga-2 cr-times">
                <div class="cr-time-block">
                  <span class="cr-label">修正前</span>
                  <span class="cr-range cr-range--before">
                    {{ cr.originalCheckIn ?? '—' }}<span class="cr-sep">→</span>{{ cr.originalCheckOut ?? '—' }}
                  </span>
                </div>
                <v-icon size="14" color="medium-emphasis">mdi-arrow-right</v-icon>
                <div class="cr-time-block">
                  <span class="cr-label cr-label--after">修正後</span>
                  <span class="cr-range cr-range--after">
                    {{ cr.requestedCheckIn }}<span class="cr-sep">→</span>{{ cr.requestedCheckOut }}
                  </span>
                </div>
                <v-chip
                  v-if="timeDelta(cr) !== 0"
                  :color="timeDelta(cr) > 0 ? 'success' : 'error'"
                  size="x-small"
                  variant="tonal"
                  class="ml-auto"
                >
                  {{ timeDelta(cr) > 0 ? '+' : '' }}{{ timeDelta(cr) }}分
                </v-chip>
              </div>

              <!-- Actions -->
              <div class="d-flex align-center justify-end ga-2 mt-2 pt-2 cr-footer">
                <v-btn
                  :to="`/attendance/${cr.employeeId}/${cr.workDate}`"
                  variant="text"
                  size="x-small"
                  color="default"
                  rounded="lg"
                >
                  詳細
                </v-btn>
                <v-btn
                  size="x-small"
                  color="success"
                  variant="tonal"
                  rounded="lg"
                  prepend-icon="mdi-check"
                  @click="attStore.approveCorrection(cr.id)"
                >
                  承認
                </v-btn>
              </div>
            </div>
          </div>
        </v-card>
      </v-col>

      <v-col cols="12" md="4">
        <AlertWidget />
      </v-col>
    </v-row>

  </div>
</template>

<script setup lang="ts">
import { useMockData } from '~/composables/useMockData'
import { useAttendanceStore } from '~/stores/attendance.store'

const { alerts, collections, getEmployee } = useMockData()
const attStore = useAttendanceStore()

// KPI derived values
const criticalCount = computed(() => alerts.filter(a => a.level === 'critical').length)
const activeCollection = computed(() => collections.find(c => c.status === 'COLLECTING'))

// Top 3 pending corrections (most recent first)
const topPendingCorrections = computed(() =>
  attStore.corrections
    .filter(c => c.status === 'pending')
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 3),
)

// Helpers
function empName(id: string) {
  return getEmployee(id)?.name ?? id
}

function empDept(id: string) {
  return getEmployee(id)?.department ?? ''
}

function deptColor(dept: string) {
  if (dept === 'キッチン') return 'orange'
  if (dept === 'ホール') return 'teal'
  if (dept === 'レジ') return 'purple'
  return 'default'
}

function toMins(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}

function timeDelta(cr: typeof attStore.corrections[0]): number {
  if (cr.type !== 'edit' || !cr.originalCheckIn || !cr.originalCheckOut) return 0
  const before = toMins(cr.originalCheckOut) - toMins(cr.originalCheckIn)
  const after = toMins(cr.requestedCheckOut) - toMins(cr.requestedCheckIn)
  return after - before
}
</script>

<style scoped>
/* KPI cards */
.kpi-card {
  cursor: pointer;
  transition: box-shadow 0.15s, transform 0.15s;
  text-decoration: none;
}

.kpi-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08) !important;
  transform: translateY(-1px);
}

.kpi-value--warning { color: #f59e0b; }
.kpi-value--primary { color: #3587dc; }
.kpi-value--error   { color: #e6273e; }

/* Correction mini-cards */
.cr-card {
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-left: 3px solid #f59e0b;
  border-radius: 10px;
  padding: 12px;
  background: #fffdf7;
}

.cr-times {
  flex-wrap: wrap;
}

.cr-time-block {
  display: flex;
  align-items: center;
  gap: 5px;
}

.cr-label {
  font-size: 0.7rem;
  color: #9ca3af;
  white-space: nowrap;
}

.cr-label--after {
  color: #374151;
}

.cr-range {
  font-size: 0.8rem;
  font-weight: 500;
}

.cr-range--before {
  color: #9ca3af;
  text-decoration: line-through;
}

.cr-range--after {
  color: #111827;
  font-weight: 700;
}

.cr-sep {
  margin: 0 2px;
  opacity: 0.5;
}

.cr-footer {
  border-top: 1px solid rgba(0, 0, 0, 0.06);
}
</style>
