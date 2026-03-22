<template>
  <div :class="['d-flex', 'mb-3', isEmployee ? 'justify-end' : 'justify-start']">
    <!-- Manager avatar -->
    <v-avatar v-if="!isEmployee" size="32" color="primary" class="mr-2 mt-1 flex-shrink-0">
      <span class="text-caption text-white font-weight-bold">店</span>
    </v-avatar>

    <div :style="isEmployee ? 'max-width: 80%; align-items: flex-end;' : 'max-width: 80%;'" class="d-flex flex-column">
      <!-- Message bubble -->
      <div
        :class="[
          'px-3 py-2',
          isEmployee ? 'employee-bubble' : 'manager-bubble',
        ]"
        style="border-radius: 12px; display: inline-block;"
      >
        <div class="text-body-2" style="white-space: pre-wrap; word-break: break-word;">{{ props.message.body }}</div>
      </div>

      <!-- Embedded adjustment request (only for manager messages) -->
      <AdjustRequestEmbed
        v-if="!isEmployee && props.message.adjustRequest"
        :message-id="props.message.id"
        :payload="props.message.adjustRequest"
        @respond="(id, res) => $emit('respond', id, res)"
      />

      <!-- Timestamp -->
      <div class="text-caption text-grey mt-1" :class="isEmployee ? 'text-right' : ''">
        {{ timeLabel }}
      </div>
    </div>

    <!-- Employee avatar -->
    <v-avatar v-if="isEmployee" size="32" color="success" class="ml-2 mt-1 flex-shrink-0">
      <v-icon size="16" color="white">mdi-account</v-icon>
    </v-avatar>
  </div>
</template>

<script setup lang="ts">
import type { ChatMessage } from '~/types'

const props = defineProps<{
  message: ChatMessage
}>()

defineEmits<{
  respond: [messageId: string, response: 'ACCEPTED' | 'DECLINED']
}>()

const isEmployee = computed(() => props.message.sender === 'employee')

const timeLabel = computed(() => {
  const d = new Date(props.message.sentAt)
  const mo = d.getMonth() + 1
  const da = d.getDate()
  const h = String(d.getHours()).padStart(2, '0')
  const m = String(d.getMinutes()).padStart(2, '0')
  return `${mo}/${da} ${h}:${m}`
})
</script>

<style scoped>
.manager-bubble {
  background: #f0f4f8;
  color: #1a1a1a;
}
.employee-bubble {
  background: #3587dc;
  color: white;
}
</style>
