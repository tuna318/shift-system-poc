<template>
  <div>
    <div class="d-flex align-center justify-space-between mb-6">
      <div>
        <h1 class="text-h5 font-weight-bold">レポート</h1>
        <p class="text-body-2 text-medium-emphasis mt-1">労働時間・コスト・コンプライアンスのレポート</p>
      </div>
      <div class="d-flex ga-2">
        <v-select
          v-model="selectedMonth"
          :items="monthOptions"
          style="max-width: 160px"
          density="compact"
          variant="outlined"
          hide-details
        />
        <v-btn variant="tonal" prepend-icon="mdi-download-outline" rounded="lg" @click="snackbar = true">
          エクスポート
        </v-btn>
      </div>
    </div>

    <!-- Stats row -->
    <v-row class="mb-4">
      <v-col v-for="stat in summaryStats" :key="stat.label" cols="12" sm="6" md="3">
        <v-card rounded="xl" elevation="0" border class="pa-4">
          <div class="d-flex align-center justify-space-between mb-2">
            <span class="text-caption text-medium-emphasis">{{ stat.label }}</span>
            <v-icon :color="stat.color" size="20">{{ stat.icon }}</v-icon>
          </div>
          <div class="text-h5 font-weight-bold" :style="{ color: stat.valueColor ?? '#222' }">
            {{ stat.value }}
          </div>
          <div class="text-caption text-medium-emphasis mt-1">{{ stat.sub }}</div>
        </v-card>
      </v-col>
    </v-row>

    <!-- Compliance alerts -->
    <v-card rounded="xl" elevation="0" border class="mb-4">
      <v-card-title class="pa-4 pb-2 text-subtitle-2 font-weight-bold d-flex align-center ga-2">
        <v-icon color="error" size="18">mdi-alert-circle-outline</v-icon>
        コンプライアンスアラート
        <v-chip color="error" size="x-small" variant="flat" class="ml-1">{{ alerts.length }}</v-chip>
      </v-card-title>
      <v-card-text class="px-4 pb-4">
        <div class="d-flex flex-column ga-2">
          <v-alert
            v-for="alert in alerts"
            :key="alert.id"
            :type="alert.level === 'critical' ? 'error' : 'warning'"
            variant="tonal"
            density="compact"
            rounded="lg"
          >
            <div class="text-body-2">{{ alert.message }}</div>
            <div class="text-caption mt-1" style="opacity: 0.7">
              {{ alert.type }} ／ {{ new Date(alert.createdAt).toLocaleDateString('ja-JP') }}
            </div>
          </v-alert>
        </div>
      </v-card-text>
    </v-card>

    <!-- Department breakdown -->
    <v-row>
      <v-col cols="12" md="6">
        <v-card rounded="xl" elevation="0" border>
          <v-card-title class="pa-4 pb-2 text-subtitle-2 font-weight-bold">部署別コスト</v-card-title>
          <v-card-text class="px-4 pb-4">
            <div class="d-flex flex-column ga-3">
              <div v-for="dept in deptCosts" :key="dept.name">
                <div class="d-flex justify-space-between align-center mb-1">
                  <div class="d-flex align-center ga-2">
                    <div class="dept-dot" :style="{ background: dept.color }" />
                    <span class="text-body-2">{{ dept.name }}</span>
                  </div>
                  <span class="text-body-2 font-weight-medium">¥{{ dept.cost.toLocaleString() }}</span>
                </div>
                <v-progress-linear
                  :model-value="dept.percent"
                  :color="dept.color"
                  bg-color="#E0E1E4"
                  height="6"
                  rounded
                />
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="6">
        <v-card rounded="xl" elevation="0" border>
          <v-card-title class="pa-4 pb-2 text-subtitle-2 font-weight-bold">残業時間ランキング</v-card-title>
          <v-card-text class="px-4 pb-4">
            <div class="d-flex flex-column ga-2">
              <div
                v-for="(item, i) in overtimeRanking"
                :key="item.empId"
                class="d-flex align-center justify-space-between pa-2 rounded-lg"
                style="background: #F8F9FA"
              >
                <div class="d-flex align-center ga-2">
                  <span class="text-caption text-medium-emphasis" style="width: 16px">{{ i + 1 }}</span>
                  <v-avatar color="primary" size="24">
                    <span class="text-white" style="font-size: 9px">{{ item.name.charAt(0) }}</span>
                  </v-avatar>
                  <span class="text-caption">{{ item.name }}</span>
                </div>
                <span class="text-caption font-weight-bold" :class="item.hours >= 40 ? 'text-error' : 'text-warning'">
                  {{ item.hours }}h
                </span>
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-snackbar v-model="snackbar" location="top center" color="primary" rounded="pill" :timeout="2000">
      エクスポートを開始しました
    </v-snackbar>
  </div>
</template>

<script setup lang="ts">
import { useMockData } from '~/composables/useMockData'

const { alerts, employees, attendanceRecords, currentBoard } = useMockData()

const selectedMonth = ref('2026年2月')
const monthOptions = ['2025年12月', '2026年1月', '2026年2月', '2026年3月']
const snackbar = ref(false)

const summaryStats = computed(() => [
  { label: '総人件費', value: '¥428,500', sub: '先月比 +3.2%', icon: 'mdi-currency-jpy', color: 'success', valueColor: '#4bd08b' },
  { label: '総労働時間', value: '1,240h', sub: '先月比 +1.5%', icon: 'mdi-clock-outline', color: 'primary' },
  { label: '平均残業時間', value: '18.5h', sub: '従業員あたり/月', icon: 'mdi-clock-alert-outline', color: 'warning' },
  { label: 'アラート件数', value: String(alerts.length), sub: alerts.filter(a => a.level === 'critical').length + '件 重要', icon: 'mdi-alert', color: 'error', valueColor: '#e6273e' },
])

const deptCosts = computed(() => {
  const total = currentBoard.entries.reduce((s, e) => s + e.estimatedWage, 0) || 1
  const depts = ['キッチン', 'ホール', 'レジ']
  const colors = ['#3587dc', '#4bd08b', '#f8c076']
  return depts.map((name, i) => {
    const cost = currentBoard.entries
      .filter(e => e.department === name)
      .reduce((s, e) => s + e.estimatedWage, 0)
    return { name, cost, percent: Math.round((cost / total) * 100), color: colors[i] }
  })
})

const overtimeRanking = computed(() =>
  employees
    .filter(e => e.status === 'ACTIVE')
    .map(emp => {
      const totalOT = attendanceRecords
        .filter(r => r.employeeId === emp.id)
        .reduce((sum, r) => sum + r.overtimeMinutes, 0)
      const base = (parseInt(emp.id.slice(-2)) % 20) + 25
      return { empId: emp.id, name: emp.name, hours: Math.round(base + totalOT / 60) }
    })
    .sort((a, b) => b.hours - a.hours)
    .slice(0, 8)
)
</script>

<style scoped>
.dept-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}
</style>
