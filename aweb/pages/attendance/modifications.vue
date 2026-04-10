<template>
  <div>
    <!-- ── Header ─────────────────────────────────────────────── -->
    <div class="d-flex align-center justify-space-between mb-4 flex-wrap gap-2">
      <div>
        <h1 class="text-h5 font-weight-bold">修正申請</h1>
        <p class="text-body-2 text-medium-emphasis mt-1">従業員からの打刻修正・追加申請を管理します</p>
      </div>
      <v-chip v-if="pendingCount > 0" color="warning" variant="flat" size="small">
        <v-icon start size="13">mdi-clock-alert-outline</v-icon>
        未処理 {{ pendingCount }}件
      </v-chip>
    </div>

    <!-- ── Filter bar ──────────────────────────────────────────── -->
    <div class="filter-bar mb-4">
      <!-- Status tabs -->
      <v-btn-toggle v-model="statusFilter" mandatory density="compact" rounded="lg" color="primary" class="flex-shrink-0">
        <v-btn value="pending" size="small">
          未処理
          <span v-if="pendingCount > 0" class="count-badge count-badge--warning ml-1">{{ pendingCount }}</span>
        </v-btn>
        <v-btn value="approved" size="small">承認済み</v-btn>
        <v-btn value="rejected" size="small">却下済み</v-btn>
        <v-btn value="all" size="small">すべて</v-btn>
      </v-btn-toggle>

      <div class="filter-right">
        <!-- Type -->
        <v-btn-toggle v-model="typeFilter" mandatory density="compact" rounded="lg" class="flex-shrink-0">
          <v-btn value="all" size="small">全種別</v-btn>
          <v-btn value="edit" size="small">時刻修正</v-btn>
          <v-btn value="add_missing" size="small">追加</v-btn>
        </v-btn-toggle>
        <!-- Dept -->
        <v-chip-group v-model="deptFilter" mandatory class="flex-shrink-0">
          <v-chip v-for="d in depts" :key="d.value" :value="d.value" size="small" rounded="lg" filter variant="tonal">
            {{ d.label }}
          </v-chip>
        </v-chip-group>
      </div>
    </div>

    <!-- ── Empty state ─────────────────────────────────────────── -->
    <template v-if="filteredRequests.length === 0">
      <div class="empty-state">
        <v-icon size="44" color="success">mdi-check-circle-outline</v-icon>
        <div class="text-subtitle-1 font-weight-medium mt-2">
          {{ statusFilter === 'pending' ? '未処理の申請はありません' : '該当する申請はありません' }}
        </div>
        <div class="text-body-2 text-medium-emphasis mt-1">
          {{ statusFilter === 'pending' ? 'すべての申請が処理済みです' : 'フィルター条件を変更してください' }}
        </div>
      </div>
    </template>

    <!-- ── Request list ────────────────────────────────────────── -->
    <div class="req-list">
      <div
        v-for="req in filteredRequests"
        :key="req.id"
        class="req-card"
        :class="{
          'req-card--pending': req.status === 'pending',
          'req-card--approved': req.status === 'approved',
          'req-card--rejected': req.status === 'rejected',
        }"
      >
        <!-- ── Identity row ──────────────────────────────────── -->
        <div class="req-identity">
          <v-avatar size="32" color="primary" variant="tonal" rounded="lg" class="flex-shrink-0">
            <span class="text-caption font-weight-bold">{{ emp(req.employeeId)?.name[0] }}</span>
          </v-avatar>
          <div class="req-who">
            <span class="req-name">{{ emp(req.employeeId)?.name }}</span>
            <v-chip size="x-small" color="surface-variant" variant="flat">{{ emp(req.employeeId)?.department }}</v-chip>
            <v-chip
              size="x-small"
              :color="req.type === 'edit' ? 'blue' : 'teal'"
              variant="tonal"
            >{{ req.type === 'edit' ? '時刻修正' : 'セッション追加' }}</v-chip>
          </div>
          <div class="req-meta">
            <span class="req-date">{{ fmtWorkDate(req.workDate) }}</span>
            <span class="req-submitted">申請 {{ fmtDateTime(req.createdAt) }}</span>
          </div>
          <v-chip size="x-small" :color="statusColor(req.status)" variant="flat" class="flex-shrink-0">
            {{ statusLabel(req.status) }}
          </v-chip>
        </div>

        <!-- ── Time comparison ───────────────────────────────── -->
        <div class="req-times">
          <template v-if="req.type === 'edit'">
            <div class="rt-row rt-row--before">
              <span class="rt-lbl">修正前</span>
              <span class="rt-range rt-range--before">{{ req.originalCheckIn ?? '—' }}<span class="rt-sep">→</span>{{ req.originalCheckOut ?? '未打刻' }}</span>
              <span class="rt-dur rt-dur--before">{{ durLabel(req.originalCheckIn, req.originalCheckOut) }}</span>
            </div>
            <div class="rt-divider">
              <v-icon size="12" color="medium-emphasis">mdi-arrow-down-thin</v-icon>
            </div>
            <div class="rt-row rt-row--after">
              <span class="rt-lbl rt-lbl--after">修正後</span>
              <span class="rt-range rt-range--after">{{ req.requestedCheckIn }}<span class="rt-sep">→</span>{{ req.requestedCheckOut }}</span>
              <span class="rt-dur">{{ durLabel(req.requestedCheckIn, req.requestedCheckOut) }}</span>
              <span v-if="timeDelta(req) !== 0" class="rt-delta" :class="timeDelta(req) > 0 ? 'rt-delta--plus' : 'rt-delta--minus'">
                {{ timeDelta(req) > 0 ? '+' : '' }}{{ timeDelta(req) }}分
              </span>
            </div>
          </template>
          <template v-else>
            <div class="rt-row rt-row--after">
              <span class="rt-lbl rt-lbl--add">追加</span>
              <span class="rt-range rt-range--add">{{ req.requestedCheckIn }}<span class="rt-sep">→</span>{{ req.requestedCheckOut }}</span>
              <span class="rt-dur">{{ durLabel(req.requestedCheckIn, req.requestedCheckOut) }}</span>
            </div>
          </template>
        </div>

        <!-- ── Footer: expand toggle + shift ref + actions ──── -->
        <div class="req-footer">
          <button class="expand-btn" @click="toggleExpand(req.id)">
            <v-icon size="12" :class="{ 'expand-icon--open': expanded.has(req.id) }">mdi-chevron-right</v-icon>
            {{ expanded.has(req.id) ? '閉じる' : '申請理由・シフト参照' }}
          </button>

          <div class="req-actions">
            <template v-if="req.status === 'pending'">
              <v-btn
                v-if="rejectingId !== req.id"
                size="x-small" variant="outlined" color="error" rounded="lg"
                @click="startReject(req.id)"
              >却下</v-btn>
              <v-btn
                v-if="rejectingId !== req.id"
                size="x-small" color="success" rounded="lg"
                @click="attStore.approveCorrection(req.id)"
              >承認</v-btn>
              <v-btn
                v-if="rejectingId === req.id"
                size="x-small" variant="text"
                @click="cancelReject"
              >キャンセル</v-btn>
            </template>
            <v-btn
              size="x-small" variant="text" color="medium-emphasis"
              :to="`/attendance/${req.employeeId}/${req.workDate}`"
            >
              <v-icon start size="11">mdi-open-in-new</v-icon>詳細
            </v-btn>
          </div>
        </div>

        <!-- ── Expandable body ───────────────────────────────── -->
        <v-expand-transition>
          <div v-if="expanded.has(req.id)" class="req-body">
            <!-- Reason -->
            <div class="rb-section">
              <div class="rb-label">
                <v-icon size="11">mdi-comment-text-outline</v-icon> 従業員コメント
              </div>
              <div class="rb-text">{{ req.reason }}</div>
            </div>

            <!-- Shift reference -->
            <div class="rb-section">
              <div class="rb-label">
                <v-icon size="11">mdi-calendar-clock-outline</v-icon> この日のシフト
              </div>
              <template v-if="shift(req.employeeId, req.workDate)">
                <div class="rb-shift">
                  <span class="rb-shift-time">{{ shift(req.employeeId, req.workDate)!.startTime }}–{{ shift(req.employeeId, req.workDate)!.endTime }}</span>
                  <v-chip size="x-small" color="primary" variant="tonal">{{ shift(req.employeeId, req.workDate)!.department }}</v-chip>
                </div>
              </template>
              <span v-else class="rb-none">シフト登録なし</span>
            </div>

            <!-- Manager note (approved/rejected) -->
            <div v-if="req.managerNote" class="rb-section rb-section--mgr">
              <div class="rb-label">
                <v-icon size="11">mdi-account-tie-outline</v-icon> 管理者コメント
              </div>
              <div class="rb-text">{{ req.managerNote }}</div>
            </div>

            <!-- Reject form -->
            <div v-if="rejectingId === req.id" class="rb-reject">
              <v-textarea
                v-model="rejectNote"
                label="却下理由（従業員に通知されます）"
                variant="outlined" density="compact" rows="2"
                hide-details rounded="lg" auto-grow
              />
              <div class="d-flex ga-2 justify-end mt-2">
                <v-btn size="small" variant="text" @click="cancelReject">キャンセル</v-btn>
                <v-btn size="small" color="error" rounded="lg" :disabled="!rejectNote.trim()" @click="submitReject(req.id)">
                  却下を確定
                </v-btn>
              </div>
            </div>
          </div>
        </v-expand-transition>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { CorrectionRequestStatus } from '~/types'
import { useAttendanceStore } from '~/stores/attendance.store'
import { useMockData } from '~/composables/useMockData'

const attStore = useAttendanceStore()
const { employees, getEmpShiftsForDate } = useMockData()

// ── Filters ───────────────────────────────────────────────────
const statusFilter = ref<'pending' | 'approved' | 'rejected' | 'all'>('pending')
const typeFilter   = ref<'all' | 'edit' | 'add_missing'>('all')
const deptFilter   = ref('ALL')

const depts = [
  { value: 'ALL',    label: '全部署' },
  { value: 'キッチン', label: 'キッチン' },
  { value: 'ホール',  label: 'ホール' },
  { value: 'レジ',   label: 'レジ' },
]

const pendingCount = computed(() => attStore.corrections.filter(c => c.status === 'pending').length)

const filteredRequests = computed(() =>
  attStore.corrections
    .filter((r) => {
      if (statusFilter.value !== 'all' && r.status !== statusFilter.value) return false
      if (typeFilter.value !== 'all' && r.type !== typeFilter.value) return false
      if (deptFilter.value !== 'ALL' && emp(r.employeeId)?.department !== deptFilter.value) return false
      return true
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
)

// ── Expand state ──────────────────────────────────────────────
const expanded = ref(new Set<string>())
function toggleExpand(id: string) {
  const s = new Set(expanded.value)
  s.has(id) ? s.delete(id) : s.add(id)
  expanded.value = s
}

// ── Reject state ──────────────────────────────────────────────
const rejectingId = ref<string | null>(null)
const rejectNote  = ref('')

function startReject(id: string) {
  rejectingId.value = id
  rejectNote.value  = ''
  // auto-expand so reject form is visible
  const s = new Set(expanded.value)
  s.add(id)
  expanded.value = s
}
function cancelReject() {
  rejectingId.value = null
  rejectNote.value  = ''
}
function submitReject(id: string) {
  if (!rejectNote.value.trim()) return
  attStore.rejectCorrection(id, rejectNote.value)
  rejectingId.value = null
  rejectNote.value  = ''
}

// ── Helpers ───────────────────────────────────────────────────
function emp(id: string) { return employees.find(e => e.id === id) }
function shift(empId: string, date: string) { return getEmpShiftsForDate(empId, date)[0] ?? null }

function toMins(t?: string): number {
  if (!t) return 0
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}
function fmtMins(m: number): string {
  const h   = Math.floor(m / 60)
  const min = m % 60
  return min > 0 ? `${h}h${String(min).padStart(2, '0')}` : `${h}h`
}
function durLabel(ci?: string, co?: string): string {
  if (!ci || !co) return '—'
  const d = toMins(co) - toMins(ci)
  return d > 0 ? fmtMins(d) : '—'
}
function timeDelta(req: typeof attStore.corrections[0]): number {
  if (req.type !== 'edit' || !req.originalCheckIn || !req.originalCheckOut) return 0
  const before = toMins(req.originalCheckOut) - toMins(req.originalCheckIn)
  const after  = toMins(req.requestedCheckOut) - toMins(req.requestedCheckIn)
  return after - before
}

function statusLabel(s: CorrectionRequestStatus): string {
  if (s === 'pending')  return '承認待ち'
  if (s === 'approved') return '承認済み'
  return '却下済み'
}
function statusColor(s: CorrectionRequestStatus): string {
  if (s === 'pending')  return 'warning'
  if (s === 'approved') return 'success'
  return 'error'
}

function fmtWorkDate(d: string): string {
  const dt  = new Date(d)
  const dow = ['日', '月', '火', '水', '木', '金', '土'][dt.getDay()]
  return `${dt.getMonth() + 1}月${dt.getDate()}日（${dow}）`
}
function fmtDateTime(iso: string): string {
  const d = new Date(iso)
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}
</script>

<style scoped>
/* ── Filter bar ───────────────────────────── */
.filter-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}
.filter-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.count-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 18px;
  border-radius: 9px;
  font-size: 10px;
  font-weight: 700;
  padding: 0 4px;
}
.count-badge--warning { background: #fef3c7; color: #92400e; }

/* ── Empty state ──────────────────────────── */
.empty-state {
  text-align: center;
  padding: 56px 16px;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  background: #fff;
}

/* ── Request list ─────────────────────────── */
.req-list { display: flex; flex-direction: column; gap: 8px; }

.req-card {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-left: 3px solid #e5e7eb;
  border-radius: 12px;
  overflow: hidden;
  transition: box-shadow 0.12s;
}
.req-card:hover { box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
.req-card--pending  { border-left-color: #f59e0b; }
.req-card--approved { border-left-color: #22c55e; }
.req-card--rejected { border-left-color: #ef4444; opacity: 0.8; }

/* ── Identity row ─────────────────────────── */
.req-identity {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px 8px;
  flex-wrap: wrap;
}
.req-who {
  display: flex;
  align-items: center;
  gap: 5px;
  flex-wrap: wrap;
  flex: 1;
}
.req-name {
  font-size: 13px;
  font-weight: 700;
  color: #111827;
  white-space: nowrap;
}
.req-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 1px;
  flex-shrink: 0;
}
.req-date {
  font-size: 12px;
  font-weight: 600;
  color: #374151;
}
.req-submitted {
  font-size: 10px;
  color: #9ca3af;
}

/* ── Time comparison ──────────────────────── */
.req-times {
  padding: 6px 14px 8px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.rt-row {
  display: flex;
  align-items: center;
  gap: 8px;
  line-height: 1;
}
.rt-lbl {
  font-size: 10px;
  font-weight: 700;
  min-width: 36px;
  color: #9ca3af;
}
.rt-lbl--after { color: #15803d; }
.rt-lbl--add   { color: #0d9488; }

.rt-range {
  font-size: 14px;
  font-weight: 600;
  font-feature-settings: "tnum";
  letter-spacing: -0.2px;
}
.rt-range--before { color: #9ca3af; text-decoration: line-through; }
.rt-range--after  { color: #111827; }
.rt-range--add    { color: #0d9488; }

.rt-sep { margin: 0 3px; font-weight: 400; color: #9ca3af; }

.rt-dur { font-size: 11px; color: #9ca3af; font-feature-settings: "tnum"; }
.rt-dur--before { text-decoration: line-through; }

.rt-delta {
  font-size: 11px;
  font-weight: 700;
  border-radius: 4px;
  padding: 1px 5px;
}
.rt-delta--plus  { background: #dcfce7; color: #15803d; }
.rt-delta--minus { background: #fee2e2; color: #dc2626; }

.rt-divider {
  padding-left: 44px;
  line-height: 1;
  opacity: 0.4;
}

/* ── Footer ───────────────────────────────── */
.req-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 14px 10px;
  border-top: 1px solid #f9fafb;
}
.expand-btn {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 11px;
  color: #9ca3af;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  transition: color 0.1s;
}
.expand-btn:hover { color: #374151; }
.expand-icon--open { transform: rotate(90deg); }
.req-actions { display: flex; align-items: center; gap: 6px; }

/* ── Expandable body ──────────────────────── */
.req-body {
  border-top: 1px solid #f1f5f9;
  padding: 10px 14px 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  background: #fafafa;
}
.rb-section { display: flex; flex-direction: column; gap: 3px; }
.rb-section--mgr { background: #fff7ed; border-radius: 6px; padding: 6px 8px; }
.rb-label {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 10px;
  font-weight: 700;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.rb-text { font-size: 12px; color: #374151; line-height: 1.5; }
.rb-shift {
  display: flex;
  align-items: center;
  gap: 6px;
}
.rb-shift-time {
  font-size: 13px;
  font-weight: 600;
  font-feature-settings: "tnum";
  color: #1f2937;
}
.rb-none { font-size: 12px; color: #9ca3af; }
.rb-reject { margin-top: 4px; }
</style>
