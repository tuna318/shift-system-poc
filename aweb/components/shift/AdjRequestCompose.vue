<template>
  <div class="adj-compose">
    <div class="adj-compose-header">
      <v-icon size="13" color="warning">mdi-swap-horizontal-bold</v-icon>
      <span class="adj-compose-title">調整依頼の内容</span>
      <div class="adj-compose-chips">
        <span class="sc sc--sm" :class="props.entry.cellStatus === 'SHIFT_REQUESTED' ? 'sc--shift-req' : 'sc--dayoff-req'">
          {{ props.entry.cellStatus === 'SHIFT_REQUESTED' ? 'シフト希望' : '休み希望' }}
        </span>
        <v-icon size="12" color="medium-emphasis">mdi-arrow-right</v-icon>
        <span class="sc sc--sm" :class="targetStatus === 'CONFIRMED' ? 'sc--intent-work' : 'sc--intent-off'">
          {{ targetStatus === 'CONFIRMED' ? '出勤依頼' : '休み打診' }}
        </span>
      </div>
    </div>

    <v-textarea
      v-model="reason"
      placeholder="依頼の理由（任意）..."
      rows="2" auto-grow
      density="compact" variant="outlined" rounded="lg"
      hide-details class="mb-2"
    />

    <div class="d-flex justify-end" style="gap:8px">
      <v-btn size="small" variant="text" @click="emit('cancel')">キャンセル</v-btn>
      <v-btn size="small" color="warning" variant="flat" rounded="lg"
        prepend-icon="mdi-send-outline" @click="send">
        依頼を送信
      </v-btn>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useChatMessages } from '~/composables/useChatMessages'
import { useShiftStore } from '~/stores/shift.store'
import { useChatStore } from '~/stores/chat.store'
import type { ShiftEntry } from '~/types'

const props = defineProps<{
  entry: ShiftEntry
  employeeId: string
}>()

const emit = defineEmits<{ sent: []; cancel: [] }>()

const { addMessage } = useChatMessages()
const shiftStore = useShiftStore()
const chatStore  = useChatStore()

const reason = ref('')

const targetStatus = computed<'CONFIRMED' | 'DAY_OFF_CONFIRMED'>(() =>
  props.entry.cellStatus === 'SHIFT_REQUESTED' ? 'DAY_OFF_CONFIRMED' : 'CONFIRMED',
)


function send() {
  const body = reason.value.trim() || '調整をお願いできますか？'
  addMessage({
    employeeId: props.employeeId,
    sender: 'manager',
    body,
    shiftDate: props.entry.shiftDate,
    adjustRequest: {
      entryId: props.entry.id,
      shiftDate: props.entry.shiftDate,
      startTime: props.entry.startTime ?? '00:00',
      endTime:   props.entry.endTime   ?? '00:00',
      currentStatus: props.entry.cellStatus,
      targetStatus: targetStatus.value,
      responseStatus: 'PENDING',
    },
  })
  shiftStore.requestAdjustment(props.entry.id, body, targetStatus.value)
  reason.value = ''
  chatStore.openConversation(props.employeeId)
  emit('sent')
}
</script>

<style scoped>
.adj-compose {
  padding: 12px 14px;
  border-radius: 8px;
  border-left: 3px solid #f59e0b;
  background: rgba(245,158,11,0.05);
}

.adj-compose-header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 10px;
  flex-wrap: wrap;
}
.adj-compose-title {
  font-size: 12px; font-weight: 600; color: #92400e;
}
.adj-compose-chips { display: flex; align-items: center; gap: 4px; margin-left: auto; }

/* Chips */
.sc {
  display: inline-flex; align-items: center;
  padding: 2px 7px; border-radius: 10px;
  font-size: 11px; font-weight: 600; border: 1.5px solid transparent;
}
.sc--sm          { padding: 2px 6px; font-size: 11px; }
.sc--shift-req   { background: transparent; border-color: #3587dc; color: #1d4ed8; }
.sc--dayoff-req  { background: transparent; border-color: #64748b; color: #475569; }
.sc--intent-work { background: rgba(37,99,235,0.1); border-color: #3587dc; color: #1d4ed8; }
.sc--intent-off  { background: rgba(100,116,139,0.1); border-color: #64748b; color: #475569; }
</style>
