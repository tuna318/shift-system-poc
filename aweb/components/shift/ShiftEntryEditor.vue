<template>
  <v-dialog v-model="dialog" max-width="500" persistent scrollable>
    <v-card rounded="xl">
      <!-- Title bar -->
      <v-card-title class="pa-4 pb-3 d-flex align-center justify-space-between" style="flex-shrink:0">
        <span class="text-subtitle-1 font-weight-bold">
          {{ isEdit ? 'シフトを編集' : 'シフトを追加' }}
        </span>
        <v-btn icon size="small" variant="text" @click="close">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>
      <v-divider />

      <v-card-text class="pa-0">

        <!-- ═══════════════════════════════════════════════════
             EDIT MODE
             ═══════════════════════════════════════════════════ -->
        <template v-if="isEdit && props.entry">

          <!-- ① Shift details (non-editable) -->
          <div class="shift-info-card">
            <!-- Employee header -->
            <div class="d-flex align-center ga-3 mb-3">
              <div class="info-avatar" :class="avatarDeptClass">{{ avatarInitial }}</div>
              <div class="flex-1-1 min-width-0">
                <div class="text-subtitle-2 font-weight-bold">{{ employeeName }}</div>
                <div class="text-caption text-medium-emphasis">{{ employeeSubtitle }}</div>
              </div>
              <!-- Chat icon button with unread badge -->
              <div class="chat-icon-wrap" @click="openChat">
                <v-icon size="19" :color="employeeUnreadCount > 0 ? 'primary' : 'medium-emphasis'">
                  mdi-message-text-outline
                </v-icon>
                <span v-if="employeeUnreadCount > 0" class="chat-icon-badge">{{ employeeUnreadCount }}</span>
              </div>
            </div>

            <!-- Date + time row (shown for all entry types) -->
            <div class="d-flex align-center ga-1 mb-2 flex-wrap" style="gap:6px!important">
              <v-icon size="13" color="medium-emphasis">mdi-calendar-outline</v-icon>
              <span class="text-caption text-medium-emphasis">{{ shortDate }}</span>
              <span class="info-dot">·</span>
              <template v-if="isDayOffEntry">
                <v-icon size="13" color="medium-emphasis">mdi-sleep</v-icon>
                <span class="text-body-2 font-weight-medium text-medium-emphasis">{{ props.entry.startTime }} → {{ props.entry.endTime }}</span>
                <span class="text-caption text-medium-emphasis">（休日申請）</span>
              </template>
              <template v-else>
                <v-icon size="13" color="primary">mdi-clock-outline</v-icon>
                <span class="text-body-2 font-weight-medium">{{ props.entry.startTime }} → {{ props.entry.endTime }}</span>
                <span class="text-caption text-medium-emphasis">({{ workHours }}時間 / ¥{{ estimatedWage.toLocaleString() }})</span>
              </template>
            </div>
            <template v-if="!isDayOffEntry">
              <div class="d-flex align-center ga-2">
                <v-icon size="13" color="medium-emphasis">mdi-chart-bar</v-icon>
                <span class="text-caption text-medium-emphasis">
                  今月累計: {{ Math.round(currentMonthlyHours * 10) / 10 }}h → {{ projectedHours }}h / 上限 {{ employeeMaxHours }}h
                </span>
                <span class="text-caption text-medium-emphasis ml-auto">残り {{ Math.max(0, employeeMaxHours - projectedHours) }}h</span>
              </div>
              <div v-if="wouldExceedLimit" class="d-flex align-center ga-2 mt-2 pa-2 rounded-lg" style="background:#FFFBEB">
                <v-icon color="warning" size="13">mdi-alert-outline</v-icon>
                <span class="text-caption" style="color:#92400e">このシフトは月間上限（{{ employeeMaxHours }}h）を超えています</span>
              </div>
            </template>
          </div>

          <v-divider />

          <!-- ② Status flow: employee preference → manager action -->
          <div class="status-panel">
            <div class="flow-row">

              <!-- Labels row -->
              <div class="flow-labels">
                <span class="flow-col-label">スタッフ</span>
                <span class="flow-col-label">マネージャー</span>
              </div>

              <!-- Chips + arrow row (arrow stays vertically centered with chips) -->
              <div class="flow-chips-row">

                <!-- Employee status chip (flex:1 so arrow lands in the true center) -->
                <div class="flow-chip-left">
                  <div class="editor-status-chip" :class="`editor-chip--${currentStatusConfig.styleKey}`">
                    <v-icon :size="11">{{ currentStatusConfig.icon }}</v-icon>
                    <span>{{ currentStatusConfig.label }}</span>
                  </div>
                </div>

                <!-- Arrow -->
                <v-icon size="20" class="flow-arrow-icon">mdi-arrow-right-bold</v-icon>

                <!-- Manager actions -->
                <div class="flow-actions">

                  <!-- SHIFT_REQUESTED -->
                  <template v-if="props.entry.cellStatus === 'SHIFT_REQUESTED'">
                    <button class="act-chip act-chip--confirmed" @click="doConfirm('CONFIRMED')">
                      <v-icon size="11">mdi-check-circle-outline</v-icon> シフト確定
                    </button>
                    <button class="act-chip act-chip--adjusting" :class="{ 'act-chip--adjusting-on': adjustCompose }" @click="adjustCompose = !adjustCompose; adjustReason = ''">
                      <v-icon size="11">mdi-swap-horizontal-bold</v-icon> 調整依頼
                    </button>
                  </template>

                  <!-- DAY_OFF_REQUESTED -->
                  <template v-else-if="props.entry.cellStatus === 'DAY_OFF_REQUESTED'">
                    <button class="act-chip act-chip--day-off" @click="doConfirm('DAY_OFF_CONFIRMED')">
                      <v-icon size="11">mdi-check-circle-outline</v-icon> 休み確定
                    </button>
                    <button class="act-chip act-chip--adjusting" :class="{ 'act-chip--adjusting-on': adjustCompose }" @click="adjustCompose = !adjustCompose; adjustReason = ''">
                      <v-icon size="11">mdi-swap-horizontal-bold</v-icon> 調整依頼
                    </button>
                  </template>

                  <!-- ADJUSTING -->
                  <template v-else-if="props.entry.cellStatus === 'ADJUSTING'">
                    <button class="act-chip act-chip--confirmed" @click="doFinalize('CONFIRMED')">
                      <v-icon size="11">mdi-check-circle-outline</v-icon> シフト確定
                    </button>
                    <button class="act-chip act-chip--day-off" @click="doFinalize('DAY_OFF_CONFIRMED')">
                      <v-icon size="11">mdi-moon-waning-crescent</v-icon> 休み確定
                    </button>
                  </template>

                  <!-- DAY_OFF_CONFIRMED (DRAFT) -->
                  <template v-else-if="props.entry.cellStatus === 'DAY_OFF_CONFIRMED' && props.boardStatus === 'DRAFT'">
                    <button class="act-chip act-chip--revert" @click="toggleRevert">
                      <v-icon size="11">mdi-undo-variant</v-icon> 取り消す
                    </button>
                  </template>

                  <!-- CONFIRMED (DRAFT) -->
                  <template v-else-if="props.entry.cellStatus === 'CONFIRMED' && props.boardStatus === 'DRAFT'">
                    <button class="act-chip act-chip--revert" @click="toggleRevert">
                      <v-icon size="11">mdi-undo-variant</v-icon> 取り消す
                    </button>
                  </template>

                  <!-- PUBLISHED -->
                  <template v-else>
                    <div class="flow-locked">
                      <v-icon size="13" color="medium-emphasis">mdi-lock-outline</v-icon>
                      <span>変更不可</span>
                    </div>
                  </template>

                </div>
              </div>
            </div>

            <!-- Adjustment request info strip (visible when ADJUSTING) -->
            <AdjInfoStrip
              v-if="props.entry.cellStatus === 'ADJUSTING'"
              :entry="props.entry"
              :employee-id="props.employeeId"
              class="mt-3"
            />

            <!-- Adjust compose (expands when 調整依頼 chip is clicked) -->
            <v-expand-transition>
              <AdjRequestCompose
                v-if="adjustCompose"
                :entry="props.entry"
                :employee-id="props.employeeId"
                class="mt-3"
                @sent="adjustCompose = false"
                @cancel="adjustCompose = false"
              />
            </v-expand-transition>

            <!-- Revert confirm (expands below the flow row) -->
            <v-expand-transition>
              <div v-if="actionMode === 'revert'" class="revert-panel">
                <div class="d-flex align-center ga-2 mb-2">
                  <v-icon size="14" color="error">mdi-undo-variant</v-icon>
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

        </template>

        <!-- ═══════════════════════════════════════════════════
             ADD MODE
             ═══════════════════════════════════════════════════ -->
        <template v-else-if="!isEdit">
          <div class="pa-4">
            <div class="d-flex flex-column ga-4">

              <!-- Employee & date -->
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

              <!-- Time range -->
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

              <!-- Hours preview -->
              <div v-if="workHours > 0" class="d-flex flex-column ga-1">
                <div class="d-flex align-center ga-2 pa-2 rounded-lg" style="background:#EBF3FC">
                  <v-icon color="primary" size="16">mdi-timer-outline</v-icon>
                  <span class="text-caption text-primary">
                    勤務時間: {{ workHours }}時間 / 見込み賃金: ¥{{ estimatedWage.toLocaleString() }}
                  </span>
                </div>
                <div class="d-flex align-center ga-2 pa-2 rounded-lg" style="background:#F8F9FA">
                  <v-icon color="medium-emphasis" size="16">mdi-chart-bar</v-icon>
                  <span class="text-caption text-medium-emphasis">
                    今月累計: {{ Math.round(currentMonthlyHours * 10) / 10 }}h → {{ projectedHours }}h / 上限 {{ employeeMaxHours }}h
                  </span>
                  <span class="text-caption text-medium-emphasis ml-auto">残り {{ Math.max(0, employeeMaxHours - projectedHours) }}h</span>
                </div>
                <div v-if="wouldExceedLimit" class="d-flex align-center ga-2 pa-2 rounded-lg" style="background:#FFFBEB">
                  <v-icon color="warning" size="16">mdi-alert-outline</v-icon>
                  <span class="text-caption" style="color:#92400e">このシフトを追加すると上限（{{ employeeMaxHours }}h）を超えます</span>
                </div>
              </div>

              <!-- Note -->
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
          </div>
        </template>

      </v-card-text>

      <!-- Footer -->
      <v-divider />
      <v-card-actions class="pa-4 pt-3 d-flex ga-2" style="flex-shrink:0">
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
        <v-btn variant="text" @click="close">{{ isEdit ? '閉じる' : 'キャンセル' }}</v-btn>
        <v-btn
          v-if="!isEdit"
          color="primary"
          variant="flat"
          :disabled="!isValid"
          @click="handleSave"
        >
          追加
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { useMockData } from '~/composables/useMockData'
import { useShiftStore, MAX_MONTHLY_HOURS } from '~/stores/shift.store'
import { useChatStore } from '~/stores/chat.store'
import { useChatMessages } from '~/composables/useChatMessages'
import type { ShiftEntry, CellStatus } from '~/types'

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
const chatStore  = useChatStore()
const { getMessages } = useChatMessages()

const dialog = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
})

const isEdit = computed(() => !!props.entry)

// ── Employee info ──────────────────────────────────────────────
const employee = computed(() => getEmployee(props.employeeId))
const employeeName = computed(() => employee.value?.name ?? '')
const hourlyWage   = computed(() => employee.value?.hourlyWage ?? 1000)

const employeeSubtitle = computed(() => {
  const emp = employee.value
  if (!emp) return ''
  return `${emp.department} · ${emp.position}`
})

const DEPT_AVATAR_CLASSES: Record<string, string> = {
  キッチン: 'info-avatar--kitchen',
  ホール:   'info-avatar--hall',
  レジ:     'info-avatar--register',
}
const avatarDeptClass = computed(() =>
  DEPT_AVATAR_CLASSES[employee.value?.department ?? ''] ?? 'info-avatar--default',
)
const avatarInitial = computed(() =>
  (employee.value?.name ?? '').replace(/\s/g, '').charAt(0),
)

const formattedDate = computed(() => {
  if (!props.shiftDate) return ''
  return new Date(props.shiftDate).toLocaleDateString('ja-JP', {
    year: 'numeric', month: 'long', day: 'numeric', weekday: 'short',
  })
})

const shortDate = computed(() => {
  if (!props.shiftDate) return ''
  return new Date(props.shiftDate).toLocaleDateString('ja-JP', {
    month: 'numeric', day: 'numeric', weekday: 'short',
  })
})

const isDayOffEntry = computed(() =>
  props.entry?.cellStatus === 'DAY_OFF_REQUESTED' || props.entry?.cellStatus === 'DAY_OFF_CONFIRMED',
)

// ── Status configs ─────────────────────────────────────────────
type StatusConfig = { label: string; icon: string; styleKey: string }

const statusConfigs: Record<CellStatus, StatusConfig> = {
  SHIFT_REQUESTED:   { label: 'シフト希望',  icon: 'mdi-clock-outline',          styleKey: 'shift-requested'   },
  CONFIRMED:         { label: 'シフト確定',  icon: 'mdi-check-circle-outline',    styleKey: 'confirmed'         },
  DAY_OFF_REQUESTED: { label: '休み希望',    icon: 'mdi-calendar-remove-outline', styleKey: 'day-off-requested' },
  DAY_OFF_CONFIRMED: { label: '休み確定',    icon: 'mdi-moon-waning-crescent',    styleKey: 'day-off-confirmed' },
  ADJUSTING:         { label: '調整中',      icon: 'mdi-alert-circle-outline',    styleKey: 'adjusting'         },
}

const currentStatusConfig = computed<StatusConfig>(() =>
  statusConfigs[props.entry?.cellStatus ?? 'CONFIRMED'],
)


// ── Action mode (only used for revert) ────────────────────────
const actionMode = ref<null | 'revert'>(null)

watch(() => props.entry, () => {
  actionMode.value = null
})

function toggleRevert() {
  actionMode.value = actionMode.value === 'revert' ? null : 'revert'
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

function submitRevert() {
  if (!props.entry) return
  shiftStore.revertToRequested(props.entry.id)
  close()
}

// ── Hours / wage (edit: read from entry; add: computed from form) ──
const workHours = computed(() => {
  const start = isEdit.value ? props.entry?.startTime : form.startTime
  const end   = isEdit.value ? props.entry?.endTime   : form.endTime
  if (!start || !end) return 0
  const [sh, sm] = start.split(':').map(Number)
  const [eh, em] = end.split(':').map(Number)
  return Math.max(0, Math.round(((eh * 60 + em) - (sh * 60 + sm)) / 60 * 10) / 10)
})

const estimatedWage = computed(() => {
  if (isEdit.value && props.entry) return props.entry.estimatedWage
  return Math.round(hourlyWage.value * workHours.value)
})

const employeeMaxHours = computed(() => {
  const emp = getEmployee(props.employeeId)
  return emp ? MAX_MONTHLY_HOURS[emp.employmentType] : 160
})

const currentMonthlyHours = computed(() =>
  shiftStore.entries
    .filter(e => e.employeeId === props.employeeId && e.id !== props.entry?.id)
    .reduce((sum, e) => {
      const [sh, sm] = e.startTime.split(':').map(Number)
      const [eh, em] = e.endTime.split(':').map(Number)
      return sum + (eh * 60 + em - (sh * 60 + sm)) / 60
    }, 0),
)

const projectedHours   = computed(() => Math.round((currentMonthlyHours.value + (workHours.value as number)) * 10) / 10)
const wouldExceedLimit = computed(() => projectedHours.value > employeeMaxHours.value)

// ── Add-mode form ──────────────────────────────────────────────
const form = reactive({ startTime: '10:00', endTime: '18:00', note: '' })

watch(() => props.entry, (entry) => {
  if (!entry) {
    form.startTime = '10:00'
    form.endTime   = '18:00'
    form.note      = ''
  }
}, { immediate: true })

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

const isValid = computed(() => !!form.startTime && !!form.endTime && (workHours.value as number) > 0)

// ── Chat / adjust request ──────────────────────────────────────
const adjustCompose = ref(false)
const adjustReason  = ref('')

const employeeUnreadCount = computed(() =>
  getMessages(props.employeeId).filter(m => m.sender === 'employee').length,
)

const canSendAdjustRequest = computed(() =>
  props.entry?.cellStatus === 'SHIFT_REQUESTED' || props.entry?.cellStatus === 'DAY_OFF_REQUESTED',
)


watch(() => props.entry, () => {
  adjustCompose.value = false
  adjustReason.value = ''
})

function openChat() {
  chatStore.openConversation(props.employeeId)
}

// ── Add mode save ──────────────────────────────────────────────
function handleSave() {
  emit('save', {
    startTime: form.startTime,
    endTime: form.endTime,
    estimatedWage: estimatedWage.value as number,
    note: form.note || undefined,
    cellStatus: 'CONFIRMED',
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
/* ── Section label ───────────────────────────────────── */
.sec-label {
  font-size: 11px;
  font-weight: 700;
  color: rgba(0,0,0,0.45);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

/* ── Shift info card ─────────────────────────────────── */
.shift-info-card {
  padding: 16px 16px 14px;
  background: #F8FAFB;
}

.info-avatar {
  width: 36px; height: 36px; border-radius: 50%;
  font-size: 14px; font-weight: 700;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.info-avatar--kitchen  { background: rgba(251,146,60,0.15); color: #ea580c; }
.info-avatar--hall     { background: rgba(53,135,220,0.13); color: #3587dc; }
.info-avatar--register { background: rgba(139,92,246,0.13); color: #7c3aed; }
.info-avatar--default  { background: rgba(0,0,0,0.08);      color: rgba(0,0,0,0.5); }

/* ── Status chip ─────────────────────────────────────── */
.editor-status-chip {
  display: inline-flex; align-items: center; gap: 5px;
  padding: 4px 10px; border-radius: 20px;
  font-size: 12px; font-weight: 600;
  border: 1.5px solid transparent;
  white-space: nowrap; user-select: none;
}
.editor-chip--shift-requested   { background: transparent; border-color: #3587dc; color: #1d4ed8; }
.editor-chip--confirmed         { background: #3587dc;     border-color: #3587dc; color: #ffffff; }
.editor-chip--day-off-requested { background: transparent; border-color: #64748b; color: #475569; }
.editor-chip--day-off-confirmed { background: #64748b;     border-color: #64748b; color: #ffffff; }
.editor-chip--adjusting         { background: #f59e0b;     border-color: #d97706; color: #1c1917; }

/* ── Status flow panel ───────────────────────────────── */
.status-panel {
  padding: 14px 16px 16px;
}

/* Flow row: two-row layout so arrow aligns with chips */
.flow-row {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

/* Top row: labels left + right */
.flow-labels {
  display: flex;
  justify-content: space-between;
}

/* Bottom row: [employee chip] [arrow] [manager chips] */
.flow-chips-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.flow-chip-left {
  flex: 1;
  display: flex;
  justify-content: flex-start;
}

.flow-actions {
  flex: 1;
  display: flex;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 6px;
}

.flow-col-label {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: rgba(0,0,0,0.35);
}

/* Arrow connector */
.flow-arrow-icon {
  flex-shrink: 0;
  color: rgba(0,0,0,0.22);
}

/* Action chip stack */
.act-stack {
  display: flex;
  flex-direction: column;
  gap: 5px;
  width: 100%;
}
.act-stack--row {
  flex-direction: row;
  gap: 6px;
}

/* Clickable destination-status chips */
.act-chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 11px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  border: 1.5px solid transparent;
  cursor: pointer;
  background: none;
  font-family: inherit;
  white-space: nowrap;
  transition: filter 0.1s, transform 0.1s, box-shadow 0.1s;
}
.act-chip:hover  { transform: scale(1.05); box-shadow: 0 2px 7px rgba(0,0,0,0.13); }
.act-chip:active { transform: scale(1.01); box-shadow: none; }

/* Mirrors editor-chip palette so right side previews the destination */
.act-chip--confirmed {
  background: #3587dc;
  border-color: #3587dc;
  color: #fff;
}
.act-chip--day-off {
  background: #64748b;
  border-color: #64748b;
  color: #fff;
}
.act-chip--adjusting {
  background: transparent;
  border-color: #f59e0b;
  color: #92400e;
}
.act-chip--adjusting-on {
  background: #f59e0b;
  border-color: #d97706;
  color: #1c1917;
}
.act-chip--revert {
  background: transparent;
  border-color: rgba(239,68,68,0.35);
  color: #b91c1c;
}
.act-chip--revert:hover {
  background: rgba(239,68,68,0.06);
  border-color: rgba(239,68,68,0.55);
}

/* Locked state (published) */
.flow-locked {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  color: rgba(0,0,0,0.38);
  font-weight: 500;
  padding: 4px 0;
}

/* Revert confirm panel */
.revert-panel {
  margin-top: 12px;
  padding: 12px 14px;
  border-radius: 8px;
  border-left: 3px solid #ef4444;
  background: rgba(239,68,68,0.05);
}

/* ── Chat icon button in header ───────────────────── */
.chat-icon-wrap {
  position: relative;
  width: 32px; height: 32px;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
  transition: background 0.13s;
}
.chat-icon-wrap:hover { background: rgba(53,135,220,0.10); }

.chat-icon-badge {
  position: absolute;
  top: -1px; right: -1px;
  min-width: 15px; height: 15px;
  border-radius: 8px;
  background: rgb(var(--v-theme-primary)); color: #fff;
  font-size: 9px; font-weight: 700;
  display: flex; align-items: center; justify-content: center;
  padding: 0 3px;
  border: 1.5px solid #fff;
  pointer-events: none;
}

/* ── Date · time row separator dot ───────────────── */
.info-dot {
  font-size: 10px;
  color: rgba(0,0,0,0.25);
  flex-shrink: 0;
}

/* AdjInfoStrip and AdjRequestCompose are shared components — styles live there */

</style>
