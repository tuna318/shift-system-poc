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

    <v-form ref="formRef" v-model="formValid" @submit.prevent="handleSubmit">
      <v-row>
        <!-- Left column: main form -->
        <v-col cols="12" lg="8">

          <!-- Section 1: 基本情報 -->
          <v-card rounded="xl" elevation="0" border class="mb-4">
            <v-card-text class="pa-5">
              <div class="d-flex align-center ga-2 mb-4">
                <v-icon color="primary" size="20">mdi-information-outline</v-icon>
                <span class="text-subtitle-2 font-weight-bold">基本情報</span>
              </div>

              <v-text-field
                v-model="form.name"
                label="シフト名"
                placeholder="例: 2026年5月 シフト"
                variant="outlined"
                density="comfortable"
                rounded="lg"
                :rules="[rules.required]"
                class="mb-3"
              />

              <v-row dense>
                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model="form.periodStart"
                    label="シフト期間（開始）"
                    type="date"
                    variant="outlined"
                    density="comfortable"
                    rounded="lg"
                    :rules="[rules.required]"
                    @update:model-value="onPeriodChange"
                  />
                </v-col>
                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model="form.periodEnd"
                    label="シフト期間（終了）"
                    type="date"
                    variant="outlined"
                    density="comfortable"
                    rounded="lg"
                    :rules="[rules.required, rules.endAfterStart]"
                    :min="form.periodStart"
                    @update:model-value="onPeriodChange"
                  />
                </v-col>
              </v-row>

              <div v-if="form.periodStart && form.periodEnd" class="mt-1">
                <v-chip size="small" variant="tonal" color="primary" prepend-icon="mdi-calendar-range">
                  {{ periodDays }}日間
                </v-chip>
              </div>
            </v-card-text>
          </v-card>

          <!-- Section 2: シフト収集設定 -->
          <v-card rounded="xl" elevation="0" border class="mb-4">
            <v-card-text class="pa-5">
              <div class="d-flex align-center ga-2 mb-4">
                <v-icon color="primary" size="20">mdi-send-clock-outline</v-icon>
                <span class="text-subtitle-2 font-weight-bold">シフト収集設定</span>
              </div>

              <v-text-field
                v-model="form.deadline"
                label="提出期限"
                type="date"
                variant="outlined"
                density="comfortable"
                rounded="lg"
                :rules="[rules.required]"
                hint="スタッフがシフト希望を提出する締め切り日"
                persistent-hint
                class="mb-4"
              />

              <v-textarea
                v-model="form.message"
                label="スタッフへのメッセージ（任意）"
                placeholder="例: 来月のシフトをご記入ください。ご希望がある方はなるべく反映します。"
                variant="outlined"
                density="comfortable"
                rounded="lg"
                rows="3"
                auto-grow
                counter="200"
                maxlength="200"
              />
            </v-card-text>
          </v-card>

          <!-- Section 3: 対象スタッフ -->
          <v-card rounded="xl" elevation="0" border class="mb-4">
            <v-card-text class="pa-5">
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

              <div v-if="selectedEmployeeIds.length === 0" class="mb-3">
                <v-alert type="warning" variant="tonal" density="compact" rounded="lg">
                  対象スタッフを1名以上選択してください
                </v-alert>
              </div>

              <div
                v-for="dept in departments"
                v-show="dept.filteredEmployees.length > 0"
                :key="dept.name"
                class="mb-4"
              >
                <div class="d-flex align-center justify-space-between mb-2">
                  <div class="d-flex align-center ga-2">
                    <v-checkbox
                      :model-value="isDeptAllSelected(dept.name)"
                      :indeterminate="isDeptPartialSelected(dept.name)"
                      density="compact"
                      hide-details
                      @update:model-value="toggleDept(dept.name, $event)"
                    />
                    <span class="text-body-2 font-weight-medium">{{ dept.name }}</span>
                    <v-chip size="x-small" variant="tonal">{{ dept.filteredEmployees.length }}名</v-chip>
                  </div>
                </div>

                <div class="pl-6">
                  <v-row dense>
                    <v-col
                      v-for="emp in dept.filteredEmployees"
                      :key="emp.id"
                      cols="12" sm="6"
                    >
                      <div
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
                    </v-col>
                  </v-row>
                </div>
              </div>
            </v-card-text>
          </v-card>

          <!-- Section 5: シフト配置設定 -->
          <v-card rounded="xl" elevation="0" border class="mb-4">
            <v-card-text class="pa-5">
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

        </v-col>

        <!-- Right column: summary + budget -->
        <v-col cols="12" lg="4">

          <!-- Section 4: 予算設定 -->
          <v-card rounded="xl" elevation="0" border class="mb-4">
            <v-card-text class="pa-5">
              <div class="d-flex align-center ga-2 mb-4">
                <v-icon color="primary" size="20">mdi-currency-jpy</v-icon>
                <span class="text-subtitle-2 font-weight-bold">予算設定（任意）</span>
              </div>

              <v-text-field
                v-model.number="form.budgetAmount"
                label="月次予算"
                type="number"
                variant="outlined"
                density="comfortable"
                rounded="lg"
                prefix="¥"
                suffix="円"
                hint="目安として入力。後から変更できます。"
                persistent-hint
                min="0"
              />
            </v-card-text>
          </v-card>

          <!-- Summary card -->
          <v-card rounded="xl" elevation="0" border class="mb-4">
            <v-card-text class="pa-5">
              <div class="d-flex align-center ga-2 mb-4">
                <v-icon color="primary" size="20">mdi-clipboard-check-outline</v-icon>
                <span class="text-subtitle-2 font-weight-bold">作成内容の確認</span>
              </div>

              <div class="summary-row">
                <span class="text-caption text-medium-emphasis">シフト名</span>
                <span class="text-body-2 font-weight-medium">{{ form.name || '—' }}</span>
              </div>
              <v-divider class="my-2" />
              <div class="summary-row">
                <span class="text-caption text-medium-emphasis">シフト期間</span>
                <span class="text-body-2">
                  {{ form.periodStart ? formatDate(form.periodStart) : '—' }}
                  <template v-if="form.periodEnd"> 〜 {{ formatDate(form.periodEnd) }}</template>
                </span>
              </div>
              <v-divider class="my-2" />
              <div class="summary-row">
                <span class="text-caption text-medium-emphasis">提出期限</span>
                <span class="text-body-2">{{ form.deadline ? formatDate(form.deadline) : '—' }}</span>
              </div>
              <v-divider class="my-2" />
              <div class="summary-row">
                <span class="text-caption text-medium-emphasis">対象スタッフ</span>
                <span class="text-body-2 font-weight-medium">{{ selectedEmployeeIds.length }}名</span>
              </div>
              <v-divider class="my-2" />
              <div class="summary-row">
                <span class="text-caption text-medium-emphasis">月次予算</span>
                <span class="text-body-2">
                  {{ form.budgetAmount ? `¥${Number(form.budgetAmount).toLocaleString()}` : '未設定' }}
                </span>
              </div>
              <v-divider class="my-2" />
              <div class="summary-row">
                <span class="text-caption text-medium-emphasis">配置スロット</span>
                <span class="text-body-2">
                  {{ allocationSummary.slotCount > 0
                    ? `${allocationSummary.slotCount}種, 配置済み ${allocationSummary.assignedDays}日`
                    : '未設定' }}
                </span>
              </div>
            </v-card-text>
          </v-card>

          <!-- Actions -->
          <v-btn
            type="submit"
            color="primary"
            size="large"
            rounded="lg"
            block
            :loading="submitting"
            :disabled="!formValid || selectedEmployeeIds.length === 0"
            prepend-icon="mdi-check"
          >
            シフトを作成する
          </v-btn>
          <v-btn
            to="/shifts/board"
            variant="text"
            size="large"
            rounded="lg"
            block
            class="mt-2"
          >
            キャンセル
          </v-btn>
        </v-col>
      </v-row>
    </v-form>

    <!-- Success snackbar -->
    <v-snackbar
      v-model="successSnackbar"
      location="top center"
      :timeout="2000"
      color="success"
      rounded="pill"
      @update:model-value="onSnackbarClose"
    >
      シフトを作成しました
    </v-snackbar>
  </div>
</template>

<script setup lang="ts">
import { useMockData } from '~/composables/useMockData'
import type { AllocationSetup } from '~/types'

const router = useRouter()
const { employees: allEmployees } = useMockData()

// ─── Employees ───────────────────────────────────────────────
const activeEmployees = computed(() =>
  allEmployees.filter(e => e.status === 'ACTIVE'),
)

const skillFilter = ref<string | null>(null)

const allSkills = computed(() => {
  const set = new Set<string>()
  for (const emp of activeEmployees.value) {
    for (const skill of emp.skills) set.add(skill)
  }
  return Array.from(set).sort()
})

const departments = computed(() => {
  const deptNames = ['キッチン', 'ホール', 'レジ']
  return deptNames.map(name => {
    const all = activeEmployees.value.filter(e => e.department === name)
    const filtered = skillFilter.value
      ? all.filter(e => e.skills.includes(skillFilter.value!))
      : all
    return { name, filteredEmployees: filtered }
  })
})

const selectedEmployeeIds = ref<string[]>(activeEmployees.value.map(e => e.id))

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
  return deptIds.every(id => selectedEmployeeIds.value.includes(id))
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
const allocationData = ref<AllocationSetup>({ slots: [], assignments: [] })

const allocationSummary = computed(() => ({
  slotCount: allocationData.value.slots.length,
  assignedDays: allocationData.value.assignments.filter(a => a.slotIds.length > 0).length,
}))

// ─── Form state ──────────────────────────────────────────────
const formRef = ref()
const formValid = ref(false)
const submitting = ref(false)
const successSnackbar = ref(false)

const today = new Date().toISOString().slice(0, 10)

const form = reactive({
  name: '',
  periodStart: '',
  periodEnd: '',
  deadline: '',
  message: '',
  budgetAmount: null as number | null,
})

// ─── Period helpers ──────────────────────────────────────────
const periodDays = computed(() => {
  if (!form.periodStart || !form.periodEnd) return 0
  const s = new Date(form.periodStart)
  const e = new Date(form.periodEnd)
  return Math.round((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1
})

function autoGenerateName() {
  if (!form.periodStart) return
  const d = new Date(form.periodStart)
  const year = d.getFullYear()
  const month = d.getMonth() + 1
  form.name = `${year}年${month}月 シフト`
}

function autoSetDeadline() {
  if (!form.periodStart) return
  const d = new Date(form.periodStart)
  d.setDate(d.getDate() - 3)
  form.deadline = d.toISOString().slice(0, 10)
}

function onPeriodChange() {
  autoGenerateName()
  autoSetDeadline()
}

// ─── Validation ──────────────────────────────────────────────
const rules = {
  required: (v: string) => !!v || '必須項目です',
  endAfterStart: (v: string) => {
    if (!form.periodStart || !v) return true
    return new Date(v) >= new Date(form.periodStart) || '終了日は開始日以降にしてください'
  },
}

// ─── Format helpers ──────────────────────────────────────────
function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('ja-JP', {
    year: 'numeric', month: 'long', day: 'numeric',
  })
}

// ─── Submit ──────────────────────────────────────────────────
async function handleSubmit() {
  const { valid } = await formRef.value.validate()
  if (!valid || selectedEmployeeIds.value.length === 0) return

  submitting.value = true
  // Mock async creation — replace with real API call
  await new Promise(resolve => setTimeout(resolve, 800))
  submitting.value = false
  console.log('[Allocation Setup]', JSON.stringify(allocationData.value, null, 2))
  successSnackbar.value = true
}

function onSnackbarClose(visible: boolean) {
  if (!visible) router.push('/shifts/board')
}
</script>

<style scoped>
.new-board-page {
  max-width: 1100px;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 8px;
}

.employee-chip {
  transition: background 0.15s, border-color 0.15s;
}
</style>
