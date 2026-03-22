<template>
  <div class="pa-4">
    <div class="text-body-2 text-grey mb-4">シフトの代打または交換を依頼します</div>

    <!-- Step 1: Select shift -->
    <div class="text-subtitle-2 font-weight-bold mb-2">1. 対象シフトを選択</div>
    <v-card rounded="xl" elevation="0" variant="outlined" class="mb-4">
      <v-list density="compact" rounded="xl">
        <v-list-item
          v-for="shift in upcomingShifts"
          :key="shift.id"
          :active="selectedShiftId === shift.id"
          active-color="primary"
          rounded="xl"
          @click="selectedShiftId = shift.id"
        >
          <template #prepend>
            <v-icon :color="selectedShiftId === shift.id ? 'primary' : 'grey'" size="18">
              {{ selectedShiftId === shift.id ? 'mdi-radiobox-marked' : 'mdi-radiobox-blank' }}
            </v-icon>
          </template>
          <v-list-item-title class="text-body-2 font-weight-medium">{{ dateLabel(shift.date) }}</v-list-item-title>
          <v-list-item-subtitle>{{ shift.startTime }} 〜 {{ shift.endTime }} / {{ shift.department }}</v-list-item-subtitle>
        </v-list-item>
      </v-list>
      <div v-if="upcomingShifts.length === 0" class="text-caption text-grey text-center py-4">
        今後の確定シフトはありません
      </div>
    </v-card>

    <!-- Step 2: Type -->
    <div class="text-subtitle-2 font-weight-bold mb-2">2. 依頼の種類</div>
    <div class="d-flex gap-2 mb-4">
      <v-btn
        :color="requestType === 'SUBSTITUTE' ? 'warning' : 'default'"
        :variant="requestType === 'SUBSTITUTE' ? 'tonal' : 'outlined'"
        rounded="lg"
        class="flex-1-1"
        @click="requestType = 'SUBSTITUTE'"
      >
        <v-icon start>mdi-account-switch-outline</v-icon>
        代打依頼
      </v-btn>
      <v-btn
        :color="requestType === 'SWAP' ? 'primary' : 'default'"
        :variant="requestType === 'SWAP' ? 'tonal' : 'outlined'"
        rounded="lg"
        class="flex-1-1"
        @click="requestType = 'SWAP'"
      >
        <v-icon start>mdi-swap-horizontal</v-icon>
        シフト交換
      </v-btn>
    </div>

    <!-- Type explanation -->
    <v-alert
      :type="requestType === 'SUBSTITUTE' ? 'warning' : 'info'"
      variant="tonal"
      density="compact"
      rounded="lg"
      class="mb-4"
    >
      <div class="text-caption">
        <template v-if="requestType === 'SUBSTITUTE'">
          代打: 相手にシフトを代わりに入ってもらいます（相手のシフト追加）
        </template>
        <template v-else>
          交換: お互いのシフトを入れ替えます（人件費変わらず）
        </template>
      </div>
    </v-alert>

    <!-- Step 3: Target employee (optional) -->
    <div class="text-subtitle-2 font-weight-bold mb-2">3. 依頼先（任意）</div>
    <v-autocomplete
      v-model="targetEmployeeId"
      :items="otherEmployees"
      item-title="name"
      item-value="id"
      label="相手を指名する（指名しない場合は全員に通知）"
      density="compact"
      variant="outlined"
      rounded="lg"
      hide-details
      clearable
      class="mb-4"
    />

    <!-- Step 4: Reason -->
    <div class="text-subtitle-2 font-weight-bold mb-2">4. 理由（任意）</div>
    <v-textarea
      v-model="reason"
      placeholder="例: 急用のため、体調不良のため..."
      rows="3"
      density="compact"
      variant="outlined"
      rounded="lg"
      hide-details
      class="mb-6"
    />

    <!-- Submit -->
    <v-btn
      block
      color="primary"
      size="large"
      rounded="xl"
      :disabled="!selectedShiftId"
      @click="confirmDialog = true"
    >
      <v-icon start>mdi-send</v-icon>
      依頼を送る
    </v-btn>

    <!-- Confirm dialog -->
    <v-dialog v-model="confirmDialog" max-width="320">
      <v-card rounded="xl">
        <v-card-text class="pa-6 text-center">
          <v-icon size="48" color="warning" class="mb-3">mdi-account-switch-outline</v-icon>
          <div class="text-subtitle-1 font-weight-bold mb-2">依頼を送りますか？</div>
          <div class="text-body-2 text-grey mb-1">{{ selectedShiftLabel }}</div>
          <div class="text-body-2 text-grey mb-4">{{ typeLabel }}</div>
          <div class="d-flex gap-2">
            <v-btn variant="outlined" rounded="lg" class="flex-1-1" @click="confirmDialog = false">戻る</v-btn>
            <v-btn color="primary" rounded="lg" class="flex-1-1" @click="doCreate">送る</v-btn>
          </div>
        </v-card-text>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import type { SubstitutionType } from '~/types'

const route = useRoute()
const shiftStore = useShiftStore()
const substitutionStore = useSubstitutionStore()
const appStore = useAppStore()
const { employees } = useMockData()

const selectedShiftId = ref<string | null>((route.query.shiftId as string) || null)
const requestType = ref<SubstitutionType>('SUBSTITUTE')
const targetEmployeeId = ref<string | null>(null)
const reason = ref('')
const confirmDialog = ref(false)

const upcomingShifts = computed(() => shiftStore.upcomingConfirmed)
const otherEmployees = computed(() => employees.filter((e) => e.id !== 'emp-003'))

const selectedShift = computed(() =>
  selectedShiftId.value ? shiftStore.entries.find((e) => e.id === selectedShiftId.value) ?? null : null
)

function dateLabel(date: string) {
  const d = new Date(date)
  const dow = ['日', '月', '火', '水', '木', '金', '土']
  return `${d.getMonth() + 1}月${d.getDate()}日 (${dow[d.getDay()]})`
}

const selectedShiftLabel = computed(() => {
  if (!selectedShift.value) return ''
  return `${dateLabel(selectedShift.value.date)} ${selectedShift.value.startTime}〜${selectedShift.value.endTime}`
})

const typeLabel = computed(() => requestType.value === 'SUBSTITUTE' ? '代打依頼' : 'シフト交換')

function doCreate() {
  if (!selectedShift.value) return
  substitutionStore.createRequest({
    type: requestType.value,
    targetEmployeeId: targetEmployeeId.value,
    sourceDate: selectedShift.value.date,
    sourceStartTime: selectedShift.value.startTime,
    sourceEndTime: selectedShift.value.endTime,
    sourceDepartment: selectedShift.value.department,
    reason: reason.value || undefined,
  })
  confirmDialog.value = false
  appStore.showSnackbar('依頼を送りました', 'success')
  navigateTo('/substitutions')
}
</script>

<style scoped>
.gap-2 { gap: 8px; }
</style>
