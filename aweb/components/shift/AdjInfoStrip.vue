<template>
  <div class="adj-info-strip" :class="`adj-info-strip--${responseStatus.toLowerCase()}`">
    <div class="adj-strip-left">
      <v-icon size="13" class="adj-strip-icon">mdi-swap-horizontal-bold</v-icon>
      <span class="adj-strip-label">調整依頼中</span>
      <span class="sc sc--xs" :class="(props.entry.preAdjustStatus ?? 'SHIFT_REQUESTED') === 'SHIFT_REQUESTED' ? 'sc--shift-req' : 'sc--dayoff-req'">
        {{ (props.entry.preAdjustStatus ?? 'SHIFT_REQUESTED') === 'SHIFT_REQUESTED' ? 'シフト希望' : '休み希望' }}
      </span>
      <v-icon size="11" color="medium-emphasis">mdi-arrow-right</v-icon>
      <span class="sc sc--xs adj-strip-intent" :class="targetStatus === 'CONFIRMED' ? 'sc--intent-work' : 'sc--intent-off'">
        {{ targetStatus === 'CONFIRMED' ? '出勤依頼' : '休み打診' }}
      </span>
    </div>
    <div class="adj-resp-badge" :class="`adj-resp-badge--${responseStatus.toLowerCase()}`">
      <v-icon size="11">{{ responseIcon }}</v-icon>
      {{ responseLabel }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { useChatMessages } from '~/composables/useChatMessages'
import type { ShiftEntry } from '~/types'

const props = defineProps<{
  entry: ShiftEntry
  employeeId: string
}>()

const { getMessages } = useChatMessages()

const responseStatus = computed((): 'PENDING' | 'ACCEPTED' | 'DECLINED' => {
  const chatResp = getMessages(props.employeeId)
    .filter(m => m.adjustRequest?.entryId === props.entry.id)
    .at(-1)?.adjustRequest?.responseStatus
  if (chatResp) return chatResp === 'DECLINED' ? 'DECLINED' : chatResp as 'PENDING' | 'ACCEPTED'
  const stored = props.entry.adjustingResponseStatus
  if (stored === 'REJECTED') return 'DECLINED'
  if (stored === 'ACCEPTED') return 'ACCEPTED'
  return 'PENDING'
})

const responseLabel = computed(() =>
  ({ PENDING: '返答待ち', ACCEPTED: '承諾済み', DECLINED: '拒否' }[responseStatus.value]),
)
const responseIcon = computed(() =>
  ({ PENDING: 'mdi-clock-outline', ACCEPTED: 'mdi-check-circle-outline', DECLINED: 'mdi-close-circle-outline' }[responseStatus.value]),
)

const targetStatus = computed<'CONFIRMED' | 'DAY_OFF_CONFIRMED'>(() =>
  props.entry.adjustTargetStatus
    ?? (props.entry.preAdjustStatus === 'SHIFT_REQUESTED' ? 'DAY_OFF_CONFIRMED' : 'CONFIRMED'),
)

</script>

<style scoped>
.adj-info-strip {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 8px;
  border: 1px solid transparent;
}
.adj-info-strip--pending  { background: rgba(245,158,11,0.07); border-color: rgba(245,158,11,0.22); }
.adj-info-strip--accepted { background: rgba(22,163,74,0.07);  border-color: rgba(22,163,74,0.22);  }
.adj-info-strip--declined { background: rgba(220,38,38,0.06);  border-color: rgba(220,38,38,0.18);  }

.adj-strip-left {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  min-width: 0;
}
.adj-strip-icon  { flex-shrink: 0; }
.adj-info-strip--pending  .adj-strip-icon { color: #d97706; }
.adj-info-strip--accepted .adj-strip-icon { color: #16a34a; }
.adj-info-strip--declined .adj-strip-icon { color: #dc2626; }

.adj-strip-label {
  font-size: 11px; font-weight: 700; white-space: nowrap;
}
.adj-info-strip--pending  .adj-strip-label { color: #92400e; }
.adj-info-strip--accepted .adj-strip-label { color: #15803d; }
.adj-info-strip--declined .adj-strip-label { color: #b91c1c; }

.adj-resp-badge {
  display: inline-flex; align-items: center; gap: 4px;
  padding: 3px 8px; border-radius: 20px;
  font-size: 11px; font-weight: 600; white-space: nowrap; flex-shrink: 0;
}
.adj-resp-badge--pending  { background: rgba(245,158,11,0.15); color: #92400e; }
.adj-resp-badge--accepted { background: rgba(22,163,74,0.15);  color: #15803d; }
.adj-resp-badge--declined { background: rgba(220,38,38,0.12);  color: #b91c1c; }

/* Intent chip */
.sc {
  display: inline-flex; align-items: center;
  padding: 2px 7px; border-radius: 10px;
  font-size: 11px; font-weight: 600; border: 1.5px solid transparent;
}
.sc--xs            { padding: 1px 6px; font-size: 10px; }
.sc--shift-req     { background: transparent; border-color: #3587dc; color: #1d4ed8; }
.sc--dayoff-req    { background: transparent; border-color: #64748b; color: #475569; }
.sc--intent-work   { background: rgba(37,99,235,0.1); border-color: #3587dc; color: #1d4ed8; }
.sc--intent-off    { background: rgba(100,116,139,0.1); border-color: #64748b; color: #475569; }
</style>
