<template>
  <Teleport to="body">
  <!-- ── Floating Action Button ────────────────────────────── -->
  <div class="chat-fab" @click="chatStore.open()">
    <v-icon size="22" color="white">mdi-message-text</v-icon>
    <span v-if="unreadCount > 0" class="fab-badge">{{ unreadCount }}</span>
  </div>

  <!-- ── Chat Panel ─────────────────────────────────────────── -->
  <Transition name="chat-panel">
    <div v-if="chatStore.isOpen" class="chat-panel" @click.stop>

      <!-- ═══ CONVERSATION LIST ═══════════════════════════════ -->
      <template v-if="!chatStore.activeEmployeeId">
        <div class="panel-header">
          <span class="panel-title">チャット</span>
          <v-btn icon size="small" variant="text" @click="chatStore.close()">
            <v-icon size="18">mdi-close</v-icon>
          </v-btn>
        </div>

        <!-- Search -->
        <div class="panel-search">
          <v-text-field
            v-model="searchQuery"
            placeholder="スタッフを検索..."
            prepend-inner-icon="mdi-magnify"
            density="compact"
            variant="outlined"
            rounded="lg"
            hide-details
            clearable
          />
        </div>

        <!-- List -->
        <div class="panel-list">
          <!-- Recent conversations first -->
          <div v-if="!searchQuery" class="list-section-label">最近のチャット</div>
          <div v-if="!searchQuery && recentConversations.length === 0" class="list-empty">
            <v-icon size="32" color="medium-emphasis">mdi-message-off-outline</v-icon>
            <span>まだチャットがありません</span>
          </div>

          <div
            v-for="emp in displayedEmployees"
            :key="emp.id"
            class="conv-row"
            @click="chatStore.openConversation(emp.id)"
          >
            <div class="conv-avatar" :class="`conv-avatar--${deptKey(emp.department)}`">
              {{ emp.name.replace(/\s/g, '').charAt(0) }}
            </div>
            <div class="conv-info">
              <div class="conv-name-row">
                <span class="conv-name">{{ emp.name }}</span>
                <span v-if="lastMsg(emp.id)" class="conv-time">{{ relativeTime(lastMsg(emp.id)!.sentAt) }}</span>
              </div>
              <div class="conv-preview">
                <span v-if="lastMsg(emp.id)">
                  <span v-if="lastMsg(emp.id)!.adjustRequest" class="preview-tag">📋 調整依頼 </span>
                  {{ lastMsg(emp.id)!.body }}
                </span>
                <span v-else class="conv-preview--empty">メッセージを開始...</span>
              </div>
            </div>
            <div v-if="empUnread(emp.id) > 0" class="conv-unread">{{ empUnread(emp.id) }}</div>
          </div>

          <!-- All staff section when searching -->
          <template v-if="searchQuery">
            <div v-if="filteredEmployees.length === 0" class="list-empty">
              <span>「{{ searchQuery }}」に一致するスタッフが見つかりません</span>
            </div>
          </template>
          <template v-else-if="remainingEmployees.length > 0">
            <div class="list-section-label list-section-label--mt">全スタッフ</div>
            <div
              v-for="emp in remainingEmployees"
              :key="emp.id"
              class="conv-row"
              @click="chatStore.openConversation(emp.id)"
            >
              <div class="conv-avatar" :class="`conv-avatar--${deptKey(emp.department)}`">
                {{ emp.name.replace(/\s/g, '').charAt(0) }}
              </div>
              <div class="conv-info">
                <div class="conv-name-row">
                  <span class="conv-name">{{ emp.name }}</span>
                  <span class="conv-dept">{{ emp.position }}</span>
                </div>
                <div class="conv-preview conv-preview--empty">{{ emp.department }}</div>
              </div>
            </div>
          </template>
        </div>
      </template>

      <!-- ═══ THREAD VIEW ══════════════════════════════════════ -->
      <template v-else-if="activeEmployee">
        <div class="panel-header panel-header--thread">
          <v-btn icon size="small" variant="text" @click="chatStore.clearEmployee()">
            <v-icon size="18">mdi-arrow-left</v-icon>
          </v-btn>
          <div class="thread-title">
            <div class="conv-avatar conv-avatar--sm" :class="`conv-avatar--${deptKey(activeEmployee.department)}`">
              {{ activeEmployee.name.replace(/\s/g, '').charAt(0) }}
            </div>
            <div>
              <div class="thread-name">{{ activeEmployee.name }}</div>
              <div class="thread-sub">{{ activeEmployee.department }} · {{ activeEmployee.position }}</div>
            </div>
          </div>
          <v-btn icon size="small" variant="text" @click="chatStore.close()">
            <v-icon size="18">mdi-close</v-icon>
          </v-btn>
        </div>

        <!-- Messages -->
        <div ref="scrollEl" class="thread-messages">
          <div v-if="threadMessages.length === 0" class="thread-empty">
            <v-icon size="36" color="medium-emphasis">mdi-message-text-outline</v-icon>
            <span>{{ activeEmployee.name }} さんとのメッセージはまだありません</span>
            <span class="thread-empty-hint">下のボックスからメッセージを送ってみましょう</span>
          </div>

          <template v-for="(msg, i) in threadMessages" :key="msg.id">
            <!-- Date separator -->
            <div
              v-if="i === 0 || !sameDay(msg.sentAt, threadMessages[i-1].sentAt)"
              class="msg-date-sep"
            >
              {{ formatDateLabel(msg.sentAt) }}
            </div>

            <!-- Adjustment request card -->
            <div v-if="msg.adjustRequest" class="adj-card">
              <div class="adj-card-header">
                <v-icon size="14" color="warning">mdi-swap-horizontal-bold</v-icon>
                <span>調整依頼</span>
                <span class="adj-card-date">{{ formatShiftDate(msg.adjustRequest.shiftDate) }}</span>
              </div>
              <div class="adj-card-shift">
                <v-icon size="13" color="medium-emphasis">mdi-clock-outline</v-icon>
                {{ msg.adjustRequest.startTime }} 〜 {{ msg.adjustRequest.endTime }}
              </div>
              <div class="adj-card-flow">
                <span class="sc" :class="`sc--${statusStyleKey(msg.adjustRequest.currentStatus)}`">
                  {{ statusLabel(msg.adjustRequest.currentStatus) }}
                </span>
                <v-icon size="14" color="medium-emphasis">mdi-arrow-right</v-icon>
                <span class="sc" :class="msg.adjustRequest.targetStatus === 'CONFIRMED' ? 'sc--intent-work' : 'sc--intent-off'">
                  {{ msg.adjustRequest.targetStatus === 'CONFIRMED' ? '出勤依頼' : '休み打診' }}
                </span>
              </div>
              <div v-if="msg.body" class="adj-card-body">{{ msg.body }}</div>
              <!-- Actions -->
              <div class="adj-card-actions">
                <template v-if="msg.adjustRequest.responseStatus === 'PENDING'">
                  <v-btn
                    size="x-small" color="success" variant="flat" rounded="lg"
                    prepend-icon="mdi-check"
                    @click="respondAdjustment(msg.id, msg.adjustRequest.entryId, 'ACCEPTED')"
                  >承諾する</v-btn>
                  <v-btn
                    size="x-small" color="error" variant="tonal" rounded="lg"
                    prepend-icon="mdi-close"
                    @click="respondAdjustment(msg.id, msg.adjustRequest.entryId, 'DECLINED')"
                  >断る</v-btn>
                  <span class="adj-status adj-status--pending">
                    <v-icon size="12">mdi-clock-outline</v-icon> 返答待ち
                  </span>
                </template>
                <template v-else-if="msg.adjustRequest.responseStatus === 'ACCEPTED'">
                  <span class="adj-status adj-status--ok">
                    <v-icon size="12">mdi-check-circle</v-icon> 承諾済み
                  </span>
                </template>
                <template v-else>
                  <span class="adj-status adj-status--ng">
                    <v-icon size="12">mdi-close-circle</v-icon> 断られました
                  </span>
                </template>
              </div>
            </div>

            <!-- Regular bubble -->
            <div
              v-else
              class="msg-bubble"
              :class="msg.sender === 'manager' ? 'msg-bubble--mgr' : 'msg-bubble--emp'"
            >
              <div class="msg-text">{{ msg.body }}</div>
              <div class="msg-time">{{ formatTime(msg.sentAt) }}</div>
            </div>
          </template>
        </div>

        <!-- Input -->
        <div class="thread-input">
          <v-textarea
            v-model="inputText"
            placeholder="メッセージを入力..."
            auto-grow rows="1" max-rows="4"
            density="compact" variant="outlined" rounded="xl"
            hide-details
            @keydown.ctrl.enter.prevent="sendMessage"
            @keydown.meta.enter.prevent="sendMessage"
          />
          <v-btn
            color="primary" icon size="small" variant="flat"
            style="flex-shrink:0;border-radius:50%"
            :disabled="!inputText.trim()"
            @click="sendMessage"
          >
            <v-icon size="17">mdi-send</v-icon>
          </v-btn>
        </div>
      </template>

    </div>
  </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { useChatStore } from '~/stores/chat.store'
import { useChatMessages } from '~/composables/useChatMessages'
import { useMockData } from '~/composables/useMockData'
import { useShiftStore } from '~/stores/shift.store'

const chatStore  = useChatStore()
const shiftStore = useShiftStore()
const { employees: allEmployees } = useMockData()
const { getMessages, getLastMessage, addMessage, respondToAdjustment, unreadCount } = useChatMessages()

// ── List view ───────────────────────────────────────────────────
const searchQuery = ref('')

const activeEmployees = computed(() =>
  allEmployees.filter(e => e.status === 'ACTIVE'),
)

const filteredEmployees = computed(() => {
  if (!searchQuery.value.trim()) return activeEmployees.value
  const q = searchQuery.value.toLowerCase()
  return activeEmployees.value.filter(e =>
    e.name.toLowerCase().includes(q) ||
    e.nameKana.toLowerCase().includes(q) ||
    e.department.toLowerCase().includes(q),
  )
})

// Employees with existing messages (sorted by last message time)
const recentConversations = computed(() =>
  activeEmployees.value
    .filter(e => getMessages(e.id).length > 0)
    .sort((a, b) => {
      const la = getLastMessage(a.id)?.sentAt ?? ''
      const lb = getLastMessage(b.id)?.sentAt ?? ''
      return lb.localeCompare(la)
    }),
)

const recentIds = computed(() => new Set(recentConversations.value.map(e => e.id)))

const displayedEmployees = computed(() =>
  searchQuery.value
    ? filteredEmployees.value
    : recentConversations.value,
)

const remainingEmployees = computed(() =>
  searchQuery.value
    ? []
    : activeEmployees.value.filter(e => !recentIds.value.has(e.id)),
)

function lastMsg(empId: string) { return getLastMessage(empId) }

function empUnread(empId: string) {
  return getMessages(empId).filter(m => m.sender === 'employee').length
}

// ── Thread view ─────────────────────────────────────────────────
const activeEmployee = computed(() =>
  chatStore.activeEmployeeId
    ? allEmployees.find(e => e.id === chatStore.activeEmployeeId) ?? null
    : null,
)

const threadMessages = computed(() =>
  chatStore.activeEmployeeId ? getMessages(chatStore.activeEmployeeId) : [],
)

const scrollEl = ref<HTMLElement | null>(null)
watch(threadMessages, () => nextTick(() => {
  if (scrollEl.value) scrollEl.value.scrollTop = scrollEl.value.scrollHeight
}), { deep: true })
watch(() => chatStore.activeEmployeeId, (id) => {
  if (id) nextTick(() => {
    if (scrollEl.value) scrollEl.value.scrollTop = scrollEl.value.scrollHeight
  })
})

// ── Send ────────────────────────────────────────────────────────
const inputText = ref('')

function sendMessage() {
  const body = inputText.value.trim()
  if (!body || !chatStore.activeEmployeeId) return
  addMessage({ employeeId: chatStore.activeEmployeeId, sender: 'manager', body })
  inputText.value = ''
}

function respondAdjustment(msgId: string, entryId: string, response: 'ACCEPTED' | 'DECLINED') {
  respondToAdjustment(msgId, response)
  // Update the shift entry
  if (response === 'ACCEPTED') {
    const msg = threadMessages.value.find(m => m.id === msgId)
    if (msg?.adjustRequest) {
      shiftStore.finalizeAdjustment(msg.adjustRequest.entryId || entryId, msg.adjustRequest.targetStatus)
    }
  }
  else {
    const msg = threadMessages.value.find(m => m.id === msgId)
    if (msg?.adjustRequest?.entryId) {
      shiftStore.updateEntry(msg.adjustRequest.entryId, { adjustingResponseStatus: 'REJECTED' })
    }
  }
}

// ── Helpers ─────────────────────────────────────────────────────
function deptKey(dept: string) {
  if (dept === 'キッチン') return 'kitchen'
  if (dept === 'ホール') return 'hall'
  return 'register'
}

function statusLabel(status: string): string {
  const map: Record<string, string> = {
    SHIFT_REQUESTED: 'シフト希望', CONFIRMED: 'シフト確定',
    DAY_OFF_REQUESTED: '休み希望', DAY_OFF_CONFIRMED: '休み確定', ADJUSTING: '調整中',
  }
  return map[status] ?? status
}

function statusStyleKey(status: string): string {
  const map: Record<string, string> = {
    SHIFT_REQUESTED: 'shift-req', CONFIRMED: 'confirmed',
    DAY_OFF_REQUESTED: 'dayoff-req', DAY_OFF_CONFIRMED: 'dayoff-conf', ADJUSTING: 'adjusting',
  }
  return map[status] ?? 'shift-req'
}

function sameDay(a: string, b: string) {
  return a.slice(0, 10) === b.slice(0, 10)
}

function formatDateLabel(iso: string): string {
  const d = new Date(iso)
  const today = new Date()
  const diff = Math.floor((today.getTime() - d.getTime()) / 86400000)
  if (diff === 0) return '今日'
  if (diff === 1) return '昨日'
  return d.toLocaleDateString('ja-JP', { month: 'long', day: 'numeric' })
}

function formatShiftDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric', weekday: 'short' })
}

function formatTime(iso: string): string {
  const d = new Date(iso)
  const today = new Date()
  if (d.toDateString() === today.toDateString())
    return d.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })
  return d.toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' })
    + ' ' + d.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'たった今'
  if (mins < 60) return `${mins}分前`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}時間前`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}日前`
  return new Date(iso).toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' })
}
</script>

<style scoped>
/* ── FAB ── */
.chat-fab {
  position: fixed;
  bottom: 28px;
  right: 28px;
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: rgb(var(--v-theme-primary));
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 4px 16px rgba(0,0,0,0.22);
  z-index: 3000;
  transition: transform 0.15s, box-shadow 0.15s;
}
.chat-fab:hover { transform: scale(1.07); box-shadow: 0 6px 20px rgba(0,0,0,0.28); }
.fab-badge {
  position: absolute;
  top: -2px; right: -2px;
  min-width: 18px; height: 18px;
  border-radius: 9px;
  background: #ef4444; color: #fff;
  font-size: 10px; font-weight: 700;
  display: flex; align-items: center; justify-content: center;
  padding: 0 4px;
  border: 2px solid #fff;
}

/* ── Panel ── */
.chat-panel {
  position: fixed;
  bottom: 92px;
  right: 28px;
  width: 340px;
  max-height: min(560px, calc(100vh - 120px));
  border-radius: 16px;
  box-shadow: 0 8px 40px rgba(0,0,0,0.18), 0 2px 10px rgba(0,0,0,0.08);
  background: #fff;
  z-index: 3000;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* Panel open/close animation */
.chat-panel-enter-active,
.chat-panel-leave-active { transition: opacity 0.18s ease, transform 0.18s ease; }
.chat-panel-enter-from,
.chat-panel-leave-to    { opacity: 0; transform: translateY(12px) scale(0.97); }

/* ── Panel header ── */
.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 14px 12px;
  border-bottom: 1px solid rgba(0,0,0,0.07);
  flex-shrink: 0;
}
.panel-header--thread { padding: 10px 10px 10px 8px; gap: 6px; }
.panel-title { font-size: 15px; font-weight: 700; color: rgba(0,0,0,0.82); }

.thread-title {
  display: flex; align-items: center; gap: 9px; flex: 1; min-width: 0;
}
.thread-name { font-size: 14px; font-weight: 700; color: rgba(0,0,0,0.82); white-space: nowrap; }
.thread-sub  { font-size: 11px; color: rgba(0,0,0,0.45); white-space: nowrap; }

/* ── Search ── */
.panel-search {
  padding: 8px 12px;
  border-bottom: 1px solid rgba(0,0,0,0.06);
  flex-shrink: 0;
}

/* ── Conversation list ── */
.panel-list {
  flex: 1;
  overflow-y: auto;
  padding: 4px 0 8px;
}
.panel-list::-webkit-scrollbar { width: 4px; }
.panel-list::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.12); border-radius: 2px; }

.list-section-label {
  font-size: 11px; font-weight: 600;
  color: rgba(0,0,0,0.4);
  padding: 6px 14px 4px;
  text-transform: uppercase; letter-spacing: 0.05em;
}
.list-section-label--mt { margin-top: 6px; border-top: 1px solid rgba(0,0,0,0.06); padding-top: 10px; }

.list-empty {
  display: flex; flex-direction: column; align-items: center; gap: 8px;
  padding: 28px 16px; color: rgba(0,0,0,0.35); font-size: 12px; text-align: center;
}

.conv-row {
  display: flex; align-items: center; gap: 10px;
  padding: 9px 14px;
  cursor: pointer;
  transition: background 0.1s;
}
.conv-row:hover { background: rgba(0,0,0,0.04); }

.conv-avatar {
  width: 38px; height: 38px; border-radius: 50%;
  font-size: 14px; font-weight: 700;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.conv-avatar--sm { width: 30px; height: 30px; font-size: 12px; }
.conv-avatar--kitchen  { background: rgba(251,146,60,0.18); color: #ea580c; }
.conv-avatar--hall     { background: rgba(53,135,220,0.15); color: #3587dc; }
.conv-avatar--register { background: rgba(139,92,246,0.15); color: #7c3aed; }

.conv-info { flex: 1; min-width: 0; }
.conv-name-row { display: flex; align-items: center; justify-content: space-between; gap: 4px; }
.conv-name  { font-size: 13px; font-weight: 600; color: rgba(0,0,0,0.82); white-space: nowrap; }
.conv-dept  { font-size: 11px; color: rgba(0,0,0,0.4); }
.conv-time  { font-size: 10px; color: rgba(0,0,0,0.38); flex-shrink: 0; }
.conv-preview {
  font-size: 12px; color: rgba(0,0,0,0.5);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  margin-top: 1px;
}
.conv-preview--empty { color: rgba(0,0,0,0.3); font-style: italic; }
.preview-tag { font-size: 10px; }

.conv-unread {
  min-width: 18px; height: 18px; border-radius: 9px;
  background: rgb(var(--v-theme-primary)); color: #fff;
  font-size: 10px; font-weight: 700;
  display: flex; align-items: center; justify-content: center;
  padding: 0 4px; flex-shrink: 0;
}

/* ── Thread messages ── */
.thread-messages {
  flex: 1;
  overflow-y: auto;
  padding: 12px 12px 4px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  overscroll-behavior: contain;
}
.thread-messages::-webkit-scrollbar { width: 4px; }
.thread-messages::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.12); border-radius: 2px; }

.thread-empty {
  display: flex; flex-direction: column; align-items: center; gap: 8px;
  padding: 36px 16px; color: rgba(0,0,0,0.35); font-size: 12px; text-align: center;
}
.thread-empty-hint { font-size: 11px; color: rgba(0,0,0,0.25); }

.msg-date-sep {
  text-align: center;
  font-size: 10px; color: rgba(0,0,0,0.35);
  margin: 8px 0 4px;
  position: relative;
}
.msg-date-sep::before {
  content: '';
  position: absolute; top: 50%; left: 0; right: 0;
  height: 1px; background: rgba(0,0,0,0.08); z-index: 0;
}
.msg-date-sep span { position: relative; z-index: 1; background: #fff; padding: 0 8px; }

.msg-bubble {
  max-width: 80%;
  padding: 8px 11px;
  border-radius: 14px;
  font-size: 13px;
  line-height: 1.45;
  margin-bottom: 1px;
}
.msg-bubble--mgr {
  background: rgb(var(--v-theme-primary));
  color: #fff;
  align-self: flex-end;
  border-bottom-right-radius: 4px;
}
.msg-bubble--emp {
  background: #F2F3F5;
  color: rgba(0,0,0,0.82);
  align-self: flex-start;
  border-bottom-left-radius: 4px;
}
.msg-text { word-break: break-word; }
.msg-time { font-size: 9px; opacity: 0.6; margin-top: 3px; text-align: right; }
.msg-bubble--emp .msg-time { text-align: left; }

/* ── Adjustment request card ── */
.adj-card {
  align-self: flex-end;
  width: 90%;
  border: 1.5px solid rgba(245,158,11,0.4);
  border-radius: 12px;
  background: rgba(254,252,232,0.9);
  padding: 10px 12px;
  margin-bottom: 4px;
}
.adj-card-header {
  display: flex; align-items: center; gap: 5px;
  font-size: 11px; font-weight: 700; color: #92400e;
  margin-bottom: 6px;
}
.adj-card-date { margin-left: auto; font-size: 10px; color: rgba(0,0,0,0.45); font-weight: 500; }
.adj-card-shift {
  display: flex; align-items: center; gap: 4px;
  font-size: 12px; color: rgba(0,0,0,0.65); margin-bottom: 6px;
}
.adj-card-flow {
  display: flex; align-items: center; gap: 6px;
  margin-bottom: 7px; flex-wrap: wrap;
}
.adj-card-body {
  font-size: 12px; color: rgba(0,0,0,0.72);
  border-top: 1px solid rgba(245,158,11,0.2);
  padding-top: 7px; margin-bottom: 8px;
  line-height: 1.5;
}
.adj-card-actions {
  display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
}
.adj-status {
  display: inline-flex; align-items: center; gap: 4px;
  font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 10px;
}
.adj-status--pending { background: rgba(0,0,0,0.07); color: rgba(0,0,0,0.5); }
.adj-status--ok      { background: rgba(22,163,74,0.12); color: #15803d; }
.adj-status--ng      { background: rgba(220,38,38,0.1);  color: #b91c1c; }

/* Compact status chips inside cards */
.sc {
  display: inline-flex; align-items: center; gap: 3px;
  padding: 2px 7px; border-radius: 10px;
  font-size: 11px; font-weight: 600; border: 1.5px solid transparent;
}
.sc--shift-req   { background: transparent; border-color: #3587dc; color: #1d4ed8; }
.sc--confirmed   { background: #3587dc;     border-color: #3587dc; color: #fff;    }
.sc--dayoff-req  { background: transparent; border-color: #64748b; color: #475569; }
.sc--dayoff-conf { background: #64748b;     border-color: #64748b; color: #fff;    }
.sc--adjusting   { background: #f59e0b;     border-color: #d97706; color: #1c1917; }
.sc--intent-work { background: rgba(37,99,235,0.1); border-color: #3587dc; color: #1d4ed8; }
.sc--intent-off  { background: rgba(100,116,139,0.1); border-color: #64748b; color: #475569; }

/* ── Thread input ── */
.thread-input {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  padding: 8px 10px 10px;
  border-top: 1px solid rgba(0,0,0,0.08);
  flex-shrink: 0;
}
</style>
