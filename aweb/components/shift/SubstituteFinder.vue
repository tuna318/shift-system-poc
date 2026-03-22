<template>
  <div class="sub-finder">
    <!-- Header -->
    <div class="sub-finder-header">
      <v-icon size="13" color="primary">mdi-account-replace</v-icon>
      <span class="sub-finder-title">代打候補</span>
      <label class="dept-toggle ml-auto">
        <input v-model="showAllDepts" type="checkbox" class="dept-toggle-input" />
        <span class="dept-toggle-label">他部署も表示</span>
      </label>
    </div>

    <!-- Empty state -->
    <div v-if="candidates.length === 0" class="sub-finder-empty">
      <v-icon size="18" color="medium-emphasis">mdi-account-off-outline</v-icon>
      <span class="text-caption text-medium-emphasis">条件に合うスタッフが見つかりません</span>
      <v-btn v-if="!showAllDepts" variant="text" size="x-small" color="primary" @click="showAllDepts = true">
        他部署も表示
      </v-btn>
    </div>

    <!-- Candidate list -->
    <div v-else class="sub-candidate-list">
      <div
        v-for="c in candidates"
        :key="c.employee.id"
        class="sub-candidate-row"
      >
        <div class="cand-avatar" :class="avatarClass(c.employee.department)">
          {{ c.employee.name.charAt(0) }}
        </div>
        <div class="cand-info">
          <div class="cand-name">{{ c.employee.name }}</div>
          <div class="cand-sub">
            {{ c.employee.department }}
            <span class="cand-hours">残 {{ c.remainingHours }}h</span>
          </div>
        </div>
        <div class="cand-actions">
          <button class="cand-btn cand-btn--sub" @click="send(c, 'SUBSTITUTE')">
            代打依頼
          </button>
          <button
            v-if="c.hasShiftOnDay"
            class="cand-btn cand-btn--swap"
            @click="send(c, 'SWAP')"
          >
            交代
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ShiftEntry, SubstitutionType } from '~/types'
import { useMockData } from '~/composables/useMockData'
import { useShiftStore, MAX_MONTHLY_HOURS } from '~/stores/shift.store'
import { useSubstitutionStore } from '~/stores/substitution.store'

const props = defineProps<{
  sourceEntry: ShiftEntry
}>()

const emit = defineEmits<{ done: [] }>()

const { employees: allEmployees } = useMockData()
const shiftStore      = useShiftStore()
const subStore        = useSubstitutionStore()

const showAllDepts = ref(false)

// ── Time overlap helper ──────────────────────────────────────
function toMins(t: string) {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

function overlaps(a: { startTime: string; endTime: string }, b: { startTime: string; endTime: string }): boolean {
  return toMins(a.startTime) < toMins(b.endTime) && toMins(a.endTime) > toMins(b.startTime)
}

// ── Candidates ───────────────────────────────────────────────
const candidates = computed(() => {
  const source = props.sourceEntry
  const allEntries = shiftStore.entries

  // Entries on the same date
  const sameDay = allEntries.filter(e => e.shiftDate === source.shiftDate)

  return allEmployees
    .filter(emp => {
      if (emp.status !== 'ACTIVE') return false
      if (emp.id === source.employeeId) return false
      if (!showAllDepts.value && emp.department !== source.department) return false
      // Filter out those with a CONFIRMED/ADJUSTING shift that overlaps the source time
      const conflicts = sameDay.filter(
        e => e.employeeId === emp.id
          && (e.cellStatus === 'CONFIRMED' || e.cellStatus === 'ADJUSTING')
          && overlaps(e, source),
      )
      return conflicts.length === 0
    })
    .map(emp => {
      // Remaining hours
      const stats = shiftStore.perEmployeeStats.find(s => s.employeeId === emp.id)
      const usedHours = stats?.hours ?? 0
      const maxHours  = MAX_MONTHLY_HOURS[emp.employmentType]
      const remainingHours = Math.max(0, Math.round((maxHours - usedHours) * 10) / 10)

      // Does this employee have any shift on that day? (for SWAP option)
      const hasShiftOnDay = sameDay.some(e => e.employeeId === emp.id)

      // Pending sub requests for this employee (fairness: fewer = higher priority)
      const pendingCount = subStore.pendingRequests.filter(r => r.targetEmployeeId === emp.id).length

      return { employee: emp, remainingHours, hasShiftOnDay, pendingCount }
    })
    // Sort: fewer pending first, then more remaining hours first
    .sort((a, b) => a.pendingCount - b.pendingCount || b.remainingHours - a.remainingHours)
})

// ── Actions ──────────────────────────────────────────────────
function send(candidate: typeof candidates.value[0], type: SubstitutionType) {
  const boardId = shiftStore.currentBoard?.id ?? ''
  subStore.createRequest({
    type,
    boardId,
    sourceEntryId: props.sourceEntry.id,
    sourceEmployeeId: props.sourceEntry.employeeId,
    sourceDate: props.sourceEntry.shiftDate,
    sourceStartTime: props.sourceEntry.startTime,
    sourceEndTime: props.sourceEntry.endTime,
    sourceDepartment: props.sourceEntry.department,
    targetEmployeeId: candidate.employee.id,
  })
  emit('done')
}

// ── Styles ───────────────────────────────────────────────────
const AVATAR_CLASSES: Record<string, string> = {
  キッチン: 'cand-avatar--kitchen',
  ホール:   'cand-avatar--hall',
  レジ:     'cand-avatar--register',
}
function avatarClass(dept: string) {
  return AVATAR_CLASSES[dept] ?? 'cand-avatar--default'
}
</script>

<style scoped>
.sub-finder {
  padding: 12px 14px;
  border-radius: 8px;
  border-left: 3px solid #3587dc;
  background: rgba(53, 135, 220, 0.04);
}

.sub-finder-header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 10px;
}

.sub-finder-title {
  font-size: 12px;
  font-weight: 600;
  color: #1d4ed8;
}

/* Dept toggle */
.dept-toggle { display: flex; align-items: center; gap: 4px; cursor: pointer; }
.dept-toggle-input { width: 13px; height: 13px; cursor: pointer; }
.dept-toggle-label { font-size: 11px; color: rgba(0,0,0,0.5); user-select: none; }

/* Empty state */
.sub-finder-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 12px 0;
}

/* Candidate list */
.sub-candidate-list { display: flex; flex-direction: column; gap: 6px; }

.sub-candidate-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  border-radius: 8px;
  background: white;
  border: 1px solid rgba(53, 135, 220, 0.15);
}

/* Avatar */
.cand-avatar {
  width: 28px; height: 28px; border-radius: 50%;
  font-size: 12px; font-weight: 700;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.cand-avatar--kitchen  { background: rgba(251,146,60,0.15); color: #ea580c; }
.cand-avatar--hall     { background: rgba(53,135,220,0.13); color: #3587dc; }
.cand-avatar--register { background: rgba(139,92,246,0.13); color: #7c3aed; }
.cand-avatar--default  { background: rgba(0,0,0,0.08);      color: rgba(0,0,0,0.5); }

/* Info */
.cand-info { flex: 1; min-width: 0; }
.cand-name { font-size: 12px; font-weight: 600; line-height: 1.3; }
.cand-sub  { font-size: 10px; color: rgba(0,0,0,0.45); line-height: 1.3; }
.cand-hours {
  display: inline-block;
  margin-left: 4px;
  padding: 0 4px;
  border-radius: 4px;
  background: rgba(53,135,220,0.1);
  color: #1d4ed8;
  font-weight: 600;
}

/* Action buttons */
.cand-actions { display: flex; gap: 4px; flex-shrink: 0; }

.cand-btn {
  display: inline-flex; align-items: center; gap: 3px;
  padding: 3px 8px; border-radius: 12px;
  font-size: 11px; font-weight: 600;
  border: 1.5px solid transparent;
  cursor: pointer; background: none; font-family: inherit;
  white-space: nowrap; transition: filter 0.1s, transform 0.08s;
}
.cand-btn:hover  { transform: scale(1.04); }
.cand-btn:active { transform: scale(1.01); }

.cand-btn--sub  { background: #3587dc; border-color: #3587dc; color: #fff; }
.cand-btn--swap { background: transparent; border-color: #f59e0b; color: #92400e; }
</style>
