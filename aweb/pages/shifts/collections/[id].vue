<template>
  <div>
    <!-- Header -->
    <div class="d-flex align-center ga-3 mb-6">
      <v-btn to="/shifts/collections" icon size="small" variant="text">
        <v-icon>mdi-arrow-left</v-icon>
      </v-btn>
      <div class="flex-1-1">
        <div class="d-flex align-center ga-2">
          <h1 class="text-h6 font-weight-bold">{{ collection?.name }}</h1>
          <v-chip :color="statusColor(collection?.status)" size="small" variant="flat">
            {{ statusLabel(collection?.status) }}
          </v-chip>
        </div>
        <p class="text-caption text-medium-emphasis">
          {{ collection?.periodStart }} 〜 {{ collection?.periodEnd }}
          ／ 締切: {{ collection?.deadline }}
        </p>
      </div>
      <div class="d-flex ga-2">
        <v-btn
          variant="tonal"
          color="primary"
          prepend-icon="mdi-send-outline"
          rounded="lg"
          size="small"
          @click="handleRemind"
        >
          リマインド送信
        </v-btn>
        <v-btn
          v-if="collection?.status === 'COLLECTING'"
          variant="flat"
          color="error"
          prepend-icon="mdi-lock-outline"
          rounded="lg"
          size="small"
          @click="handleClose"
        >
          収集を閉じる
        </v-btn>
      </div>
    </div>

    <!-- Stats -->
    <v-row class="mb-4">
      <v-col cols="6" md="3">
        <v-card rounded="xl" elevation="0" border class="pa-3 text-center">
          <div class="text-h5 font-weight-bold text-success">{{ collection?.submittedCount }}</div>
          <div class="text-caption text-medium-emphasis">提出済み</div>
        </v-card>
      </v-col>
      <v-col cols="6" md="3">
        <v-card rounded="xl" elevation="0" border class="pa-3 text-center">
          <div class="text-h5 font-weight-bold text-warning">
            {{ (collection?.totalTargets ?? 0) - (collection?.submittedCount ?? 0) }}
          </div>
          <div class="text-caption text-medium-emphasis">未提出</div>
        </v-card>
      </v-col>
      <v-col cols="6" md="3">
        <v-card rounded="xl" elevation="0" border class="pa-3 text-center">
          <div class="text-h5 font-weight-bold">{{ collection?.totalTargets }}</div>
          <div class="text-caption text-medium-emphasis">対象人数</div>
        </v-card>
      </v-col>
      <v-col cols="6" md="3">
        <v-card rounded="xl" elevation="0" border class="pa-3 text-center">
          <div class="text-h5 font-weight-bold text-primary">
            {{ Math.round(((collection?.submittedCount ?? 0) / (collection?.totalTargets ?? 1)) * 100) }}%
          </div>
          <div class="text-caption text-medium-emphasis">提出率</div>
        </v-card>
      </v-col>
    </v-row>

    <!-- Progress bar -->
    <v-card rounded="xl" elevation="0" border class="mb-4 pa-4">
      <div class="d-flex justify-space-between align-center mb-2">
        <span class="text-subtitle-2 font-weight-bold">提出状況</span>
        <span class="text-body-2">{{ collection?.submittedCount }}/{{ collection?.totalTargets }}名</span>
      </div>
      <v-progress-linear
        :model-value="submissionRate"
        color="success"
        bg-color="#E0E1E4"
        height="8"
        rounded
      />
    </v-card>

    <!-- Submission table -->
    <v-card rounded="xl" elevation="0" border>
      <v-card-title class="pa-4 pb-2 text-subtitle-2 font-weight-bold">提出一覧</v-card-title>
      <v-data-table
        :headers="headers"
        :items="tableItems"
        density="compact"
        hover
      >
        <template #item.status="{ item }">
          <v-chip
            :color="item.submitted ? 'success' : 'default'"
            size="small"
            variant="flat"
          >
            {{ item.submitted ? '提出済み' : '未提出' }}
          </v-chip>
        </template>
        <template #item.submittedAt="{ item }">
          <span class="text-caption">{{ item.submittedAt ? formatDate(item.submittedAt) : '—' }}</span>
        </template>
      </v-data-table>
    </v-card>

    <v-snackbar v-model="snackbar.show" location="top center" :color="snackbar.color" rounded="pill" :timeout="2000">
      {{ snackbar.message }}
    </v-snackbar>
  </div>
</template>

<script setup lang="ts">
import { useMockData } from '~/composables/useMockData'
import type { CollectionStatus } from '~/types'

const route = useRoute()
const { collections, getEmployee } = useMockData()

const collectionId = computed(() => route.params.id as string)
const collection = computed(() => collections.find(c => c.id === collectionId.value))

const submissionRate = computed(() =>
  Math.round(((collection.value?.submittedCount ?? 0) / (collection.value?.totalTargets ?? 1)) * 100)
)

const headers = [
  { title: '従業員名', key: 'name', sortable: true },
  { title: '部署', key: 'department', sortable: true },
  { title: 'ステータス', key: 'status', sortable: true },
  { title: '最終更新', key: 'submittedAt', sortable: true },
]

const tableItems = computed(() =>
  (collection.value?.submissions ?? []).map(sub => {
    const emp = getEmployee(sub.employeeId)
    return {
      ...sub,
      name: emp?.name ?? '不明',
      department: emp?.department ?? '—',
    }
  })
)

function statusColor(status?: CollectionStatus | string) {
  const map: Record<string, string> = {
    DRAFT: 'default', SENT: 'primary', COLLECTING: 'warning', CLOSED: 'success',
  }
  return map[status ?? ''] ?? 'default'
}

function statusLabel(status?: CollectionStatus | string) {
  const map: Record<string, string> = {
    DRAFT: '下書き', SENT: '送信済み', COLLECTING: '収集中', CLOSED: '締切済み',
  }
  return map[status ?? ''] ?? status
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('ja-JP', {
    month: 'short', day: 'numeric',
  })
}

const snackbar = reactive({ show: false, message: '', color: 'primary' })

function handleRemind() {
  snackbar.message = 'リマインドを送信しました'
  snackbar.color = 'primary'
  snackbar.show = true
}

function handleClose() {
  snackbar.message = '収集を締め切りました'
  snackbar.color = 'success'
  snackbar.show = true
}
</script>
