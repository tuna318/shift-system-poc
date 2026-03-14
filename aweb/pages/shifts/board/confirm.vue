<template>
  <div class="confirm-page">
    <!-- Header -->
    <div class="d-flex align-center ga-3 mb-6">
      <v-btn to="/shifts/board/new" icon size="small" variant="text">
        <v-icon>mdi-arrow-left</v-icon>
      </v-btn>
      <div>
        <h1 class="text-h5 font-weight-bold">作成内容の確認</h1>
        <p class="text-body-2 text-medium-emphasis mt-1">内容を確認してシフトを作成してください</p>
      </div>
    </div>

    <!-- Icon + message -->
    <div class="text-center mb-8">
      <div class="confirm-icon mx-auto mb-4">
        <v-icon color="primary" size="36">mdi-clipboard-check-outline</v-icon>
      </div>
      <p class="text-body-1 text-medium-emphasis">以下の内容でシフトを作成します</p>
    </div>

    <!-- 基本情報 -->
    <v-card rounded="xl" elevation="0" border class="mb-4">
      <v-card-text class="pa-5">
        <div class="section-header mb-4">
          <div class="d-flex align-center ga-2">
            <v-icon color="primary" size="18">mdi-information-outline</v-icon>
            <span class="text-body-1 font-weight-bold">基本情報</span>
          </div>
          <v-btn size="small" variant="text" color="primary" to="/shifts/board/new">
            <v-icon size="14" start>mdi-pencil-outline</v-icon>編集
          </v-btn>
        </div>
        <div class="summary-grid">
          <span class="label">シフト名</span>
          <span class="value font-weight-medium">{{ form.name || '—' }}</span>

          <span class="label">シフト期間</span>
          <span class="value">
            {{ form.periodStart ? formatDate(form.periodStart) : '—' }}
            <template v-if="form.periodEnd"> 〜 {{ formatDate(form.periodEnd) }}</template>
            <v-chip v-if="periodDays > 0" size="x-small" variant="tonal" color="primary" class="ml-2">
              {{ periodDays }}日間
            </v-chip>
          </span>

          <span class="label">提出期限</span>
          <span class="value">{{ form.deadline ? formatDate(form.deadline) : '—' }}</span>

          <template v-if="form.budgetAmount">
            <span class="label">月次予算</span>
            <span class="value">¥{{ Number(form.budgetAmount).toLocaleString() }}</span>
          </template>

          <template v-if="form.message">
            <span class="label">メッセージ</span>
            <span class="value" style="white-space: pre-wrap">{{ form.message }}</span>
          </template>
        </div>
      </v-card-text>
    </v-card>

    <!-- シフト配置 -->
    <v-card rounded="xl" elevation="0" border class="mb-4">
      <v-card-text class="pa-5">
        <div class="section-header mb-4">
          <div class="d-flex align-center ga-2">
            <v-icon color="primary" size="18">mdi-calendar-clock-outline</v-icon>
            <span class="text-body-1 font-weight-bold">シフト配置設定</span>
          </div>
          <v-btn size="small" variant="text" color="primary" to="/shifts/board/new">
            <v-icon size="14" start>mdi-pencil-outline</v-icon>編集
          </v-btn>
        </div>

        <div v-if="allocationSummary.slotCount === 0" class="text-body-2 text-medium-emphasis">
          配置設定なし
        </div>
        <template v-else>
          <div class="d-flex ga-6 mb-4">
            <div class="text-center">
              <div class="text-h5 font-weight-bold text-primary">{{ allocationSummary.slotCount }}</div>
              <div class="text-caption text-medium-emphasis">スロット種</div>
            </div>
            <v-divider vertical />
            <div class="text-center">
              <div class="text-h5 font-weight-bold text-primary">{{ allocationSummary.assignedDays }}</div>
              <div class="text-caption text-medium-emphasis">配置済み日数</div>
            </div>
          </div>
          <div class="d-flex flex-wrap ga-2">
            <v-chip
              v-for="slot in allocationData.slots"
              :key="slot.id"
              size="small"
              variant="tonal"
              :style="{ borderLeft: `3px solid ${slot.color}` }"
            >
              {{ slot.label }}　{{ slot.startTime }}–{{ slot.endTime }}
            </v-chip>
          </div>
        </template>
      </v-card-text>
    </v-card>

    <!-- 対象スタッフ -->
    <v-card rounded="xl" elevation="0" border class="mb-8">
      <v-card-text class="pa-5">
        <div class="section-header mb-4">
          <div class="d-flex align-center ga-2">
            <v-icon color="primary" size="18">mdi-account-group-outline</v-icon>
            <span class="text-body-1 font-weight-bold">対象スタッフ</span>
          </div>
          <v-btn size="small" variant="text" color="primary" to="/shifts/board/new">
            <v-icon size="14" start>mdi-pencil-outline</v-icon>編集
          </v-btn>
        </div>

        <div class="d-flex align-center ga-2 mb-4">
          <span class="text-h5 font-weight-bold text-primary">{{ selectedEmployeeIds.length }}</span>
          <span class="text-body-2 text-medium-emphasis">名</span>
        </div>

        <v-row dense>
          <v-col v-for="dept in deptNames" :key="dept" cols="auto">
            <v-card variant="tonal" rounded="lg" class="pa-3">
              <div class="text-caption text-medium-emphasis mb-1">{{ dept }}</div>
              <div class="text-body-1 font-weight-bold">
                {{ activeEmployees.filter(e => e.department === dept && selectedEmployeeIds.includes(e.id)).length }}名
              </div>
            </v-card>
          </v-col>
        </v-row>

        <div v-if="selectedEmployees.length > 0" class="d-flex flex-wrap ga-1 mt-4">
          <v-chip
            v-for="emp in selectedEmployees"
            :key="emp.id"
            size="small"
            variant="tonal"
            prepend-icon="mdi-account"
          >{{ emp.name }}</v-chip>
        </div>
      </v-card-text>
    </v-card>

    <!-- Actions -->
    <div class="d-flex align-center justify-space-between">
      <v-btn to="/shifts/board/new" variant="text" size="large" rounded="lg">
        <v-icon start>mdi-arrow-left</v-icon>戻って編集
      </v-btn>
      <v-btn
        color="primary"
        size="large"
        rounded="lg"
        :loading="submitting"
        prepend-icon="mdi-check"
        @click="handleSubmit"
      >
        シフトを作成する
      </v-btn>
    </div>

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

const router = useRouter()
const { employees: allEmployees } = useMockData()
const { form, allocationData, selectedEmployeeIds, resetForm } = useNewBoardForm()

const deptNames = ['キッチン', 'ホール', 'レジ']

const activeEmployees = computed(() =>
  allEmployees.filter(e => e.status === 'ACTIVE'),
)

const selectedEmployees = computed(() =>
  activeEmployees.value.filter(e => selectedEmployeeIds.value.includes(e.id)),
)

const allocationSummary = computed(() => ({
  slotCount: allocationData.value.slots.length,
  assignedDays: allocationData.value.assignments.filter(a => a.slotIds.length > 0).length,
}))

const periodDays = computed(() => {
  if (!form.value.periodStart || !form.value.periodEnd) return 0
  const diff = Math.round(
    (new Date(form.value.periodEnd).getTime() - new Date(form.value.periodStart).getTime())
    / (1000 * 60 * 60 * 24),
  ) + 1
  return diff > 0 ? diff : 0
})

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('ja-JP', {
    year: 'numeric', month: 'long', day: 'numeric',
  })
}

const submitting = ref(false)
const successSnackbar = ref(false)

async function handleSubmit() {
  submitting.value = true
  await new Promise(resolve => setTimeout(resolve, 800))
  submitting.value = false
  console.log('[New Board]', JSON.stringify({
    form: form.value,
    allocation: allocationData.value,
    staffIds: selectedEmployeeIds.value,
  }, null, 2))
  successSnackbar.value = true
}

function onSnackbarClose(visible: boolean) {
  if (!visible) {
    resetForm()
    router.push('/shifts/board')
  }
}
</script>

<style scoped>
.confirm-page {
  max-width: 760px;
}

.confirm-icon {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: rgba(var(--v-theme-primary), 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.summary-grid {
  display: grid;
  grid-template-columns: 7em 1fr;
  gap: 10px 16px;
  align-items: baseline;
}

.summary-grid .label {
  font-size: 0.8rem;
  color: rgba(0, 0, 0, 0.6);
}

.summary-grid .value {
  font-size: 0.875rem;
}
</style>
