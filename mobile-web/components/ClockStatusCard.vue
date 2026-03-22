<template>
  <!-- ── NOT STARTED ───────────────────────────────────────────────── -->
  <div v-if="status === 'NOT_STARTED'" class="clock-hero clock-hero--idle" @click="$emit('punch', 'CHECK_IN')">
    <div class="clock-hero__time">{{ timeNow.timeShort.value }}</div>
    <div class="clock-hero__date">{{ timeNow.dateLabel.value }}</div>

    <!-- Today's shift reference -->
    <div v-if="todayShift" class="clock-hero__shift-ref">
      <v-icon size="14" color="white" style="opacity:.7">mdi-calendar-check-outline</v-icon>
      <span>本日 {{ todayShift.startTime }}〜{{ todayShift.endTime }} / {{ todayShift.department }}</span>
    </div>

    <div class="clock-hero__btn-wrap mt-4">
      <v-btn
        color="white"
        rounded="xl"
        size="x-large"
        height="56"
        style="color: #3587dc; font-size: 17px; font-weight: 700; min-width: 220px;"
        elevation="0"
      >
        <v-icon start size="22">mdi-login</v-icon>
        出勤打刻
      </v-btn>
    </div>
    <div class="text-caption mt-2" style="color:rgba(255,255,255,.55)">タップして打刻</div>
  </div>

  <!-- ── WORKING ───────────────────────────────────────────────────── -->
  <div v-else-if="status === 'WORKING'" class="clock-hero clock-hero--working">
    <!-- Status + elapsed -->
    <div class="d-flex align-center gap-2 mb-1">
      <span class="working-dot" />
      <span class="text-body-1 font-weight-bold text-white">出勤中</span>
    </div>
    <div class="clock-hero__elapsed">{{ clockStore.elapsedDisplay }}</div>
    <div class="text-caption mb-4" style="color:rgba(255,255,255,.65)">
      出勤 {{ checkInTime }}〜
      <span v-if="todayShift"> (予定 〜{{ todayShift.endTime }})</span>
    </div>

    <!-- Primary: clock out -->
    <v-btn
      color="white"
      rounded="xl"
      size="x-large"
      height="56"
      block
      style="color: #e6273e; font-size: 17px; font-weight: 700;"
      elevation="0"
      class="mb-2"
      @click.stop="$emit('punch', 'CHECK_OUT')"
    >
      <v-icon start size="22">mdi-logout</v-icon>
      退勤打刻
    </v-btn>

    <!-- Secondary: break (visually smaller, below) -->
    <v-btn
      variant="outlined"
      rounded="xl"
      size="default"
      height="44"
      block
      style="color:rgba(255,255,255,.9); border-color:rgba(255,255,255,.4); font-size: 14px;"
      @click.stop="$emit('punch', 'BREAK_START')"
    >
      <v-icon start size="18">mdi-coffee-outline</v-icon>
      休憩開始
    </v-btn>
  </div>

  <!-- ── ON BREAK ──────────────────────────────────────────────────── -->
  <div v-else-if="status === 'ON_BREAK'" class="clock-hero clock-hero--break" @click="$emit('punch', 'BREAK_END')">
    <div class="d-flex align-center gap-2 mb-2">
      <v-icon color="white" size="20">mdi-coffee-outline</v-icon>
      <span class="text-body-1 font-weight-bold text-white">休憩中</span>
    </div>
    <div class="clock-hero__time" style="font-size:36px;">{{ timeNow.timeShort.value }}</div>
    <div class="clock-hero__btn-wrap mt-4">
      <v-btn
        color="white"
        rounded="xl"
        size="x-large"
        height="56"
        style="color: #388e3c; font-size: 17px; font-weight: 700; min-width: 220px;"
        elevation="0"
      >
        <v-icon start size="22">mdi-play-circle-outline</v-icon>
        休憩終了
      </v-btn>
    </div>
    <div class="text-caption mt-2" style="color:rgba(255,255,255,.55)">タップして再開</div>
  </div>

  <!-- ── COMPLETED ─────────────────────────────────────────────────── -->
  <div v-else class="clock-hero clock-hero--done">
    <v-icon color="white" size="36" class="mb-2">mdi-check-circle-outline</v-icon>
    <div class="text-h6 font-weight-bold text-white">退勤済み</div>
    <div class="text-caption mt-1" style="color:rgba(255,255,255,.7)">
      {{ checkInTime }}〜 / 実働 {{ clockStore.elapsedDisplay }}
    </div>
    <div class="text-caption mt-3" style="color:rgba(255,255,255,.55)">本日もお疲れ様でした</div>
  </div>
</template>

<script setup lang="ts">
import type { ClockStatus, ShiftEntry } from '~/types'

defineProps<{
  status: ClockStatus
  checkInTime: string | null
  breakMinutes: number
  todayShift: ShiftEntry | null
}>()

defineEmits<{
  punch: [type: string]
}>()

const clockStore = useClockStore()
const timeNow = useTimeNow()
</script>

<style scoped>
.clock-hero {
  border-radius: 20px;
  padding: 24px 20px;
  text-align: center;
  cursor: pointer;
  user-select: none;
  transition: filter 0.15s;

  &:active { filter: brightness(0.95); }
}

.clock-hero--idle {
  background: linear-gradient(135deg, #3587dc 0%, #2563b0 100%);
}
.clock-hero--working {
  background: linear-gradient(135deg, #1b5e20 0%, #2e7d32 100%);
  cursor: default;
}
.clock-hero--break {
  background: linear-gradient(135deg, #e65100 0%, #f57c00 100%);
}
.clock-hero--done {
  background: linear-gradient(135deg, #546e7a 0%, #78909c 100%);
  cursor: default;
}

.clock-hero__time {
  font-size: 52px;
  font-weight: 700;
  color: white;
  line-height: 1;
  letter-spacing: -2px;
  font-variant-numeric: tabular-nums;
}

.clock-hero__date {
  color: rgba(255,255,255,.75);
  font-size: 13px;
  margin-top: 4px;
}

.clock-hero__shift-ref {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-top: 8px;
  background: rgba(255,255,255,.15);
  border-radius: 20px;
  padding: 4px 12px;
  font-size: 12px;
  color: rgba(255,255,255,.9);
}

.clock-hero__elapsed {
  font-size: 36px;
  font-weight: 700;
  color: white;
  letter-spacing: -1px;
  margin-bottom: 2px;
}

.clock-hero__btn-wrap {
  display: flex;
  justify-content: center;
}

.working-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #69f0ae;
  animation: pulse-dot 1.5s ease-in-out infinite;
  flex-shrink: 0;
}

@keyframes pulse-dot {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(0.7); }
}

.gap-2 { gap: 8px; }
</style>
