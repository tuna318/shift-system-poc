<template>
  <div class="pa-4">
    <!-- Collection info banner -->
    <v-alert
      v-if="collection"
      type="info"
      variant="tonal"
      rounded="xl"
      density="compact"
      class="mb-4"
    >
      <div class="text-body-2 font-weight-medium">{{ collection.name }}</div>
      <div class="text-caption">提出期限: {{ deadlineLabel }}</div>
    </v-alert>

    <!-- Month display (read-only, locked to collection period) -->
    <div class="d-flex align-center justify-center mb-4">
      <span class="text-subtitle-1 font-weight-bold">{{ displayMonth }}</span>
    </div>

    <p class="text-body-2 text-grey mb-4">
      各日をタップして出勤希望を入力してください。
    </p>

    <!-- Calendar -->
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
          @click="openDaySheet(day)"
        >
          <span class="day-num" :class="{ 'text-error': isWeekend(day, 0), 'text-primary': isWeekend(day, 6) }">
            {{ day }}
          </span>
          <template v-if="getPreference(day)">
            <span class="day-chip" :style="chipStyle(day)">{{ chipLabel(day) }}</span>
          </template>
        </div>
      </div>
    </v-card>

    <!-- Summary -->
    <v-card rounded="xl" elevation="0" variant="outlined" class="mb-4">
      <v-card-text class="pa-3 d-flex justify-space-around">
        <div class="text-center">
          <div class="text-h6 font-weight-bold text-primary">{{ preferredCount }}</div>
          <div class="text-caption text-grey">第一希望</div>
        </div>
        <v-divider vertical />
        <div class="text-center">
          <div class="text-h6 font-weight-bold" style="color: #3587dc; opacity: 0.6;">{{ availableCount }}</div>
          <div class="text-caption text-grey">出勤可能</div>
        </div>
        <v-divider vertical />
        <div class="text-center">
          <div class="text-h6 font-weight-bold text-grey">{{ unavailableCount }}</div>
          <div class="text-caption text-grey">休み希望</div>
        </div>
      </v-card-text>
    </v-card>

    <!-- Legend -->
    <div class="d-flex gap-3 mb-4 flex-wrap">
      <div class="d-flex align-center gap-1">
        <span style="width:10px;height:10px;border-radius:3px;background:#3587dc;display:inline-block;"></span>
        <span class="text-caption text-grey">第一希望</span>
      </div>
      <div class="d-flex align-center gap-1">
        <span style="width:10px;height:10px;border-radius:3px;background:#EBF3FC;border:1px solid #3587dc;display:inline-block;"></span>
        <span class="text-caption text-grey">出勤可能</span>
      </div>
      <div class="d-flex align-center gap-1">
        <span style="width:10px;height:10px;border-radius:3px;background:#F3F4F6;display:inline-block;"></span>
        <span class="text-caption text-grey">休み希望</span>
      </div>
    </div>

    <!-- Submit button -->
    <v-btn
      block
      color="primary"
      size="large"
      rounded="xl"
      :disabled="totalCount === 0 || submitted"
      @click="confirmSubmit = true"
    >
      <v-icon start>mdi-send</v-icon>
      {{ submitted ? '提出済み' : '提出する' }}
    </v-btn>

    <!-- Day edit bottom sheet -->
    <v-bottom-sheet v-model="editSheet">
      <v-card rounded="t-xl" class="pa-4">
        <div class="text-subtitle-1 font-weight-bold mb-4">{{ editDayLabel }} の希望</div>
        <div class="d-flex flex-column gap-2">
          <v-btn
            :color="editAvail === 'PREFERRED' ? 'primary' : 'default'"
            :variant="editAvail === 'PREFERRED' ? 'flat' : 'outlined'"
            rounded="lg"
            @click="editAvail = 'PREFERRED'"
          >
            <v-icon start>mdi-star-outline</v-icon>
            第一希望（ぜひ入りたい）
          </v-btn>
          <v-btn
            :color="editAvail === 'AVAILABLE' ? 'primary' : 'default'"
            :variant="editAvail === 'AVAILABLE' ? 'tonal' : 'outlined'"
            rounded="lg"
            @click="editAvail = 'AVAILABLE'"
          >
            <v-icon start>mdi-briefcase-outline</v-icon>
            出勤可能（入れる）
          </v-btn>
          <v-btn
            :color="editAvail === 'UNAVAILABLE' ? 'grey' : 'default'"
            :variant="editAvail === 'UNAVAILABLE' ? 'tonal' : 'outlined'"
            rounded="lg"
            @click="editAvail = 'UNAVAILABLE'"
          >
            <v-icon start>mdi-home-outline</v-icon>
            休み希望
          </v-btn>
          <v-btn variant="outlined" rounded="lg" color="error" @click="clearDay">
            <v-icon start>mdi-delete-outline</v-icon>
            クリア
          </v-btn>
        </div>

        <!-- Time range -->
        <div v-if="editAvail === 'PREFERRED' || editAvail === 'AVAILABLE'" class="mt-4">
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
          <v-btn variant="outlined" rounded="lg" class="flex-1-1" @click="editSheet = false">キャンセル</v-btn>
          <v-btn color="primary" rounded="lg" class="flex-1-1" @click="saveDay">保存</v-btn>
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
            第一希望: {{ preferredCount }}日 / 出勤可能: {{ availableCount }}日 / 休み希望: {{ unavailableCount }}日
          </div>
          <div class="d-flex gap-2">
            <v-btn variant="outlined" rounded="lg" class="flex-1-1" @click="confirmSubmit = false">戻る</v-btn>
            <v-btn color="primary" rounded="lg" class="flex-1-1" @click="doSubmit">提出する</v-btn>
          </div>
        </v-card-text>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import type { PreferenceAvailability } from '~/types'

const route = useRoute()
const shiftStore = useShiftStore()
const appStore = useAppStore()

const collectionId = computed(() => route.params.id as string)
const collection = computed(() => shiftStore.collection?.id === collectionId.value ? shiftStore.collection : null)

const periodDate = computed(() => {
  if (!collection.value) return { year: 2026, month: 4 }
  const d = new Date(collection.value.periodStart)
  return { year: d.getFullYear(), month: d.getMonth() + 1 }
})

const displayMonth = computed(() => `${periodDate.value.year}年${periodDate.value.month}月`)
const deadlineLabel = computed(() => {
  if (!collection.value) return ''
  const d = new Date(collection.value.deadline)
  return `${d.getMonth() + 1}月${d.getDate()}日`
})

const dayHeaders = ['日', '月', '火', '水', '木', '金', '土']

const leadingBlanks = computed(() => {
  return new Date(periodDate.value.year, periodDate.value.month - 1, 1).getDay()
})

const daysInMonth = computed(() => {
  return new Date(periodDate.value.year, periodDate.value.month, 0).getDate()
})

type LocalPref = { availability: PreferenceAvailability; start?: string; end?: string }
const prefs = ref<Map<number, LocalPref>>(new Map())

function dateStr(day: number) {
  return `${periodDate.value.year}-${String(periodDate.value.month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function getPreference(day: number) {
  return prefs.value.get(day)
}

function getDayClass(day: number) {
  const p = getPreference(day)
  if (!p) return {}
  return {
    'pref-preferred': p.availability === 'PREFERRED',
    'pref-available': p.availability === 'AVAILABLE',
    'pref-unavailable': p.availability === 'UNAVAILABLE',
  }
}

function chipLabel(day: number) {
  const p = getPreference(day)
  if (!p) return ''
  return p.availability === 'PREFERRED' ? '★' : p.availability === 'AVAILABLE' ? '○' : '×'
}

function chipStyle(day: number) {
  const p = getPreference(day)
  if (!p) return ''
  if (p.availability === 'PREFERRED') return 'background: #3587dc; color: white;'
  if (p.availability === 'AVAILABLE') return 'background: #EBF3FC; color: #3587dc;'
  return 'background: #F3F4F6; color: #9e9e9e;'
}

function isWeekend(day: number, targetDay: number) {
  return new Date(periodDate.value.year, periodDate.value.month - 1, day).getDay() === targetDay
}

const editSheet = ref(false)
const editDay = ref<number | null>(null)
const editAvail = ref<PreferenceAvailability | null>(null)
const editStart = ref('10:00')
const editEnd = ref('16:00')

const editDayLabel = computed(() => {
  if (!editDay.value) return ''
  const d = new Date(periodDate.value.year, periodDate.value.month - 1, editDay.value)
  const dow = ['日', '月', '火', '水', '木', '金', '土']
  return `${periodDate.value.month}/${editDay.value} (${dow[d.getDay()]})`
})

const timeOptions = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`)

function openDaySheet(day: number) {
  editDay.value = day
  const existing = prefs.value.get(day)
  editAvail.value = existing?.availability ?? 'PREFERRED'
  editStart.value = existing?.start ?? '10:00'
  editEnd.value = existing?.end ?? '16:00'
  editSheet.value = true
}

function saveDay() {
  if (!editDay.value || !editAvail.value) return
  prefs.value.set(editDay.value, {
    availability: editAvail.value,
    start: (editAvail.value !== 'UNAVAILABLE') ? editStart.value : undefined,
    end: (editAvail.value !== 'UNAVAILABLE') ? editEnd.value : undefined,
  })
  editSheet.value = false
}

function clearDay() {
  if (editDay.value) prefs.value.delete(editDay.value)
  editSheet.value = false
}

const preferredCount = computed(() => [...prefs.value.values()].filter((p) => p.availability === 'PREFERRED').length)
const availableCount = computed(() => [...prefs.value.values()].filter((p) => p.availability === 'AVAILABLE').length)
const unavailableCount = computed(() => [...prefs.value.values()].filter((p) => p.availability === 'UNAVAILABLE').length)
const totalCount = computed(() => prefs.value.size)

const confirmSubmit = ref(false)
const submitted = ref(false)

function doSubmit() {
  const entries = [...prefs.value.entries()].map(([day, p]) => ({
    date: dateStr(day),
    availability: p.availability,
    start: p.start,
    end: p.end,
  }))
  shiftStore.submitPreferences(collectionId.value, entries)
  submitted.value = true
  confirmSubmit.value = false
  appStore.showSnackbar(`${displayMonth.value}の希望シフトを提出しました`, 'success')
  setTimeout(() => navigateTo('/shifts'), 1500)
}
</script>

<style scoped>
.pref-preferred { background: rgba(53, 135, 220, 0.15); border-radius: 8px; }
.pref-available { background: rgba(53, 135, 220, 0.06); border-radius: 8px; }
.pref-unavailable { background: rgba(158, 158, 158, 0.08); border-radius: 8px; }
.gap-1 { gap: 4px; }
.gap-2 { gap: 8px; }
.gap-3 { gap: 12px; }
</style>
