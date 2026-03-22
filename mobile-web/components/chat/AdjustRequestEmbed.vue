<template>
  <v-card
    rounded="lg"
    variant="outlined"
    :color="responded ? 'grey-lighten-3' : 'primary'"
    class="mt-2"
    style="max-width: 280px;"
  >
    <v-card-text class="pa-3">
      <div class="d-flex align-center gap-1 mb-2">
        <v-icon size="14" :color="responded ? 'grey' : 'primary'">mdi-calendar-edit</v-icon>
        <span class="text-caption font-weight-bold" :class="responded ? 'text-grey' : 'text-primary'">シフト調整依頼</span>
      </div>
      <div class="text-body-2 font-weight-bold mb-1">{{ dateLabel }}</div>
      <div class="text-caption text-grey">{{ props.payload.startTime }} 〜 {{ props.payload.endTime }}</div>

      <template v-if="!responded">
        <div class="d-flex gap-2 mt-3">
          <v-btn
            size="small"
            color="primary"
            rounded="lg"
            class="flex-1-1"
            @click="$emit('respond', props.messageId, 'ACCEPTED')"
          >
            承諾する
          </v-btn>
          <v-btn
            size="small"
            color="error"
            variant="outlined"
            rounded="lg"
            class="flex-1-1"
            @click="$emit('respond', props.messageId, 'DECLINED')"
          >
            断る
          </v-btn>
        </div>
      </template>
      <template v-else>
        <v-chip
          :color="props.payload.responseStatus === 'ACCEPTED' ? 'success' : 'grey'"
          size="small"
          variant="tonal"
          class="mt-2"
        >
          <v-icon start size="12">{{ props.payload.responseStatus === 'ACCEPTED' ? 'mdi-check' : 'mdi-close' }}</v-icon>
          {{ props.payload.responseStatus === 'ACCEPTED' ? '承諾済み' : '断り済み' }}
        </v-chip>
      </template>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import type { AdjustRequestPayload } from '~/types'

const props = defineProps<{
  messageId: string
  payload: AdjustRequestPayload
}>()

defineEmits<{
  respond: [messageId: string, response: 'ACCEPTED' | 'DECLINED']
}>()

const responded = computed(() => props.payload.responseStatus !== 'PENDING')

const dateLabel = computed(() => {
  if (!props.payload.shiftDate) return ''
  const d = new Date(props.payload.shiftDate)
  const dow = ['日', '月', '火', '水', '木', '金', '土']
  return `${d.getMonth() + 1}月${d.getDate()}日 (${dow[d.getDay()]})`
})
</script>
