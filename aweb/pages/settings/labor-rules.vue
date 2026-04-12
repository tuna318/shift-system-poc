<template>
  <div>
    <!-- Page header -->
    <div class="d-flex align-center justify-space-between mb-6">
      <div>
        <h1 class="text-h5 font-weight-bold">労働ルール設定</h1>
        <p class="text-body-2 text-medium-emphasis mt-1">
          36協定・労働時間の上限とアラート閾値を設定します
        </p>
      </div>
      <v-btn
        color="primary"
        prepend-icon="mdi-content-save-outline"
        rounded="lg"
        :loading="saving"
        @click="save"
      >
        保存する
      </v-btn>
    </div>

    <v-row>
      <!-- Left column -->
      <v-col cols="12" lg="8">

        <!-- 36協定 -->
        <v-card rounded="xl" elevation="0" border class="mb-4">
          <div class="section-header px-5 py-4">
            <div class="d-flex align-center ga-2">
              <v-icon color="primary" size="20">mdi-file-sign</v-icon>
              <span class="text-subtitle-2 font-weight-bold">36協定（時間外・休日労働協定）</span>
            </div>
            <p class="text-caption text-medium-emphasis mt-1 mb-0">
              労働基準法第36条に基づく時間外労働の上限を設定します
            </p>
          </div>
          <v-divider />
          <div class="pa-5">

            <!-- General provisions -->
            <div class="rule-group mb-5">
              <div class="rule-group-label">一般条項</div>
              <v-row>
                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model.number="rules.overtime.monthlyLimitHours"
                    label="月間残業上限"
                    suffix="時間"
                    type="number"
                    variant="outlined"
                    density="compact"
                    rounded="lg"
                    :rules="[v => v > 0 || '必須']"
                    hint="法定上限：45時間"
                    persistent-hint
                  />
                </v-col>
                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model.number="rules.overtime.annualLimitHours"
                    label="年間残業上限"
                    suffix="時間"
                    type="number"
                    variant="outlined"
                    density="compact"
                    rounded="lg"
                    hint="法定上限：360時間"
                    persistent-hint
                  />
                </v-col>
              </v-row>
            </div>

            <!-- Special provisions toggle -->
            <div class="rule-group">
              <div class="d-flex align-center justify-space-between mb-3">
                <div class="rule-group-label mb-0">特別条項</div>
                <v-switch
                  v-model="rules.overtime.hasSpecialProvision"
                  color="primary"
                  density="compact"
                  hide-details
                  label="特別条項あり"
                  class="mt-0"
                />
              </div>
              <v-expand-transition>
                <div v-if="rules.overtime.hasSpecialProvision">
                  <v-alert
                    type="info"
                    variant="tonal"
                    density="compact"
                    rounded="lg"
                    class="mb-3 text-caption"
                  >
                    特別条項を設定する場合、月100時間未満・複数月平均80時間以内・年720時間以内の遵守が必要です
                  </v-alert>
                  <v-row>
                    <v-col cols="12" sm="6">
                      <v-text-field
                        v-model.number="rules.overtime.specialMonthlyLimitHours"
                        label="特別条項 月間上限"
                        suffix="時間"
                        type="number"
                        variant="outlined"
                        density="compact"
                        rounded="lg"
                        hint="法定上限：100時間未満"
                        persistent-hint
                      />
                    </v-col>
                    <v-col cols="12" sm="6">
                      <v-text-field
                        v-model.number="rules.overtime.specialAnnualLimitHours"
                        label="特別条項 年間上限"
                        suffix="時間"
                        type="number"
                        variant="outlined"
                        density="compact"
                        rounded="lg"
                        hint="法定上限：720時間"
                        persistent-hint
                      />
                    </v-col>
                    <v-col cols="12" sm="6">
                      <v-text-field
                        v-model.number="rules.overtime.specialMonthMaxCount"
                        label="特別条項を適用できる月数"
                        suffix="回/年"
                        type="number"
                        variant="outlined"
                        density="compact"
                        rounded="lg"
                        hint="法定上限：6回"
                        persistent-hint
                      />
                    </v-col>
                  </v-row>
                </div>
              </v-expand-transition>
            </div>
          </div>
        </v-card>

        <!-- 基本労働時間ルール -->
        <v-card rounded="xl" elevation="0" border class="mb-4">
          <div class="section-header px-5 py-4">
            <div class="d-flex align-center ga-2">
              <v-icon color="primary" size="20">mdi-clock-outline</v-icon>
              <span class="text-subtitle-2 font-weight-bold">基本労働時間ルール</span>
            </div>
            <p class="text-caption text-medium-emphasis mt-1 mb-0">
              法定労働時間・休憩・深夜割増の基準を設定します
            </p>
          </div>
          <v-divider />
          <div class="pa-5">

            <!-- Statutory hours -->
            <div class="rule-group mb-5">
              <div class="rule-group-label">法定労働時間</div>
              <v-row>
                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model.number="rules.workHours.dailyLimitHours"
                    label="1日の法定労働時間"
                    suffix="時間"
                    type="number"
                    variant="outlined"
                    density="compact"
                    rounded="lg"
                    hint="法定：8時間"
                    persistent-hint
                  />
                </v-col>
                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model.number="rules.workHours.weeklyLimitHours"
                    label="週の法定労働時間"
                    suffix="時間"
                    type="number"
                    variant="outlined"
                    density="compact"
                    rounded="lg"
                    hint="法定：40時間"
                    persistent-hint
                  />
                </v-col>
              </v-row>
            </div>

            <!-- Night premium -->
            <div class="rule-group mb-5">
              <div class="rule-group-label">深夜割増時間帯</div>
              <v-row>
                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model="rules.workHours.nightStart"
                    label="深夜開始"
                    type="time"
                    variant="outlined"
                    density="compact"
                    rounded="lg"
                    hint="通常：22:00"
                    persistent-hint
                  />
                </v-col>
                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model="rules.workHours.nightEnd"
                    label="深夜終了"
                    type="time"
                    variant="outlined"
                    density="compact"
                    rounded="lg"
                    hint="通常：05:00"
                    persistent-hint
                  />
                </v-col>
              </v-row>
            </div>

            <!-- Break rules -->
            <div class="rule-group">
              <div class="rule-group-label">休憩時間ルール（労働基準法第34条）</div>
              <div class="d-flex flex-column ga-3">
                <div
                  v-for="rule in rules.breakRules"
                  :key="rule.id"
                  class="d-flex align-center ga-3 break-rule-row"
                >
                  <span class="text-body-2 text-medium-emphasis" style="white-space:nowrap">勤務</span>
                  <v-text-field
                    v-model.number="rule.workingHoursOver"
                    suffix="時間超"
                    type="number"
                    variant="outlined"
                    density="compact"
                    rounded="lg"
                    hide-details
                    style="max-width:120px"
                  />
                  <span class="text-body-2 text-medium-emphasis" style="white-space:nowrap">→ 休憩</span>
                  <v-text-field
                    v-model.number="rule.requiredBreakMinutes"
                    suffix="分以上"
                    type="number"
                    variant="outlined"
                    density="compact"
                    rounded="lg"
                    hide-details
                    style="max-width:130px"
                  />
                  <v-btn
                    icon
                    variant="text"
                    size="x-small"
                    color="error"
                    @click="removeBreakRule(rule.id)"
                  >
                    <v-icon size="16">mdi-close</v-icon>
                  </v-btn>
                </div>
                <v-btn
                  variant="tonal"
                  color="default"
                  size="small"
                  prepend-icon="mdi-plus"
                  rounded="lg"
                  class="align-self-start"
                  @click="addBreakRule"
                >
                  ルールを追加
                </v-btn>
              </div>
            </div>
          </div>
        </v-card>

        <!-- 連続勤務 -->
        <v-card rounded="xl" elevation="0" border class="mb-4">
          <div class="section-header px-5 py-4">
            <div class="d-flex align-center ga-2">
              <v-icon color="primary" size="20">mdi-calendar-range</v-icon>
              <span class="text-subtitle-2 font-weight-bold">連続勤務ルール</span>
            </div>
          </div>
          <v-divider />
          <div class="pa-5">
            <v-row>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model.number="rules.consecutiveDays.warningDays"
                  label="警告：連続勤務日数"
                  suffix="日"
                  type="number"
                  variant="outlined"
                  density="compact"
                  rounded="lg"
                  hint="この日数に達したら警告"
                  persistent-hint
                />
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model.number="rules.consecutiveDays.limitDays"
                  label="上限：連続勤務日数"
                  suffix="日"
                  type="number"
                  variant="outlined"
                  density="compact"
                  rounded="lg"
                  hint="労働基準法上の限度（週1休）"
                  persistent-hint
                />
              </v-col>
            </v-row>
          </div>
        </v-card>

        <!-- 雇用形態別 月間所定時間 -->
        <v-card rounded="xl" elevation="0" border>
          <div class="section-header px-5 py-4">
            <div class="d-flex align-center ga-2">
              <v-icon color="primary" size="20">mdi-account-cog-outline</v-icon>
              <span class="text-subtitle-2 font-weight-bold">雇用形態別ルール</span>
            </div>
            <p class="text-caption text-medium-emphasis mt-1 mb-0">
              各雇用形態の月間所定労働時間・残業計算の基準
            </p>
          </div>
          <v-divider />
          <div class="pa-5">
            <div class="d-flex flex-column ga-4">
              <div
                v-for="emp in rules.employmentTypes"
                :key="emp.type"
                class="emp-type-row"
              >
                <div class="d-flex align-center ga-2 mb-3">
                  <v-chip :color="emp.color" size="small" variant="tonal" class="font-weight-medium">
                    {{ emp.label }}
                  </v-chip>
                  <span class="text-caption text-medium-emphasis">{{ emp.description }}</span>
                </div>
                <v-row>
                  <v-col cols="12" sm="4">
                    <v-text-field
                      v-model.number="emp.monthlyScheduledHours"
                      label="月間所定労働時間"
                      suffix="時間"
                      type="number"
                      variant="outlined"
                      density="compact"
                      rounded="lg"
                      hide-details
                    />
                  </v-col>
                  <v-col v-if="emp.type === 'FLEX'" cols="12" sm="4">
                    <v-text-field
                      v-model="emp.coreTimeStart"
                      label="コアタイム（開始）"
                      type="time"
                      variant="outlined"
                      density="compact"
                      rounded="lg"
                      hide-details
                    />
                  </v-col>
                  <v-col v-if="emp.type === 'FLEX'" cols="12" sm="4">
                    <v-text-field
                      v-model="emp.coreTimeEnd"
                      label="コアタイム（終了）"
                      type="time"
                      variant="outlined"
                      density="compact"
                      rounded="lg"
                      hide-details
                    />
                  </v-col>
                  <v-col v-if="emp.type === 'DISCRETIONARY'" cols="12" sm="4">
                    <v-text-field
                      v-model.number="emp.deemedWorkHours"
                      label="みなし労働時間"
                      suffix="時間"
                      type="number"
                      variant="outlined"
                      density="compact"
                      rounded="lg"
                      hide-details
                    />
                  </v-col>
                </v-row>
              </div>
            </div>
          </div>
        </v-card>

      </v-col>

      <!-- Right column -->
      <v-col cols="12" lg="4">

        <!-- Alert thresholds -->
        <v-card rounded="xl" elevation="0" border class="mb-4">
          <div class="section-header px-5 py-4">
            <div class="d-flex align-center ga-2">
              <v-icon color="warning" size="20">mdi-bell-alert-outline</v-icon>
              <span class="text-subtitle-2 font-weight-bold">アラート閾値</span>
            </div>
            <p class="text-caption text-medium-emphasis mt-1 mb-0">
              警告・緊急アラートを発火する閾値
            </p>
          </div>
          <v-divider />
          <div class="pa-5 d-flex flex-column ga-4">

            <div>
              <div class="threshold-section-label">月間残業時間</div>
              <div class="d-flex flex-column ga-2 mt-2">
                <div class="threshold-row">
                  <v-icon color="warning" size="16">mdi-alert</v-icon>
                  <span class="text-caption">警告</span>
                  <v-text-field
                    v-model.number="rules.alerts.monthlyOvertimeWarningHours"
                    suffix="時間"
                    type="number"
                    variant="outlined"
                    density="compact"
                    rounded="lg"
                    hide-details
                    style="max-width: 110px"
                  />
                </div>
                <div class="threshold-row">
                  <v-icon color="error" size="16">mdi-alert-circle</v-icon>
                  <span class="text-caption">緊急</span>
                  <v-text-field
                    v-model.number="rules.alerts.monthlyOvertimeCriticalHours"
                    suffix="時間"
                    type="number"
                    variant="outlined"
                    density="compact"
                    rounded="lg"
                    hide-details
                    style="max-width: 110px"
                  />
                </div>
              </div>
            </div>

            <v-divider />

            <div>
              <div class="threshold-section-label">週間労働時間</div>
              <div class="d-flex flex-column ga-2 mt-2">
                <div class="threshold-row">
                  <v-icon color="warning" size="16">mdi-alert</v-icon>
                  <span class="text-caption">警告</span>
                  <v-text-field
                    v-model.number="rules.alerts.weeklyHoursWarning"
                    suffix="時間"
                    type="number"
                    variant="outlined"
                    density="compact"
                    rounded="lg"
                    hide-details
                    style="max-width: 110px"
                  />
                </div>
              </div>
            </div>

            <v-divider />

            <div>
              <div class="threshold-section-label">連続勤務日数</div>
              <div class="d-flex flex-column ga-2 mt-2">
                <div class="threshold-row">
                  <v-icon color="warning" size="16">mdi-alert</v-icon>
                  <span class="text-caption">警告</span>
                  <v-text-field
                    v-model.number="rules.alerts.consecutiveDaysWarning"
                    suffix="日"
                    type="number"
                    variant="outlined"
                    density="compact"
                    rounded="lg"
                    hide-details
                    style="max-width: 110px"
                  />
                </div>
              </div>
            </div>

            <v-divider />

            <div>
              <div class="threshold-section-label">法定休憩未取得（1日）</div>
              <div class="d-flex flex-column ga-2 mt-2">
                <div class="threshold-row">
                  <v-icon color="error" size="16">mdi-alert-circle</v-icon>
                  <span class="text-caption">緊急</span>
                  <v-text-field
                    v-model.number="rules.alerts.noBreakWorkHoursThreshold"
                    suffix="時間超"
                    type="number"
                    variant="outlined"
                    density="compact"
                    rounded="lg"
                    hide-details
                    style="max-width: 110px"
                  />
                </div>
              </div>
            </div>
          </div>
        </v-card>

        <!-- Current status preview -->
        <v-card rounded="xl" elevation="0" border>
          <div class="section-header px-5 py-4">
            <div class="d-flex align-center ga-2">
              <v-icon color="primary" size="20">mdi-account-clock-outline</v-icon>
              <span class="text-subtitle-2 font-weight-bold">現在の超過状況</span>
            </div>
            <p class="text-caption text-medium-emphasis mt-1 mb-0">
              今月の残業時間と上限の比較
            </p>
          </div>
          <v-divider />
          <div class="pa-4 d-flex flex-column ga-2">
            <div
              v-for="emp in overtimeStatus"
              :key="emp.id"
              class="ot-row"
            >
              <div class="d-flex align-center justify-space-between mb-1">
                <div class="d-flex align-center ga-2">
                  <v-avatar :color="emp.level === 'critical' ? 'error' : emp.level === 'warning' ? 'warning' : 'default'" size="22">
                    <span class="text-caption text-white" style="font-size:9px">{{ emp.name.charAt(0) }}</span>
                  </v-avatar>
                  <span class="text-body-2">{{ emp.name }}</span>
                </div>
                <v-chip
                  :color="emp.level === 'critical' ? 'error' : emp.level === 'warning' ? 'warning' : 'success'"
                  size="x-small"
                  variant="tonal"
                >
                  {{ emp.hours }}h / {{ rules.overtime.monthlyLimitHours }}h
                </v-chip>
              </div>
              <v-progress-linear
                :model-value="(emp.hours / rules.overtime.monthlyLimitHours) * 100"
                :color="emp.level === 'critical' ? 'error' : emp.level === 'warning' ? 'warning' : 'success'"
                rounded
                height="4"
              />
            </div>
          </div>
        </v-card>

      </v-col>
    </v-row>

    <!-- Save snackbar -->
    <v-snackbar
      v-model="snackbar"
      color="success"
      location="bottom right"
      rounded="lg"
      :timeout="3000"
    >
      <v-icon class="mr-2">mdi-check-circle</v-icon>
      労働ルールを保存しました
    </v-snackbar>
  </div>
</template>

<script setup lang="ts">
import { useMockData } from '~/composables/useMockData'

const { employees } = useMockData()

const saving = ref(false)
const snackbar = ref(false)

// ── Rule state ──────────────────────────────────────────────────────────────

const rules = reactive({
  overtime: {
    monthlyLimitHours: 45,
    annualLimitHours: 360,
    hasSpecialProvision: false,
    specialMonthlyLimitHours: 99,
    specialAnnualLimitHours: 720,
    specialMonthMaxCount: 6,
  },
  workHours: {
    dailyLimitHours: 8,
    weeklyLimitHours: 40,
    nightStart: '22:00',
    nightEnd: '05:00',
  },
  breakRules: [
    { id: 1, workingHoursOver: 6, requiredBreakMinutes: 45 },
    { id: 2, workingHoursOver: 8, requiredBreakMinutes: 60 },
  ] as { id: number; workingHoursOver: number; requiredBreakMinutes: number }[],
  consecutiveDays: {
    warningDays: 5,
    limitDays: 6,
  },
  alerts: {
    monthlyOvertimeWarningHours: 40,
    monthlyOvertimeCriticalHours: 45,
    weeklyHoursWarning: 40,
    consecutiveDaysWarning: 5,
    noBreakWorkHoursThreshold: 6,
  },
  employmentTypes: [
    {
      type: 'FULL_TIME',
      label: '正社員',
      color: 'primary',
      description: '通常の残業・深夜・休日割増計算を適用',
      monthlyScheduledHours: 176,
      coreTimeStart: undefined as string | undefined,
      coreTimeEnd: undefined as string | undefined,
      deemedWorkHours: undefined as number | undefined,
    },
    {
      type: 'PART_TIME',
      label: 'パート・アルバイト',
      color: 'teal',
      description: '時給ベース・シフト制で管理',
      monthlyScheduledHours: 120,
      coreTimeStart: undefined as string | undefined,
      coreTimeEnd: undefined as string | undefined,
      deemedWorkHours: undefined as number | undefined,
    },
    {
      type: 'FLEX',
      label: 'フレックス',
      color: 'indigo',
      description: '清算期間1ヶ月・コアタイム設定可',
      monthlyScheduledHours: 160,
      coreTimeStart: '10:00',
      coreTimeEnd: '15:00',
      deemedWorkHours: undefined as number | undefined,
    },
    {
      type: 'DISCRETIONARY',
      label: '裁量労働',
      color: 'purple',
      description: 'みなし労働時間を適用・深夜休日割増のみ計算',
      monthlyScheduledHours: 160,
      coreTimeStart: undefined as string | undefined,
      coreTimeEnd: undefined as string | undefined,
      deemedWorkHours: 8,
    },
  ],
})

let nextRuleId = 3

function addBreakRule() {
  rules.breakRules.push({ id: nextRuleId++, workingHoursOver: 0, requiredBreakMinutes: 0 })
}

function removeBreakRule(id: number) {
  const idx = rules.breakRules.findIndex(r => r.id === id)
  if (idx !== -1) rules.breakRules.splice(idx, 1)
}

// ── Save ────────────────────────────────────────────────────────────────────

async function save() {
  saving.value = true
  await new Promise(r => setTimeout(r, 600))
  saving.value = false
  snackbar.value = true
}

// ── Current overtime status preview ────────────────────────────────────────

// Mock monthly overtime hours per employee (hours worked beyond 所定労働時間)
const mockOvertimeHours: Record<string, number> = {
  'emp-001': 12,
  'emp-002': 28,
  'emp-003': 8,
  'emp-004': 35,
  'emp-005': 5,
  'emp-006': 42,
  'emp-007': 18,
  'emp-012': 42,
}

const overtimeStatus = computed(() => {
  const warning = rules.alerts.monthlyOvertimeWarningHours
  const critical = rules.alerts.monthlyOvertimeCriticalHours

  return employees
    .filter(e => e.status === 'ACTIVE' && (mockOvertimeHours[e.id] ?? 0) >= warning)
    .map(e => {
      const hours = mockOvertimeHours[e.id] ?? 0
      const level = hours >= critical ? 'critical' : hours >= warning ? 'warning' : 'ok'
      return { id: e.id, name: e.name, hours, level }
    })
    .sort((a, b) => b.hours - a.hours)
    .slice(0, 8)
})
</script>

<style scoped>
.section-header {
  background: #fafafa;
  border-radius: 12px 12px 0 0;
}

.rule-group {
  background: #f8f9fa;
  border-radius: 10px;
  padding: 14px 16px;
}

.rule-group-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 12px;
}

.break-rule-row {
  align-items: center;
}

.emp-type-row {
  padding: 14px 16px;
  background: #f8f9fa;
  border-radius: 10px;
}

.threshold-section-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.threshold-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.threshold-row .text-caption {
  min-width: 28px;
  color: #6b7280;
}

.ot-row {
  padding: 6px 4px;
}
</style>
