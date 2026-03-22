<template>
  <div class="pa-4">
    <template v-if="shift">
      <!-- Shift detail card -->
      <v-card rounded="xl" elevation="1" class="mb-4">
        <v-card-text class="pa-5">
          <div class="d-flex align-center justify-space-between mb-3">
            <div class="text-h6 font-weight-bold">{{ dateLabel }}</div>
            <v-chip :color="statusColor" size="small" variant="tonal">
              <v-icon start size="14">{{ statusIcon }}</v-icon>
              {{ statusLabel }}
            </v-chip>
          </div>
          <div class="d-flex align-center gap-3 mb-2">
            <v-icon color="primary" size="20">mdi-clock-outline</v-icon>
            <span class="text-h6">{{ shift.startTime }} 〜 {{ shift.endTime }}</span>
          </div>
          <div class="d-flex align-center gap-3">
            <v-icon color="grey" size="20">mdi-store-outline</v-icon>
            <span class="text-body-2 text-grey">{{ shift.department }}</span>
          </div>
        </v-card-text>
      </v-card>

      <!-- ADJUSTING: manager request card -->
      <template v-if="shift.cellStatus === 'ADJUSTING' && shift.adjustingResponseStatus === 'PENDING'">
        <v-card rounded="xl" color="warning" variant="tonal" class="mb-4">
          <v-card-text class="pa-4">
            <div class="d-flex align-center gap-2 mb-2">
              <v-icon color="warning">mdi-calendar-edit</v-icon>
              <span class="text-subtitle-2 font-weight-bold">店長からの調整依頼</span>
            </div>
            <p class="text-body-2 mb-4">{{ shift.adjustingReason }}</p>
            <div class="d-flex gap-2">
              <v-btn
                color="primary"
                rounded="lg"
                class="flex-1-1"
                @click="openResponse('ACCEPTED')"
              >
                <v-icon start>mdi-check</v-icon>
                承諾する
              </v-btn>
              <v-btn
                color="error"
                variant="outlined"
                rounded="lg"
                class="flex-1-1"
                @click="openResponse('DECLINED')"
              >
                <v-icon start>mdi-close</v-icon>
                断る
              </v-btn>
            </div>
          </v-card-text>
        </v-card>
      </template>

      <!-- Already responded -->
      <template v-else-if="shift.cellStatus === 'ADJUSTING' && shift.adjustingResponseStatus !== 'PENDING'">
        <v-card rounded="xl" variant="outlined" class="mb-4">
          <v-card-text class="pa-4">
            <v-chip
              :color="shift.adjustingResponseStatus === 'ACCEPTED' ? 'success' : 'grey'"
              variant="tonal"
            >
              <v-icon start size="14">{{ shift.adjustingResponseStatus === 'ACCEPTED' ? 'mdi-check-circle' : 'mdi-close-circle' }}</v-icon>
              {{ shift.adjustingResponseStatus === 'ACCEPTED' ? '調整依頼を承諾しました' : '調整依頼をお断りしました' }}
            </v-chip>
            <p v-if="shift.adjustingResponse" class="text-body-2 text-grey mt-2">{{ shift.adjustingResponse }}</p>
          </v-card-text>
        </v-card>
      </template>

      <!-- Actions -->
      <v-card rounded="xl" elevation="0" variant="outlined" class="mb-4">
        <v-list density="compact" rounded="xl">
          <v-list-item
            prepend-icon="mdi-swap-horizontal"
            title="代打・シフト交換を依頼する"
            append-icon="mdi-chevron-right"
            @click="navigateTo(`/substitutions/new?shiftId=${shift.id}`)"
          />
          <v-divider />
          <v-list-item
            prepend-icon="mdi-message-outline"
            title="店長にメッセージする"
            append-icon="mdi-chevron-right"
            @click="navigateTo('/chat/emp-003')"
          />
        </v-list>
      </v-card>
    </template>

    <template v-else>
      <div class="text-center pa-8 text-grey">
        <v-icon size="48" color="grey-lighten-2">mdi-calendar-remove</v-icon>
        <div class="text-body-2 mt-2">シフトが見つかりません</div>
      </div>
    </template>

    <!-- Response dialog -->
    <v-dialog v-model="responseDialog" max-width="340">
      <v-card rounded="xl">
        <v-card-text class="pa-6">
          <div class="text-subtitle-1 font-weight-bold mb-2">
            {{ pendingResponse === 'ACCEPTED' ? '調整依頼を承諾しますか？' : '調整依頼をお断りしますか？' }}
          </div>
          <v-textarea
            v-model="responseMessage"
            :label="pendingResponse === 'ACCEPTED' ? '一言メッセージ（任意）' : 'お断りの理由（任意）'"
            rows="3"
            density="compact"
            variant="outlined"
            rounded="lg"
            hide-details
            class="mb-4"
          />
          <div class="d-flex gap-2">
            <v-btn variant="outlined" rounded="lg" class="flex-1-1" @click="responseDialog = false">
              キャンセル
            </v-btn>
            <v-btn
              :color="pendingResponse === 'ACCEPTED' ? 'primary' : 'error'"
              rounded="lg"
              class="flex-1-1"
              @click="submitResponse"
            >
              {{ pendingResponse === 'ACCEPTED' ? '承諾する' : 'お断りする' }}
            </v-btn>
          </div>
        </v-card-text>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const shiftStore = useShiftStore()
const appStore = useAppStore()

const shiftId = computed(() => route.params.id as string)
const shift = computed(() => shiftStore.entries.find((e) => e.id === shiftId.value) ?? null)

const dateLabel = computed(() => {
  if (!shift.value) return ''
  const d = new Date(shift.value.date)
  const dow = ['日', '月', '火', '水', '木', '金', '土']
  return `${d.getMonth() + 1}月${d.getDate()}日 (${dow[d.getDay()]})`
})

const statusConfig = {
  CONFIRMED: { label: '確定済み', color: 'success', icon: 'mdi-check-circle-outline' },
  ADJUSTING: { label: '調整中', color: 'warning', icon: 'mdi-calendar-edit' },
  SHIFT_REQUESTED: { label: '希望提出済み', color: 'primary', icon: 'mdi-calendar-clock' },
  DAY_OFF_REQUESTED: { label: '休み希望', color: 'grey', icon: 'mdi-home-outline' },
  DAY_OFF_CONFIRMED: { label: '休み確定', color: 'grey', icon: 'mdi-home-check-outline' },
}

const statusLabel = computed(() => statusConfig[shift.value?.cellStatus ?? 'CONFIRMED']?.label ?? '確定済み')
const statusColor = computed(() => statusConfig[shift.value?.cellStatus ?? 'CONFIRMED']?.color ?? 'success')
const statusIcon = computed(() => statusConfig[shift.value?.cellStatus ?? 'CONFIRMED']?.icon ?? 'mdi-check-circle-outline')

const responseDialog = ref(false)
const pendingResponse = ref<'ACCEPTED' | 'DECLINED' | null>(null)
const responseMessage = ref('')

function openResponse(res: 'ACCEPTED' | 'DECLINED') {
  pendingResponse.value = res
  responseMessage.value = res === 'ACCEPTED' ? '承知しました。出勤いたします。' : ''
  responseDialog.value = true
}

function submitResponse() {
  if (!pendingResponse.value || !shift.value) return
  const msg = responseMessage.value || (pendingResponse.value === 'ACCEPTED' ? '承知しました。' : 'お断りします。')
  shiftStore.respondToAdjustment(shift.value.id, pendingResponse.value, msg)
  responseDialog.value = false
  const label = pendingResponse.value === 'ACCEPTED' ? '承諾しました' : 'お断りしました'
  appStore.showSnackbar(`調整依頼を${label}`, pendingResponse.value === 'ACCEPTED' ? 'success' : 'warning')
}
</script>

<style scoped>
.gap-2 { gap: 8px; }
.gap-3 { gap: 12px; }
</style>
