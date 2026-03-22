<template>
  <div class="pa-4">
    <!-- Employee info card -->
    <v-card rounded="xl" color="primary" elevation="2" class="mb-4">
      <v-card-text class="pa-5">
        <div class="d-flex align-center gap-3">
          <v-avatar size="56" color="white">
            <v-icon size="32" color="primary">mdi-account</v-icon>
          </v-avatar>
          <div>
            <div class="text-h6 font-weight-bold text-white">{{ employee?.name }}</div>
            <div class="text-caption text-white" style="opacity: 0.8;">{{ employee?.nameKana }}</div>
            <div class="d-flex gap-2 mt-1">
              <v-chip size="x-small" color="white" variant="outlined" label>
                {{ employee?.department }}
              </v-chip>
              <v-chip size="x-small" color="white" variant="outlined" label>
                {{ employmentTypeLabel }}
              </v-chip>
            </div>
          </div>
        </div>
      </v-card-text>
    </v-card>

    <!-- Monthly labor hours -->
    <div class="text-subtitle-2 font-weight-bold text-grey-darken-2 mb-2">今月の勤務時間</div>
    <v-card rounded="xl" elevation="0" variant="outlined" class="mb-4">
      <v-card-text class="pa-4">
        <div class="d-flex justify-space-between align-center mb-3">
          <span class="text-body-2 text-grey">勤務時間</span>
          <span class="text-h6 font-weight-bold text-primary">{{ monthTotalLabel }}</span>
        </div>
        <v-progress-linear
          :model-value="monthProgress"
          :color="monthProgress >= 100 ? 'error' : monthProgress >= 80 ? 'warning' : 'primary'"
          height="10"
          rounded="pill"
          bg-color="#e3f0fb"
          class="mb-1"
        />
        <div class="d-flex justify-space-between">
          <span class="text-caption text-grey">0時間</span>
          <span class="text-caption text-grey">上限: {{ maxHoursLabel }}</span>
        </div>

        <v-divider class="my-3" />

        <div class="d-flex justify-space-around">
          <div class="text-center">
            <div class="text-h6 font-weight-bold">{{ shiftsThisMonth }}</div>
            <div class="text-caption text-grey">出勤日数</div>
          </div>
          <v-divider vertical />
          <div class="text-center">
            <div class="text-h6 font-weight-bold text-warning">{{ overtimeLabel }}</div>
            <div class="text-caption text-grey">残業</div>
          </div>
          <v-divider vertical />
          <div class="text-center">
            <div class="text-h6 font-weight-bold">{{ avgHoursLabel }}</div>
            <div class="text-caption text-grey">平均/日</div>
          </div>
        </div>
      </v-card-text>
    </v-card>

    <!-- Wage info -->
    <div class="text-subtitle-2 font-weight-bold text-grey-darken-2 mb-2">給与情報</div>
    <v-card rounded="xl" elevation="0" variant="outlined" class="mb-4">
      <v-card-text class="pa-4">
        <div class="d-flex justify-space-between align-center mb-2">
          <span class="text-body-2 text-grey">時給</span>
          <span class="text-body-1 font-weight-bold">¥{{ employee?.hourlyWage?.toLocaleString() }}</span>
        </div>
        <div class="d-flex justify-space-between align-center">
          <span class="text-body-2 text-grey">今月の概算給与</span>
          <span class="text-body-1 font-weight-bold text-success">{{ estimatedWageLabel }}</span>
        </div>
      </v-card-text>
    </v-card>

    <!-- Quick links -->
    <v-card rounded="xl" elevation="0" variant="outlined" class="mb-4">
      <v-list density="compact" rounded="xl">
        <v-list-item
          prepend-icon="mdi-clipboard-text-outline"
          title="勤怠履歴を見る"
          append-icon="mdi-chevron-right"
          @click="navigateTo('/attendance')"
        />
        <v-divider />
        <v-list-item
          prepend-icon="mdi-calendar-outline"
          title="シフトを確認する"
          append-icon="mdi-chevron-right"
          @click="navigateTo('/shifts')"
        />
        <v-divider />
        <v-list-item
          prepend-icon="mdi-swap-horizontal"
          title="代打・交代の依頼"
          append-icon="mdi-chevron-right"
          @click="navigateTo('/substitutions')"
        />
      </v-list>
    </v-card>

    <!-- Logout -->
    <v-btn
      block
      color="error"
      variant="outlined"
      rounded="xl"
      prepend-icon="mdi-logout"
      @click="logout"
    >
      ログアウト
    </v-btn>
  </div>
</template>

<script setup lang="ts">
const authStore = useAuthStore()
const { loggedInEmployee, getMonthTotalMinutes, formatMinutes, myAttendance } = useMockData()

const employee = computed(() => authStore.currentEmployee ?? loggedInEmployee.value)
const employmentTypeLabel = computed(() =>
  employee.value?.employmentType === 'FULL_TIME' ? '正社員' : 'パート・アルバイト'
)

const maxHours = computed(() =>
  employee.value?.employmentType === 'FULL_TIME' ? 176 : 120
)
const maxHoursLabel = computed(() => `${maxHours.value}時間`)

const now = new Date()
const currentYear = now.getFullYear()
const currentMonth = now.getMonth() + 1

const monthTotalMinutes = computed(() => getMonthTotalMinutes(currentYear, currentMonth))
const monthTotalLabel = computed(() => formatMinutes(monthTotalMinutes.value))
const monthProgress = computed(() => Math.min(100, (monthTotalMinutes.value / (maxHours.value * 60)) * 100))

const monthAttendance = computed(() =>
  myAttendance.filter((a) => {
    const d = new Date(a.date)
    return d.getFullYear() === currentYear && d.getMonth() + 1 === currentMonth && a.totalMinutes > 0
  })
)

const shiftsThisMonth = computed(() => monthAttendance.value.length)

const overtimeMinutes = computed(() =>
  monthAttendance.value.reduce((sum, a) => sum + a.overtimeMinutes, 0)
)
const overtimeLabel = computed(() => overtimeMinutes.value > 0 ? formatMinutes(overtimeMinutes.value) : '0時間')

const avgHoursLabel = computed(() => {
  if (monthAttendance.value.length === 0) return '0時間'
  const avg = monthTotalMinutes.value / monthAttendance.value.length
  const h = Math.floor(avg / 60)
  const m = Math.round(avg % 60)
  return m > 0 ? `${h}h${m}m` : `${h}時間`
})

const estimatedWageLabel = computed(() => {
  const wage = employee.value?.hourlyWage ?? 1000
  const hours = monthTotalMinutes.value / 60
  const estimated = Math.floor(wage * hours)
  return `¥${estimated.toLocaleString()}`
})

async function logout() {
  await authStore.logout()
  navigateTo('/login')
}
</script>

<style scoped>
.gap-2 { gap: 8px; }
.gap-3 { gap: 12px; }
</style>
