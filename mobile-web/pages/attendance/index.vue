<template>
  <div class="pa-4">
    <!-- Month selector -->
    <div class="d-flex align-center justify-space-between mb-4">
      <v-btn icon="mdi-chevron-left" variant="text" size="small" @click="prevMonth" />
      <span class="text-subtitle-1 font-weight-bold">{{ displayMonth }}</span>
      <v-btn icon="mdi-chevron-right" variant="text" size="small" @click="nextMonth" />
    </div>

    <!-- Summary card -->
    <v-card rounded="xl" color="primary" class="mb-4" elevation="2">
      <v-card-text class="pa-4">
        <div class="d-flex justify-space-around text-white">
          <div class="text-center">
            <div class="text-h6 font-weight-bold">{{ totalHoursLabel }}</div>
            <div class="text-caption" style="opacity:0.8;">総勤務時間</div>
          </div>
          <v-divider vertical color="white" style="opacity:0.3;" />
          <div class="text-center">
            <div class="text-h6 font-weight-bold">{{ workDays }}</div>
            <div class="text-caption" style="opacity:0.8;">出勤日数</div>
          </div>
          <v-divider vertical color="white" style="opacity:0.3;" />
          <div class="text-center">
            <div class="text-h6 font-weight-bold">{{ overtimeLabel }}</div>
            <div class="text-caption" style="opacity:0.8;">残業時間</div>
          </div>
        </div>
      </v-card-text>
    </v-card>

    <!-- Attendance list -->
    <v-card rounded="xl" elevation="0" variant="outlined">
      <div v-if="filteredRecords.length === 0" class="text-center text-grey pa-8">
        <v-icon size="40" color="grey-lighten-2">mdi-clipboard-text-outline</v-icon>
        <div class="text-body-2 mt-2">勤怠記録はありません</div>
      </div>
      <template v-else>
        <template v-for="(record, i) in filteredRecords" :key="record.id">
          <v-divider v-if="i > 0" />
          <AttendanceRow
            :record="record"
            @click="navigateTo(`/attendance/${record.id}`)"
          />
        </template>
      </template>
    </v-card>
  </div>
</template>

<script setup lang="ts">
const { myAttendance, formatMinutes } = useMockData()

const currentYear = ref(2026)
const currentMonth = ref(3)

const displayMonth = computed(() => `${currentYear.value}年${currentMonth.value}月`)

function prevMonth() {
  if (currentMonth.value === 1) { currentMonth.value = 12; currentYear.value-- }
  else currentMonth.value--
}
function nextMonth() {
  if (currentMonth.value === 12) { currentMonth.value = 1; currentYear.value++ }
  else currentMonth.value++
}

const filteredRecords = computed(() =>
  myAttendance
    .filter((a) => {
      const d = new Date(a.date)
      return d.getFullYear() === currentYear.value && d.getMonth() + 1 === currentMonth.value
    })
    .sort((a, b) => b.date.localeCompare(a.date))
)

const totalMinutes = computed(() =>
  filteredRecords.value.reduce((sum, r) => sum + (r.totalMinutes ?? 0), 0)
)
const totalHoursLabel = computed(() => formatMinutes(totalMinutes.value) || '0時間')
const workDays = computed(() =>
  filteredRecords.value.filter((r) => r.checkIn).length
)
const overtimeTotal = computed(() =>
  filteredRecords.value.reduce((sum, r) => sum + (r.overtimeMinutes ?? 0), 0)
)
const overtimeLabel = computed(() => formatMinutes(overtimeTotal.value) || '0時間')
</script>
