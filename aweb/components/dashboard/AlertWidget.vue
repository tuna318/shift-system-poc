<template>
  <v-card rounded="xl" elevation="0" border>
    <v-card-title class="pa-4 pb-2 d-flex align-center justify-space-between">
      <div class="d-flex align-center ga-2">
        <v-icon color="error" size="20">mdi-alert-circle-outline</v-icon>
        <span class="text-subtitle-2 font-weight-bold">コンプライアンスアラート</span>
      </div>
      <v-chip color="error" size="x-small" variant="flat">{{ alerts.length }}</v-chip>
    </v-card-title>

    <v-card-text class="px-4 pb-4">
      <div v-if="alerts.length === 0" class="text-center py-4 text-medium-emphasis text-body-2">
        現在アラートはありません
      </div>

      <div v-else class="d-flex flex-column ga-2">
        <v-alert
          v-for="alert in alerts"
          :key="alert.id"
          :type="alert.level === 'critical' ? 'error' : 'warning'"
          variant="tonal"
          density="compact"
          rounded="lg"
          class="py-2"
        >
          <template #prepend>
            <v-icon size="18">
              {{ alert.level === 'critical' ? 'mdi-alert-circle' : 'mdi-alert' }}
            </v-icon>
          </template>
          <div class="text-caption">{{ alert.message }}</div>
          <div class="text-caption mt-1" style="opacity: 0.7">
            {{ formatDate(alert.createdAt) }}
          </div>
        </v-alert>
      </div>
    </v-card-text>

    <v-card-actions class="px-4 pb-4 pt-0">
      <v-btn
        to="/reports"
        variant="tonal"
        color="error"
        size="small"
        block
        rounded="lg"
        append-icon="mdi-arrow-right"
      >
        詳細レポートを見る
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script setup lang="ts">
import { useMockData } from '~/composables/useMockData'

const { alerts } = useMockData()

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('ja-JP', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}
</script>
