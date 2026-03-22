<template>
  <v-card rounded="xl" elevation="0" variant="outlined">
    <v-card-text class="pa-4">
      <!-- Header: type + status -->
      <div class="d-flex align-center justify-space-between mb-3">
        <v-chip :color="typeColor" size="small" variant="tonal">
          <v-icon start size="12">{{ typeIcon }}</v-icon>
          {{ typeLabel }}
        </v-chip>
        <v-chip :color="statusColor" size="small" variant="tonal">
          {{ statusLabel }}
        </v-chip>
      </div>

      <!-- Shift info -->
      <div class="d-flex align-center gap-2 mb-1">
        <v-icon size="16" color="primary">mdi-calendar</v-icon>
        <span class="text-body-2 font-weight-bold">{{ dateLabel }}</span>
      </div>
      <div class="d-flex align-center gap-2 mb-1">
        <v-icon size="16" color="grey">mdi-clock-outline</v-icon>
        <span class="text-body-2">{{ props.request.sourceStartTime }} 〜 {{ props.request.sourceEndTime }}</span>
      </div>
      <div class="d-flex align-center gap-2 mb-2">
        <v-icon size="16" color="grey">mdi-store-outline</v-icon>
        <span class="text-body-2 text-grey">{{ props.request.sourceDepartment }}</span>
      </div>

      <!-- Partner -->
      <div class="d-flex align-center gap-2 mb-2">
        <v-icon size="16" color="grey">mdi-account-outline</v-icon>
        <span class="text-body-2 text-grey">
          {{ props.isReceived ? '依頼者: ' : '依頼先: ' }}
          <strong>{{ partnerName }}</strong>
        </span>
      </div>

      <!-- Reason -->
      <div v-if="props.request.reason" class="text-caption text-grey mb-3 ml-1">
        "{{ props.request.reason }}"
      </div>

      <!-- Actions -->
      <template v-if="props.isReceived && props.request.status === 'PENDING'">
        <div class="d-flex gap-2 mt-2">
          <v-btn color="primary" rounded="lg" size="small" class="flex-1-1" @click="$emit('accept')">
            <v-icon start size="14">mdi-check</v-icon>
            承諾する
          </v-btn>
          <v-btn color="error" variant="outlined" rounded="lg" size="small" class="flex-1-1" @click="$emit('reject')">
            <v-icon start size="14">mdi-close</v-icon>
            断る
          </v-btn>
        </div>
      </template>
      <template v-else-if="!props.isReceived && props.request.status === 'PENDING'">
        <v-btn color="error" variant="outlined" rounded="lg" size="small" block @click="$emit('cancel')">
          キャンセルする
        </v-btn>
      </template>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import type { SubstitutionRequest } from '~/types'

const props = defineProps<{
  request: SubstitutionRequest
  isReceived: boolean
}>()

defineEmits<{
  accept: []
  reject: []
  cancel: []
}>()

const { employees } = useMockData()

const partnerId = computed(() =>
  props.isReceived ? props.request.sourceEmployeeId : props.request.targetEmployeeId
)

const partnerName = computed(() => {
  if (!partnerId.value) return '未指定'
  return employees.find((e) => e.id === partnerId.value)?.name ?? partnerId.value
})

const dateLabel = computed(() => {
  const d = new Date(props.request.sourceDate)
  const dow = ['日', '月', '火', '水', '木', '金', '土']
  return `${d.getMonth() + 1}月${d.getDate()}日 (${dow[d.getDay()]})`
})

const typeLabel = computed(() => props.request.type === 'SUBSTITUTE' ? '代打依頼' : 'シフト交換')
const typeColor = computed(() => props.request.type === 'SUBSTITUTE' ? 'warning' : 'primary')
const typeIcon = computed(() => props.request.type === 'SUBSTITUTE' ? 'mdi-account-switch-outline' : 'mdi-swap-horizontal')

const statusConfig: Record<string, { label: string; color: string }> = {
  PENDING: { label: '回答待ち', color: 'warning' },
  ACCEPTED: { label: '承諾済み', color: 'success' },
  REJECTED: { label: 'お断り', color: 'error' },
  CANCELLED: { label: 'キャンセル', color: 'grey' },
}

const statusLabel = computed(() => statusConfig[props.request.status]?.label ?? props.request.status)
const statusColor = computed(() => statusConfig[props.request.status]?.color ?? 'grey')
</script>

<style scoped>
.gap-2 { gap: 8px; }
</style>
