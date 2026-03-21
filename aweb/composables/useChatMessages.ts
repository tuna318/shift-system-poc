import { reactive } from 'vue'

export interface AdjustRequestPayload {
  entryId: string
  shiftDate: string
  startTime: string
  endTime: string
  currentStatus: string
  targetStatus: 'CONFIRMED' | 'DAY_OFF_CONFIRMED'
  responseStatus: 'PENDING' | 'ACCEPTED' | 'DECLINED'
}

export interface ChatMessage {
  id: string
  employeeId: string
  sender: 'manager' | 'employee'
  body: string
  sentAt: string
  shiftDate?: string
  adjustRequest?: AdjustRequestPayload
}

const _messages = reactive<ChatMessage[]>([
  // ── 山田 太郎 (emp-001) ──────────────────────────────────────
  {
    id: 'chat-001', employeeId: 'emp-001', sender: 'manager',
    body: '先月のフォロー本当にありがとうございました。今月もよろしくお願いします！',
    sentAt: '2026-02-25T10:00:00', shiftDate: '2026-02-25',
  },
  {
    id: 'chat-002', employeeId: 'emp-001', sender: 'employee',
    body: 'こちらこそ！今月もしっかり頑張ります 💪',
    sentAt: '2026-02-25T10:42:00',
  },

  // ── 鈴木 一郎 (emp-002) ──────────────────────────────────────
  {
    id: 'chat-003', employeeId: 'emp-002', sender: 'manager',
    body: '3/10 のシフト、急遽人手が足りなくなりました。出勤可能でしょうか？',
    sentAt: '2026-03-04T09:10:00', shiftDate: '2026-03-10',
  },
  {
    id: 'chat-004', employeeId: 'emp-002', sender: 'employee',
    body: 'その日は予定があるので難しいです…すみません。',
    sentAt: '2026-03-04T12:05:00',
  },
  {
    id: 'chat-005', employeeId: 'emp-002', sender: 'manager',
    body: 'わかりました。無理を言ってすみません。',
    sentAt: '2026-03-04T12:20:00',
  },

  // ── 佐藤 花子 (emp-006) ──────────────────────────────────────
  {
    id: 'chat-006', employeeId: 'emp-006', sender: 'manager',
    body: '来月のシフト希望ありがとうございます。6日連続になりますがご確認ください。',
    sentAt: '2026-03-01T14:00:00',
  },
  {
    id: 'chat-007', employeeId: 'emp-006', sender: 'employee',
    body: '承知しました。問題ありません！むしろ稼ぎたいのでOKです 😊',
    sentAt: '2026-03-01T15:18:00',
  },

  // ── 田中 恵子 (emp-003) — adjustment request example ────────
  {
    id: 'chat-008', employeeId: 'emp-003', sender: 'manager',
    body: 'ランチシフトのご出勤をお願いできますか？ランチ人員が足りておらず、ご協力いただけると助かります。',
    sentAt: '2026-03-18T11:00:00',
    shiftDate: '2026-03-22',
    adjustRequest: {
      entryId: '',  // will be matched by shiftDate + employeeId at runtime
      shiftDate: '2026-03-22',
      startTime: '11:00',
      endTime: '15:00',
      currentStatus: 'DAY_OFF_REQUESTED',
      targetStatus: 'CONFIRMED',
      responseStatus: 'PENDING',
    },
  },
  {
    id: 'chat-009', employeeId: 'emp-003', sender: 'employee',
    body: '少し家族と相談が必要です。明日お返事してもよいですか？',
    sentAt: '2026-03-18T14:00:00',
  },
])

export function useChatMessages() {
  function getMessages(employeeId: string): ChatMessage[] {
    return _messages
      .filter(m => m.employeeId === employeeId)
      .sort((a, b) => a.sentAt.localeCompare(b.sentAt))
  }

  function getLastMessage(employeeId: string): ChatMessage | undefined {
    return getMessages(employeeId).at(-1)
  }

  function addMessage(msg: Omit<ChatMessage, 'id' | 'sentAt'>): ChatMessage {
    const m: ChatMessage = {
      id: `chat-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      sentAt: new Date().toISOString(),
      ...msg,
    }
    _messages.push(m)
    return m
  }

  function respondToAdjustment(messageId: string, response: 'ACCEPTED' | 'DECLINED') {
    const msg = _messages.find(m => m.id === messageId)
    if (msg?.adjustRequest) {
      msg.adjustRequest.responseStatus = response === 'ACCEPTED' ? 'ACCEPTED' : 'DECLINED'
      // Auto-reply from employee
      addMessage({
        employeeId: msg.employeeId,
        sender: 'employee',
        body: response === 'ACCEPTED' ? 'わかりました。承諾します。' : '申し訳ありませんが、お断りさせてください。',
      })
    }
  }

  // Count messages sent by employees (simulated unread)
  const unreadCount = computed(() =>
    _messages.filter(m => m.sender === 'employee').length,
  )

  return { getMessages, getLastMessage, addMessage, respondToAdjustment, unreadCount }
}
