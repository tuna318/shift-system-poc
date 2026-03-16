<template>
  <div class="week-cal" :class="{ 'is-ev-dragging': !!eventDrag }" @selectstart.prevent>

    <!-- Week navigation -->
    <div class="d-flex align-center justify-space-between mb-3">
      <v-btn icon size="small" variant="text" :disabled="!canGoPrev" @click="prevWeek">
        <v-icon>mdi-chevron-left</v-icon>
      </v-btn>
      <div class="text-center">
        <div class="text-body-2 font-weight-bold">{{ weekLabel }}</div>
        <div class="text-caption text-medium-emphasis">ドラッグしてシフトブロックを作成・移動</div>
      </div>
      <v-btn icon size="small" variant="text" :disabled="!canGoNext" @click="nextWeek">
        <v-icon>mdi-chevron-right</v-icon>
      </v-btn>
    </div>

    <!-- Block Library -->
    <div class="block-library mb-3">
      <div class="d-flex align-center justify-space-between mb-2">
        <span class="library-title">ブロックライブラリ</span>
        <v-btn size="x-small" variant="tonal" color="primary" rounded="lg"
          prepend-icon="mdi-plus" @click="openAddTemplate">
          カスタム追加
        </v-btn>
      </div>
      <div class="library-scroll">
        <div
          v-for="tpl in libraryTemplates" :key="tpl.id"
          class="library-card"
          :style="{ '--tpl-color': tpl.color }"
          @mousedown.prevent="onLibraryMouseDown($event, tpl)"
        >
          <div class="lc-bar" />
          <div class="lc-body">
            <div class="lc-label">{{ tpl.label }}</div>
            <div class="lc-time">{{ tpl.startTime }}–{{ tpl.endTime }}</div>
            <div class="lc-depts">{{ tpl.departmentConfigs.map(d => d.department).join('・') }}</div>
          </div>
          <v-menu>
            <template #activator="{ props }">
              <v-btn v-bind="props" icon size="x-small" variant="text"
                class="lc-menu-btn" @mousedown.stop>
                <v-icon size="14">mdi-dots-vertical</v-icon>
              </v-btn>
            </template>
            <v-list density="compact" width="120">
              <v-list-item title="編集" prepend-icon="mdi-pencil-outline"
                @click="openEditTemplate(tpl)" />
              <v-list-item title="削除" prepend-icon="mdi-delete-outline"
                :disabled="libraryTemplates.length <= 1"
                @click="deleteTemplate(tpl.id)" />
            </v-list>
          </v-menu>
        </div>
      </div>
    </div>

    <!-- Calendar frame -->
    <div class="cal-frame">

      <!-- Sticky day header -->
      <div class="cal-header">
        <div class="time-gutter" />
        <div
          v-for="day in weekDays"
          :key="day.date"
          class="day-header-cell"
          :class="{ 'day-header-cell--out': !day.inPeriod }"
        >
          <div class="text-caption" :class="day.isWeekend ? 'text-error' : 'text-medium-emphasis'">
            {{ day.dowLabel }}
          </div>
          <div class="text-body-2 font-weight-bold" :class="day.isWeekend ? 'text-error' : ''">
            {{ day.monthDay }}
          </div>
        </div>
      </div>

      <!-- Scrollable time grid -->
      <div ref="scrollRef" class="cal-scroll">
        <div ref="calBodyRef" class="cal-body">

          <!-- Time gutter -->
          <div class="time-gutter" style="position: relative;">
            <div :style="{ height: `${TOTAL_HEIGHT}px` }" />
            <div
              v-for="h in hourMarkers"
              :key="h"
              class="hour-label"
              :style="{ top: `${(h - START_HOUR) * HOUR_PX - 8}px` }"
            >
              {{ h >= 24 ? `${String(h - 24).padStart(2, '0')}:00` : `${String(h).padStart(2, '0')}:00` }}
            </div>
          </div>

          <!-- Day columns -->
          <div
            v-for="day in weekDays"
            :key="day.date"
            class="day-col"
            :class="{
              'day-col--out': !day.inPeriod,
              'day-col--drop-target': (eventDrag?.mode === 'move'
                && eventDrag.previewDate === day.date
                && eventDrag.previewDate !== eventDrag.fromDate)
                || (libraryDrag?.previewDate === day.date),
            }"
            :style="{ height: `${TOTAL_HEIGHT}px` }"
            @mousedown.prevent="day.inPeriod ? onColMouseDown($event, day.date) : undefined"
          >
            <template v-for="h in hourMarkers" :key="h">
              <div class="hour-line" :style="{ top: `${(h - START_HOUR) * HOUR_PX}px` }" />
              <div class="half-line" :style="{ top: `${(h - START_HOUR) * HOUR_PX + HOUR_PX / 2}px` }" />
            </template>

            <!-- Existing event blocks -->
            <div
              v-for="ev in getDayEvents(day.date)"
              :key="ev.slot.id"
              class="event-block"
              :class="{ 'event-block--dragging': eventDrag?.slotId === ev.slot.id }"
              :style="getEventStyle(ev.slot)"
              @mousedown.stop.prevent="onEventMouseDown($event, ev.slot, day.date, 'move')"
            >
              <button class="event-remove" @mousedown.stop @click.stop="removeEvent(ev.slot.id, day.date)">×</button>
              <div class="eb-label">{{ ev.slot.label }}</div>
              <div class="eb-time">{{ ev.slot.startTime }}–{{ ev.slot.endTime }}</div>
              <template v-for="dc in ev.slot.departmentConfigs" :key="dc.department">
                <div v-if="dc.roleRequirements.some(r => r.count > 0)" class="eb-dept-block">
                  <div class="eb-dept-name">{{ dc.department }}</div>
                  <div
                    v-for="rr in dc.roleRequirements.filter(r => r.count > 0)"
                    :key="rr.role"
                    class="eb-role-row"
                  >
                    <span class="eb-role-name">{{ rr.role }}</span>
                    <span class="eb-role-badge">{{ rr.count }}名</span>
                  </div>
                </div>
              </template>
              <!-- Resize handle (bottom edge) -->
              <div
                class="resize-handle"
                @mousedown.stop.prevent="onEventMouseDown($event, ev.slot, day.date, 'resize')"
              />
            </div>

            <!-- Event drag preview (move / resize) -->
            <div
              v-if="eventDrag && eventDrag.previewDate === day.date"
              class="event-block event-block--ev-preview"
              :style="getEvDragPreviewStyle()"
            >
              <div class="eb-label">{{ getSlotById(eventDrag.slotId)?.label }}</div>
              <div class="eb-time">{{ eventDrag.previewStartTime }}–{{ eventDrag.previewEndTime }}</div>
            </div>

            <!-- New-event drag preview -->
            <div
              v-if="drag.active && drag.date === day.date"
              class="event-block event-block--preview"
              :style="getNewDragStyle()"
            >
              <div class="eb-label">{{ drag.startTime }}</div>
              <div class="eb-time">{{ drag.endTime }}</div>
            </div>

            <!-- Library drag preview -->
            <div
              v-if="libraryDrag?.previewDate === day.date"
              class="event-block event-block--preview"
              :style="{
                ...getEventStyle({ ...libraryDrag.template, id: '_preview' } as ShiftSlot),
                opacity: 0.55,
                border: '2px dashed rgba(255,255,255,0.7)',
                pointerEvents: 'none',
              }"
            >
              <div class="eb-label">{{ libraryDrag.template.label }}</div>
              <div class="eb-time">{{ libraryDrag.template.startTime }}–{{ libraryDrag.template.endTime }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Ghost card following cursor during library drag -->
    <teleport to="body">
      <div
        v-if="libraryDrag"
        class="library-ghost"
        :style="{
          left: `${libraryDrag.clientX}px`,
          top: `${libraryDrag.clientY}px`,
          '--tpl-color': libraryDrag.template.color,
        }"
      >
        <div class="lc-bar" />
        <div class="lc-body">
          <div class="lc-label">{{ libraryDrag.template.label }}</div>
          <div class="lc-time">{{ libraryDrag.template.startTime }}–{{ libraryDrag.template.endTime }}</div>
        </div>
      </div>
    </teleport>

    <!-- ── Create / Edit dialog ───────────────────────────────── -->
    <v-dialog v-model="dialog.show" max-width="480" persistent scrollable>
      <v-card rounded="xl">
        <v-card-title class="pa-5 pb-2 text-body-1 font-weight-bold">
          <template v-if="dialogMode === 'template'">
            {{ dialog.isEdit ? 'テンプレートを編集' : 'テンプレートを追加' }}
          </template>
          <template v-else>
            {{ dialog.isEdit ? 'シフトブロックを編集' : 'シフトブロックを作成' }}
            <div class="text-caption text-medium-emphasis font-weight-regular">{{ dialogDateLabel }}</div>
          </template>
        </v-card-title>

        <v-divider />

        <v-card-text class="pa-5" style="max-height: 72vh;">

          <!-- ① 時間帯プリセット -->
          <div class="section-label">時間帯</div>
          <v-select
            v-model="selectedPresetId"
            :items="TIME_PRESETS.map(p => ({ title: `${p.label}　${p.startTime}–${p.endTime}`, value: p.id }))"
            label="プリセットから選択（任意）"
            clearable
            variant="outlined"
            density="comfortable"
            rounded="lg"
            prepend-inner-icon="mdi-clock-time-four-outline"
            class="mb-4"
            @update:model-value="onPresetSelect"
          />

          <!-- ② ラベル -->
          <v-text-field
            v-model="form.label"
            label="ラベル"
            placeholder="例: ランチ"
            variant="outlined"
            density="comfortable"
            rounded="lg"
            class="mb-3"
            autofocus
          />

          <!-- ③ 開始・終了 -->
          <div class="d-flex align-center ga-2 mb-5">
            <v-select
              v-model="form.startTime"
              :items="timeOptions"
              label="開始"
              variant="outlined"
              density="comfortable"
              rounded="lg"
              hide-details
              style="flex: 1"
            />
            <span class="text-body-2 text-medium-emphasis flex-shrink-0">〜</span>
            <v-select
              v-model="form.endTime"
              :items="timeOptions"
              label="終了"
              variant="outlined"
              density="comfortable"
              rounded="lg"
              hide-details
              style="flex: 1"
            />
          </div>

          <!-- ④ 部門設定 -->
          <div class="d-flex align-center justify-space-between mb-3">
            <div class="section-label mb-0">部門設定</div>
            <v-btn
              size="x-small" variant="tonal" color="primary" rounded="lg" prepend-icon="mdi-plus"
              :disabled="form.departmentConfigs.length >= ALL_DEPARTMENTS.length"
              @click="addDepartment"
            >
              部門を追加
            </v-btn>
          </div>

          <div class="d-flex flex-column ga-3 mb-5">
            <v-card
              v-for="(dc, idx) in form.departmentConfigs"
              :key="idx"
              elevation="0" border rounded="lg" class="pa-3"
            >
              <div class="d-flex align-center ga-2 mb-3">
                <v-select
                  :model-value="dc.department"
                  :items="availableDepts(dc.department)"
                  label="部門"
                  variant="outlined" density="compact" rounded="lg" hide-details
                  style="flex: 1"
                  @update:model-value="onDeptChange(idx, $event)"
                />
                <v-btn
                  icon size="x-small" variant="text" color="error"
                  :disabled="form.departmentConfigs.length === 1"
                  @click="removeDepartment(idx)"
                >
                  <v-icon size="16">mdi-close</v-icon>
                </v-btn>
              </div>
              <div class="text-caption text-medium-emphasis mb-2">役割ごとの必要人数</div>
              <div class="d-flex flex-column ga-1">
                <div v-for="rr in dc.roleRequirements" :key="rr.role" class="role-row">
                  <span class="role-name text-body-2">{{ rr.role }}</span>
                  <div class="role-stepper">
                    <button class="stepper-btn" :disabled="rr.count <= 0" @click="rr.count = Math.max(0, rr.count - 1)">
                      <v-icon size="14">mdi-minus</v-icon>
                    </button>
                    <span class="stepper-val">{{ rr.count }}</span>
                    <button class="stepper-btn" @click="rr.count++">
                      <v-icon size="14">mdi-plus</v-icon>
                    </button>
                    <span class="text-caption text-medium-emphasis ml-1">名</span>
                  </div>
                </div>
              </div>
            </v-card>
          </div>

          <!-- ⑤ カラー -->
          <v-divider class="mb-4" />
          <div class="section-label">カラー</div>
          <div class="d-flex ga-2">
            <div
              v-for="c in SLOT_COLORS"
              :key="c"
              class="color-swatch"
              :style="{
                background: c,
                outline: form.color === c ? `3px solid ${c}` : '3px solid transparent',
                outlineOffset: '2px',
              }"
              @click="form.color = c"
            />
          </div>
        </v-card-text>

        <v-divider />

        <v-card-actions class="pa-4">
          <v-btn v-if="dialog.isEdit && dialogMode === 'slot'" color="error" variant="text" @click="deleteEditingEvent">削除</v-btn>
          <v-btn v-if="dialogMode === 'slot'" size="small" variant="tonal" color="secondary" rounded="lg"
            prepend-icon="mdi-bookmark-plus-outline" @click="saveBlockToLibrary">
            ライブラリに保存
          </v-btn>
          <v-spacer />
          <v-btn variant="text" @click="cancelDialog">キャンセル</v-btn>
          <v-btn
            color="primary" variant="flat" rounded="lg"
            :disabled="!form.label || form.departmentConfigs.length === 0"
            @click="dialogMode === 'template' ? saveTemplate() : saveEvent()"
          >
            {{ dialog.isEdit ? '更新' : (dialogMode === 'template' ? '追加' : '作成') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import type { ShiftSlot, DaySlotAssignment, AllocationSetup, SlotColor, DepartmentConfig } from '~/types'
import type { Employee } from '~/types'
import { useMockData } from '~/composables/useMockData'

const props = defineProps<{
  periodStart: string
  periodEnd: string
  modelValue: AllocationSetup
}>()
const emit = defineEmits<{ 'update:modelValue': [AllocationSetup] }>()

// ── Constants ─────────────────────────────────────────────────
const START_HOUR = 6
const END_HOUR = 26
const HOUR_PX = 64
const TOTAL_HEIGHT = (END_HOUR - START_HOUR) * HOUR_PX
const QUARTER_PX = HOUR_PX / 4
const GUTTER_W = 52 // px — must match .time-gutter width in CSS

const SLOT_COLORS: SlotColor[] = [
  '#3587dc', '#4bd08b', '#f8c076', '#e879a0', '#9c7fe0', '#f97316',
]
const ALL_DEPARTMENTS = ['キッチン', 'ホール', 'レジ'] as const
const DOW_LABELS = ['日', '月', '火', '水', '木', '金', '土']

interface TimePreset { id: string; label: string; startTime: string; endTime: string }
const TIME_PRESETS: TimePreset[] = [
  { id: 'shikomi', label: '仕込み',  startTime: '09:00', endTime: '11:00' },
  { id: 'asaban',  label: '朝番',    startTime: '07:00', endTime: '15:00' },
  { id: 'lunch',   label: 'ランチ',  startTime: '10:00', endTime: '15:00' },
  { id: 'yuban',   label: '夕番',    startTime: '15:00', endTime: '22:00' },
  { id: 'toshi',   label: '通し',    startTime: '09:00', endTime: '21:00' },
  { id: 'close',   label: 'クローズ', startTime: '22:00', endTime: '23:30' },
  { id: 'shinya',  label: '深夜',    startTime: '22:00', endTime: '26:00' },
]

// ── Block Library ─────────────────────────────────────────────
interface BlockTemplate {
  id: string
  label: string
  startTime: string
  endTime: string
  color: SlotColor
  departmentConfigs: DepartmentConfig[]
}

const DEFAULT_TEMPLATES: BlockTemplate[] = [
  {
    id: 'tpl-shikomi', label: '仕込み', startTime: '09:00', endTime: '11:00',
    color: '#f8c076',
    departmentConfigs: [
      { department: 'キッチン', roleRequirements: [{ role: 'キッチンリーダー', count: 1 }, { role: 'キッチンスタッフ', count: 1 }] },
    ],
  },
  {
    id: 'tpl-lunch', label: 'ランチ', startTime: '11:00', endTime: '15:00',
    color: '#4bd08b',
    departmentConfigs: [
      { department: 'キッチン', roleRequirements: [{ role: 'キッチンリーダー', count: 1 }, { role: 'キッチンスタッフ', count: 2 }] },
      { department: 'ホール', roleRequirements: [{ role: 'ホールリーダー', count: 1 }, { role: 'ホールスタッフ', count: 3 }] },
      { department: 'レジ', roleRequirements: [{ role: 'レジスタッフ', count: 1 }] },
    ],
  },
  {
    id: 'tpl-teatime', label: 'ティータイム', startTime: '15:00', endTime: '17:00',
    color: '#9c7fe0',
    departmentConfigs: [
      { department: 'キッチン', roleRequirements: [{ role: 'キッチンスタッフ', count: 1 }] },
      { department: 'ホール', roleRequirements: [{ role: 'ホールスタッフ', count: 2 }] },
    ],
  },
  {
    id: 'tpl-dinner', label: 'ディナー', startTime: '17:00', endTime: '22:00',
    color: '#3587dc',
    departmentConfigs: [
      { department: 'キッチン', roleRequirements: [{ role: 'キッチンリーダー', count: 1 }, { role: 'キッチンスタッフ', count: 3 }] },
      { department: 'ホール', roleRequirements: [{ role: 'ホールリーダー', count: 1 }, { role: 'ホールスタッフ', count: 4 }] },
      { department: 'レジ', roleRequirements: [{ role: 'レジスタッフ', count: 2 }] },
    ],
  },
  {
    id: 'tpl-close', label: 'クローズ', startTime: '22:00', endTime: '23:30',
    color: '#e879a0',
    departmentConfigs: [
      { department: 'キッチン', roleRequirements: [{ role: 'キッチンスタッフ', count: 1 }] },
      { department: 'ホール', roleRequirements: [{ role: 'ホールスタッフ', count: 1 }] },
    ],
  },
]

const libraryTemplates = ref<BlockTemplate[]>(DEFAULT_TEMPLATES.map(t => ({
  ...t,
  departmentConfigs: t.departmentConfigs.map(dc => ({
    ...dc, roleRequirements: dc.roleRequirements.map(rr => ({ ...rr })),
  })),
})))

interface LibraryDragState {
  template: BlockTemplate
  clientX: number
  clientY: number
  previewDate: string | null
}
const libraryDrag = ref<LibraryDragState | null>(null)

const hourMarkers = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i)

const timeOptions = computed(() => {
  const opts: string[] = []
  for (let h = START_HOUR; h <= END_HOUR; h++) {
    opts.push(`${String(h).padStart(2, '0')}:00`)
    if (h < END_HOUR) opts.push(`${String(h).padStart(2, '0')}:30`)
  }
  return opts
})

// ── Employee / role data ──────────────────────────────────────
const { employees: allEmployees } = useMockData()
function getRolesForDept(dept: string): string[] {
  const roles = new Set<string>()
  ;(allEmployees as Employee[])
    .filter((e: Employee) => e.department === dept && e.status === 'ACTIVE')
    .forEach((e: Employee) => roles.add(e.position))
  return Array.from(roles)
}

// ── Period helpers ────────────────────────────────────────────
const effectiveStart = computed(() => {
  if (props.periodStart) return props.periodStart
  const d = new Date(); d.setDate(1)
  return d.toISOString().slice(0, 10)
})
const effectiveEnd = computed(() => {
  if (props.periodEnd) return props.periodEnd
  const d = new Date(); d.setMonth(d.getMonth() + 1); d.setDate(0)
  return d.toISOString().slice(0, 10)
})

// ── Local state ───────────────────────────────────────────────
const localSlots = ref<ShiftSlot[]>([...props.modelValue.slots])
const localAssignments = ref<DaySlotAssignment[]>([...props.modelValue.assignments])

watch([localSlots, localAssignments], () => {
  emit('update:modelValue', { slots: localSlots.value, assignments: localAssignments.value })
}, { deep: true })

// ── Week navigation ───────────────────────────────────────────
function sundayOf(d: Date): Date {
  const c = new Date(d); c.setDate(c.getDate() - c.getDay()); return c
}
const weekStart = ref<Date>(sundayOf(new Date()))
watch(effectiveStart, val => { weekStart.value = sundayOf(new Date(val)) }, { immediate: true })

const weekDays = computed(() => {
  const pStart = new Date(effectiveStart.value)
  const pEnd = new Date(effectiveEnd.value)
  const hasPeriod = !!(props.periodStart && props.periodEnd)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart.value); d.setDate(d.getDate() + i)
    const dow = d.getDay()
    return {
      date: d.toISOString().slice(0, 10),
      dowLabel: DOW_LABELS[dow],
      monthDay: `${d.getMonth() + 1}/${d.getDate()}`,
      isWeekend: dow === 0 || dow === 6,
      inPeriod: !hasPeriod || (d >= pStart && d <= pEnd),
    }
  })
})

const weekLabel = computed(() => {
  const [first, last] = [weekDays.value[0], weekDays.value[6]]
  const fd = new Date(first.date); const ld = new Date(last.date)
  return fd.getMonth() === ld.getMonth()
    ? `${fd.getFullYear()}年${fd.getMonth() + 1}月 ${fd.getDate()}〜${ld.getDate()}日`
    : `${fd.getFullYear()}年${fd.getMonth() + 1}月${fd.getDate()}日〜${ld.getMonth() + 1}月${ld.getDate()}日`
})

const canGoPrev = computed(() =>
  weekStart.value.getTime() > sundayOf(new Date(effectiveStart.value)).getTime(),
)
const canGoNext = computed(() => {
  const we = new Date(weekStart.value); we.setDate(we.getDate() + 6)
  return we.toISOString().slice(0, 10) < effectiveEnd.value
})
function prevWeek() { const d = new Date(weekStart.value); d.setDate(d.getDate() - 7); weekStart.value = d }
function nextWeek() { const d = new Date(weekStart.value); d.setDate(d.getDate() + 7); weekStart.value = d }

// ── Time ↔ pixel / minute helpers ────────────────────────────
function timeToY(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return ((h - START_HOUR) * 60 + m) * (HOUR_PX / 60)
}
function yToTime(y: number): string {
  const snapped = Math.round((y / HOUR_PX) * 4) / 4
  const totalMin = clamp(snapped * 60, 0, (END_HOUR - START_HOUR) * 60)
  const hour = Math.floor(totalMin / 60) + START_HOUR
  const min = Math.round(totalMin % 60)
  return `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`
}
function timeToMin(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return (h - START_HOUR) * 60 + m
}
function minToTime(minutes: number): string {
  const h = Math.floor(minutes / 60) + START_HOUR
  const m = minutes % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}
function clamp(v: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, v)) }
function snapMin(minutes: number) { return Math.round(minutes / 15) * 15 }

// ── Calendar event helpers ────────────────────────────────────
function getDayEvents(date: string) {
  const a = localAssignments.value.find(x => x.date === date)
  if (!a) return []
  return a.slotIds.flatMap(id => {
    const slot = localSlots.value.find(s => s.id === id)
    return slot ? [{ slot }] : []
  })
}

function getEventStyle(slot: ShiftSlot): Record<string, string | number> {
  const top = timeToY(slot.startTime)
  const height = Math.max(timeToY(slot.endTime) - top, QUARTER_PX)
  const isDragging = eventDrag.value?.slotId === slot.id
  return {
    top: `${top}px`,
    height: `${height}px`,
    background: slot.color,
    opacity: isDragging ? 0.3 : 1,
    cursor: 'grab',
    zIndex: isDragging ? 0 : 1,
  }
}

function getSlotById(id: string) { return localSlots.value.find(s => s.id === id) }

function applySlotToDate(date: string, slotId: string) {
  const existing = localAssignments.value.find(a => a.date === date)
  if (existing) { if (!existing.slotIds.includes(slotId)) existing.slotIds.push(slotId) }
  else localAssignments.value.push({ date, slotIds: [slotId] })
}

function removeEvent(slotId: string, date: string) {
  const a = localAssignments.value.find(x => x.date === date)
  if (a) a.slotIds = a.slotIds.filter(id => id !== slotId)
  if (!localAssignments.value.some(x => x.slotIds.includes(slotId)))
    localSlots.value = localSlots.value.filter(s => s.id !== slotId)
}

// ── New-event drag (column background drag) ───────────────────
const scrollRef = ref<HTMLElement>()
const calBodyRef = ref<HTMLElement>()
const drag = ref({ active: false, date: '', startY: 0, endY: 0, startTime: '', endTime: '' })

function onColMouseDown(e: MouseEvent, date: string) {
  const scrollEl = scrollRef.value; if (!scrollEl) return
  const getScrollY = (clientY: number) => {
    const rect = scrollEl.getBoundingClientRect()
    return clamp(clientY - rect.top + scrollEl.scrollTop, 0, TOTAL_HEIGHT)
  }
  const startY = getScrollY(e.clientY)
  const defaultEndY = Math.min(startY + HOUR_PX, TOTAL_HEIGHT)
  drag.value = { active: true, date, startY, endY: defaultEndY, startTime: yToTime(startY), endTime: yToTime(defaultEndY) }
  const onMove = (me: MouseEvent) => {
    const y = getScrollY(me.clientY)
    if (y > drag.value.startY + QUARTER_PX) { drag.value.endY = y; drag.value.endTime = yToTime(y) }
  }
  const onUp = () => {
    document.removeEventListener('mousemove', onMove)
    document.removeEventListener('mouseup', onUp)
    openCreateDialog()
  }
  document.addEventListener('mousemove', onMove)
  document.addEventListener('mouseup', onUp)
}

function getNewDragStyle(): Record<string, string | number> {
  const top = Math.min(drag.value.startY, drag.value.endY)
  const height = Math.max(Math.abs(drag.value.endY - drag.value.startY), QUARTER_PX)
  return { top: `${top}px`, height: `${height}px`, background: form.value.color, opacity: 0.55, border: '2px dashed rgba(255,255,255,0.7)', pointerEvents: 'none', zIndex: 2 }
}

// ── Event drag (move & resize) ────────────────────────────────
interface EventDragState {
  slotId: string
  fromDate: string
  origStartTime: string
  origEndTime: string
  startClientY: number
  startClientX: number
  previewDate: string
  previewStartTime: string
  previewEndTime: string
  mode: 'move' | 'resize'
}
const eventDrag = ref<EventDragState | null>(null)

/** Resolve which in-period date column the cursor X is over. */
function dateFromClientX(clientX: number): string | null {
  const body = calBodyRef.value; if (!body) return null
  const rect = body.getBoundingClientRect()
  const relX = clientX - rect.left - GUTTER_W
  if (relX < 0) return null
  const colW = (rect.width - GUTTER_W) / 7
  const idx = Math.floor(relX / colW)
  const day = weekDays.value[clamp(idx, 0, 6)]
  return day?.inPeriod ? day.date : null
}

function onEventMouseDown(e: MouseEvent, slot: ShiftSlot, date: string, mode: 'move' | 'resize') {
  const scrollEl = scrollRef.value; if (!scrollEl) return
  const startClientY = e.clientY
  const startClientX = e.clientX
  let hasDragged = false

  const getScrollY = (clientY: number) =>
    clamp(clientY - scrollEl.getBoundingClientRect().top + scrollEl.scrollTop, 0, TOTAL_HEIGHT)

  const onMove = (me: MouseEvent) => {
    const dxAbs = Math.abs(me.clientX - startClientX)
    const dyAbs = Math.abs(me.clientY - startClientY)
    if (!hasDragged && (dxAbs > 4 || dyAbs > 4)) {
      hasDragged = true
      eventDrag.value = {
        slotId: slot.id,
        fromDate: date,
        origStartTime: slot.startTime,
        origEndTime: slot.endTime,
        startClientY,
        startClientX,
        previewDate: date,
        previewStartTime: slot.startTime,
        previewEndTime: slot.endTime,
        mode,
      }
    }
    if (!hasDragged || !eventDrag.value) return

    const MAX_MIN = (END_HOUR - START_HOUR) * 60
    const rawDelta = ((me.clientY - startClientY) / HOUR_PX) * 60
    const deltaMin = snapMin(rawDelta)

    if (mode === 'move') {
      const origStart = timeToMin(slot.startTime)
      const origEnd = timeToMin(slot.endTime)
      const dur = origEnd - origStart
      const newStart = clamp(origStart + deltaMin, 0, MAX_MIN - dur)
      eventDrag.value.previewStartTime = minToTime(newStart)
      eventDrag.value.previewEndTime = minToTime(newStart + dur)
      // Horizontal: detect target date column
      const targetDate = dateFromClientX(me.clientX)
      if (targetDate) eventDrag.value.previewDate = targetDate
    }
    else {
      // resize: only vertical, only endTime changes
      const origEnd = timeToMin(slot.endTime)
      const origStart = timeToMin(slot.startTime)
      const newEnd = clamp(origEnd + deltaMin, origStart + 15, MAX_MIN)
      eventDrag.value.previewEndTime = minToTime(newEnd)
    }
  }

  const onUp = () => {
    document.removeEventListener('mousemove', onMove)
    document.removeEventListener('mouseup', onUp)
    if (hasDragged && eventDrag.value) {
      commitEventDrag()
    }
    else {
      openEditDialog(slot, date)
    }
    eventDrag.value = null
  }

  document.addEventListener('mousemove', onMove)
  document.addEventListener('mouseup', onUp)
}

function commitEventDrag() {
  const ed = eventDrag.value; if (!ed) return
  const idx = localSlots.value.findIndex(s => s.id === ed.slotId)
  if (idx === -1) return

  // Update the slot's times
  localSlots.value[idx] = {
    ...localSlots.value[idx],
    startTime: ed.previewStartTime,
    endTime: ed.previewEndTime,
  }

  // If moved to a different date, transfer the assignment
  if (ed.mode === 'move' && ed.previewDate !== ed.fromDate) {
    const fromA = localAssignments.value.find(a => a.date === ed.fromDate)
    if (fromA) fromA.slotIds = fromA.slotIds.filter(id => id !== ed.slotId)
    applySlotToDate(ed.previewDate, ed.slotId)
  }
}

function getEvDragPreviewStyle(): Record<string, string | number> {
  const ed = eventDrag.value; if (!ed) return {}
  const top = timeToY(ed.previewStartTime)
  const height = Math.max(timeToY(ed.previewEndTime) - top, QUARTER_PX)
  const slot = getSlotById(ed.slotId)
  return {
    top: `${top}px`,
    height: `${height}px`,
    background: slot?.color ?? '#3587dc',
    opacity: 0.75,
    border: '2px solid rgba(255,255,255,0.55)',
    zIndex: 3,
    pointerEvents: 'none',
  }
}

// ── Library drag ──────────────────────────────────────────────
function onLibraryMouseDown(e: MouseEvent, template: BlockTemplate) {
  e.preventDefault()
  libraryDrag.value = { template, clientX: e.clientX, clientY: e.clientY, previewDate: null }

  const onMove = (me: MouseEvent) => {
    if (!libraryDrag.value) return
    libraryDrag.value.clientX = me.clientX
    libraryDrag.value.clientY = me.clientY
    libraryDrag.value.previewDate = dateFromClientX(me.clientX)
  }
  const onUp = (me: MouseEvent) => {
    document.removeEventListener('mousemove', onMove)
    document.removeEventListener('mouseup', onUp)
    const date = dateFromClientX(me.clientX)
    if (date) applyLibraryDrop(date, template)
    libraryDrag.value = null
  }
  document.addEventListener('mousemove', onMove)
  document.addEventListener('mouseup', onUp)
}

function applyLibraryDrop(date: string, template: BlockTemplate) {
  const newSlot: ShiftSlot = {
    id: `slot-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    label: template.label,
    startTime: template.startTime,
    endTime: template.endTime,
    color: template.color,
    departmentConfigs: template.departmentConfigs.map(dc => ({
      ...dc, roleRequirements: dc.roleRequirements.map(rr => ({ ...rr })),
    })),
  }
  localSlots.value.push(newSlot)
  applySlotToDate(date, newSlot.id)
}

// ── Department config helpers ─────────────────────────────────
function availableDepts(currentDept: string): string[] {
  const used = form.value.departmentConfigs.map(dc => dc.department)
  return ALL_DEPARTMENTS.filter(d => d === currentDept || !used.includes(d))
}
function makeDeptConfig(dept: string): DepartmentConfig {
  return { department: dept, roleRequirements: getRolesForDept(dept).map(role => ({ role, count: 0 })) }
}
function addDepartment() {
  const used = form.value.departmentConfigs.map(dc => dc.department)
  const next = ALL_DEPARTMENTS.find(d => !used.includes(d))
  if (next) form.value.departmentConfigs.push(makeDeptConfig(next))
}
function removeDepartment(idx: number) {
  if (form.value.departmentConfigs.length > 1) form.value.departmentConfigs.splice(idx, 1)
}
function onDeptChange(idx: number, newDept: string) {
  form.value.departmentConfigs[idx] = makeDeptConfig(newDept)
}

// ── Dialog / Form ─────────────────────────────────────────────
const dialog = ref({ show: false, isEdit: false })
const dialogMode = ref<'slot' | 'template'>('slot')
const editingSlotId = ref('')
const editingDate = ref('')
const editingTemplateId = ref('')
const selectedPresetId = ref<string | null>(null)
const dialogDateLabel = ref('')

interface FormState {
  label: string; startTime: string; endTime: string
  color: SlotColor; departmentConfigs: DepartmentConfig[]
}

const defaultForm = (): FormState => ({
  label: '',
  startTime: drag.value.startTime || '10:00',
  endTime: drag.value.endTime || '18:00',
  color: SLOT_COLORS[localSlots.value.length % SLOT_COLORS.length],
  departmentConfigs: [makeDeptConfig('キッチン')],
})
const form = ref<FormState>(defaultForm())

function onPresetSelect(presetId: string | null) {
  if (!presetId) return
  const p = TIME_PRESETS.find(x => x.id === presetId)
  if (p) { form.value.label = p.label; form.value.startTime = p.startTime; form.value.endTime = p.endTime }
}

function openCreateDialog() {
  selectedPresetId.value = null
  form.value = defaultForm()
  editingSlotId.value = ''
  editingDate.value = drag.value.date
  dialogDateLabel.value = formatDialogDate(drag.value.date)
  dialogMode.value = 'slot'
  dialog.value = { show: true, isEdit: false }
}

function openEditDialog(slot: ShiftSlot, date: string) {
  selectedPresetId.value = TIME_PRESETS.find(
    p => p.startTime === slot.startTime && p.endTime === slot.endTime,
  )?.id ?? null
  form.value = {
    label: slot.label, startTime: slot.startTime, endTime: slot.endTime, color: slot.color,
    departmentConfigs: slot.departmentConfigs.map(dc => ({
      department: dc.department,
      roleRequirements: dc.roleRequirements.map(rr => ({ ...rr })),
    })),
  }
  editingSlotId.value = slot.id
  editingDate.value = date
  dialogDateLabel.value = formatDialogDate(date)
  dialogMode.value = 'slot'
  dialog.value = { show: true, isEdit: true }
}

function openAddTemplate() {
  selectedPresetId.value = null
  form.value = defaultForm()
  editingTemplateId.value = ''
  dialogMode.value = 'template'
  dialog.value = { show: true, isEdit: false }
}

function openEditTemplate(tpl: BlockTemplate) {
  selectedPresetId.value = TIME_PRESETS.find(
    p => p.startTime === tpl.startTime && p.endTime === tpl.endTime,
  )?.id ?? null
  form.value = {
    label: tpl.label, startTime: tpl.startTime, endTime: tpl.endTime,
    color: tpl.color,
    departmentConfigs: tpl.departmentConfigs.map(dc => ({
      ...dc, roleRequirements: dc.roleRequirements.map(rr => ({ ...rr })),
    })),
  }
  editingTemplateId.value = tpl.id
  dialogMode.value = 'template'
  dialog.value = { show: true, isEdit: true }
}

function cancelDialog() { drag.value.active = false; dialog.value.show = false }

function saveEvent() {
  const slotData: Omit<ShiftSlot, 'id'> = {
    label: form.value.label, startTime: form.value.startTime, endTime: form.value.endTime,
    color: form.value.color,
    departmentConfigs: form.value.departmentConfigs.map(dc => ({
      department: dc.department,
      roleRequirements: dc.roleRequirements.map(rr => ({ ...rr })),
    })),
  }
  if (dialog.value.isEdit) {
    const idx = localSlots.value.findIndex(s => s.id === editingSlotId.value)
    if (idx !== -1) localSlots.value[idx] = { id: editingSlotId.value, ...slotData }
  }
  else {
    const newSlot: ShiftSlot = { id: `slot-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, ...slotData }
    localSlots.value.push(newSlot)
    applySlotToDate(editingDate.value, newSlot.id)
  }
  drag.value.active = false
  dialog.value.show = false
}

function saveTemplate() {
  const tplData = {
    label: form.value.label,
    startTime: form.value.startTime,
    endTime: form.value.endTime,
    color: form.value.color,
    departmentConfigs: form.value.departmentConfigs.map(dc => ({
      ...dc, roleRequirements: dc.roleRequirements.map(rr => ({ ...rr })),
    })),
  }
  if (dialog.value.isEdit) {
    const idx = libraryTemplates.value.findIndex(t => t.id === editingTemplateId.value)
    if (idx !== -1) libraryTemplates.value[idx] = { id: editingTemplateId.value, ...tplData }
  }
  else {
    libraryTemplates.value.push({ id: `tpl-${Date.now()}`, ...tplData })
  }
  dialog.value.show = false
}

function deleteTemplate(id: string) {
  libraryTemplates.value = libraryTemplates.value.filter(t => t.id !== id)
}

function saveBlockToLibrary() {
  libraryTemplates.value.push({
    id: `tpl-${Date.now()}`,
    label: form.value.label,
    startTime: form.value.startTime,
    endTime: form.value.endTime,
    color: form.value.color,
    departmentConfigs: form.value.departmentConfigs.map(dc => ({
      ...dc, roleRequirements: dc.roleRequirements.map(rr => ({ ...rr })),
    })),
  })
}

function deleteEditingEvent() {
  removeEvent(editingSlotId.value, editingDate.value)
  drag.value.active = false; dialog.value.show = false
}

function formatDialogDate(dateStr: string): string {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' })
}

onMounted(() => {
  nextTick(() => { if (scrollRef.value) scrollRef.value.scrollTop = (8 - START_HOUR) * HOUR_PX })
})
</script>

<style scoped>
.week-cal { user-select: none; }
.is-ev-dragging,
.is-ev-dragging * { cursor: grabbing !important; }

/* ── Frame ── */
.cal-frame { border: 1px solid rgba(0,0,0,0.12); border-radius: 10px; overflow: hidden; }

/* ── Header ── */
.cal-header { display: flex; border-bottom: 1px solid rgba(0,0,0,0.1); background: rgba(0,0,0,0.015); }
.time-gutter { width: 52px; flex-shrink: 0; }
.day-header-cell { flex: 1; text-align: center; padding: 8px 4px; border-left: 1px solid rgba(0,0,0,0.06); }
.day-header-cell--out { opacity: 0.3; }

/* ── Scroll area ── */
.cal-scroll { overflow-y: auto; max-height: 560px; }
.cal-body { display: flex; position: relative; }
.hour-label { position: absolute; right: 6px; font-size: 10px; color: rgba(0,0,0,0.38); white-space: nowrap; line-height: 1; }

/* ── Day columns ── */
.day-col { flex: 1; position: relative; border-left: 1px solid rgba(0,0,0,0.06); cursor: crosshair; min-width: 80px; }
.day-col--out { background: rgba(0,0,0,0.018); cursor: default; pointer-events: none; }
.day-col--drop-target { background: rgba(var(--v-theme-primary), 0.06); }
.hour-line { position: absolute; left: 0; right: 0; border-top: 1px solid rgba(0,0,0,0.08); pointer-events: none; }
.half-line { position: absolute; left: 0; right: 0; border-top: 1px dashed rgba(0,0,0,0.05); pointer-events: none; }

/* ── Event blocks ── */
.event-block {
  position: absolute; left: 3px; right: 3px;
  border-radius: 6px; overflow: visible;
  padding: 5px 7px 12px; /* bottom pad for resize handle */
  cursor: grab; z-index: 1; transition: opacity 0.12s, box-shadow 0.12s;
}
.event-block:not(.event-block--dragging):not(.event-block--preview):not(.event-block--ev-preview):hover {
  box-shadow: 0 4px 12px rgba(0,0,0,0.25);
}
.event-block--dragging { cursor: grabbing; }
.event-block--preview { cursor: default; pointer-events: none; }
.event-block--ev-preview { cursor: grabbing; pointer-events: none; border-radius: 6px; overflow: hidden; }

.event-remove {
  position: absolute; top: 4px; right: 4px; width: 16px; height: 16px;
  border-radius: 50%; border: none; background: rgba(0,0,0,0.25); color: white;
  font-size: 11px; cursor: pointer; display: flex; align-items: center;
  justify-content: center; padding: 0; line-height: 1; transition: background 0.12s;
}
.event-remove:hover { background: rgba(0,0,0,0.5); }

/* Event content */
.eb-label { color: white; font-size: 12px; font-weight: 700; line-height: 1.3; padding-right: 18px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.eb-time  { color: rgba(255,255,255,0.75); font-size: 10px; line-height: 1.4; margin-bottom: 4px; }
.eb-dept-block { margin-top: 4px; padding-top: 4px; border-top: 1px solid rgba(255,255,255,0.18); }
.eb-dept-name { color: rgba(255,255,255,0.6); font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 2px; }
.eb-role-row { display: flex; align-items: center; justify-content: space-between; line-height: 1.5; }
.eb-role-name { color: rgba(255,255,255,0.9); font-size: 10px; flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.eb-role-badge { background: rgba(0,0,0,0.22); color: white; font-size: 10px; font-weight: 700; border-radius: 4px; padding: 0 4px; flex-shrink: 0; margin-left: 4px; }

/* ── Resize handle ── */
.resize-handle {
  position: absolute; bottom: 0; left: 0; right: 0; height: 10px;
  cursor: ns-resize; display: flex; align-items: center; justify-content: center;
  border-radius: 0 0 6px 6px;
  background: rgba(0,0,0,0.15);
  opacity: 0; transition: opacity 0.15s;
}
.resize-handle::after {
  content: ''; display: block; width: 22px; height: 2px;
  background: rgba(255,255,255,0.7); border-radius: 1px;
}
.event-block:hover .resize-handle { opacity: 1; }

/* ── Dialog ── */
.section-label { font-size: 11px; font-weight: 700; text-transform: uppercase; color: rgba(0,0,0,0.45); letter-spacing: 0.06em; margin-bottom: 8px; }

/* ── Role stepper ── */
.role-row { display: flex; align-items: center; justify-content: space-between; padding: 5px 0; border-bottom: 1px solid rgba(0,0,0,0.05); }
.role-row:last-child { border-bottom: none; }
.role-name { flex: 1; font-size: 13px; }
.role-stepper { display: flex; align-items: center; gap: 6px; }
.stepper-btn { width: 26px; height: 26px; border-radius: 6px; border: 1px solid rgba(0,0,0,0.15); background: white; cursor: pointer; display: flex; align-items: center; justify-content: center; padding: 0; transition: background 0.12s; }
.stepper-btn:hover:not(:disabled) { background: rgba(0,0,0,0.06); }
.stepper-btn:disabled { opacity: 0.3; cursor: default; }
.stepper-val { min-width: 24px; text-align: center; font-size: 14px; font-weight: 600; }

/* ── Color swatches ── */
.color-swatch { width: 28px; height: 28px; border-radius: 50%; cursor: pointer; transition: transform 0.15s; }
.color-swatch:hover { transform: scale(1.18); }

/* ── Block Library panel ── */
.library-title { font-size: 11px; font-weight: 700; text-transform: uppercase; color: rgba(0,0,0,0.45); letter-spacing: 0.06em; }
.library-scroll { display: flex; gap: 8px; overflow-x: auto; padding-bottom: 4px; }
.library-scroll::-webkit-scrollbar { height: 4px; }
.library-scroll::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.15); border-radius: 2px; }

.library-card {
  display: flex; align-items: stretch; flex-shrink: 0;
  border: 1px solid rgba(0,0,0,0.10); border-radius: 8px;
  cursor: grab; overflow: hidden; background: white;
  min-width: 110px; position: relative;
  transition: box-shadow 0.12s, transform 0.12s;
}
.library-card:hover { box-shadow: 0 2px 8px rgba(0,0,0,0.14); transform: translateY(-1px); }
.lc-bar { width: 4px; flex-shrink: 0; background: var(--tpl-color); }
.lc-body { padding: 6px 8px 6px 6px; flex: 1; min-width: 0; }
.lc-label { font-size: 12px; font-weight: 700; color: rgba(0,0,0,0.82); white-space: nowrap; }
.lc-time  { font-size: 10px; color: rgba(0,0,0,0.5); white-space: nowrap; }
.lc-depts { font-size: 10px; color: rgba(0,0,0,0.4); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.lc-menu-btn { position: absolute; top: 2px; right: 2px; opacity: 0; transition: opacity 0.12s; }
.library-card:hover .lc-menu-btn { opacity: 1; }

/* ── Ghost card (follows cursor) ── */
.library-ghost {
  position: fixed; pointer-events: none; z-index: 9999;
  transform: translate(-50%, -50%) rotate(3deg);
  display: flex; align-items: stretch; border-radius: 8px;
  overflow: hidden; width: 120px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.22);
  background: white; opacity: 0.9;
}
</style>
