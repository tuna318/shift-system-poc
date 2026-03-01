<template>
  <div>
    <div class="d-flex align-center justify-space-between mb-6">
      <div>
        <h1 class="text-h5 font-weight-bold">シフト調整</h1>
        <p class="text-body-2 text-medium-emphasis mt-1">シフトの調整依頼と進捗を確認します</p>
      </div>
    </div>

    <v-row>
      <v-col
        v-for="item in adjustments"
        :key="item.id"
        cols="12" md="6"
      >
        <v-card rounded="xl" elevation="0" border>
          <v-card-text class="pa-4">
            <div class="d-flex align-center justify-space-between mb-2">
              <div class="d-flex align-center ga-2">
                <v-avatar color="primary" size="32">
                  <span class="text-white text-caption">{{ item.employeeName.charAt(0) }}</span>
                </v-avatar>
                <div>
                  <div class="text-body-2 font-weight-medium">{{ item.employeeName }}</div>
                  <div class="text-caption text-medium-emphasis">{{ item.date }}</div>
                </div>
              </div>
              <v-chip :color="item.statusColor" size="small" variant="flat">{{ item.statusLabel }}</v-chip>
            </div>
            <div class="pa-2 rounded-lg mb-2" style="background: #FEF3C7">
              <div class="text-caption text-medium-emphasis mb-1">現在のシフト</div>
              <div class="text-body-2 font-weight-medium">{{ item.currentShift }}</div>
            </div>
            <div class="pa-2 rounded-lg" style="background: #DBEAFE">
              <div class="text-caption text-medium-emphasis mb-1">提案シフト</div>
              <div class="text-body-2 font-weight-medium text-primary">{{ item.proposedShift }}</div>
            </div>
            <p class="text-caption text-medium-emphasis mt-2">理由: {{ item.reason }}</p>
          </v-card-text>
          <v-card-actions class="pa-4 pt-0">
            <v-btn size="small" color="success" variant="tonal" rounded="lg" @click="approve(item.id)">承認</v-btn>
            <v-btn size="small" color="error" variant="tonal" rounded="lg" @click="reject(item.id)">拒否</v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>

    <v-snackbar v-model="snackbar.show" location="top center" :color="snackbar.color" rounded="pill" :timeout="2000">
      {{ snackbar.message }}
    </v-snackbar>
  </div>
</template>

<script setup lang="ts">
const adjustments = ref([
  { id: 1, employeeName: '田中 恵子', date: '2026-03-07', currentShift: '11:00〜20:00', proposedShift: '13:00〜22:00', reason: '通学の都合', statusLabel: '調整中', statusColor: 'warning' },
  { id: 2, employeeName: '伊藤 美咲', date: '2026-03-03', currentShift: '15:00〜22:00', proposedShift: '17:00〜23:00', reason: '家庭の事情', statusLabel: '調整中', statusColor: 'warning' },
  { id: 3, employeeName: '木村 大輔', date: '2026-03-08', currentShift: '10:00〜18:00', proposedShift: '休日希望', reason: '体調不良', statusLabel: '調整中', statusColor: 'warning' },
])

const snackbar = reactive({ show: false, message: '', color: 'success' })

function approve(id: number) {
  const item = adjustments.value.find(a => a.id === id)
  if (item) { item.statusLabel = '承認済み'; item.statusColor = 'success' }
  snackbar.message = '調整を承認しました'
  snackbar.color = 'success'
  snackbar.show = true
}

function reject(id: number) {
  const item = adjustments.value.find(a => a.id === id)
  if (item) { item.statusLabel = '拒否'; item.statusColor = 'error' }
  snackbar.message = '調整を拒否しました'
  snackbar.color = 'error'
  snackbar.show = true
}
</script>
