<template>
  <div class="gantt-wrapper">
    <!-- Main scrollable grid -->
    <div ref="mainRef" class="gantt-main">
      <div
        class="gantt-grid"
        :style="gridStyle"
      >
        <!-- ── ROW 0: Header ── -->
        <!-- Corner cell -->
        <div class="gantt-corner gantt-cell gantt-header-cell">
          <span class="text-caption text-medium-emphasis">従業員</span>
        </div>

        <!-- Date headers -->
        <div
          v-for="day in days"
          :key="`hdr-${day.date}`"
          class="gantt-date-header gantt-cell gantt-header-cell"
          :class="{ 'weekend': day.isWeekend, 'today': day.isToday }"
        >
          <div class="d-flex flex-column align-center">
            <span class="text-caption font-weight-medium" :class="day.isToday ? 'text-primary' : ''">
              {{ day.dayNum }}
            </span>
            <span class="text-caption" style="font-size: 9px" :class="day.isWeekend ? 'text-error' : 'text-medium-emphasis'">
              {{ day.dayOfWeek }}
            </span>
          </div>
        </div>

        <!-- Stats column header -->
        <div class="gantt-stats-header gantt-cell gantt-header-cell">
          <span class="text-caption text-medium-emphasis">時間 / コスト</span>
        </div>

        <!-- ── ROWS 1+: Employees ── -->
        <template v-for="emp in employees" :key="emp.id">
          <!-- Employee name column -->
          <div class="gantt-employee-col gantt-cell gantt-emp-cell">
            <div class="d-flex align-center ga-2 w-100">
              <v-avatar :color="deptColor(emp.department)" size="26" style="flex-shrink:0">
                <span class="text-white" style="font-size: 10px">{{ emp.name.charAt(0) }}</span>
              </v-avatar>
              <div class="overflow-hidden flex-1-1">
                <div class="text-caption font-weight-medium text-truncate">{{ emp.name }}</div>
                <div class="text-caption text-medium-emphasis" style="font-size: 9px">{{ emp.department }}</div>
                <template v-if="collection">
                  <div class="d-flex align-center ga-1 mt-1">
                    <span class="sub-badge" :class="submissionFor(emp.id)?.submitted ? 'sub-badge--ok' : 'sub-badge--pending'">
                      <v-icon :size="9">{{ submissionFor(emp.id)?.submitted ? 'mdi-check' : 'mdi-clock-outline' }}</v-icon>
                      {{ submissionFor(emp.id)?.submitted ? '提出済み' : '未提出' }}
                    </span>
                    <v-tooltip v-if="!submissionFor(emp.id)?.submitted && collection.status === 'COLLECTING'" :text="`${emp.name}にリマインドを送信`" location="right">
                      <template #activator="{ props: tipProps }">
                        <v-btn
                          v-bind="tipProps"
                          icon
                          size="x-small"
                          variant="text"
                          color="primary"
                          style="width:18px;height:18px"
                          @click.stop="sendReminderTo(emp.name)"
                        >
                          <v-icon size="12">mdi-bell-outline</v-icon>
                        </v-btn>
                      </template>
                    </v-tooltip>
                  </div>
                </template>
              </div>
            </div>
          </div>

          <!-- Day cells -->
          <div
            v-for="day in days"
            :key="`cell-${emp.id}-${day.date}`"
            class="gantt-cell gantt-day-cell"
            :class="[
              cellClass(emp.id, day.date),
              { 'weekend': day.isWeekend, 'today': day.isToday }
            ]"
            @click="onCellClick(emp.id, day.date, $event)"
          >
            <!-- Entry chips -->
            <ShiftEntryChip
              v-for="entry in getEntries(emp.id, day.date)"
              :key="entry.id"
              :entry="entry"
              @click="openEditor(entry)"
            />

            <!-- Add icon on hover -->
            <div class="cell-add-hint" :class="{ 'cell-add-hint--corner': getEntries(emp.id, day.date).length > 0 }">
              <v-icon size="14" color="medium-emphasis">mdi-plus</v-icon>
            </div>
          </div>

          <!-- Stats column cell -->
          <div class="gantt-stats-col gantt-cell">
            <template v-if="empStats(emp.id)">
              <div class="px-2 py-1 w-100">
                <div class="d-flex justify-space-between align-center mb-1">
                  <span
                    class="text-caption"
                    style="font-size: 10px"
                    :class="empStats(emp.id)!.isOver ? 'text-error font-weight-bold' : 'text-medium-emphasis'"
                  >
                    {{ empStats(emp.id)!.hours }}h / {{ empStats(emp.id)!.maxHours }}h
                  </span>
                  <v-icon v-if="empStats(emp.id)!.isOver" size="11" color="error">mdi-alert</v-icon>
                </div>
                <v-progress-linear
                  :model-value="Math.min(100, (empStats(emp.id)!.hours / empStats(emp.id)!.maxHours) * 100)"
                  :color="empStats(emp.id)!.isOver ? 'error' : 'primary'"
                  bg-color="#E0E1E4"
                  height="3"
                  rounded
                />
                <div class="text-caption text-medium-emphasis mt-1" style="font-size: 10px">
                  ¥{{ empStats(emp.id)!.cost.toLocaleString() }}
                </div>
              </div>
            </template>
          </div>
        </template>
      </div>
    </div>

    <!-- Cost summary panel -->
    <CostSummaryPanel />

    <!-- Shift editor dialog -->
    <ShiftEntryEditor
      v-model="editorOpen"
      :employee-id="editorState.employeeId"
      :shift-date="editorState.shiftDate"
      :entry="editorState.entry"
      :board-status="boardStatus"
      @save="handleSave"
      @delete="handleDelete"
    />
  </div>
</template>

<script setup lang="ts">
import { useShiftStore } from '~/stores/shift.store'
import type { ShiftEntry, CellStatus } from '~/types'
import { useMockData } from '~/composables/useMockData'

const props = defineProps<{
  boardId: string
  periodStart: string
  periodEnd: string
}>()

const shiftStore = useShiftStore()
const { employees: allEmployees, getCollectionForBoard } = useMockData()

const boardStatus = computed(() => shiftStore.currentBoard?.status ?? 'DRAFT')

// Collection data for submission status
const collection = computed(() => getCollectionForBoard(props.boardId))

function submissionFor(empId: string) {
  return collection.value?.submissions?.find(s => s.employeeId === empId)
}

function sendReminderTo(name: string) {
  shiftStore.showSnackbar(`${name}にリマインドを送信しました`)
}

const empStatsMap = computed(() => {
  const map = new Map<string, (typeof shiftStore.perEmployeeStats)[0]>()
  for (const s of shiftStore.perEmployeeStats) map.set(s.employeeId, s)
  return map
})

function empStats(empId: string) {
  return empStatsMap.value.get(empId)
}

const employees = computed(() =>
  allEmployees.filter(e => e.status === 'ACTIVE')
)

// Build days array for the period
const days = computed(() => {
  const result = []
  const start = new Date(props.periodStart)
  const end = new Date(props.periodEnd)
  const today = '2026-03-01'
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split('T')[0]
    const dow = d.getDay()
    result.push({
      date: dateStr,
      dayNum: d.getDate(),
      dayOfWeek: ['日', '月', '火', '水', '木', '金', '土'][dow],
      isWeekend: dow === 0 || dow === 6,
      isToday: dateStr === today,
    })
  }
  return result
})

const gridStyle = computed(() => ({
  gridTemplateColumns: `200px repeat(${days.value.length}, 80px) 160px`,
}))

// Entries lookup
function getEntries(empId: string, date: string): ShiftEntry[] {
  return shiftStore.entries.filter(e => e.employeeId === empId && e.shiftDate === date)
}

function cellClass(empId: string, date: string): string {
  const entries = getEntries(empId, date)
  if (entries.length === 0) return 'cell-undecided'
  if (entries.length > 1) return 'cell-multi'
  const map: Record<CellStatus, string> = {
    SHIFT_REQUESTED: 'cell-shift-requested',
    CONFIRMED: 'cell-confirmed',
    DAY_OFF_REQUESTED: 'cell-day-off-requested',
    DAY_OFF_CONFIRMED: 'cell-day-off',
    ADJUSTING: 'cell-adjusting',
  }
  return map[entries[0].cellStatus] ?? 'cell-undecided'
}

function deptColor(dept: string): string {
  const map: Record<string, string> = {
    'キッチン': '#3587dc',
    'ホール': '#4bd08b',
    'レジ': '#f8c076',
  }
  return map[dept] ?? '#80848e'
}

// Editor state
const editorOpen = ref(false)
const editorState = reactive({
  employeeId: '',
  shiftDate: '',
  entry: null as ShiftEntry | null,
})

function onCellClick(empId: string, date: string, _event: MouseEvent) {
  // Always open in add-mode — chips handle their own click with @click.stop
  editorState.employeeId = empId
  editorState.shiftDate = date
  editorState.entry = null
  editorOpen.value = true
}

function openEditor(entry: ShiftEntry) {
  editorState.employeeId = entry.employeeId
  editorState.shiftDate = entry.shiftDate
  editorState.entry = entry
  editorOpen.value = true
}

// Save from editor
let nextEntryId = 200

function handleSave(changes: Partial<ShiftEntry>) {
  if (editorState.entry) {
    shiftStore.updateEntry(editorState.entry.id, changes)
  } else {
    const emp = allEmployees.find(e => e.id === editorState.employeeId)
    shiftStore.addEntry({
      id: `entry-${nextEntryId++}`,
      employeeId: editorState.employeeId,
      shiftDate: editorState.shiftDate,
      startTime: changes.startTime ?? '10:00',
      endTime: changes.endTime ?? '18:00',
      department: emp?.department ?? '',
      cellStatus: 'CONFIRMED',
      estimatedWage: changes.estimatedWage ?? 0,
      note: changes.note,
    })
  }
}

function handleDelete(entryId: string) {
  shiftStore.deleteEntry(entryId)
}

const mainRef = ref<HTMLElement | null>(null)
</script>

<style scoped>
.gantt-cell {
  border-right: 1px solid #e0e1e4;
  border-bottom: 1px solid #e0e1e4;
  min-height: 48px;
  box-sizing: border-box;
}

.gantt-header-cell {
  background: #F8F9FA;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 6px 4px;
  border-top: 1px solid #e0e1e4;
  border-left: 1px solid #e0e1e4;
  height: 52px;
  font-weight: 500;
}

.gantt-emp-cell {
  background: white;
  padding: 4px 8px;
  display: flex;
  align-items: center;
  border-left: 1px solid #e0e1e4;
  min-height: 72px;
}

.gantt-day-cell {
  padding: 2px;
  position: relative;
  cursor: pointer;
  transition: background 0.1s;
}

.gantt-day-cell:hover {
  filter: brightness(0.97);
}

.gantt-day-cell.weekend {
  background-color: rgba(230, 39, 62, 0.03);
}

.gantt-day-cell.today {
  border-top: 2px solid #3587dc;
}

.gantt-header-cell.weekend .text-caption:first-child {
  color: #e6273e;
}

.gantt-header-cell.today {
  background: #EBF3FC;
}

.cell-add-hint {
  display: none;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.cell-add-hint--corner {
  top: 3px;
  right: 3px;
  left: auto;
  transform: none;
}

.gantt-day-cell:hover .cell-add-hint {
  display: flex;
}

.cell-multi {
  background-color: #FFFFFF;
}

/* Submission status badge */
.sub-badge {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 1px 5px;
  border-radius: 8px;
  font-size: 9px;
  font-weight: 600;
  white-space: nowrap;
  line-height: 1.4;
}

.sub-badge--ok      { background: rgba(22, 163, 74, 0.1);   color: #15803d; }
.sub-badge--pending { background: rgba(245, 158, 11, 0.12); color: #b45309; }

.gantt-stats-header {
  position: sticky;
  top: 0;
  right: 0;
  z-index: 3;
  background: #F8F9FA;
  border-left: 2px solid #e0e1e4;
}

.gantt-stats-col {
  position: sticky;
  right: 0;
  z-index: 2;
  background: white;
  border-left: 2px solid #e0e1e4;
  display: flex;
  align-items: center;
}

/* Cell status classes — background intentionally removed;
   status is communicated only by the ShiftEntryChip itself. */
.cell-confirmed,
.cell-shift-requested,
.cell-day-off,
.cell-day-off-requested,
.cell-adjusting,
.cell-undecided {
  background-color: #FFFFFF;
}
</style>
