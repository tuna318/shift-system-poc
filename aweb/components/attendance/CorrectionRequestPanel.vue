<template>
  <v-card variant="outlined" rounded="xl" class="cr-panel mb-3">
    <v-card-text class="pa-4">
      <!-- Header -->
      <div class="d-flex align-center justify-space-between mb-2">
        <div class="d-flex align-center ga-2">
          <v-chip size="x-small" :color="typeColor" variant="tonal" :prepend-icon="typeIcon">
            {{ typeLabel }}
          </v-chip>
          <span class="text-caption text-medium-emphasis">
            {{ formatDate(request.createdAt) }} 申請
          </span>
        </div>
        <v-chip size="small" :color="statusColor" variant="flat">
          {{ statusLabel }}
        </v-chip>
      </div>

      <!-- Time comparison -->
      <div class="time-compare mb-3">
        <template v-if="request.type === 'edit'">
          <div class="tc-row">
            <span class="tc-label">修正前</span>
            <span class="tc-times text-medium-emphasis">
              {{ request.originalCheckIn ?? '—' }} → {{ request.originalCheckOut ?? '未打刻' }}
            </span>
          </div>
          <v-icon size="14" color="medium-emphasis" class="my-1 ml-11">mdi-arrow-down</v-icon>
          <div class="tc-row">
            <span class="tc-label text-primary">申請後</span>
            <span class="tc-times font-weight-medium">
              {{ request.requestedCheckIn }} → {{ request.requestedCheckOut }}
            </span>
          </div>
        </template>
        <template v-else>
          <div class="tc-row">
            <span class="tc-label text-primary">追加申請</span>
            <span class="tc-times font-weight-medium">
              {{ request.requestedCheckIn }} → {{ request.requestedCheckOut }}
            </span>
          </div>
        </template>
      </div>

      <!-- Reason -->
      <div class="reason-block mb-3">
        <div class="text-caption text-medium-emphasis mb-1">従業員コメント</div>
        <div class="text-body-2 reason-text">{{ request.reason }}</div>
      </div>

      <!-- Manager note (if rejected) -->
      <div v-if="request.managerNote" class="manager-note mb-3">
        <div class="text-caption text-medium-emphasis mb-1">
          <v-icon size="12">mdi-account-tie-outline</v-icon> 管理者コメント
        </div>
        <div class="text-body-2">{{ request.managerNote }}</div>
      </div>

      <!-- Actions (pending only, non-readonly) -->
      <template v-if="!readonly && request.status === 'pending'">
        <!-- Reject note input -->
        <v-expand-transition>
          <div v-if="showRejectInput" class="reject-area mb-3">
            <v-textarea
              v-model="rejectNote"
              label="却下理由（従業員に通知されます）"
              variant="outlined"
              density="compact"
              rows="2"
              hide-details
              rounded="lg"
            />
          </div>
        </v-expand-transition>

        <div class="d-flex ga-2 justify-end">
          <template v-if="!showRejectInput">
            <v-btn
              variant="outlined"
              color="error"
              size="small"
              rounded="lg"
              @click="showRejectInput = true"
            >
              却下
            </v-btn>
            <v-btn
              color="success"
              size="small"
              rounded="lg"
              @click="$emit('approve', request.id)"
            >
              承認
            </v-btn>
          </template>
          <template v-else>
            <v-btn variant="text" size="small" @click="showRejectInput = false; rejectNote = ''">
              キャンセル
            </v-btn>
            <v-btn
              color="error"
              size="small"
              rounded="lg"
              :disabled="!rejectNote.trim()"
              @click="submitReject"
            >
              却下を確定
            </v-btn>
          </template>
        </div>
      </template>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import type { CorrectionRequest } from '~/types'

const props = defineProps<{
  request: CorrectionRequest
  readonly?: boolean
}>()

const emit = defineEmits<{
  approve: [id: string]
  reject: [id: string, note: string]
}>()

const showRejectInput = ref(false)
const rejectNote = ref('')

function submitReject() {
  if (!rejectNote.value.trim()) return
  emit('reject', props.request.id, rejectNote.value)
  showRejectInput.value = false
  rejectNote.value = ''
}

const typeLabel = computed(() => props.request.type === 'edit' ? '時刻修正' : 'セッション追加')
const typeIcon  = computed(() => props.request.type === 'edit' ? 'mdi-pencil-outline' : 'mdi-plus-circle-outline')
const typeColor = computed(() => props.request.type === 'edit' ? 'blue' : 'teal')

const statusLabel = computed(() => {
  switch (props.request.status) {
    case 'pending':  return '承認待ち'
    case 'approved': return '承認済み'
    case 'rejected': return '却下済み'
  }
})
const statusColor = computed(() => {
  switch (props.request.status) {
    case 'pending':  return 'warning'
    case 'approved': return 'success'
    case 'rejected': return 'error'
  }
})

function formatDate(iso: string): string {
  const d = new Date(iso)
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}
</script>

<style scoped>
.cr-panel { border-color: #e0e0e0; }

.time-compare { display: flex; flex-direction: column; background: #f5f5f5; border-radius: 8px; padding: 8px 12px; }
.tc-row { display: flex; align-items: center; gap: 8px; }
.tc-label { font-size: 11px; font-weight: 600; min-width: 42px; }
.tc-times { font-size: 13px; font-feature-settings: "tnum"; }

.reason-block { background: #fafafa; border-radius: 8px; padding: 8px 12px; }
.reason-text { line-height: 1.5; }

.manager-note { background: #fff3e0; border-radius: 8px; padding: 8px 12px; }

.reject-area { padding: 0; }
</style>
