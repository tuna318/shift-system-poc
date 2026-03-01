<template>
  <div class="pa-4">
    <!-- Month selector -->
    <div class="d-flex align-center justify-space-between mb-4">
      <v-btn icon="mdi-chevron-left" variant="text" size="small" @click="prevMonth" />
      <span class="text-subtitle-1 font-weight-bold">{{ displayMonth }}</span>
      <v-btn icon="mdi-chevron-right" variant="text" size="small" @click="nextMonth" />
    </div>

    <p class="text-body-2 text-grey mb-4">
      各日をタップして希望を入力してください。
    </p>

    <!-- Calendar with multi-select -->
    <v-card rounded="xl" elevation="0" variant="outlined" class="mb-4 overflow-hidden">
      <div class="shift-calendar pa-3">
        <div v-for="d in dayHeaders" :key="d" class="cal-header" :class="{ 'text-error': d === '日', 'text-primary': d === '土' }">
          {{ d }}
        </div>
        <div v-for="n in leadingBlanks" :key="`blank-${n}`" />
        <div
          v-for="day in daysInMonth"
          :key="day"
          class="cal-day"
          :class="getDayClass(day)"
          @click="toggleDay(day)"
        >
          <span class="day-num" :class="{ 'text-error': isWeekend(day, 0), 'text-primary': isWeekend(day, 6) }">
            {{ day }}
          </span>
          <template v-if="getPreference(day)">
            <span class="day-chip" :style="chipStyle(day)">
              {{ chipLabel(day) }}
            </span>
          </template>
        </div>
      </div>
    </v-card>

    <!-- Summary -->
    <v-card rounded="xl" elevation="0" variant="outlined" class="mb-4">
      <v-card-text class="pa-3 d-flex justify-space-around">
        <div class="text-center">
          <div class="text-h6 font-weight-bold text-primary">{{ workCount }}</div>
          <div class="text-caption text-grey">出勤希望</div>
        </div>
        <v-divider vertical />
        <div class="text-center">
          <div class="text-h6 font-weight-bold text-grey">{{ offCount }}</div>
          <div class="text-caption text-grey">休み希望</div>
        </div>
        <v-divider vertical />
        <div class="text-center">
          <div class="text-h6 font-weight-bold text-grey-lighten-1">{{ unsubCount }}</div>
          <div class="text-caption text-grey">未入力</div>
        </div>
      </v-card-text>
    </v-card>

    <!-- Submit button -->
    <v-btn
      block
      color="primary"
      size="large"
      rounded="xl"
      :disabled="workCount + offCount === 0 || submitted"
      @click="confirmSubmit = true"
    >
      <v-icon start>mdi-send</v-icon>
      提出する
    </v-btn>

    <!-- Day edit bottom sheet -->
    <v-bottom-sheet v-model="editSheet">
      <v-card rounded="t-xl" class="pa-4">
        <div class="text-subtitle-1 font-weight-bold mb-4">{{ editDayLabel }} の希望</div>
        <div class="d-flex flex-column gap-2">
          <v-btn
            :color="editPref === 'WORK' ? 'primary' : 'default'"
            :variant="editPref === 'WORK' ? 'tonal' : 'outlined'"
            rounded="lg"
            @click="editPref = 'WORK'"
          >
            <v-icon start>mdi-briefcase-outline</v-icon>
            出勤希望
          </v-btn>
          <v-btn
            :color="editPref === 'OFF' ? 'grey' : 'default'"
            :variant="editPref === 'OFF' ? 'tonal' : 'outlined'"
            rounded="lg"
            @click="editPref = 'OFF'"
          >
            <v-icon start>mdi-home-outline</v-icon>
            休み希望
          </v-btn>
          <v-btn
            variant="outlined"
            rounded="lg"
            color="error"
            @click="clearDay"
          >
            <v-icon start>mdi-delete-outline</v-icon>
            クリア
          </v-btn>
        </div>

        <!-- Time range for WORK preference -->
        <div v-if="editPref === 'WORK'" class="mt-4">
          <div class="text-caption text-grey mb-2">希望時間帯（任意）</div>
          <div class="d-flex align-center gap-2">
            <v-select
              v-model="editStart"
              :items="timeOptions"
              label="開始"
              density="compact"
              variant="outlined"
              rounded="lg"
              hide-details
              class="flex-1-1"
            />
            <span class="text-body-2">〜</span>
            <v-select
              v-model="editEnd"
              :items="timeOptions"
              label="終了"
              density="compact"
              variant="outlined"
              rounded="lg"
              hide-details
              class="flex-1-1"
            />
          </div>
        </div>

        <div class="d-flex gap-2 mt-4">
          <v-btn variant="outlined" rounded="lg" class="flex-1-1" @click="editSheet = false">
            キャンセル
          </v-btn>
          <v-btn color="primary" rounded="lg" class="flex-1-1" @click="saveEditDay">
            保存
          </v-btn>
        </div>
      </v-card>
    </v-bottom-sheet>

    <!-- Confirm dialog -->
    <v-dialog v-model="confirmSubmit" max-width="320">
      <v-card rounded="xl">
        <v-card-text class="pa-6 text-center">
          <v-icon size="48" color="primary" class="mb-3">mdi-send-circle-outline</v-icon>
          <div class="text-subtitle-1 font-weight-bold mb-2">提出確認</div>
          <div class="text-body-2 text-grey mb-4">
            {{ displayMonth }}の希望シフトを提出しますか？<br>
            出勤: {{ workCount }}日 / 休み: {{ offCount }}日
          </div>
          <div class="d-flex gap-2">
            <v-btn variant="outlined" rounded="lg" class="flex-1-1" @click="confirmSubmit = false">
              戻る
            </v-btn>
            <v-btn color="primary" rounded="lg" class="flex-1-1" @click="doSubmit">
              提出する
            </v-btn>
          </div>
        </v-card-text>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import type { PreferenceType } from '~/types'

const appStore = useAppStore()

const today = new Date('2026-03-01')
// Default to next month for preference submission
const currentYear = ref(2026)
const currentMonth = ref(4)

const displayMonth = computed(() => `${currentYear.value}年${currentMonth.value}月`)
const dayHeaders = ['日', '月', '火', '水', '木', '金', '土']

const leadingBlanks = computed(() => {
  return new Date(currentYear.value, currentMonth.value - 1, 1).getDay()
})

const daysInMonth = computed(() => {
  return new Date(currentYear.value, currentMonth.value, 0).getDate()
})

// Local preference state: day → type
type LocalPref = { type: PreferenceType; start?: string; end?: string }
const prefs = ref<Map<number, LocalPref>>(new Map())

function dateStr(day: number) {
  return `${currentYear.value}-${String(currentMonth.value).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function getPreference(day: number): LocalPref | undefined {
  return prefs.value.get(day)
}

function getDayClass(day: number) {
  const p = getPreference(day)
  return {
    'pref-work': p?.type === 'WORK',
    'pref-off': p?.type === 'OFF',
  }
}

function chipLabel(day: number) {
  const p = getPreference(day)
  if (!p) return ''
  return p.type === 'WORK' ? '希望' : '休み'
}

function chipStyle(day: number) {
  const p = getPreference(day)
  if (!p) return ''
  return p.type === 'WORK'
    ? 'background: #e3f0fb; color: #3587dc;'
    : 'background: #f5f5f5; color: #9e9e9e;'
}

function isWeekend(day: number, targetDay: number) {
  const d = new Date(currentYear.value, currentMonth.value - 1, day)
  return d.getDay() === targetDay
}

function prevMonth() {
  if (currentMonth.value === 1) { currentMonth.value = 12; currentYear.value-- }
  else currentMonth.value--
}

function nextMonth() {
  if (currentMonth.value === 12) { currentMonth.value = 1; currentYear.value++ }
  else currentMonth.value++
}

// Edit sheet
const editSheet = ref(false)
const editDay = ref<number | null>(null)
const editPref = ref<PreferenceType | null>(null)
const editStart = ref('10:00')
const editEnd = ref('16:00')

const editDayLabel = computed(() => {
  if (!editDay.value) return ''
  const d = new Date(currentYear.value, currentMonth.value - 1, editDay.value)
  const dow = ['日', '月', '火', '水', '木', '金', '土']
  return `${currentMonth.value}/${editDay.value} (${dow[d.getDay()]})`
})

const timeOptions = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`)

function toggleDay(day: number) {
  editDay.value = day
  const existing = prefs.value.get(day)
  editPref.value = existing?.type ?? 'WORK'
  editStart.value = existing?.start ?? '10:00'
  editEnd.value = existing?.end ?? '16:00'
  editSheet.value = true
}

function saveEditDay() {
  if (!editDay.value || !editPref.value) return
  prefs.value.set(editDay.value, {
    type: editPref.value,
    start: editPref.value === 'WORK' ? editStart.value : undefined,
    end: editPref.value === 'WORK' ? editEnd.value : undefined,
  })
  editSheet.value = false
}

function clearDay() {
  if (editDay.value) prefs.value.delete(editDay.value)
  editSheet.value = false
}

const workCount = computed(() => [...prefs.value.values()].filter((p) => p.type === 'WORK').length)
const offCount = computed(() => [...prefs.value.values()].filter((p) => p.type === 'OFF').length)
const unsubCount = computed(() => daysInMonth.value - workCount.value - offCount.value)

const confirmSubmit = ref(false)
const submitted = ref(false)

function doSubmit() {
  submitted.value = true
  confirmSubmit.value = false
  appStore.showSnackbar(`${displayMonth.value}の希望シフトを提出しました`, 'success')
  setTimeout(() => navigateTo('/shifts'), 1500)
}
</script>

<style scoped>
.pref-work { background: rgba(53, 135, 220, 0.08); border-radius: 8px; }
.pref-off { background: rgba(158, 158, 158, 0.08); border-radius: 8px; }
.gap-2 { gap: 8px; }
</style>
