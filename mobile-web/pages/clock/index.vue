<template>
  <div class="pa-4">
    <!-- Current time display -->
    <v-card rounded="xl" color="primary" class="mb-4" elevation="2">
      <v-card-text class="text-center pa-6">
        <div class="text-white text-caption mb-1" style="opacity: 0.8;">{{ timeNow.dateLabel.value }}</div>
        <div class="text-white font-weight-bold" style="font-size: 48px; letter-spacing: -2px; line-height: 1; font-variant-numeric: tabular-nums;">
          {{ timeNow.timeDisplay.value }}
        </div>
        <div class="text-white mt-2" style="opacity: 0.7; font-size: 12px;">渋谷本店</div>
      </v-card-text>
    </v-card>

    <!-- Punch type + department selectors (before check-in only) -->
    <template v-if="clockStore.status === 'NOT_STARTED'">
      <div class="text-subtitle-2 font-weight-bold text-grey-darken-2 mb-2">打刻種別</div>
      <v-card rounded="xl" elevation="0" variant="outlined" class="mb-4">
        <v-card-text class="pa-3">
          <v-btn-toggle
            v-model="clockStore.punchVariant"
            color="primary"
            variant="outlined"
            rounded="lg"
            density="compact"
            mandatory
            divided
            class="w-100"
          >
            <v-btn value="NORMAL" class="flex-1-1">
              <v-icon start size="14">mdi-clock-outline</v-icon>
              通常
            </v-btn>
            <v-btn value="HELP" class="flex-1-1">
              <v-icon start size="14">mdi-store-plus-outline</v-icon>
              ヘルプ
            </v-btn>
            <v-btn value="TRAINING" class="flex-1-1">
              <v-icon start size="14">mdi-school-outline</v-icon>
              研修
            </v-btn>
          </v-btn-toggle>
          <div v-if="clockStore.punchVariant !== 'NORMAL'" class="text-caption text-grey mt-2 text-center">
            {{ variantExplanation }}
          </div>
        </v-card-text>
      </v-card>

      <!-- Help store selector: only when HELP variant -->
      <template v-if="clockStore.punchVariant === 'HELP'">
        <div class="text-subtitle-2 font-weight-bold text-grey-darken-2 mb-2">応援先店舗</div>
        <v-card rounded="xl" elevation="0" variant="outlined" class="mb-4" style="border-color: #f59e0b;">
          <v-card-text class="pa-3">
            <div class="d-flex gap-2 flex-wrap">
              <v-chip
                v-for="store in helpStores"
                :key="store"
                :color="clockStore.helpStore === store ? 'warning' : undefined"
                :variant="clockStore.helpStore === store ? 'tonal' : 'outlined'"
                @click="clockStore.helpStore = store"
              >
                {{ store }}
              </v-chip>
            </div>
            <div v-if="!clockStore.helpStore" class="text-caption text-error mt-2">
              応援先店舗を選択してください
            </div>
          </v-card-text>
        </v-card>
      </template>

      <div class="text-subtitle-2 font-weight-bold text-grey-darken-2 mb-2">部署</div>
      <v-card rounded="xl" elevation="0" variant="outlined" class="mb-4">
        <v-card-text class="pa-3">
          <div class="d-flex gap-2 flex-wrap">
            <v-chip
              v-for="dept in departments"
              :key="dept"
              :color="clockStore.department === dept ? 'primary' : undefined"
              :variant="clockStore.department === dept ? 'tonal' : 'outlined'"
              @click="clockStore.department = dept"
            >
              {{ dept }}
            </v-chip>
          </div>
        </v-card-text>
      </v-card>
    </template>

    <!-- Status & action -->
    <v-card rounded="xl" elevation="1" class="mb-4">
      <v-card-text class="pa-4">
        <div class="d-flex align-center justify-space-between mb-4">
          <v-chip :color="statusColor" size="default" variant="tonal">
            <v-icon start size="16">{{ statusIcon }}</v-icon>
            {{ statusLabel }}
          </v-chip>
          <div class="text-right">
            <div v-if="clockStore.checkInTime" class="text-body-2 text-grey">
              出勤: {{ clockStore.checkInTime }}
            </div>
            <div v-if="clockStore.status !== 'NOT_STARTED'" class="text-caption text-grey">
              <template v-if="clockStore.punchVariant === 'HELP'">
                <v-chip size="x-small" color="warning" variant="tonal" class="mr-1">ヘルプ</v-chip>
                <span>{{ clockStore.helpStore ? clockStore.helpStore + ' · ' : '' }}{{ clockStore.department }}</span>
              </template>
              <template v-else-if="clockStore.punchVariant === 'TRAINING'">
                <v-chip size="x-small" color="teal" variant="tonal" class="mr-1">研修</v-chip>
                <span>{{ clockStore.department }}</span>
              </template>
              <template v-else>
                <span>{{ clockStore.department }}</span>
              </template>
            </div>
          </div>
        </div>

        <!-- Elapsed time for WORKING state -->
        <div v-if="clockStore.status === 'WORKING'" class="text-center mb-4">
          <div class="text-caption text-grey mb-1">勤務時間</div>
          <div class="text-h5 font-weight-bold text-primary">{{ clockStore.elapsedDisplay }}</div>
        </div>

        <!-- Action buttons -->
        <div v-if="clockStore.status === 'NOT_STARTED'">
          <v-btn
            block
            color="primary"
            size="x-large"
            rounded="xl"
            height="64"
            @click="openConfirm('CHECK_IN')"
          >
            <v-icon start size="24">mdi-login</v-icon>
            <span style="font-size: 18px;">出勤打刻</span>
          </v-btn>
        </div>

        <div v-else-if="clockStore.status === 'WORKING'" class="d-flex flex-column gap-3">
          <v-btn color="warning" size="x-large" rounded="xl" height="56" block @click="openConfirm('BREAK_START')">
            <v-icon start size="20">mdi-coffee-outline</v-icon>
            休憩開始
          </v-btn>
          <v-btn color="error" size="x-large" rounded="xl" height="56" block @click="openConfirm('CHECK_OUT')">
            <v-icon start size="20">mdi-logout</v-icon>
            退勤打刻
          </v-btn>
        </div>

        <div v-else-if="clockStore.status === 'ON_BREAK'">
          <v-btn block color="success" size="x-large" rounded="xl" height="64" @click="openConfirm('BREAK_END')">
            <v-icon start size="24">mdi-play-circle-outline</v-icon>
            <span style="font-size: 18px;">休憩終了</span>
          </v-btn>
          <div class="text-center mt-3 text-body-2 text-grey">休憩中です</div>
        </div>

        <div v-else>
          <v-btn block disabled size="x-large" rounded="xl" height="64" variant="tonal">
            <v-icon start size="24">mdi-check-circle-outline</v-icon>
            <span style="font-size: 18px;">退勤済み</span>
          </v-btn>
          <div class="text-center mt-3 text-body-2 text-grey">本日の勤務お疲れ様でした</div>
        </div>
      </v-card-text>
    </v-card>

    <!-- Punch timeline -->
    <div class="text-subtitle-2 font-weight-bold text-grey-darken-2 mb-2">本日の打刻履歴</div>
    <v-card rounded="xl" elevation="0" variant="outlined" class="mb-4">
      <v-card-text class="pa-4">
        <div v-if="clockStore.events.length === 0" class="text-body-2 text-grey text-center py-2">
          打刻記録はありません
        </div>
        <div v-else class="punch-timeline">
          <div
            v-for="(event, i) in clockStore.events"
            :key="i"
            class="punch-event d-flex align-center justify-space-between"
          >
            <div class="d-flex align-center gap-2">
              <v-icon size="16" :color="eventColor(event.type)">{{ eventIcon(event.type) }}</v-icon>
              <div>
                <span class="text-body-2">{{ eventLabel(event.type) }}</span>
                <span v-if="event.variant && event.variant !== 'NORMAL'" class="text-caption text-grey ml-1">
                  ({{ variantLabelMap[event.variant] }})
                </span>
              </div>
            </div>
            <span class="text-body-2 font-weight-bold">{{ event.time }}</span>
          </div>
        </div>
      </v-card-text>
    </v-card>
  </div>

  <!-- Confirmation dialog -->
  <v-dialog v-model="confirmDialog" max-width="320" persistent>
    <v-card rounded="xl">
      <v-card-text class="pa-6 text-center">
        <v-icon size="48" :color="confirmColor" class="mb-3">{{ confirmIcon }}</v-icon>
        <div class="text-subtitle-1 font-weight-bold mb-1">{{ confirmTitle }}</div>
        <div class="text-h5 font-weight-bold text-primary mb-1">{{ timeNow.timeShort.value }}</div>
        <div class="text-body-2 text-grey mb-1">{{ timeNow.dateLabel.value }}</div>
        <div v-if="pendingAction === 'CHECK_IN'" class="text-caption text-grey mb-1">
          <template v-if="clockStore.punchVariant === 'HELP'">
            ヘルプ打刻 / {{ clockStore.helpStore || '店舗未選択' }} {{ clockStore.department }}
          </template>
          <template v-else-if="clockStore.punchVariant === 'TRAINING'">
            研修打刻 / {{ clockStore.department }}
          </template>
          <template v-else>
            {{ clockStore.department }}
          </template>
        </div>
        <div v-if="clockStore.status === 'WORKING' && pendingAction === 'CHECK_OUT'" class="text-caption text-grey mb-1">
          勤務時間: {{ clockStore.elapsedDisplay }}
        </div>
        <div class="mb-3" />
        <div class="d-flex gap-2">
          <v-btn variant="outlined" rounded="lg" class="flex-1-1" @click="confirmDialog = false">
            キャンセル
          </v-btn>
          <v-btn :color="confirmColor" rounded="lg" class="flex-1-1" @click="executePunch">
            打刻する
          </v-btn>
        </div>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import type { PunchType, Department } from '~/types'

const clockStore = useClockStore()
const appStore = useAppStore()
const timeNow = useTimeNow()

const departments: Department[] = ['ホール', 'キッチン', 'レジ']
const helpStores: string[] = ['新宿店', '池袋店', '六本木店', '表参道店']

const variantLabelMap: Record<string, string> = { NORMAL: '通常', HELP: 'ヘルプ', TRAINING: '研修' }

onMounted(() => {
  clockStore.checkNewDay(timeNow.todayStr.value)
})

const statusConfig = {
  NOT_STARTED: { label: '未出勤', color: 'grey', icon: 'mdi-clock-outline' },
  WORKING: { label: '出勤中', color: 'success', icon: 'mdi-briefcase-outline' },
  ON_BREAK: { label: '休憩中', color: 'warning', icon: 'mdi-coffee-outline' },
  COMPLETED: { label: '退勤済み', color: 'grey', icon: 'mdi-check-circle-outline' },
}

const statusLabel = computed(() => statusConfig[clockStore.status].label)
const statusColor = computed(() => statusConfig[clockStore.status].color)
const statusIcon = computed(() => statusConfig[clockStore.status].icon)

const variantExplanation = computed(() => {
  if (clockStore.punchVariant === 'HELP') return '人件費は応援先の店舗に計上されます'
  if (clockStore.punchVariant === 'TRAINING') return '人件費は所属店舗に計上されます'
  return ''
})

const confirmDialog = ref(false)
const pendingAction = ref<PunchType | null>(null)

const actionConfig = {
  CHECK_IN: { title: '出勤打刻しますか？', color: 'primary', icon: 'mdi-login' },
  BREAK_START: { title: '休憩開始しますか？', color: 'warning', icon: 'mdi-coffee-outline' },
  BREAK_END: { title: '休憩終了しますか？', color: 'success', icon: 'mdi-play-circle-outline' },
  CHECK_OUT: { title: '退勤打刻しますか？', color: 'error', icon: 'mdi-logout' },
}

const confirmTitle = computed(() => pendingAction.value ? actionConfig[pendingAction.value].title : '')
const confirmColor = computed(() => pendingAction.value ? actionConfig[pendingAction.value].color : 'primary')
const confirmIcon = computed(() => pendingAction.value ? actionConfig[pendingAction.value].icon : 'mdi-clock')

function openConfirm(type: PunchType) {
  pendingAction.value = type
  confirmDialog.value = true
}

function executePunch() {
  if (!pendingAction.value) return
  const result = clockStore.punch(pendingAction.value, timeNow.now.value)
  if (!result.success) {
    appStore.showSnackbar(result.reason ?? '打刻に失敗しました', 'error')
    confirmDialog.value = false
    pendingAction.value = null
    return
  }

  const messages: Record<PunchType, string> = {
    CHECK_IN: `出勤打刻しました (${timeNow.timeShort.value})`,
    BREAK_START: `休憩開始しました (${timeNow.timeShort.value})`,
    BREAK_END: `休憩終了しました (${timeNow.timeShort.value})`,
    CHECK_OUT: `退勤打刻しました (${timeNow.timeShort.value})`,
  }
  const colors: Record<PunchType, string> = {
    CHECK_IN: 'success', BREAK_START: 'warning', BREAK_END: 'success', CHECK_OUT: 'error',
  }
  appStore.showSnackbar(messages[pendingAction.value], colors[pendingAction.value])
  confirmDialog.value = false
  pendingAction.value = null
}

function eventLabel(type: string) {
  return { CHECK_IN: '出勤', BREAK_START: '休憩開始', BREAK_END: '休憩終了', CHECK_OUT: '退勤' }[type] ?? type
}

function eventIcon(type: string) {
  return {
    CHECK_IN: 'mdi-login', BREAK_START: 'mdi-coffee-outline',
    BREAK_END: 'mdi-play-circle-outline', CHECK_OUT: 'mdi-logout',
  }[type] ?? 'mdi-clock'
}

function eventColor(type: string) {
  return {
    CHECK_IN: '#4bd08b', BREAK_START: '#f8c076', BREAK_END: '#4bd08b', CHECK_OUT: '#e6273e',
  }[type] ?? '#9e9e9e'
}
</script>

<style scoped>
.gap-2 { gap: 8px; }
.gap-3 { gap: 12px; }
.w-100 { width: 100%; }
.punch-timeline { display: flex; flex-direction: column; gap: 16px; }
.punch-event { position: relative; }
</style>
