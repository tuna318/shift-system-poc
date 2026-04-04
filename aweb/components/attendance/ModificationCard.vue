<template>
  <v-card rounded="xl" elevation="0" border class="mb-3">
    <v-card-text class="pa-4">
      <div class="d-flex align-start justify-space-between mb-2">
        <div class="d-flex align-center ga-2">
          <v-avatar color="warning" size="32">
            <span class="text-white text-caption font-weight-bold">
              {{ modification.employeeName.charAt(0) }}
            </span>
          </v-avatar>
          <div>
            <div class="text-body-2 font-weight-medium">{{ modification.employeeName }}</div>
            <div class="text-caption text-medium-emphasis">{{ modification.workDate }}</div>
          </div>
        </div>
        <div class="d-flex align-center ga-2">
          <v-chip
            :color="modification.type === 'add_missing' ? 'purple' : 'primary'"
            size="x-small"
            variant="tonal"
          >
            {{ modification.type === 'add_missing' ? 'セッション追加' : '打刻修正' }}
          </v-chip>
          <v-chip color="warning" size="small" variant="flat">修正申請中</v-chip>
        </div>
      </div>

      <!-- edit: show before/after comparison -->
      <div v-if="modification.type === 'edit'" class="d-flex ga-2 mt-2">
        <div class="flex-1-1 pa-2 rounded-lg" style="background: #F3F4F6">
          <div class="text-caption text-medium-emphasis mb-1">現在の記録</div>
          <div class="text-caption">
            出勤: {{ modification.originalCheckIn ?? '—' }}<br>
            退勤: {{ modification.originalCheckOut ?? '未打刻' }}
          </div>
        </div>
        <v-icon size="16" color="medium-emphasis" class="align-self-center">mdi-arrow-right</v-icon>
        <div class="flex-1-1 pa-2 rounded-lg" style="background: #EBF3FC">
          <div class="text-caption text-primary mb-1">修正後</div>
          <div class="text-caption text-primary">
            出勤: {{ modification.requestedCheckIn }}<br>
            退勤: {{ modification.requestedCheckOut }}
          </div>
        </div>
      </div>

      <!-- add_missing: show new session info -->
      <div v-else class="d-flex ga-2 mt-2">
        <div class="flex-1-1 pa-2 rounded-lg" style="background: #F3E8FF">
          <div class="text-caption text-medium-emphasis mb-1" style="color: #7C3AED">追加セッション</div>
          <div class="text-caption" style="color: #7C3AED">
            出勤: {{ modification.requestedCheckIn }}<br>
            退勤: {{ modification.requestedCheckOut }}
          </div>
        </div>
      </div>

      <div class="mt-2 pa-2 rounded-lg" style="background: #FFFBEB">
        <span class="text-caption">理由: {{ modification.reason }}</span>
      </div>

      <!-- Rejection comment input -->
      <v-expand-transition>
        <div v-if="showRejectInput" class="mt-3">
          <v-textarea
            v-model="rejectNote"
            label="拒否理由（任意）"
            rows="2"
            variant="outlined"
            density="compact"
            hide-details
            placeholder="スタッフへのコメントを入力してください"
          />
          <div class="d-flex ga-2 mt-2 justify-end">
            <v-btn size="small" variant="text" @click="cancelReject">キャンセル</v-btn>
            <v-btn size="small" color="error" variant="flat" rounded="lg" @click="confirmReject">
              拒否を確定
            </v-btn>
          </div>
        </div>
      </v-expand-transition>
    </v-card-text>

    <v-card-actions v-if="!showRejectInput" class="pa-4 pt-0">
      <v-btn size="small" color="success" variant="tonal" rounded="lg" @click="emit('approve', modification.id)">
        <v-icon size="14" start>mdi-check</v-icon>
        承認
      </v-btn>
      <v-btn size="small" color="error" variant="tonal" rounded="lg" @click="showRejectInput = true">
        <v-icon size="14" start>mdi-close</v-icon>
        拒否
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script setup lang="ts">
interface Modification {
  id: string
  type: 'edit' | 'add_missing'
  employeeName: string
  workDate: string
  originalCheckIn?: string
  originalCheckOut?: string
  requestedCheckIn: string
  requestedCheckOut: string
  reason: string
}

const props = defineProps<{
  modification: Modification
}>()

const emit = defineEmits<{
  approve: [id: string]
  reject: [id: string, note: string]
}>()

const showRejectInput = ref(false)
const rejectNote = ref('')

function cancelReject() {
  showRejectInput.value = false
  rejectNote.value = ''
}

function confirmReject() {
  emit('reject', props.modification.id, rejectNote.value)
  showRejectInput.value = false
  rejectNote.value = ''
}
</script>
