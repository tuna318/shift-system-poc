<template>
  <v-dialog v-model="dialog" max-width="440">
    <v-card rounded="xl">
      <v-card-title class="pa-4 pb-3 d-flex align-center justify-space-between">
        <span class="text-subtitle-1 font-weight-bold">シフト調整を提案</span>
        <v-btn icon size="small" variant="text" @click="dialog = false">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>
      <v-divider />
      <v-card-text class="pa-4">
        <v-alert type="info" variant="tonal" density="compact" rounded="lg" class="mb-4">
          <span class="text-caption">スタッフに新しい時間帯を提案します。承認が得られた場合に確定します。</span>
        </v-alert>
        <div class="d-flex ga-3 mb-3">
          <div class="flex-1-1">
            <label class="text-caption font-weight-medium mb-1 d-block text-medium-emphasis">提案 開始時刻</label>
            <v-select v-model="propStart" :items="timeOptions" />
          </div>
          <div class="flex-1-1">
            <label class="text-caption font-weight-medium mb-1 d-block text-medium-emphasis">提案 終了時刻</label>
            <v-select v-model="propEnd" :items="timeOptions" />
          </div>
        </div>
        <div>
          <label class="text-caption font-weight-medium mb-1 d-block text-medium-emphasis">調整理由</label>
          <v-textarea v-model="reason" placeholder="調整理由を入力..." rows="2" />
        </div>
      </v-card-text>
      <v-card-actions class="pa-4 pt-0">
        <v-spacer />
        <v-btn variant="text" @click="dialog = false">キャンセル</v-btn>
        <v-btn color="warning" variant="flat" @click="propose">提案を送信</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
const props = defineProps<{
  modelValue: boolean
}>()
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  propose: [start: string, end: string, reason: string]
}>()

const dialog = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
})

const propStart = ref('10:00')
const propEnd = ref('18:00')
const reason = ref('')

const timeOptions = computed(() => {
  const opts: string[] = []
  for (let h = 6; h <= 26; h++) {
    for (const m of [0, 15, 30, 45]) {
      const displayH = h > 23 ? h - 24 : h
      opts.push(`${String(displayH).padStart(2, '0')}:${String(m).padStart(2, '0')}`)
    }
  }
  return opts
})

function propose() {
  emit('propose', propStart.value, propEnd.value, reason.value)
  dialog.value = false
}
</script>
