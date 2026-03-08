<template>
  <div class="gantt-cost-panel d-flex flex-column">
    <!-- Header -->
    <div class="pa-3 border-b" style="background: #F8F9FA">
      <div class="d-flex align-center justify-space-between mb-2">
        <span class="text-caption font-weight-bold text-medium-emphasis">コスト概要</span>
        <v-chip v-if="overLimitCount > 0" color="error" size="x-small" variant="flat">
          ⚠ {{ overLimitCount }}名超過
        </v-chip>
      </div>

      <!-- Total vs Budget -->
      <div class="mb-2">
        <div class="d-flex justify-space-between align-center mb-1">
          <span class="text-caption text-medium-emphasis">合計勤務時間</span>
          <span class="text-caption font-weight-medium">{{ totalHours }}h</span>
        </div>
        <div class="d-flex justify-space-between align-center mb-1">
          <span class="text-caption text-medium-emphasis">合計コスト</span>
          <span class="text-body-2 font-weight-bold" :style="{ color: overBudget ? '#e6273e' : '#3587dc' }">
            ¥{{ totalCost.toLocaleString() }}
          </span>
        </div>
        <div class="d-flex justify-space-between align-center mb-1">
          <span class="text-caption text-medium-emphasis">予算</span>
          <span class="text-caption">¥{{ budget.toLocaleString() }}</span>
        </div>
        <v-progress-linear
          :model-value="budgetPercent"
          :color="overBudget ? 'error' : 'primary'"
          bg-color="#E0E1E4"
          height="6"
          rounded
        />
        <div class="d-flex justify-space-between align-center mt-1">
          <span class="text-caption" style="font-size: 10px" :class="overBudget ? 'text-error' : 'text-medium-emphasis'">
            {{ overBudget ? '予算超過' : '予算内' }}
          </span>
          <span class="text-caption" style="font-size: 10px" :class="overBudget ? 'text-error' : 'text-success'">
            {{ overBudget ? '+' : '' }}¥{{ Math.abs(variance).toLocaleString() }} ({{ variancePercent }}%)
          </span>
        </div>
      </div>
    </div>

    <!-- Slot heatmap -->
    <div class="pa-3 border-t" style="background: #F8F9FA">
      <div class="text-caption font-weight-bold text-medium-emphasis mb-2">時間帯別カバレッジ</div>
      <div class="d-flex ga-1 flex-wrap">
        <div
          v-for="slot in heatmapSlots"
          :key="slot.hour"
          class="heatmap-cell"
          :style="{
            background: slotColor(slot.count),
          }"
          :title="`${slot.hour}:00 — ${slot.count}名`"
        >
          <span style="font-size: 8px">{{ slot.hour }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useShiftStore } from '~/stores/shift.store'

const shiftStore = useShiftStore()

const totalCost = computed(() => shiftStore.costSummary.totalCost)
const budget = computed(() => shiftStore.costSummary.budget)
const variance = computed(() => shiftStore.costSummary.variance)
const overBudget = computed(() => variance.value > 0)
const budgetPercent = computed(() => Math.min(100, (totalCost.value / budget.value) * 100))

const perEmployeeStats = computed(() => shiftStore.perEmployeeStats)

const totalHours = computed(() =>
  perEmployeeStats.value.reduce((sum, e) => sum + e.hours, 0).toFixed(1)
)

const overLimitCount = computed(() =>
  perEmployeeStats.value.filter(e => e.isOver).length
)

const variancePercent = computed(() =>
  budget.value > 0 ? Math.round((totalCost.value / budget.value) * 100) : 0
)

// Heatmap: count employees working each hour across all entries
const heatmapSlots = computed(() => {
  const slots = Array.from({ length: 17 }, (_, i) => ({ hour: i + 7, count: 0 }))
  for (const entry of shiftStore.entries) {
    const [sh] = entry.startTime.split(':').map(Number)
    const [eh] = entry.endTime.split(':').map(Number)
    for (let h = sh; h < eh; h++) {
      const slot = slots.find(s => s.hour === h)
      if (slot) slot.count++
    }
  }
  return slots
})

function slotColor(count: number): string {
  if (count === 0) return '#E0E1E4'
  if (count <= 2) return '#DBEAFE'
  if (count <= 4) return '#93C5FD'
  if (count <= 6) return '#3587dc'
  return '#1D4ED8'
}
</script>

<style scoped>
.heatmap-cell {
  width: 22px;
  height: 22px;
  border-radius: 3px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #555;
  cursor: default;
}
</style>
