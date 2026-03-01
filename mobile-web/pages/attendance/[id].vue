<template>
  <div class="pa-4">
    <template v-if="record">
      <!-- Date header -->
      <div class="text-h6 font-weight-bold mb-1">{{ dateLabel }}</div>
      <v-chip :color="statusColor" size="small" variant="tonal" class="mb-4">
        {{ statusLabel }}
      </v-chip>

      <!-- Punch timeline -->
      <div class="text-subtitle-2 font-weight-bold text-grey-darken-2 mb-2">打刻記録</div>
      <v-card rounded="xl" elevation="0" variant="outlined" class="mb-4">
        <v-card-text class="pa-4">
          <!-- Scheduled -->
          <div class="d-flex justify-space-between mb-3 text-body-2">
            <span class="text-grey">シフト予定</span>
            <span v-if="record.scheduledStart" class="font-weight-medium">
              {{ record.scheduledStart }} 〜 {{ record.scheduledEnd }}
            </span>
            <span v-else class="text-grey">—</span>
          </div>

          <v-divider class="mb-3" />

          <!-- Actual punches (editable if correction requested) -->
          <div class="d-flex flex-column gap-3">
            <div class="d-flex align-center justify-space-between">
              <div class="d-flex align-center gap-2">
                <v-icon color="success" size="18">mdi-login</v-icon>
                <span class="text-body-2">出勤</span>
              </div>
              <template v-if="isCorrectionMode">
                <v-text-field
                  v-model="correctedCheckIn"
                  type="time"
                  density="compact"
                  variant="outlined"
                  hide-details
                  style="max-width: 120px;"
                  rounded="lg"
                />
              </template>
              <template v-else>
                <span class="text-body-2 font-weight-bold">{{ record.checkIn ?? '—' }}</span>
              </template>
            </div>

            <div class="d-flex align-center justify-space-between">
              <div class="d-flex align-center gap-2">
                <v-icon color="error" size="18">mdi-logout</v-icon>
                <span class="text-body-2">退勤</span>
              </div>
              <template v-if="isCorrectionMode">
                <v-text-field
                  v-model="correctedCheckOut"
                  type="time"
                  density="compact"
                  variant="outlined"
                  hide-details
                  style="max-width: 120px;"
                  rounded="lg"
                />
              </template>
              <template v-else>
                <span class="text-body-2 font-weight-bold">{{ record.checkOut ?? '未退勤' }}</span>
              </template>
            </div>
          </div>

          <v-divider class="mt-3 mb-3" />

          <!-- Totals -->
          <div class="d-flex justify-space-between text-body-2">
            <span class="text-grey">休憩時間</span>
            <span>{{ record.breakMinutes }}分</span>
          </div>
          <div class="d-flex justify-space-between text-body-2 mt-1">
            <span class="text-grey">実働時間</span>
            <span class="font-weight-bold">{{ totalLabel }}</span>
          </div>
          <div v-if="record.overtimeMinutes > 0" class="d-flex justify-space-between text-body-2 mt-1">
            <span class="text-grey">残業時間</span>
            <span class="text-error font-weight-bold">{{ overtimeLabel }}</span>
          </div>
        </v-card-text>
      </v-card>

      <!-- Correction request card -->
      <template v-if="record.status === 'CORRECTION_REQUESTED' || record.status === 'PENDING_APPROVAL'">
        <div class="text-subtitle-2 font-weight-bold text-grey-darken-2 mb-2">
          {{ record.status === 'CORRECTION_REQUESTED' ? '修正依頼' : '申請状況' }}
        </div>
        <v-card rounded="xl" elevation="0" :color="record.status === 'CORRECTION_REQUESTED' ? 'error' : 'primary'" variant="tonal" class="mb-4">
          <v-card-text class="pa-4">
            <div v-if="record.correctionComment" class="text-body-2 mb-3">
              <span class="font-weight-bold">管理者コメント: </span>{{ record.correctionComment }}
            </div>
            <div v-else class="text-body-2 mb-3 text-grey">
              {{ record.status === 'PENDING_APPROVAL' ? '承認待ちです。しばらくお待ちください。' : '打刻内容を確認・修正して再申請してください。' }}
            </div>
          </v-card-text>
        </v-card>

        <!-- Correction submit button -->
        <template v-if="record.status === 'CORRECTION_REQUESTED' && !correctionSubmitted">
          <template v-if="!isCorrectionMode">
            <v-btn block color="error" size="large" rounded="xl" @click="isCorrectionMode = true">
              <v-icon start>mdi-pencil-outline</v-icon>
              打刻を修正して申請
            </v-btn>
          </template>
          <template v-else>
            <v-btn block color="primary" size="large" rounded="xl" @click="submitCorrection">
              <v-icon start>mdi-send</v-icon>
              修正して申請する
            </v-btn>
            <v-btn block variant="outlined" rounded="xl" class="mt-2" @click="isCorrectionMode = false">
              キャンセル
            </v-btn>
          </template>
        </template>
        <template v-if="correctionSubmitted">
          <v-alert type="success" rounded="xl" variant="tonal" density="compact">
            修正申請を送信しました。承認をお待ちください。
          </v-alert>
        </template>
      </template>

      <!-- Approved state -->
      <template v-if="record.status === 'APPROVED'">
        <v-alert type="success" rounded="xl" variant="tonal" density="compact">
          <v-icon start>mdi-check-circle-outline</v-icon>
          この勤怠は承認済みです
        </v-alert>
      </template>
    </template>

    <template v-else>
      <div class="text-center pa-8 text-grey">
        <v-icon size="48" color="grey-lighten-2">mdi-alert-circle-outline</v-icon>
        <div class="text-body-2 mt-2">記録が見つかりませんでした</div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const { myAttendance, formatMinutes } = useMockData()
const appStore = useAppStore()

const record = computed(() => myAttendance.find((a) => a.id === route.params.id))

const DOW = ['日', '月', '火', '水', '木', '金', '土']

const dateLabel = computed(() => {
  if (!record.value) return ''
  const d = new Date(record.value.date)
  return `${d.getMonth() + 1}月${d.getDate()}日 (${DOW[d.getDay()]})`
})

const statusConfig = {
  APPROVED: { label: '承認済み', color: 'success' },
  PENDING_APPROVAL: { label: '承認待ち', color: 'primary' },
  CORRECTION_REQUESTED: { label: '修正依頼あり', color: 'error' },
  NOT_SUBMITTED: { label: '未提出', color: 'grey' },
  ABSENT: { label: '欠勤', color: 'warning' },
}

const statusLabel = computed(() => record.value ? statusConfig[record.value.status].label : '')
const statusColor = computed(() => record.value ? statusConfig[record.value.status].color : 'grey')

const totalLabel = computed(() => record.value ? formatMinutes(record.value.totalMinutes) || '0分' : '')
const overtimeLabel = computed(() => record.value ? formatMinutes(record.value.overtimeMinutes) : '')

// Correction mode
const isCorrectionMode = ref(false)
const correctionSubmitted = ref(false)
const correctedCheckIn = ref(record.value?.checkIn ?? '')
const correctedCheckOut = ref(record.value?.checkOut ?? '')

function submitCorrection() {
  correctionSubmitted.value = true
  isCorrectionMode.value = false
  appStore.showSnackbar('修正申請を送信しました', 'success')
}
</script>

<style scoped>
.gap-2 { gap: 8px; }
.gap-3 { gap: 12px; }
</style>
