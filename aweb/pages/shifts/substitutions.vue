<template>
  <div>
    <div class="d-flex align-center justify-space-between mb-6">
      <div>
        <h1 class="text-h5 font-weight-bold">代打・交代</h1>
        <p class="text-body-2 text-medium-emphasis mt-1">シフトの代打・交代申請を管理します</p>
      </div>
      <v-btn color="primary" prepend-icon="mdi-plus" rounded="lg" @click="dialog = true">
        申請を作成
      </v-btn>
    </div>

    <v-row>
      <v-col cols="12">
        <v-card rounded="xl" elevation="0" border>
          <v-card-title class="pa-4 pb-2 text-subtitle-2 font-weight-bold">申請一覧</v-card-title>
          <v-card-text class="px-4 pb-4">
            <div class="d-flex flex-column ga-3">
              <div
                v-for="req in substitutions"
                :key="req.id"
                class="d-flex align-center justify-space-between pa-3 rounded-xl border"
              >
                <div class="d-flex align-center ga-3">
                  <v-icon :color="req.type === 'SUBSTITUTE' ? 'primary' : 'warning'" size="24">
                    {{ req.type === 'SUBSTITUTE' ? 'mdi-account-replace' : 'mdi-swap-horizontal-bold' }}
                  </v-icon>
                  <div>
                    <div class="text-body-2 font-weight-medium">{{ req.description }}</div>
                    <div class="text-caption text-medium-emphasis">{{ req.date }} ／ {{ req.shift }}</div>
                  </div>
                </div>
                <div class="d-flex align-center ga-2">
                  <v-chip :color="req.statusColor" size="small" variant="flat">{{ req.statusLabel }}</v-chip>
                  <v-btn icon size="x-small" variant="text">
                    <v-icon>mdi-dots-vertical</v-icon>
                  </v-btn>
                </div>
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-dialog v-model="dialog" max-width="440">
      <v-card rounded="xl">
        <v-card-title class="pa-4 text-subtitle-1 font-weight-bold">代打・交代申請</v-card-title>
        <v-divider />
        <v-card-text class="pa-4">
          <v-select v-model="form.type" :items="['代打', '交代']" label="種別" class="mb-3" />
          <v-select v-model="form.requester" :items="employeeNames" label="申請者" class="mb-3" />
          <v-text-field v-model="form.date" type="date" label="日付" class="mb-3" />
          <v-text-field v-model="form.reason" label="理由" class="mb-3" />
        </v-card-text>
        <v-card-actions class="pa-4 pt-0">
          <v-spacer />
          <v-btn variant="text" @click="dialog = false">キャンセル</v-btn>
          <v-btn color="primary" variant="flat" @click="dialog = false">申請</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { useMockData } from '~/composables/useMockData'

const { employees } = useMockData()

const dialog = ref(false)
const form = reactive({ type: '代打', requester: '', date: '', reason: '' })

const employeeNames = computed(() => employees.filter(e => e.status === 'ACTIVE').map(e => e.name))

const substitutions = [
  { id: 1, type: 'SUBSTITUTE', description: '山田 太郎 → 鈴木 一郎（代打）', date: '2026-03-05', shift: '10:00〜18:00', statusLabel: '承認待ち', statusColor: 'warning' },
  { id: 2, type: 'SWAP', description: '佐藤 花子 ↔ 高橋 和也（交代）', date: '2026-03-08', shift: '11:00〜20:00', statusLabel: '承認済み', statusColor: 'success' },
  { id: 3, type: 'SUBSTITUTE', description: '田中 恵子 → 伊藤 美咲（代打）', date: '2026-03-12', shift: '17:00〜22:00', statusLabel: '拒否', statusColor: 'error' },
]
</script>
