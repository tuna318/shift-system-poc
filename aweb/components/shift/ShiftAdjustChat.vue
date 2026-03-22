<template>
  <div class="adjust-chat" :class="{ 'adjust-chat--collapsed': collapsed }">

    <!-- ── Header ──────────────────────────────────────────────── -->
    <div class="chat-header" @click="collapsed = !collapsed">
      <div class="d-flex align-center ga-2">
        <v-icon size="15" color="warning">mdi-message-text-outline</v-icon>
        <span class="chat-header-title">チャット</span>
        <span v-if="totalMessages > 0" class="chat-count-badge">{{ totalMessages }}</span>
        <!-- Active negotiation pill -->
        <div v-if="entry?.cellStatus === 'ADJUSTING'" class="nego-pill">
          <v-icon size="10">mdi-swap-horizontal</v-icon>
          調整中
          <span v-if="entry.adjustingResponseStatus === 'ACCEPTED'" class="nego-pill__status nego-pill__status--ok">承諾</span>
          <span v-else-if="entry.adjustingResponseStatus === 'REJECTED'" class="nego-pill__status nego-pill__status--ng">拒否</span>
          <span v-else class="nego-pill__status nego-pill__status--wait">返答待ち</span>
        </div>
      </div>
      <v-icon size="16" color="medium-emphasis">
        {{ collapsed ? 'mdi-chevron-down' : 'mdi-chevron-up' }}
      </v-icon>
    </div>

    <!-- ── Body (collapsible) ───────────────────────────────────── -->
    <v-expand-transition>
      <div v-show="!collapsed" class="chat-body">

        <!-- Nego context bar (ADJUSTING only) -->
        <div v-if="entry?.cellStatus === 'ADJUSTING'" class="nego-bar">
          <v-icon size="13" color="warning">mdi-swap-horizontal-bold</v-icon>
          <span class="sc" :class="`sc--${preStatusConfig.styleKey}`">{{ preStatusConfig.label }}</span>
          <v-icon size="13" color="medium-emphasis">mdi-arrow-right</v-icon>
          <span class="sc nego-intent" :class="targetStatusConfig.styleKey === 'confirmed' ? 'sc--intent-work' : 'sc--intent-off'">
            {{ targetStatusConfig.styleKey === 'confirmed' ? '出勤依頼' : '休み打診' }}
          </span>
        </div>

        <!-- ── Scrollable message history ────────────────────── -->
        <div ref="scrollEl" class="chat-scroll">

          <!-- Cross-shift history from messages store -->
          <template v-if="storeMessages.length > 0">
            <template v-for="(msg, i) in storeMessages" :key="msg.id">
              <!-- Date separator when shift context changes -->
              <div
                v-if="i === 0 || msg.shiftDate !== storeMessages[i-1].shiftDate"
                class="date-sep"
              >
                <span>{{ formatShiftLabel(msg.shiftDate) }}</span>
              </div>
              <div class="bubble" :class="msg.sender === 'manager' ? 'bubble--mgr' : 'bubble--emp'">
                <div class="bubble-sender">
                  <v-icon size="11">{{ msg.sender === 'manager' ? 'mdi-briefcase-outline' : 'mdi-account-outline' }}</v-icon>
                  {{ msg.sender === 'manager' ? 'マネージャー' : employeeName }}
                  <span class="bubble-time">{{ formatTime(msg.sentAt) }}</span>
                </div>
                <div class="bubble-body">{{ msg.body }}</div>
              </div>
            </template>
          </template>

          <!-- Current entry separator -->
          <div v-if="entry && hasChatContent" class="date-sep date-sep--current">
            <span>{{ currentShiftLabel }}</span>
          </div>

          <!-- Current entry: manager message -->
          <div v-if="entry?.adjustingReason" class="bubble bubble--mgr">
            <div class="bubble-sender">
              <v-icon size="11">mdi-briefcase-outline</v-icon> マネージャー
            </div>
            <div class="bubble-body">{{ entry.adjustingReason }}</div>
          </div>

          <!-- Current entry: employee reply or waiting -->
          <div v-if="entry?.adjustingResponse" class="bubble bubble--emp">
            <div class="bubble-sender">
              <v-icon size="11">mdi-account-outline</v-icon> {{ employeeName }}
            </div>
            <div class="bubble-body">{{ entry.adjustingResponse }}</div>
          </div>
          <div v-else-if="entry?.cellStatus === 'ADJUSTING'" class="chat-waiting">
            <v-icon size="13" color="medium-emphasis">mdi-clock-outline</v-icon>
            <span>スタッフの返答待ち...</span>
          </div>

          <!-- Note (manager memo) -->
          <div v-if="entry?.note" class="bubble bubble--note">
            <div class="bubble-sender"><v-icon size="11">mdi-note-text-outline</v-icon> メモ</div>
            <div class="bubble-body">{{ entry.note }}</div>
          </div>

          <!-- Empty state -->
          <div v-if="totalMessages === 0 && !entry?.adjustingReason" class="chat-empty">
            <v-icon size="24" color="medium-emphasis">mdi-message-text-outline</v-icon>
            <span>{{ employeeName }} さんとのメッセージはまだありません</span>
          </div>
        </div>

        <!-- ── Input area (always visible) ─────────────────────── -->
        <div class="chat-input-wrap">
          <!-- Context hint: what sending will do -->
          <div v-if="sendActionLabel" class="send-action-hint">
            <v-icon size="11" color="warning">mdi-information-outline</v-icon>
            {{ sendActionLabel }}
          </div>
          <div class="d-flex ga-2 align-end">
            <v-textarea
              v-model="inputText"
              :placeholder="inputPlaceholder"
              auto-grow rows="1" max-rows="4"
              density="compact" variant="outlined" rounded="lg"
              hide-details
              class="flex-1-1"
              @keydown.ctrl.enter.prevent="send"
              @keydown.meta.enter.prevent="send"
            />
            <v-btn
              color="warning" variant="flat" icon size="small"
              :disabled="!inputText.trim()"
              style="flex-shrink:0;margin-bottom:2px"
              @click="send"
            >
              <v-icon size="17">mdi-send</v-icon>
            </v-btn>
          </div>
          <div class="input-hint">Ctrl+Enter で送信</div>
        </div>

      </div>
    </v-expand-transition>
  </div>
</template>

<script setup lang="ts">
import { useChatMessages } from '~/composables/useChatMessages'
import { useShiftStore } from '~/stores/shift.store'
import type { ShiftEntry, CellStatus } from '~/types'

const props = defineProps<{
  employeeId: string
  employeeName: string
  entry?: ShiftEntry | null
  boardStatus?: 'DRAFT' | 'PUBLISHED'
}>()

const shiftStore = useShiftStore()
const { getMessages, addMessage } = useChatMessages()

// ── Collapse ────────────────────────────────────────────────────
const collapsed = ref(false)
const scrollEl  = ref<HTMLElement | null>(null)

// ── Message history ─────────────────────────────────────────────
const storeMessages = computed(() => getMessages(props.employeeId))

const hasChatContent = computed(() =>
  !!props.entry?.adjustingReason || !!props.entry?.adjustingResponse || !!props.entry?.note,
)

const totalMessages = computed(() =>
  storeMessages.value.length + (hasChatContent.value ? 1 : 0),
)

// Scroll to bottom after messages change
watch(totalMessages, () => nextTick(() => {
  if (scrollEl.value) scrollEl.value.scrollTop = scrollEl.value.scrollHeight
}))
// Also scroll when opening
watch(() => collapsed.value, (v) => {
  if (!v) nextTick(() => {
    if (scrollEl.value) scrollEl.value.scrollTop = scrollEl.value.scrollHeight
  })
}, { flush: 'post' })

// ── Status configs ──────────────────────────────────────────────
type SC = { label: string; icon: string; styleKey: string }
const STATUS_CFG: Record<CellStatus, SC> = {
  SHIFT_REQUESTED:   { label: 'シフト希望', icon: 'mdi-clock-outline',          styleKey: 'shift-req'   },
  CONFIRMED:         { label: 'シフト確定', icon: 'mdi-check-circle-outline',    styleKey: 'confirmed'   },
  DAY_OFF_REQUESTED: { label: '休み希望',   icon: 'mdi-calendar-remove-outline', styleKey: 'dayoff-req'  },
  DAY_OFF_CONFIRMED: { label: '休み確定',   icon: 'mdi-moon-waning-crescent',    styleKey: 'dayoff-conf' },
  ADJUSTING:         { label: '調整中',     icon: 'mdi-alert-circle-outline',    styleKey: 'adjusting'   },
}

const preStatusConfig = computed(() =>
  STATUS_CFG[props.entry?.preAdjustStatus ?? 'SHIFT_REQUESTED'],
)

const targetStatusConfig = computed(() => {
  if (props.entry?.adjustTargetStatus) return STATUS_CFG[props.entry.adjustTargetStatus]
  const pre = props.entry?.preAdjustStatus
  return (pre === 'DAY_OFF_REQUESTED' || pre === 'DAY_OFF_CONFIRMED')
    ? STATUS_CFG.CONFIRMED
    : STATUS_CFG.DAY_OFF_CONFIRMED
})

// ── Input context ────────────────────────────────────────────────
const adjustTarget = computed<'CONFIRMED' | 'DAY_OFF_CONFIRMED'>(() =>
  props.entry?.cellStatus === 'SHIFT_REQUESTED' ? 'DAY_OFF_CONFIRMED' : 'CONFIRMED',
)

const sendActionLabel = computed(() => {
  if (!props.entry || props.boardStatus === 'PUBLISHED') return null
  const s = props.entry.cellStatus
  if (s === 'SHIFT_REQUESTED')
    return '送信すると「調整中」に変わり、スタッフへ通知されます（調整先: 休み確定）'
  if (s === 'DAY_OFF_REQUESTED' || s === 'DAY_OFF_CONFIRMED')
    return '送信すると「調整中」に変わり、スタッフへ通知されます（調整先: シフト確定）'
  return null
})

const inputPlaceholder = computed(() => {
  if (!props.entry) return 'メッセージを入力...'
  const s = props.entry.cellStatus
  if (s === 'SHIFT_REQUESTED' || s === 'DAY_OFF_REQUESTED' || s === 'DAY_OFF_CONFIRMED')
    return '調整の理由や依頼内容を入力...'
  if (s === 'ADJUSTING')
    return '追加のメッセージを入力...'
  return 'メモやメッセージを入力...'
})

const currentShiftLabel = computed(() => {
  if (!props.entry?.shiftDate) return '現在のシフト'
  return `現在のシフト　${formatShiftLabel(props.entry.shiftDate)}`
})

// ── Send ────────────────────────────────────────────────────────
const inputText = ref('')

function send() {
  const body = inputText.value.trim()
  if (!body) return

  const shiftDate = props.entry?.shiftDate

  // Persist to messages store
  addMessage({ employeeId: props.employeeId, sender: 'manager', body, shiftDate })

  // If the entry is in a "requestable" state, trigger the adjustment
  if (props.entry) {
    const s = props.entry.cellStatus
    if (s === 'SHIFT_REQUESTED' || s === 'DAY_OFF_REQUESTED' || s === 'DAY_OFF_CONFIRMED') {
      shiftStore.requestAdjustment(props.entry.id, body, adjustTarget.value)
    }
  }

  inputText.value = ''
  collapsed.value = false
}

// ── Formatting helpers ──────────────────────────────────────────
function formatShiftLabel(dateStr?: string): string {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleDateString('ja-JP', { month: 'long', day: 'numeric', weekday: 'short' })
}

function formatTime(iso: string): string {
  const d = new Date(iso)
  const today = new Date()
  const isToday = d.toDateString() === today.toDateString()
  if (isToday) return d.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })
  return d.toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}
</script>

<style scoped>
.adjust-chat {
  border-top: 1px solid rgba(0, 0, 0, 0.08);
  background: #FAFBFC;
}

/* ── Header ── */
.chat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 14px;
  cursor: pointer;
  user-select: none;
  transition: background 0.1s;
}
.chat-header:hover { background: rgba(0,0,0,0.03); }
.chat-header-title { font-size: 12px; font-weight: 700; color: rgba(0,0,0,0.65); }
.chat-count-badge {
  font-size: 10px; font-weight: 700;
  background: rgba(0,0,0,0.1); color: rgba(0,0,0,0.55);
  border-radius: 10px; padding: 1px 6px;
}

/* Negotiation pill in header */
.nego-pill {
  display: inline-flex; align-items: center; gap: 4px;
  padding: 2px 8px; border-radius: 10px;
  font-size: 10px; font-weight: 700;
  background: rgba(245,158,11,0.12); color: #92400e;
}
.nego-pill__status { padding: 1px 5px; border-radius: 8px; font-size: 9px; }
.nego-pill__status--ok   { background: rgba(22,163,74,0.15);  color: #15803d; }
.nego-pill__status--ng   { background: rgba(220,38,38,0.12);  color: #b91c1c; }
.nego-pill__status--wait { background: rgba(0,0,0,0.08);      color: rgba(0,0,0,0.5); }

/* ── Body ── */
.chat-body { display: flex; flex-direction: column; }

/* Nego context bar */
.nego-bar {
  display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
  padding: 7px 14px 6px;
  background: rgba(245,158,11,0.07);
  border-bottom: 1px solid rgba(245,158,11,0.15);
}
.nego-side { display: flex; flex-direction: column; gap: 3px; }
.nego-label { font-size: 9px; font-weight: 600; color: rgba(0,0,0,0.4); text-transform: uppercase; letter-spacing: 0.04em; }

/* Compact status chips for nego bar */
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

/* ── Scrollable message area ── */
.chat-scroll {
  max-height: 220px;
  overflow-y: auto;
  padding: 10px 14px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  overscroll-behavior: contain;
}
.chat-scroll::-webkit-scrollbar { width: 4px; }
.chat-scroll::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.13); border-radius: 2px; }

/* Date separator */
.date-sep {
  display: flex; align-items: center; gap: 8px;
  margin: 4px 0 2px;
  font-size: 10px; color: rgba(0,0,0,0.38); font-weight: 500;
}
.date-sep::before,
.date-sep::after {
  content: '';
  flex: 1;
  height: 1px;
  background: rgba(0,0,0,0.1);
}
.date-sep--current { font-weight: 700; color: rgba(245,158,11,0.9); }
.date-sep--current::before,
.date-sep--current::after { background: rgba(245,158,11,0.3); }

/* Bubbles */
.bubble {
  max-width: 85%; padding: 6px 10px;
  border-radius: 10px; font-size: 12px; line-height: 1.5;
}
.bubble--mgr  { background: rgba(53,135,220,0.08); border: 1px solid rgba(53,135,220,0.14); align-self: flex-start; }
.bubble--emp  { background: #fff; border: 1px solid rgba(0,0,0,0.11); align-self: flex-end; }
.bubble--note { background: rgba(0,0,0,0.03); border: 1px dashed rgba(0,0,0,0.13); align-self: flex-start; font-style: italic; }
.bubble-sender { font-size: 10px; color: rgba(0,0,0,0.38); margin-bottom: 3px; display: flex; align-items: center; gap: 3px; }
.bubble-time   { margin-left: 4px; font-size: 9px; color: rgba(0,0,0,0.28); }
.bubble-body   { color: rgba(0,0,0,0.8); }

.chat-waiting {
  display: flex; align-items: center; gap: 5px;
  font-size: 11px; color: rgba(0,0,0,0.4);
  padding: 2px 0;
}

.chat-empty {
  display: flex; flex-direction: column; align-items: center; gap: 6px;
  padding: 20px 0; color: rgba(0,0,0,0.3); font-size: 11px;
  text-align: center;
}

/* ── Input area ── */
.chat-input-wrap {
  padding: 8px 12px 10px;
  border-top: 1px solid rgba(0,0,0,0.07);
  background: #fff;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.send-action-hint {
  display: flex; align-items: flex-start; gap: 4px;
  font-size: 10px; color: #92400e;
  background: rgba(245,158,11,0.08);
  border-radius: 5px; padding: 4px 8px;
  line-height: 1.4;
}
.input-hint {
  font-size: 10px; color: rgba(0,0,0,0.3);
  text-align: right;
}
</style>
