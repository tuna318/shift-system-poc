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
          <div v-if="isEdit" class="status-section">
            <div class="d-flex align-center justify-space-between">
              <span class="text-caption font-weight-bold text-medium-emphasis" style="letter-spacing: 0.04em">申請ステータス</span>
              <div class="editor-status-chip" :class="`editor-chip--${currentStatusConfig.styleKey}`">
                <v-icon :size="12">{{ currentStatusConfig.icon }}</v-icon>
                <span>{{ currentStatusConfig.label }}</span>
              </div>
            </div>

            <!-- Dynamic hint for request statuses -->
            <div
              v-if="isRequestedStatus"
              class="action-hint mt-3"
              :class="{ 'action-hint--warn': timeModified }"
            >
              <v-icon size="14" :color="timeModified ? 'warning' : 'primary'">
                {{ timeModified ? 'mdi-swap-horizontal-circle-outline' : 'mdi-check-circle-outline' }}
              </v-icon>
              <span class="text-caption" :class="timeModified ? 'text-warning-darken' : 'text-primary'">
                <template v-if="timeModified">
                  時刻を変更しました。保存すると <strong>調整中</strong> になります。
                </template>
                <template v-else>
                  このまま保存すると <strong>{{ confirmLabel }}</strong> になります。
                </template>
              </span>
            </div>
          </div>

          <!-- ── Time range (hidden for day-off statuses) ── -->
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
import type { ShiftEntry, CellStatus } from '~/types'

const props = defineProps<{
  modelValue: boolean
  employeeId: string
  shiftDate: string
  entry?: ShiftEntry | null
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

// Whether this entry was submitted by an employee (manager needs to act on it)
const isRequestedStatus = computed(() =>
  props.entry?.cellStatus === 'SHIFT_REQUESTED' || props.entry?.cellStatus === 'DAY_OFF_REQUESTED'
)

// The "confirm" target for each requested status
const confirmStatus = computed<CellStatus>(() =>
  props.entry?.cellStatus === 'DAY_OFF_REQUESTED' ? 'DAY_OFF_CONFIRMED' : 'CONFIRMED'
)
const confirmLabel = computed(() => statusConfigs[confirmStatus.value].label)

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

// Detect if the manager changed the time from the employee's original request
const timeModified = computed(() =>
  isRequestedStatus.value &&
  !!props.entry &&
  (form.startTime !== props.entry.startTime || form.endTime !== props.entry.endTime)
)

// Status that will be written on save
const resolvedStatus = computed<CellStatus>(() => {
  if (!isRequestedStatus.value || !props.entry) return props.entry?.cellStatus ?? 'CONFIRMED'
  return timeModified.value ? 'ADJUSTING' : confirmStatus.value
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

// Show time fields for all statuses except pure day-off entries
const showTimeFields = computed(() => {
  const s = props.entry?.cellStatus
  return s !== 'DAY_OFF_CONFIRMED' && s !== 'DAY_OFF_REQUESTED'
})

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

/* ── Action hint banner ───────────────────────────────── */
.action-hint {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  background: #EBF3FC;
  border-radius: 6px;
  padding: 7px 10px;
  line-height: 1.4;
}

.action-hint.action-hint--warn {
  background: #FFFBEB;
}

.text-warning-darken {
  color: #92400e;
}
</style>
