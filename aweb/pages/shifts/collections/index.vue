<template>
  <div>
    <div class="d-flex align-center justify-space-between mb-6">
      <div>
        <h1 class="text-h5 font-weight-bold">シフト収集</h1>
        <p class="text-body-2 text-medium-emphasis mt-1">スタッフへのシフト希望収集を管理します</p>
      </div>
      <v-btn
        color="primary"
        prepend-icon="mdi-plus"
        rounded="lg"
        @click="createDialog = true"
      >
        新規収集作成
      </v-btn>
    </div>

    <v-row>
      <v-col
        v-for="coll in collections"
        :key="coll.id"
        cols="12" md="6" lg="4"
      >
        <v-card rounded="xl" elevation="0" border>
          <v-card-text class="pa-5">
            <div class="d-flex align-start justify-space-between mb-3">
              <div>
                <h3 class="text-subtitle-2 font-weight-bold mb-1">{{ coll.name }}</h3>
                <p class="text-caption text-medium-emphasis">
                  {{ coll.periodStart }} 〜 {{ coll.periodEnd }}
                </p>
                <p class="text-caption text-medium-emphasis">
                  締切: {{ coll.deadline }}
                </p>
              </div>
              <v-chip
                :color="statusColor(coll.status)"
                size="small"
                variant="flat"
              >
                {{ statusLabel(coll.status) }}
              </v-chip>
            </div>

            <!-- Progress bar -->
            <div class="mb-2">
              <div class="d-flex justify-space-between align-center mb-1">
                <span class="text-caption text-medium-emphasis">提出状況</span>
                <span class="text-caption font-weight-medium">
                  {{ coll.submittedCount }} / {{ coll.totalTargets }}名
                </span>
              </div>
              <v-progress-linear
                :model-value="(coll.submittedCount / coll.totalTargets) * 100"
                :color="coll.submittedCount === coll.totalTargets ? 'success' : 'primary'"
                bg-color="#E0E1E4"
                height="6"
                rounded
              />
            </div>
          </v-card-text>

          <v-card-actions class="pa-4 pt-0">
            <v-btn
              :to="`/shifts/collections/${coll.id}`"
              variant="tonal"
              color="primary"
              size="small"
              block
              rounded="lg"
              append-icon="mdi-arrow-right"
            >
              詳細を見る
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>

    <!-- Create dialog -->
    <v-dialog v-model="createDialog" max-width="480">
      <v-card rounded="xl">
        <v-card-title class="pa-4 pb-3 text-subtitle-1 font-weight-bold">
          新規シフト収集を作成
        </v-card-title>
        <v-divider />
        <v-card-text class="pa-4">
          <div class="d-flex flex-column ga-3">
            <v-text-field v-model="newColl.name" label="収集名" placeholder="2026年X月 シフト収集" />
            <div class="d-flex ga-3">
              <v-text-field v-model="newColl.periodStart" label="対象期間 開始" type="date" />
              <v-text-field v-model="newColl.periodEnd" label="対象期間 終了" type="date" />
            </div>
            <v-text-field v-model="newColl.deadline" label="提出締切日" type="date" />
          </div>
        </v-card-text>
        <v-card-actions class="pa-4 pt-0">
          <v-spacer />
          <v-btn variant="text" @click="createDialog = false">キャンセル</v-btn>
          <v-btn color="primary" variant="flat" @click="handleCreate">作成</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snackbar" location="top center" color="primary" rounded="pill" :timeout="2000">
      収集を作成しました
    </v-snackbar>
  </div>
</template>

<script setup lang="ts">
import { useMockData } from '~/composables/useMockData'
import type { CollectionStatus } from '~/types'

const { collections } = useMockData()

const createDialog = ref(false)
const snackbar = ref(false)
const newColl = reactive({ name: '', periodStart: '', periodEnd: '', deadline: '' })

function statusColor(status: CollectionStatus) {
  const map: Record<CollectionStatus, string> = {
    DRAFT: 'default',
    SENT: 'primary',
    COLLECTING: 'warning',
    CLOSED: 'success',
  }
  return map[status]
}

function statusLabel(status: CollectionStatus) {
  const map: Record<CollectionStatus, string> = {
    DRAFT: '下書き',
    SENT: '送信済み',
    COLLECTING: '収集中',
    CLOSED: '締切済み',
  }
  return map[status]
}

function handleCreate() {
  createDialog.value = false
  snackbar.value = true
}
</script>
