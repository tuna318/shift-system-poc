<template>
  <div>
    <div class="d-flex align-center justify-space-between mb-6">
      <div>
        <h1 class="text-h5 font-weight-bold">シフトボード</h1>
        <p class="text-body-2 text-medium-emphasis mt-1">シフトボードの一覧</p>
      </div>
      <v-btn color="primary" prepend-icon="mdi-plus" rounded="lg">
        新規ボード作成
      </v-btn>
    </div>

    <v-row>
      <v-col
        v-for="board in boards"
        :key="board.id"
        cols="12" md="6" lg="4"
      >
        <v-card
          rounded="xl"
          elevation="0"
          border
          :to="`/shifts/board/${board.id}`"
          class="board-card"
        >
          <v-card-text class="pa-5">
            <div class="d-flex align-start justify-space-between mb-3">
              <div>
                <h3 class="text-subtitle-1 font-weight-bold mb-1">{{ board.name }}</h3>
                <p class="text-caption text-medium-emphasis">
                  {{ formatDate(board.periodStart) }} 〜 {{ formatDate(board.periodEnd) }}
                </p>
              </div>
              <v-chip
                :color="board.status === 'PUBLISHED' ? 'success' : 'warning'"
                size="small"
                variant="flat"
              >
                {{ board.status === 'PUBLISHED' ? '公開済み' : 'DRAFT' }}
              </v-chip>
            </div>

            <div class="d-flex ga-4 mt-3">
              <div class="text-center">
                <div class="text-h6 font-weight-bold text-primary">{{ board.entries.length }}</div>
                <div class="text-caption text-medium-emphasis">シフト件数</div>
              </div>
              <v-divider vertical />
              <div class="text-center">
                <div class="text-h6 font-weight-bold">¥{{ (board.budgetAmount / 10000).toFixed(0) }}万</div>
                <div class="text-caption text-medium-emphasis">予算</div>
              </div>
              <v-divider vertical />
              <div class="text-center">
                <div class="text-h6 font-weight-bold text-medium-emphasis">
                  {{ getDaysCount(board.periodStart, board.periodEnd) }}日
                </div>
                <div class="text-caption text-medium-emphasis">対象期間</div>
              </div>
            </div>
          </v-card-text>

          <v-card-actions class="pa-4 pt-0">
            <v-btn
              :to="`/shifts/board/${board.id}`"
              color="primary"
              variant="tonal"
              size="small"
              rounded="lg"
              append-icon="mdi-arrow-right"
              block
            >
              ボードを開く
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script setup lang="ts">
import { useMockData } from '~/composables/useMockData'

const { boards } = useMockData()

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('ja-JP', {
    year: 'numeric', month: 'long', day: 'numeric',
  })
}

function getDaysCount(start: string, end: string): number {
  const s = new Date(start)
  const e = new Date(end)
  return Math.round((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1
}
</script>

<style scoped>
.board-card {
  transition: box-shadow 0.2s, transform 0.1s;
  text-decoration: none;
}

.board-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1) !important;
  transform: translateY(-1px);
}
</style>
