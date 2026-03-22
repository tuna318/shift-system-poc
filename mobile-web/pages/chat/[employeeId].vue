<template>
  <div class="chat-page">
    <!-- Messages -->
    <div ref="scrollContainer" class="chat-messages pa-4">
      <div v-if="messageStore.sortedMessages.length === 0" class="text-center text-grey py-8">
        メッセージはありません
      </div>
      <ChatBubble
        v-for="msg in messageStore.sortedMessages"
        :key="msg.id"
        :message="msg"
        @respond="handleRespond"
      />
      <div ref="bottomAnchor" />
    </div>

    <!-- Input bar -->
    <div class="chat-input-area pa-3">
      <div class="d-flex align-center gap-2">
        <v-text-field
          v-model="inputText"
          placeholder="メッセージを入力..."
          variant="outlined"
          density="compact"
          rounded="xl"
          hide-details
          class="flex-1-1"
          @keydown.enter.prevent="sendMessage"
        />
        <v-btn
          icon
          color="primary"
          :disabled="!inputText.trim()"
          @click="sendMessage"
        >
          <v-icon>mdi-send</v-icon>
        </v-btn>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const messageStore = useMessageStore()
const appStore = useAppStore()
const scrollContainer = ref<HTMLElement | null>(null)
const bottomAnchor = ref<HTMLElement | null>(null)
const inputText = ref('')

onMounted(() => {
  messageStore.markAllRead()
  nextTick(() => scrollToBottom())
})

function scrollToBottom() {
  bottomAnchor.value?.scrollIntoView({ behavior: 'smooth' })
}

function sendMessage() {
  const text = inputText.value.trim()
  if (!text) return
  messageStore.sendMessage(text)
  inputText.value = ''
  nextTick(() => scrollToBottom())
}

function handleRespond(messageId: string, response: 'ACCEPTED' | 'DECLINED') {
  messageStore.respondToAdjustment(messageId, response)
  const label = response === 'ACCEPTED' ? '承諾しました' : 'お断りしました'
  appStore.showSnackbar(`調整依頼を${label}`, response === 'ACCEPTED' ? 'success' : 'warning')
  nextTick(() => scrollToBottom())
}

watch(() => messageStore.messages.length, () => {
  nextTick(() => scrollToBottom())
})
</script>

<style scoped>
.chat-page {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 56px - 64px); /* header + bottom nav */
}
.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding-bottom: 8px;
}
.chat-input-area {
  border-top: 1px solid #e0e0e0;
  background: white;
  flex-shrink: 0;
}
.gap-2 { gap: 8px; }
</style>
