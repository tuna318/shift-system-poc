<template>
  <div class="pa-4">
    <v-list rounded="xl" elevation="0" variant="outlined">
      <v-list-item
        prepend-avatar=""
        rounded="xl"
        class="py-3"
        @click="navigateTo('/chat/emp-003')"
      >
        <template #prepend>
          <v-avatar color="primary" size="44">
            <span class="text-subtitle-2 text-white font-weight-bold">店</span>
          </v-avatar>
        </template>
        <v-list-item-title class="font-weight-bold">店長</v-list-item-title>
        <v-list-item-subtitle class="text-truncate" style="max-width: 220px;">
          {{ lastMessage?.body ?? 'メッセージはありません' }}
        </v-list-item-subtitle>
        <template #append>
          <div class="d-flex flex-column align-end gap-1">
            <div class="text-caption text-grey">{{ lastMessageTime }}</div>
            <v-badge
              v-if="messageStore.unreadCount > 0"
              :content="messageStore.unreadCount"
              color="error"
              inline
            />
          </div>
        </template>
      </v-list-item>
    </v-list>

    <div class="text-caption text-grey text-center mt-6">
      店舗メンバーとのチャットは今後追加予定です
    </div>
  </div>
</template>

<script setup lang="ts">
const messageStore = useMessageStore()

const lastMessage = computed(() => messageStore.sortedMessages.at(-1))

const lastMessageTime = computed(() => {
  if (!lastMessage.value) return ''
  const d = new Date(lastMessage.value.sentAt)
  const mo = d.getMonth() + 1
  const da = d.getDate()
  return `${mo}/${da}`
})
</script>
