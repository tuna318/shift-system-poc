<template>
  <div class="new-board-page">
    <!-- Header -->
    <div class="d-flex align-center ga-3 mb-6">
      <v-btn to="/shifts/board" icon size="small" variant="text">
        <v-icon>mdi-arrow-left</v-icon>
      </v-btn>
      <div>
        <h1 class="text-h5 font-weight-bold">新しいシフトを作成</h1>
        <p class="text-body-2 text-medium-emphasis mt-1">シフト収集とボードを同時に作成します</p>
      </div>
    </div>

    <!-- 基本情報 + 収集設定 -->
    <v-card rounded="xl" elevation="0" border class="mb-4">
      <v-card-text class="pa-6">
        <div class="d-flex align-center ga-2 mb-5">
          <v-icon color="primary" size="20">mdi-information-outline</v-icon>
          <span class="text-subtitle-2 font-weight-bold">基本情報</span>
        </div>

        <!-- Row 1: name + budget -->
        <v-row dense class="mb-1">
          <v-col cols="12" sm="7">
            <v-text-field
              v-model="form.name"
              label="シフト名"
              placeholder="例: 2026年5月 シフト"
              variant="outlined"
              density="comfortable"
              rounded="lg"
            />
          </v-col>
          <v-col cols="12" sm="5">
            <v-text-field
              v-model.number="form.budgetAmount"
              label="月次予算（任意）"
              type="number"
              variant="outlined"
              density="comfortable"
              rounded="lg"
              prefix="¥"
              min="0"
            />
          </v-col>
        </v-row>

        <!-- Row 2: period start / end / deadline -->
        <v-row dense class="mb-1">
          <v-col cols="12" sm="4">
            <v-text-field
              v-model="form.periodStart"
              label="シフト期間（開始）"
              type="date"
              variant="outlined"
              density="comfortable"
              rounded="lg"
              @update:model-value="onPeriodChange"
            />
          </v-col>
          <v-col cols="12" sm="4">
            <v-text-field
              v-model="form.periodEnd"
              label="シフト期間（終了）"
              type="date"
              variant="outlined"
              density="comfortable"
              rounded="lg"
              :min="form.periodStart"
              @update:model-value="onPeriodChange"
            />
          </v-col>
          <v-col cols="12" sm="4">
            <v-text-field
              v-model="form.deadline"
              label="提出期限"
              type="date"
              variant="outlined"
              density="comfortable"
              rounded="lg"
              hint="希望提出の締め切り"
              persistent-hint
            />
          </v-col>
        </v-row>

        <div v-if="periodDays > 0" class="mb-4">
          <v-chip size="small" variant="tonal" color="primary" prepend-icon="mdi-calendar-range">
            {{ periodDays }}日間
          </v-chip>
        </div>

        <!-- Message -->
        <v-textarea
          v-model="form.message"
          label="スタッフへのメッセージ（任意）"
          placeholder="例: 来月のシフトをご記入ください。ご希望がある方はなるべく反映します。"
          variant="outlined"
          density="comfortable"
          rounded="lg"
          rows="2"
          auto-grow
          counter="200"
          maxlength="200"
        />
      </v-card-text>
    </v-card>

    <!-- シフト配置設定 -->
    <v-card rounded="xl" elevation="0" border class="mb-4">
      <v-card-text class="pa-6">
        <div class="d-flex align-center ga-2 mb-4">
          <v-icon color="primary" size="20">mdi-calendar-clock-outline</v-icon>
          <span class="text-subtitle-2 font-weight-bold">シフト配置設定</span>
        </div>
        <ShiftAllocationCalendar
          v-model="allocationData"
          :period-start="form.periodStart"
          :period-end="form.periodEnd"
        />
      </v-card-text>
    </v-card>

    <!-- 対象スタッフ -->
    <v-card rounded="xl" elevation="0" border class="mb-6">
      <v-card-text class="pa-6">
        <div class="d-flex align-center justify-space-between mb-4">
          <div class="d-flex align-center ga-2">
            <v-icon color="primary" size="20">mdi-account-group-outline</v-icon>
            <span class="text-subtitle-2 font-weight-bold">対象スタッフ</span>
          </div>
          <div class="d-flex align-center ga-3">
            <span class="text-caption text-medium-emphasis">
              {{ selectedEmployeeIds.length }}/{{ activeEmployees.length }}名選択中
            </span>
            <v-btn
              size="x-small"
              variant="tonal"
              color="primary"
              rounded="lg"
              @click="toggleAllEmployees"
            >
              {{ allSelected ? '全員解除' : '全員選択' }}
            </v-btn>
          </div>
        </div>

        <!-- Skill filter -->
        <div class="mb-4">
          <div class="d-flex align-center ga-2 mb-2">
            <v-icon size="14" color="medium-emphasis">mdi-filter-outline</v-icon>
            <span class="text-caption text-medium-emphasis">スキルで絞り込み</span>
            <v-btn
              v-if="skillFilter"
              size="x-small"
              variant="text"
              color="primary"
              @click="skillFilter = null"
            >クリア</v-btn>
          </div>
          <div class="d-flex flex-wrap ga-1">
            <v-chip
              v-for="skill in allSkills"
              :key="skill"
              size="x-small"
              :variant="skillFilter === skill ? 'flat' : 'tonal'"
              :color="skillFilter === skill ? 'primary' : 'default'"
              style="cursor: pointer"
              @click="skillFilter = skillFilter === skill ? null : skill"
            >{{ skill }}</v-chip>
          </div>
        </div>

        <div v-if="selectedEmployeeIds.length === 0" class="mb-4">
          <v-alert type="warning" variant="tonal" density="compact" rounded="lg">
            対象スタッフを1名以上選択してください
          </v-alert>
        </div>

        <v-row>
          <v-col
            v-for="dept in departments"
            v-show="dept.filteredEmployees.length > 0"
            :key="dept.name"
            cols="12" md="4"
          >
            <div class="d-flex align-center ga-2 flex-wrap mb-2">
              <v-checkbox
                :model-value="isDeptAllSelected(dept.name)"
                :indeterminate="isDeptPartialSelected(dept.name)"
                density="compact"
                hide-details
                @update:model-value="toggleDept(dept.name, $event)"
              />
              <span class="text-body-2 font-weight-medium">{{ dept.name }}</span>
              <v-chip size="x-small" variant="tonal">{{ dept.filteredEmployees.length }}名</v-chip>
              <v-chip
                v-if="allocatedDepts.includes(dept.name)"
                size="x-small"
                color="primary"
                variant="tonal"
                prepend-icon="mdi-calendar-check"
              >配置設定あり</v-chip>
            </div>

            <div class="pl-4 d-flex flex-column ga-2">
              <div
                v-for="emp in dept.filteredEmployees"
                :key="emp.id"
                class="employee-chip d-flex align-center ga-2 pa-2 rounded-lg"
                :class="{ 'employee-chip--selected': selectedEmployeeIds.includes(emp.id) }"
                style="cursor: pointer; border: 1px solid"
                :style="{
                  borderColor: selectedEmployeeIds.includes(emp.id)
                    ? 'rgb(var(--v-theme-primary))'
                    : 'rgba(0,0,0,0.12)',
                  background: selectedEmployeeIds.includes(emp.id)
                    ? 'rgba(var(--v-theme-primary), 0.08)'
                    : 'transparent',
                }"
                @click="toggleEmployee(emp.id)"
              >
                <v-checkbox
                  :model-value="selectedEmployeeIds.includes(emp.id)"
                  density="compact"
                  hide-details
                  @click.stop
                  @update:model-value="toggleEmployee(emp.id)"
                />
                <div class="flex-grow-1 min-width-0">
                  <div class="text-body-2 font-weight-medium text-truncate">{{ emp.name }}</div>
                  <div class="text-caption text-medium-emphasis">{{ emp.position }}</div>
                  <div v-if="emp.skills.length > 0" class="d-flex flex-wrap ga-1 mt-1">
                    <v-chip
                      v-for="skill in emp.skills"
                      :key="skill"
                      size="x-small"
                      :variant="skillFilter === skill ? 'flat' : 'tonal'"
                      :color="skillFilter === skill ? 'primary' : 'default'"
                    >{{ skill }}</v-chip>
                  </div>
                </div>
                <v-chip
                  size="x-small"
                  :color="emp.employmentType === 'FULL_TIME' ? 'primary' : 'default'"
                  variant="tonal"
                  class="align-self-start mt-1"
                >
                  {{ emp.employmentType === 'FULL_TIME' ? '正社員' : 'パート' }}
                </v-chip>
              </div>
            </div>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Bottom actions -->
    <div class="d-flex align-center justify-space-between">
      <v-btn to="/shifts/board" variant="text" size="large" rounded="lg">
        キャンセル
      </v-btn>
      <v-btn
        color="primary"
        size="large"
        rounded="lg"
        :disabled="!canProceed"
        @click="goToConfirm"
      >
        確認へ進む<v-icon end>mdi-arrow-right</v-icon>
      </v-btn>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useMockData } from '~/composables/useMockData'

const router = useRouter()
const { employees: allEmployees } = useMockData()
const { form, allocationData, selectedEmployeeIds } = useNewBoardForm()

// ─── Employees ───────────────────────────────────────────────
const deptNames = ['キッチン', 'ホール', 'レジ']

const activeEmployees = computed(() =>
  allEmployees.filter(e => e.status === 'ACTIVE'),
)

// Init selection on mount if empty
onMounted(() => {
  if (selectedEmployeeIds.value.length === 0) {
    selectedEmployeeIds.value = activeEmployees.value.map(e => e.id)
  }
})

const skillFilter = ref<string | null>(null)

const allSkills = computed(() => {
  const set = new Set<string>()
  for (const emp of activeEmployees.value) {
    for (const skill of emp.skills) set.add(skill)
  }
  return Array.from(set).sort()
})

const departments = computed(() =>
  deptNames.map(name => {
    const all = activeEmployees.value.filter(e => e.department === name)
    const filtered = skillFilter.value
      ? all.filter(e => e.skills.includes(skillFilter.value!))
      : all
    return { name, filteredEmployees: filtered }
  }),
)

const allSelected = computed(() =>
  selectedEmployeeIds.value.length === activeEmployees.value.length,
)

function toggleAllEmployees() {
  selectedEmployeeIds.value = allSelected.value
    ? []
    : activeEmployees.value.map(e => e.id)
}

function isDeptAllSelected(dept: string) {
  const deptIds = activeEmployees.value.filter(e => e.department === dept).map(e => e.id)
  return deptIds.length > 0 && deptIds.every(id => selectedEmployeeIds.value.includes(id))
}

function isDeptPartialSelected(dept: string) {
  const deptIds = activeEmployees.value.filter(e => e.department === dept).map(e => e.id)
  const selected = deptIds.filter(id => selectedEmployeeIds.value.includes(id))
  return selected.length > 0 && selected.length < deptIds.length
}

function toggleDept(dept: string, checked: boolean | null) {
  const deptIds = activeEmployees.value.filter(e => e.department === dept).map(e => e.id)
  if (checked) {
    selectedEmployeeIds.value = [...new Set([...selectedEmployeeIds.value, ...deptIds])]
  }
  else {
    selectedEmployeeIds.value = selectedEmployeeIds.value.filter(id => !deptIds.includes(id))
  }
}

function toggleEmployee(empId: string) {
  const idx = selectedEmployeeIds.value.indexOf(empId)
  if (idx === -1) selectedEmployeeIds.value.push(empId)
  else selectedEmployeeIds.value.splice(idx, 1)
}

// ─── Allocation ───────────────────────────────────────────────
const allocatedDepts = computed(() => {
  const depts = new Set<string>()
  for (const slot of allocationData.value.slots) {
    for (const dc of slot.departmentConfigs) {
      if (dc.roleRequirements.some(rr => rr.count > 0)) {
        depts.add(dc.department)
      }
    }
  }
  return Array.from(depts)
})

// ─── Period helpers ──────────────────────────────────────────
const periodDays = computed(() => {
  if (!form.value.periodStart || !form.value.periodEnd) return 0
  const diff = Math.round(
    (new Date(form.value.periodEnd).getTime() - new Date(form.value.periodStart).getTime())
    / (1000 * 60 * 60 * 24),
  ) + 1
  return diff > 0 ? diff : 0
})

function autoGenerateName() {
  if (!form.value.periodStart) return
  const d = new Date(form.value.periodStart)
  const generated = `${d.getFullYear()}年${d.getMonth() + 1}月 シフト`
  if (!form.value.name || /^\d{4}年\d{1,2}月 シフト$/.test(form.value.name)) {
    form.value.name = generated
  }
}

function autoSetDeadline() {
  if (!form.value.periodStart) return
  const d = new Date(form.value.periodStart)
  d.setDate(d.getDate() - 3)
  form.value.deadline = d.toISOString().slice(0, 10)
}

function onPeriodChange() {
  autoGenerateName()
  autoSetDeadline()
}

// ─── Proceed validation ───────────────────────────────────────
const canProceed = computed(() =>
  !!form.value.name.trim()
  && !!form.value.periodStart
  && !!form.value.periodEnd
  && new Date(form.value.periodEnd) >= new Date(form.value.periodStart)
  && !!form.value.deadline
  && selectedEmployeeIds.value.length > 0,
)

function goToConfirm() {
  if (!canProceed.value) return
  router.push('/shifts/board/confirm')
}
</script>

<style scoped>
.new-board-page {
  max-width: 1100px;
}

.employee-chip {
  transition: background 0.15s, border-color 0.15s;
}
</style>
