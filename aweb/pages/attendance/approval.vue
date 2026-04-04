<template>
  <div>
    <!-- ── Header ──────────────────────────────────────────── -->
    <div class="d-flex align-center justify-space-between mb-5">
      <div>
        <h1 class="text-h5 font-weight-bold">勤怠承認</h1>
        <p class="text-body-2 text-medium-emphasis mt-1">
          従業員から申請された勤怠を確認・承認してください
        </p>
      </div>
      <div class="d-flex ga-2">
        <v-btn
          v-if="selectedIds.size > 0"
          color="success"
          rounded="lg"
          :prepend-icon="'mdi-check-all'"
          @click="bulkApprove"
        >
          選択した{{ selectedIds.size }}件を一括承認
        </v-btn>
        <v-btn
          v-else-if="visibleRecords.length > 0"
          variant="tonal"
          color="success"
          rounded="lg"
          :prepend-icon="'mdi-check-all'"
          @click="bulkApproveAll"
        >
          表示中 {{ visibleRecords.length }}件を一括承認
        </v-btn>
      </div>
    </div>

    <!-- ── Filters ─────────────────────────────────────────── -->
    <v-card rounded="xl" elevation="0" border class="mb-4">
      <v-card-text class="pa-4">
        <div class="d-flex flex-wrap align-center ga-3">
          <v-chip-group v-model="deptFilter" mandatory>
            <v-chip value="ALL" size="small" rounded="lg" filter>全部署</v-chip>
            <v-chip value="キッチン" size="small" rounded="lg" filter>キッチン</v-chip>
            <v-chip value="ホール" size="small" rounded="lg" filter>ホール</v-chip>
            <v-chip value="レジ" size="small" rounded="lg" filter>レジ</v-chip>
          </v-chip-group>
          <v-spacer />
          <div class="text-body-2 text-medium-emphasis">
            <v-icon size="16" color="primary">mdi-clock-outline</v-icon>
            承認待ち <strong class="text-primary">{{ visibleRecords.length }}</strong> 件
          </div>
        </div>
      </v-card-text>
    </v-card>

    <!-- ── Empty state ─────────────────────────────────────── -->
    <template v-if="visibleRecords.length === 0">
      <v-card rounded="xl" elevation="0" border class="text-center py-12">
        <v-icon size="56" color="success">mdi-check-circle-outline</v-icon>
        <div class="text-h6 mt-3">承認待ちはありません</div>
        <div class="text-body-2 text-medium-emphasis mt-1">すべての勤怠申請が処理済みです</div>
        <v-btn to="/attendance" variant="tonal" rounded="lg" class="mt-4">一覧に戻る</v-btn>
      </v-card>
    </template>

    <!-- ── Record list ─────────────────────────────────────── -->
    <div class="d-flex flex-column ga-3">
      <v-card
        v-for="rec in visibleRecords"
        :key="rec.id"
        rounded="xl"
        elevation="0"
        border
        :class="{ 'card--selected': selectedIds.has(rec.id) }"
      >
        <v-card-text class="pa-4">
          <!-- Row header -->
          <div class="d-flex align-center ga-3 mb-3">
            <v-checkbox
              :model-value="selectedIds.has(rec.id)"
              hide-details
              density="compact"
              @update:model-value="toggleSelect(rec.id)"
            />
            <v-avatar size="36" color="primary" variant="tonal" rounded="lg">
              <span class="text-body-2 font-weight-bold">{{ getEmp(rec.employeeId)?.name[0] }}</span>
            </v-avatar>
            <div class="flex-1-1">
              <div class="d-flex align-center ga-2 flex-wrap">
                <span class="text-subtitle-2 font-weight-bold">{{ getEmp(rec.employeeId)?.name }}</span>
                <v-chip size="x-small" color="surface-variant" variant="flat">
                  {{ getEmp(rec.employeeId)?.department }}
                </v-chip>
                <span class="text-body-2 text-medium-emphasis">{{ formatDate(rec.workDate) }}</span>
              </div>
              <div class="d-flex align-center ga-2 mt-1 flex-wrap">
                <v-chip v-if="shift(rec)" size="x-small" color="primary" variant="tonal" prepend-icon="mdi-calendar">
                  シフト {{ shift(rec)?.startTime }}–{{ shift(rec)?.endTime }} {{ shift(rec)?.department }}
                </v-chip>
                <span class="text-caption text-medium-emphasis">
                  申請 {{ formatDateTime(rec.submittedAt) }}
                </span>
              </div>
            </div>
            <!-- Quick stats -->
            <div class="d-flex ga-4 text-center flex-shrink-0">
              <div>
                <div class="text-subtitle-2 font-weight-bold">{{ formatMins(rec.actualMinutes) }}</div>
                <div class="text-caption text-medium-emphasis">実働</div>
              </div>
              <div v-if="rec.overtimeMinutes > 0" class="text-error">
                <div class="text-subtitle-2 font-weight-bold">+{{ formatMins(rec.overtimeMinutes) }}</div>
                <div class="text-caption">残業</div>
              </div>
              <div>
                <div class="text-subtitle-2 font-weight-bold">{{ sessions(rec).length }}</div>
                <div class="text-caption text-medium-emphasis">セッション</div>
              </div>
            </div>
          </div>

          <!-- Sessions (expandable) -->
          <v-expansion-panels v-model="expandedPanels[rec.id]" variant="accordion" flat class="mb-3">
            <v-expansion-panel class="sessions-panel">
              <v-expansion-panel-title class="text-caption text-medium-emphasis">
                セッション詳細を見る
              </v-expansion-panel-title>
              <v-expansion-panel-text>
                <SessionCard
                  v-for="(sess, i) in sessions(rec)"
                  :key="sess.id ?? i"
                  :session="sess"
                  :idx="i"
                  :flags="sessionFlags(sess)"
                />
              </v-expansion-panel-text>
            </v-expansion-panel>
          </v-expansion-panels>

          <!-- Compliance flags -->
          <div v-if="complianceFlags(rec).length > 0" class="d-flex flex-wrap ga-1 mb-3">
            <v-chip
              v-for="f in complianceFlags(rec)"
              :key="f.key"
              size="x-small"
              :color="f.level === 'error' ? 'error' : 'warning'"
              variant="tonal"
              :prepend-icon="f.icon"
            >
              {{ f.message }}
            </v-chip>
          </div>

          <!-- Pending corrections notice -->
          <v-alert
            v-if="pendingCorrections(rec).length > 0"
            type="warning"
            density="compact"
            variant="tonal"
            class="mb-3"
          >
            <span class="text-caption">
              修正申請 {{ pendingCorrections(rec).length }}件 が未処理です。
              <router-link :to="`/attendance/${rec.employeeId}/${rec.workDate}`" class="text-warning font-weight-bold">
                詳細ページで確認する →
              </router-link>
            </span>
          </v-alert>

          <!-- Actions -->
          <div class="d-flex align-center ga-2 justify-end">
            <v-btn
              variant="text"
              size="small"
              :to="`/attendance/${rec.employeeId}/${rec.workDate}`"
            >
              詳細を見る
            </v-btn>

            <v-expand-transition>
              <div v-if="returningId === rec.id" class="d-flex align-center ga-2" style="width:100%">
                <v-textarea
                  v-model="returnNote"
                  label="差戻しコメント"
                  variant="outlined"
                  density="compact"
                  rows="1"
                  hide-details
                  rounded="lg"
                  auto-grow
                  class="flex-1-1"
                />
                <v-btn variant="text" size="small" @click="returningId = null; returnNote = ''">キャンセル</v-btn>
                <v-btn
                  color="warning"
                  size="small"
                  rounded="lg"
                  :disabled="!returnNote.trim()"
                  @click="submitReturn(rec.id)"
                >
                  差戻し確定
                </v-btn>
              </div>
              <div v-else class="d-flex ga-2">
                <v-btn
                  variant="outlined"
                  color="warning"
                  size="small"
                  rounded="lg"
                  @click="returningId = rec.id"
                >
                  <v-icon start size="14">mdi-undo</v-icon>差戻す
                </v-btn>
                <v-btn
                  color="success"
                  size="small"
                  rounded="lg"
                  @click="approve(rec.id, complianceFlags(rec).length > 0)"
                >
                  <v-icon start size="14">mdi-check</v-icon>承認する
                </v-btn>
              </div>
            </v-expand-transition>
          </div>
        </v-card-text>
      </v-card>
    </div>

    <!-- Compliance confirm dialog -->
    <v-dialog v-model="complianceDialog.open" max-width="400">
      <v-card rounded="xl">
        <v-card-title class="text-subtitle-1 font-weight-bold pa-4 pb-2">コンプライアンス警告</v-card-title>
        <v-card-text class="pa-4 pt-0">
          <p class="text-body-2 mb-3">以下の警告があります。このまま承認しますか？</p>
          <v-alert
            v-for="f in complianceDialog.flags"
            :key="f.key"
            :type="f.level === 'error' ? 'error' : 'warning'"
            density="compact"
            variant="tonal"
            :icon="f.icon"
            class="mb-2"
          >
            <span class="text-caption">{{ f.message }}</span>
          </v-alert>
        </v-card-text>
        <v-card-actions class="pa-4 pt-0 ga-2">
          <v-spacer />
          <v-btn variant="text" @click="complianceDialog.open = false">キャンセル</v-btn>
          <v-btn color="success" @click="confirmApprove">承認する</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import type { AttendanceRecord, WorkSession, ComplianceFlag } from '~/types'
import { useAttendanceStore } from '~/stores/attendance.store'
import { useMockData, getComplianceFlags, computeNightMins } from '~/composables/useMockData'

const attStore = useAttendanceStore()
const { employees, getEmpShiftsForDate } = useMockData()

const deptFilter = ref('ALL')
const selectedIds = ref(new Set<string>())
const expandedPanels = ref<Record<string, number | undefined>>({})
const returningId = ref<string | null>(null)
const returnNote = ref('')
const complianceDialog = ref<{ open: boolean; recordId: string; flags: ComplianceFlag[] }>({
  open: false, recordId: '', flags: [],
})

const visibleRecords = computed(() => {
  return attStore.pendingApprovalRecords.filter((rec) => {
    if (deptFilter.value === 'ALL') return true
    return getEmp(rec.employeeId)?.department === deptFilter.value
  })
})

function getEmp(empId: string) { return employees.find(e => e.id === empId) }

function shift(rec: AttendanceRecord) {
  const entries = getEmpShiftsForDate(rec.employeeId, rec.workDate)
  return entries[0] ?? null
}

function sessions(rec: AttendanceRecord): WorkSession[] {
  if (rec.sessions?.length) return rec.sessions
  return [{
    id: rec.id,
    sessionIdx: 0,
    checkIn: rec.checkIn,
    checkOut: rec.checkOut,
    breakMinutes: rec.breakMinutes,
    actualMinutes: rec.actualMinutes,
    department: getEmp(rec.employeeId)?.department,
    punchVariant: 'NORMAL',
    nightMinutes: computeNightMins(rec.checkIn, rec.checkOut),
  }]
}

function complianceFlags(rec: AttendanceRecord): ComplianceFlag[] {
  return getComplianceFlags(rec)
}

function sessionFlags(sess: WorkSession): ComplianceFlag[] {
  const flags: ComplianceFlag[] = []
  if (sess.actualMinutes >= 360 && sess.breakMinutes === 0) {
    flags.push({ key: 'no_break', level: 'error', icon: 'mdi-coffee-off-outline', message: '6時間以上休憩なし' })
  }
  if ((sess.nightMinutes ?? 0) > 0) {
    flags.push({ key: 'night', level: 'info', icon: 'mdi-moon-waning-crescent', message: `深夜 ${sess.nightMinutes}分` })
  }
  return flags
}

function pendingCorrections(rec: AttendanceRecord) {
  return attStore.corrections.filter(c => c.employeeId === rec.employeeId && c.workDate === rec.workDate && c.status === 'pending')
}

function toggleSelect(id: string) {
  const s = new Set(selectedIds.value)
  s.has(id) ? s.delete(id) : s.add(id)
  selectedIds.value = s
}

function approve(recordId: string, hasFlags: boolean) {
  if (hasFlags) {
    const rec = visibleRecords.value.find(r => r.id === recordId)
    complianceDialog.value = { open: true, recordId, flags: rec ? getComplianceFlags(rec) : [] }
  } else {
    attStore.approveDay(recordId)
  }
}

function confirmApprove() {
  attStore.approveDay(complianceDialog.value.recordId)
  complianceDialog.value.open = false
}

function submitReturn(recordId: string) {
  attStore.returnDay(recordId, returnNote.value)
  returningId.value = null
  returnNote.value = ''
}

function bulkApprove() {
  for (const id of selectedIds.value) {
    attStore.approveDay(id)
  }
  selectedIds.value = new Set()
}

function bulkApproveAll() {
  for (const rec of visibleRecords.value) {
    attStore.approveDay(rec.id)
  }
}

function formatMins(m: number): string {
  const h = Math.floor(m / 60)
  const min = m % 60
  return `${h}h${String(min).padStart(2, '0')}m`
}

function formatDate(d: string): string {
  const dt = new Date(d)
  const dow = ['日', '月', '火', '水', '木', '金', '土'][dt.getDay()]
  return `${dt.getMonth() + 1}月${dt.getDate()}日（${dow}）`
}

function formatDateTime(iso?: string): string {
  if (!iso) return '—'
  const d = new Date(iso)
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}
</script>

<style scoped>
.card--selected { border-color: #1976d2 !important; background: #f8fbff; }
.sessions-panel { background: transparent !important; }
.sessions-panel:deep(.v-expansion-panel-title) {
  font-size: 12px;
  min-height: 36px;
  padding: 0;
}
</style>
