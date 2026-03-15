<template>
  <v-dialog v-model="dialog" max-width="480" persistent>
    <v-card rounded="xl">
      <v-card-title class="pa-4 pb-3 d-flex align-center justify-space-between">
        <span class="text-subtitle-1 font-weight-bold">
          {{ isEdit ? 'シフトを編集' : 'シフトを追加' }}
        </span>
        <v-btn icon size="small" variant="text" @click="close">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>
      <v-divider />

      <v-card-text class="pa-4">
        <div class="d-flex flex-column ga-4">

          <!-- Employee & Date row -->
          <div class="d-flex ga-3">
            <div class="flex-1-1">
              <label class="text-caption font-weight-medium mb-1 d-block text-medium-emphasis">従業員</label>
              <v-text-field
                :model-value="employeeName"
                readonly
                prepend-inner-icon="mdi-account-outline"
                density="compact"
                hide-details
              />
            </div>
            <div class="flex-1-1">
              <label class="text-caption font-weight-medium mb-1 d-block text-medium-emphasis">日付</label>
              <v-text-field
                :model-value="formattedDate"
                readonly
                prepend-inner-icon="mdi-calendar"
                density="compact"
                hide-details
              />
            </div>
          </div>

          <!-- ── Status section (edit only) ── -->
          <div v-if="isEdit && props.entry" class="status-section">

            <!-- ① Status chip row -->
            <div class="d-flex align-center justify-space-between">
              <span class="text-caption font-weight-bold text-medium-emphasis" style="letter-spacing: 0.04em">申請ステータス</span>
              <div class="editor-status-chip" :class="`editor-chip--${currentStatusConfig.styleKey}`">
                <v-icon :size="12">{{ currentStatusConfig.icon }}</v-icon>
                <span>{{ currentStatusConfig.label }}</span>
              </div>
            </div>

            <!-- Action buttons -->
            <div class="d-flex flex-wrap ga-2 mt-3">
              <!-- SHIFT_REQUESTED -->
              <template v-if="props.entry.cellStatus === 'SHIFT_REQUESTED'">
                <v-btn size="small" color="primary" variant="flat" rounded="lg" @click="doConfirm('CONFIRMED')">シフト確定</v-btn>
                <v-btn size="small" color="warning" variant="tonal" rounded="lg" @click="toggleActionMode('adjust')">調整依頼…</v-btn>
              </template>
              <!-- DAY_OFF_REQUESTED -->
              <template v-else-if="props.entry.cellStatus === 'DAY_OFF_REQUESTED'">
                <v-btn size="small" color="default" variant="flat" rounded="lg" @click="doConfirm('DAY_OFF_CONFIRMED')">休み確定</v-btn>
                <v-btn size="small" color="warning" variant="tonal" rounded="lg" @click="toggleActionMode('adjust')">調整依頼…</v-btn>
              </template>
              <!-- ADJUSTING -->
              <template v-else-if="props.entry.cellStatus === 'ADJUSTING'">
                <v-btn size="small" color="primary" variant="flat" rounded="lg" @click="doFinalize('CONFIRMED')">シフト確定</v-btn>
                <v-btn size="small" color="default" variant="tonal" rounded="lg" @click="doFinalize('DAY_OFF_CONFIRMED')">休み確定</v-btn>
              </template>
              <!-- DAY_OFF_CONFIRMED + DRAFT -->
              <template v-else-if="props.entry.cellStatus === 'DAY_OFF_CONFIRMED' && props.boardStatus === 'DRAFT'">
                <v-btn size="small" color="warning" variant="tonal" rounded="lg" @click="toggleActionMode('adjust')">調整依頼…</v-btn>
                <v-btn size="small" color="error" variant="text" rounded="lg" @click="toggleActionMode('revert')">取り消し</v-btn>
              </template>
              <!-- CONFIRMED + DRAFT -->
              <template v-else-if="props.entry.cellStatus === 'CONFIRMED' && props.boardStatus === 'DRAFT'">
                <v-btn size="small" color="error" variant="text" rounded="lg" @click="toggleActionMode('revert')">取り消し</v-btn>
              </template>
              <!-- PUBLISHED + confirmed statuses -->
              <template v-else-if="props.boardStatus === 'PUBLISHED'">
                <span class="text-caption text-medium-emphasis">確定済 – 変更不可</span>
              </template>
            </div>

            <!-- ② Negotiation card (always visible when ADJUSTING) -->
            <v-expand-transition>
              <div v-if="props.entry.cellStatus === 'ADJUSTING'" class="negotiation-card mt-3">
                <div class="d-flex align-center ga-2 mb-3">
                  <div class="nego-side">
                    <div class="nego-side-label">スタッフの希望</div>
                    <div class="editor-status-chip" :class="`editor-chip--${statusConfigs[props.entry.preAdjustStatus ?? 'SHIFT_REQUESTED'].styleKey}`">
                      <v-icon :size="12">{{ statusConfigs[props.entry.preAdjustStatus ?? 'SHIFT_REQUESTED'].icon }}</v-icon>
                      <span>{{ statusConfigs[props.entry.preAdjustStatus ?? 'SHIFT_REQUESTED'].label }}</span>
                    </div>
                  </div>
                  <v-icon size="20" color="warning" class="mx-1">mdi-arrow-right-bold</v-icon>
                  <div class="nego-side">
                    <div class="nego-side-label">マネージャーの要望</div>
                    <div class="editor-status-chip" :class="`editor-chip--${managerRequestedStatusConfig.styleKey}`">
                      <v-icon :size="12">{{ managerRequestedStatusConfig.icon }}</v-icon>
                      <span>{{ managerRequestedStatusConfig.label }}</span>
                    </div>
                  </div>
                  <v-spacer />
                  <div class="response-badge" :class="`response-badge--${props.entry.adjustingResponseStatus ?? 'PENDING'}`">
                    <v-icon size="13">{{ responseIcon(props.entry.adjustingResponseStatus) }}</v-icon>
                    {{ responseLabel(props.entry.adjustingResponseStatus) }}
                  </div>
                </div>
                <div class="message-thread">
                  <div class="message-bubble message-bubble--manager">
                    <div class="message-sender">
                      <v-icon size="13">mdi-briefcase-outline</v-icon> マネージャー
                    </div>
                    <div class="message-body">{{ props.entry.adjustingReason ?? '調整を依頼しています。' }}</div>
                  </div>
                  <div v-if="props.entry.adjustingResponse" class="message-bubble message-bubble--employee">
                    <div class="message-sender">
                      <v-icon size="13">mdi-account-outline</v-icon> {{ employeeName }}
                    </div>
                    <div class="message-body">{{ props.entry.adjustingResponse }}</div>
                  </div>
                  <div v-else class="message-waiting">
                    <v-icon size="13" color="medium-emphasis">mdi-clock-outline</v-icon>
                    <span class="text-caption text-medium-emphasis">スタッフの返答待ち...</span>
                  </div>
                </div>
              </div>
            </v-expand-transition>

            <!-- ③ Inline: Adjust form -->
            <v-expand-transition>
              <div v-if="actionMode === 'adjust'" class="inline-panel inline-panel--warn mt-3">
                <div class="d-flex align-center ga-2 mb-2">
                  <v-icon size="15" color="warning">mdi-cellphone-message</v-icon>
                  <span class="text-caption font-weight-medium" style="color:#92400e">スタッフのデバイスに通知が送信されます</span>
                </div>
                <div class="text-caption text-medium-emphasis mb-2">
                  <template v-if="props.entry.cellStatus === 'DAY_OFF_REQUESTED' || props.entry.cellStatus === 'DAY_OFF_CONFIRMED'">
                    休みの予定を変更し、出勤をお願いする理由を入力してください。
                  </template>
                  <template v-else>シフト希望を承認できない理由と、調整内容を入力してください。</template>
                </div>
                <v-textarea
                  v-model="adjustReason"
                  label="従業員へのメッセージ（必須）"
                  auto-grow rows="2" max-rows="4"
                  density="compact" variant="outlined" rounded="lg"
                  hide-details="auto" class="mb-3"
                  placeholder="例：〇日は人員が不足しているため、ご出勤をお願いできますか？"
                />
                <div class="d-flex justify-end ga-2">
                  <v-btn size="small" variant="text" @click="actionMode = null">キャンセル</v-btn>
                  <v-btn
                    size="small" color="warning" variant="flat" rounded="lg"
                    prepend-icon="mdi-send-outline"
                    :disabled="!adjustReason.trim()"
                    @click="submitAdjust"
                  >
                    送信して調整中にする
                  </v-btn>
                </div>
              </div>
            </v-expand-transition>

            <!-- ③ Inline: Revert confirm -->
            <v-expand-transition>
              <div v-if="actionMode === 'revert'" class="inline-panel inline-panel--error mt-3">
                <div class="d-flex align-center ga-2 mb-2">
                  <v-icon size="15" color="error">mdi-undo-variant</v-icon>
                  <span class="text-caption font-weight-medium" style="color:#b91c1c">確定を取り消しますか？</span>
                </div>
                <div class="text-caption text-medium-emphasis mb-3">「{{ revertTargetLabel }}」に戻します。この操作は取り消せます。</div>
                <div class="d-flex justify-end ga-2">
                  <v-btn size="small" variant="text" @click="actionMode = null">キャンセル</v-btn>
                  <v-btn size="small" color="error" variant="flat" rounded="lg" @click="submitRevert">取り消す</v-btn>
                </div>
              </div>
            </v-expand-transition>
          </div>

          <!-- ── Time range (add mode, SHIFT_REQUESTED, or CONFIRMED) ── -->
          <template v-if="showTimeFields">
            <div class="d-flex ga-3">
              <div class="flex-1-1">
                <label class="text-caption font-weight-medium mb-1 d-block text-medium-emphasis">開始時刻</label>
                <v-select
                  v-model="form.startTime"
                  :items="timeOptions"
                  prepend-inner-icon="mdi-clock-start"
                  density="compact"
                  hide-details
                />
              </div>
              <div class="flex-1-1">
                <label class="text-caption font-weight-medium mb-1 d-block text-medium-emphasis">終了時刻</label>
                <v-select
                  v-model="form.endTime"
                  :items="timeOptions"
                  prepend-inner-icon="mdi-clock-end"
                  density="compact"
                  hide-details
                />
              </div>
            </div>

            <div v-if="workHours > 0" class="d-flex flex-column ga-1">
              <div class="d-flex align-center ga-2 pa-2 rounded-lg" style="background: #EBF3FC">
                <v-icon color="primary" size="16">mdi-timer-outline</v-icon>
                <span class="text-caption text-primary">
                  勤務時間: {{ workHours }}時間 / 見込み賃金: ¥{{ estimatedWage.toLocaleString() }}
                </span>
              </div>
              <div class="d-flex align-center ga-2 pa-2 rounded-lg" style="background: #F8F9FA">
                <v-icon color="medium-emphasis" size="16">mdi-chart-bar</v-icon>
                <span class="text-caption text-medium-emphasis">
                  今月累計: {{ Math.round(currentMonthlyHours * 10) / 10 }}h → {{ projectedHours }}h / 上限 {{ employeeMaxHours }}h
                </span>
                <span class="text-caption text-medium-emphasis ml-auto">
                  残り {{ Math.max(0, employeeMaxHours - projectedHours) }}h
                </span>
              </div>
              <div v-if="wouldExceedLimit" class="d-flex align-center ga-2 pa-2 rounded-lg" style="background: #FFFBEB">
                <v-icon color="warning" size="16">mdi-alert-outline</v-icon>
                <span class="text-caption" style="color: #92400e">
                  このシフトを追加すると上限（{{ employeeMaxHours }}h）を超えます
                </span>
              </div>
            </div>
          </template>

          <!-- ── Note ── -->
          <div>
            <label class="text-caption font-weight-medium mb-1 d-block text-medium-emphasis">メモ（任意）</label>
            <v-textarea
              v-model="form.note"
              placeholder="備考・メモを入力..."
              rows="2"
              density="compact"
              hide-details
            />
          </div>

        </div>
      </v-card-text>

      <v-card-actions class="pa-4 pt-2 d-flex ga-2">
        <v-btn
          v-if="isEdit"
          color="error"
          variant="tonal"
          prepend-icon="mdi-delete-outline"
          @click="handleDelete"
        >
          削除
        </v-btn>
        <v-spacer />
        <v-btn variant="text" @click="close">キャンセル</v-btn>
        <v-btn
          v-if="showSaveButton"
          :color="saveButtonColor"
          variant="flat"
          :disabled="!isValid"
          @click="handleSave"
        >
          {{ saveButtonLabel }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { useMockData } from '~/composables/useMockData'
import { useShiftStore, MAX_MONTHLY_HOURS } from '~/stores/shift.store'
import type { ShiftEntry, CellStatus, AdjustingResponseStatus } from '~/types'

const props = defineProps<{
  modelValue: boolean
  employeeId: string
  shiftDate: string
  entry?: ShiftEntry | null
  boardStatus?: 'DRAFT' | 'PUBLISHED'
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  save: [entry: Partial<ShiftEntry>]
  delete: [entryId: string]
}>()

const { getEmployee } = useMockData()
const shiftStore = useShiftStore()

const dialog = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
})

const isEdit = computed(() => !!props.entry)

const employeeName = computed(() => getEmployee(props.employeeId)?.name ?? '')
const hourlyWage = computed(() => getEmployee(props.employeeId)?.hourlyWage ?? 1000)

const formattedDate = computed(() => {
  if (!props.shiftDate) return ''
  return new Date(props.shiftDate).toLocaleDateString('ja-JP', {
    year: 'numeric', month: 'long', day: 'numeric', weekday: 'short',
  })
})

// ── Status configs ────────────────────────────────────────────
type StatusConfig = { label: string; icon: string; styleKey: string }

const statusConfigs: Record<CellStatus, StatusConfig> = {
  SHIFT_REQUESTED:  { label: 'シフト希望',  icon: 'mdi-clock-outline',             styleKey: 'shift-requested'   },
  CONFIRMED:        { label: 'シフト確定',  icon: 'mdi-check-circle-outline',       styleKey: 'confirmed'         },
  DAY_OFF_REQUESTED:{ label: '休み希望',    icon: 'mdi-calendar-remove-outline',    styleKey: 'day-off-requested' },
  DAY_OFF_CONFIRMED:{ label: '休み確定',    icon: 'mdi-moon-waning-crescent',       styleKey: 'day-off-confirmed' },
  ADJUSTING:        { label: '調整中',      icon: 'mdi-alert-circle-outline',       styleKey: 'adjusting'         },
}

const currentStatusConfig = computed<StatusConfig>(() =>
  statusConfigs[props.entry?.cellStatus ?? 'CONFIRMED']
)

// Manager's desired status (opposite of what employee requested)
const managerRequestedStatusConfig = computed<StatusConfig>(() => {
  const pre = props.entry?.preAdjustStatus
  if (pre === 'DAY_OFF_REQUESTED' || pre === 'DAY_OFF_CONFIRMED') {
    return statusConfigs.CONFIRMED
  }
  return statusConfigs.DAY_OFF_CONFIRMED
})

// ── Inline action state ───────────────────────────────────────
const actionMode = ref<null | 'adjust' | 'revert'>(null)
const adjustReason = ref('')

watch(() => props.entry, () => {
  actionMode.value = null
  adjustReason.value = ''
})

function toggleActionMode(mode: 'adjust' | 'revert') {
  if (actionMode.value === mode) {
    actionMode.value = null
  } else {
    actionMode.value = mode
    adjustReason.value = ''
  }
}

// ── Workflow helpers ──────────────────────────────────────────
function responseIcon(s?: AdjustingResponseStatus): string {
  if (s === 'ACCEPTED') return 'mdi-check-circle'
  if (s === 'REJECTED') return 'mdi-close-circle'
  return 'mdi-clock-outline'
}
function responseLabel(s?: AdjustingResponseStatus): string {
  if (s === 'ACCEPTED') return '承諾'
  if (s === 'REJECTED') return '拒否'
  return '返答待ち'
}

const revertTargetLabel = computed(() => {
  if (!props.entry) return ''
  const target = props.entry.preAdjustStatus
    ?? (props.entry.cellStatus === 'DAY_OFF_CONFIRMED' ? 'DAY_OFF_REQUESTED' : 'SHIFT_REQUESTED')
  return statusConfigs[target]?.label ?? target
})

function doConfirm(status: CellStatus) {
  if (!props.entry) return
  shiftStore.updateCellStatus(props.entry.id, status)
  close()
}

function doFinalize(status: 'CONFIRMED' | 'DAY_OFF_CONFIRMED') {
  if (!props.entry) return
  shiftStore.finalizeAdjustment(props.entry.id, status)
  close()
}

function submitAdjust() {
  if (!props.entry || !adjustReason.value.trim()) return
  shiftStore.requestAdjustment(props.entry.id, adjustReason.value.trim())
  close()
}

function submitRevert() {
  if (!props.entry) return
  shiftStore.revertToRequested(props.entry.id)
  close()
}

// ── Form state ────────────────────────────────────────────────
const form = reactive({
  startTime: '10:00',
  endTime: '18:00',
  note: '',
})

watch(() => props.entry, (entry) => {
  if (entry) {
    form.startTime = entry.startTime
    form.endTime = entry.endTime
    form.note = entry.note ?? ''
  } else {
    form.startTime = '10:00'
    form.endTime = '18:00'
    form.note = ''
  }
}, { immediate: true })

// Whether this entry was submitted by an employee (manager needs to act on it)
const isRequestedStatus = computed(() =>
  props.entry?.cellStatus === 'SHIFT_REQUESTED' || props.entry?.cellStatus === 'DAY_OFF_REQUESTED'
)

// The "confirm" target for each requested status
const confirmStatus = computed<CellStatus>(() =>
  props.entry?.cellStatus === 'DAY_OFF_REQUESTED' ? 'DAY_OFF_CONFIRMED' : 'CONFIRMED'
)
const confirmLabel = computed(() => statusConfigs[confirmStatus.value].label)

// Detect if the manager changed the time from the employee's original request
const timeModified = computed(() =>
  isRequestedStatus.value &&
  !!props.entry &&
  (form.startTime !== props.entry.startTime || form.endTime !== props.entry.endTime)
)

// Status that will be written on save (secondary path via save button)
const resolvedStatus = computed<CellStatus>(() => {
  if (!isRequestedStatus.value || !props.entry) return props.entry?.cellStatus ?? 'CONFIRMED'
  return timeModified.value ? 'ADJUSTING' : confirmStatus.value
})

// Show time fields: add mode, SHIFT_REQUESTED, or CONFIRMED
const showTimeFields = computed(() => {
  if (!isEdit.value) return true
  const s = props.entry?.cellStatus
  return s === 'SHIFT_REQUESTED' || s === 'CONFIRMED'
})

// Show save button: add mode, SHIFT_REQUESTED, or CONFIRMED in DRAFT; hidden for ADJUSTING / DAY_OFF_* / PUBLISHED
const showSaveButton = computed(() => {
  if (!isEdit.value) return true
  const s = props.entry?.cellStatus
  if (s === 'ADJUSTING' || s === 'DAY_OFF_REQUESTED' || s === 'DAY_OFF_CONFIRMED') return false
  if (props.boardStatus === 'PUBLISHED') return false
  return true
})

// Smart save button label + color
const saveButtonLabel = computed(() => {
  if (!isEdit.value) return '追加'
  if (!isRequestedStatus.value) return '更新'
  return timeModified.value ? '調整中にする' : `${confirmLabel.value}にする`
})
const saveButtonColor = computed(() =>
  isRequestedStatus.value && timeModified.value ? 'warning' : 'primary'
)

// ── Time / wage helpers ───────────────────────────────────────
const timeOptions = computed(() => {
  const opts: string[] = []
  for (let h = 6; h <= 26; h++) {
    for (const m of [0, 15, 30, 45]) {
      const displayH = h > 23 ? h - 24 : h
      opts.push(`${String(displayH).padStart(2, '0')}:${String(m).padStart(2, '0')}`)
    }
  }
  return opts
})

const workHours = computed(() => {
  if (!form.startTime || !form.endTime) return 0
  const [sh, sm] = form.startTime.split(':').map(Number)
  const [eh, em] = form.endTime.split(':').map(Number)
  return Math.max(0, Math.round(((eh * 60 + em) - (sh * 60 + sm)) / 60 * 10) / 10)
})

const estimatedWage = computed(() => Math.round(hourlyWage.value * workHours.value))

const employeeMaxHours = computed(() => {
  const emp = getEmployee(props.employeeId)
  return emp ? MAX_MONTHLY_HOURS[emp.employmentType] : 160
})

const currentMonthlyHours = computed(() => {
  return shiftStore.entries
    .filter(e => e.employeeId === props.employeeId && e.id !== props.entry?.id)
    .reduce((sum, e) => {
      const [sh, sm] = e.startTime.split(':').map(Number)
      const [eh, em] = e.endTime.split(':').map(Number)
      return sum + (eh * 60 + em - (sh * 60 + sm)) / 60
    }, 0)
})

const projectedHours = computed(() => Math.round((currentMonthlyHours.value + workHours.value) * 10) / 10)
const wouldExceedLimit = computed(() => projectedHours.value > employeeMaxHours.value)

const isValid = computed(() =>
  showTimeFields.value ? (!!form.startTime && !!form.endTime && workHours.value > 0) : true
)

// ── Actions ───────────────────────────────────────────────────
function handleSave() {
  emit('save', {
    startTime: form.startTime,
    endTime: form.endTime,
    estimatedWage: estimatedWage.value,
    note: form.note || undefined,
    cellStatus: resolvedStatus.value,
  })
  close()
}

function handleDelete() {
  if (props.entry) {
    emit('delete', props.entry.id)
    close()
  }
}

function close() {
  emit('update:modelValue', false)
}
</script>

<style scoped>
/* ── Status section container ─────────────────────────── */
.status-section {
  background: #F8F9FA;
  border: 1px solid #e0e1e4;
  border-radius: 10px;
  padding: 12px 16px;
}

/* ── Status chip (display-only badge) ────────────────── */
.editor-status-chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  border: 1.5px solid transparent;
  white-space: nowrap;
  user-select: none;
}

/* ── Per-status colors (match ShiftEntryChip palette) ── */
.editor-chip--shift-requested {
  background: transparent;
  border-color: #3587dc;
  color: #1d4ed8;
}

.editor-chip--confirmed {
  background: #3587dc;
  border-color: #3587dc;
  color: #ffffff;
}

.editor-chip--day-off-requested {
  background: transparent;
  border-color: #64748b;
  color: #475569;
}

.editor-chip--day-off-confirmed {
  background: #64748b;
  border-color: #64748b;
  color: #ffffff;
}

.editor-chip--adjusting {
  background: #f59e0b;
  border-color: #d97706;
  color: #1c1917;
}

/* ── Negotiation card ─────────────────────────────────── */
.negotiation-card {
  padding: 12px 14px;
  background: rgba(245, 158, 11, 0.06);
  border-left: 3px solid #f59e0b;
  border-radius: 0 8px 8px 0;
}

.nego-side {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.nego-side-label {
  font-size: 10px;
  color: rgba(0, 0, 0, 0.5);
  font-weight: 500;
}

/* ── Response badge ───────────────────────────────────── */
.response-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
  flex-shrink: 0;
}

.response-badge--PENDING  { background: rgba(0, 0, 0, 0.07);    color: rgba(0, 0, 0, 0.5); }
.response-badge--ACCEPTED { background: rgba(22, 163, 74, 0.12); color: #15803d; }
.response-badge--REJECTED { background: rgba(220, 38, 38, 0.1);  color: #b91c1c; }

/* ── Message thread ──────────────────────────────────── */
.message-thread {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 10px;
}

.message-bubble {
  padding: 8px 10px;
  border-radius: 8px;
}

.message-bubble--manager {
  background: rgba(53, 135, 220, 0.08);
  border: 1px solid rgba(53, 135, 220, 0.15);
  align-self: flex-start;
  max-width: 95%;
}

.message-bubble--employee {
  background: white;
  border: 1px solid rgba(0, 0, 0, 0.12);
  align-self: flex-end;
  max-width: 95%;
}

.message-sender {
  font-size: 10px;
  color: rgba(0, 0, 0, 0.45);
  margin-bottom: 3px;
  display: flex;
  align-items: center;
  gap: 3px;
}

.message-body {
  font-size: 12px;
  line-height: 1.5;
  color: rgba(0, 0, 0, 0.8);
}

.message-waiting {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 6px 2px;
}

/* ── Inline panels ───────────────────────────────────── */
.inline-panel {
  padding: 12px 14px;
  border-radius: 8px;
}

.inline-panel--warn  { border-left: 3px solid #f59e0b; background: rgba(245, 158, 11, 0.06); }
.inline-panel--error { border-left: 3px solid #ef4444; background: rgba(239, 68, 68, 0.05); }
</style>
