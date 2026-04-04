<template>
  <v-card variant="outlined" rounded="xl" class="approval-panel" :class="{ 'approval-panel--approved': isApproved }">
    <v-card-text class="pa-4">
      <div class="text-subtitle-2 font-weight-bold mb-3 d-flex align-center justify-space-between">
        <div class="d-flex align-center ga-2">
          <v-icon size="16" color="primary">mdi-check-decagram-outline</v-icon>
          日次承認
        </div>
        <v-chip size="small" :color="statusColor" variant="flat">{{ statusLabel }}</v-chip>
      </div>

      <!-- Stats -->
      <div class="stats-grid mb-4">
        <div class="stat-item">
          <div class="stat-value">{{ formatMins(record.actualMinutes) }}</div>
          <div class="stat-label">実働時間</div>
        </div>
        <div class="stat-item" :class="{ 'stat-item--alert': record.overtimeMinutes > 0 }">
          <div class="stat-value">{{ record.overtimeMinutes > 0 ? '+' + formatMins(record.overtimeMinutes) : '—' }}</div>
          <div class="stat-label">残業</div>
        </div>
        <div class="stat-item" :class="{ 'stat-item--night': nightMins > 0 }">
          <div class="stat-value">{{ nightMins > 0 ? nightMins + '分' : '—' }}</div>
          <div class="stat-label">深夜帯</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">{{ sessionCount }}</div>
          <div class="stat-label">セッション</div>
        </div>
      </div>

      <!-- Approved info -->
      <div v-if="isApproved" class="approved-info mb-3">
        <v-icon size="14" color="success">mdi-check-circle</v-icon>
        <span class="text-caption text-success ml-1">
          {{ record.approvedAt ? formatApprovedAt(record.approvedAt) : '' }} 承認済み
        </span>
      </div>

      <!-- Compliance warnings -->
      <div v-if="flags.length > 0" class="compliance-flags mb-3">
        <v-alert
          v-for="f in flags"
          :key="f.key"
          :type="f.level === 'error' ? 'error' : 'warning'"
          density="compact"
          variant="tonal"
          :icon="f.icon"
          class="mb-1"
        >
          <span class="text-caption">{{ f.message }}</span>
        </v-alert>
      </div>

      <!-- Correction requested note -->
      <div v-if="record.status === 'CORRECTION_REQUESTED' && record.correctionComment" class="correction-note mb-3">
        <div class="text-caption text-medium-emphasis mb-1">差戻しコメント</div>
        <div class="text-body-2">{{ record.correctionComment }}</div>
      </div>

      <!-- Return note input -->
      <v-expand-transition>
        <div v-if="showReturnInput" class="mb-3">
          <v-textarea
            v-model="returnNote"
            label="差戻しコメント（従業員に通知されます）"
            variant="outlined"
            density="compact"
            rows="2"
            rounded="lg"
            hide-details
          />
        </div>
      </v-expand-transition>

      <!-- Actions -->
      <div v-if="!isApproved" class="d-flex ga-2">
        <template v-if="!showReturnInput">
          <v-btn
            variant="outlined"
            color="warning"
            rounded="lg"
            class="flex-1-1"
            @click="showReturnInput = true"
          >
            <v-icon start>mdi-undo</v-icon>差戻す
          </v-btn>
          <v-btn
            color="success"
            rounded="lg"
            class="flex-1-1"
            @click="handleApprove"
          >
            <v-icon start>mdi-check</v-icon>承認する
          </v-btn>
        </template>
        <template v-else>
          <v-btn variant="text" @click="showReturnInput = false; returnNote = ''">キャンセル</v-btn>
          <v-btn
            color="warning"
            rounded="lg"
            :disabled="!returnNote.trim()"
            @click="handleReturn"
          >
            差戻しを確定
          </v-btn>
        </template>
      </div>

      <!-- Revert approved -->
      <div v-else class="d-flex justify-end">
        <v-btn variant="text" size="small" color="medium-emphasis" @click="$emit('revert')">
          承認を取り消す
        </v-btn>
      </div>
    </v-card-text>

    <!-- Compliance confirm dialog -->
    <v-dialog v-model="showComplianceDialog" max-width="400">
      <v-card rounded="xl">
        <v-card-title class="text-subtitle-1 font-weight-bold pa-4 pb-2">
          コンプライアンス警告
        </v-card-title>
        <v-card-text class="pa-4 pt-0">
          <div class="mb-3 text-body-2">以下の警告があります。このまま承認しますか？</div>
          <v-alert
            v-for="f in flags"
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
          <v-btn variant="text" @click="showComplianceDialog = false">キャンセル</v-btn>
          <v-btn color="success" @click="confirmApprove">承認する</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-card>
</template>

<script setup lang="ts">
import type { AttendanceRecord, ComplianceFlag } from '~/types'
import { computeNightMins, getComplianceFlags } from '~/composables/useMockData'

const props = defineProps<{
  record: AttendanceRecord
}>()

const emit = defineEmits<{
  approve: []
  return: [note: string]
  revert: []
}>()

const showReturnInput = ref(false)
const returnNote = ref('')
const showComplianceDialog = ref(false)

const flags = computed<ComplianceFlag[]>(() => getComplianceFlags(props.record))
const isApproved = computed(() => props.record.status === 'APPROVED')

const nightMins = computed(() =>
  props.record.sessions?.reduce((sum, s) => sum + (s.nightMinutes ?? computeNightMins(s.checkIn, s.checkOut)), 0)
  ?? computeNightMins(props.record.checkIn, props.record.checkOut),
)

const sessionCount = computed(() => props.record.sessions?.length ?? 1)

const statusLabel = computed(() => {
  switch (props.record.status) {
    case 'APPROVED': return '承認済み'
    case 'PENDING_APPROVAL': return '承認待ち'
    case 'CORRECTION_REQUESTED': return '差戻し中'
    default: return '未提出'
  }
})
const statusColor = computed(() => {
  switch (props.record.status) {
    case 'APPROVED': return 'success'
    case 'PENDING_APPROVAL': return 'primary'
    case 'CORRECTION_REQUESTED': return 'warning'
    default: return 'default'
  }
})

function handleApprove() {
  if (flags.value.length > 0) {
    showComplianceDialog.value = true
  } else {
    emit('approve')
  }
}

function confirmApprove() {
  showComplianceDialog.value = false
  emit('approve')
}

function handleReturn() {
  if (!returnNote.value.trim()) return
  emit('return', returnNote.value)
  showReturnInput.value = false
  returnNote.value = ''
}

function formatMins(m: number): string {
  const h = Math.floor(m / 60)
  const min = m % 60
  return `${h}h${String(min).padStart(2, '0')}m`
}

function formatApprovedAt(iso: string): string {
  const d = new Date(iso)
  return `${d.getMonth() + 1}/${d.getDate()}`
}
</script>

<style scoped>
.approval-panel { border-color: #e0e0e0; }
.approval-panel--approved { border-color: #a5d6a7; background: #f9fff9; }

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  background: #f5f5f5;
  border-radius: 8px;
  padding: 10px;
}
.stat-item { display: flex; flex-direction: column; align-items: center; }
.stat-value { font-size: 14px; font-weight: 700; font-feature-settings: "tnum"; }
.stat-label { font-size: 10px; color: #9e9e9e; margin-top: 2px; }
.stat-item--alert .stat-value { color: #e53935; }
.stat-item--night .stat-value { color: #7e57c2; }

.correction-note { background: #fff3e0; border-radius: 8px; padding: 8px 12px; }
.approved-info { display: flex; align-items: center; }
</style>
