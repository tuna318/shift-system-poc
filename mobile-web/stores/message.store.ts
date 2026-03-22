import { defineStore } from 'pinia'
import type { ChatMessage } from '~/types'

export const useMessageStore = defineStore('messages', () => {
  const mockData = useMockData()
  const messages = ref<ChatMessage[]>([...mockData.chatMessages.value])

  const sortedMessages = computed(() =>
    [...messages.value].sort((a, b) => a.sentAt.localeCompare(b.sentAt))
  )

  const unreadCount = computed(() =>
    messages.value.filter((m) => m.sender === 'manager' && !m.read).length
  )

  const pendingAdjustments = computed(() =>
    messages.value.filter((m) => m.adjustRequest?.responseStatus === 'PENDING')
  )

  function sendMessage(body: string) {
    messages.value.push({
      id: `msg-${Date.now()}`,
      sender: 'employee',
      body,
      sentAt: new Date().toISOString(),
      read: true,
    })
  }

  function markAllRead() {
    messages.value.forEach((m) => { m.read = true })
  }

  function respondToAdjustment(messageId: string, response: 'ACCEPTED' | 'DECLINED') {
    const msg = messages.value.find((m) => m.id === messageId)
    if (!msg?.adjustRequest) return

    msg.adjustRequest.responseStatus = response
    msg.read = true

    // Update the shift entry via shift store
    const shiftStore = useShiftStore()
    const replyBody = response === 'ACCEPTED'
      ? '承知しました。出勤いたします。'
      : '申し訳ありません。その日は対応できません。'
    shiftStore.respondToAdjustment(msg.adjustRequest.entryId, response, replyBody)

    // Auto-reply
    sendMessage(replyBody)
  }

  return {
    messages,
    sortedMessages,
    unreadCount,
    pendingAdjustments,
    sendMessage,
    markAllRead,
    respondToAdjustment,
  }
})
