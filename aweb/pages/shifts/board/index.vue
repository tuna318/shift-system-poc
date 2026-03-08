<template>
  <div>
    <div class="d-flex align-center justify-space-between mb-6">
      <div>
        <h1 class="text-h5 font-weight-bold">シフト管理</h1>
        <p class="text-body-2 text-medium-emphasis mt-1">収集からボード作成・公開まで一元管理</p>
      </div>
      <v-btn to="/shifts/board/new" color="primary" prepend-icon="mdi-plus" rounded="lg">
        新規作成
      </v-btn>
    </div>

    <v-row>
      <v-col
        v-for="board in boards"
        :key="board.id"
        cols="12" md="6" lg="4"
      >
        <v-card rounded="xl" elevation="0" border class="board-card">
          <v-card-text class="pa-5">
            <!-- Header -->
            <div class="mb-4">
              <h3 class="text-subtitle-1 font-weight-bold mb-1">{{ board.name }}</h3>
              <p class="text-caption text-medium-emphasis">
                {{ formatDate(board.periodStart) }} 〜 {{ formatDate(board.periodEnd) }}
              </p>
            </div>

            <!-- Workflow steps -->
            <div class="d-flex align-center ga-1 mb-4">
              <template v-for="(step, idx) in getWorkflowSteps(board)" :key="step.label">
                <div class="d-flex align-center ga-1">
                  <v-icon
                    :color="step.done ? 'success' : step.active ? 'primary' : 'medium-emphasis'"
                    size="14"
                  >
                    {{ step.done ? 'mdi-check-circle' : step.active ? 'mdi-circle-slice-8' : 'mdi-circle-outline' }}
                  </v-icon>
                  <span
                    class="text-caption font-weight-medium"
                    :class="step.done ? 'text-success' : step.active ? 'text-primary' : 'text-medium-emphasis'"
                  >{{ step.label }}</span>
                </div>
                <v-icon v-if="idx < 2" size="12" color="medium-emphasis">mdi-chevron-right</v-icon>
              </template>
            </div>

            <!-- Collection row (if linked) -->
            <template v-if="getCollectionForBoard(board.id)">
              <div class="mb-3">
                <div class="d-flex align-center justify-space-between mb-1">
                  <span class="text-caption text-medium-emphasis">提出状況</span>
                  <div class="d-flex align-center ga-2">
                    <span class="text-caption font-weight-medium">
                      {{ getCollectionForBoard(board.id)!.submittedCount }}/{{ getCollectionForBoard(board.id)!.totalTargets }}名 提出済み
                    </span>
                    <v-chip
                      :color="collectionStatusColor(getCollectionForBoard(board.id)!.status)"
                      size="x-small"
                      variant="flat"
                    >
                      {{ collectionStatusLabel(getCollectionForBoard(board.id)!.status) }}
                    </v-chip>
                  </div>
                </div>
                <v-progress-linear
                  :model-value="getSubmissionRate(board.id)"
                  :color="getCollectionForBoard(board.id)!.status === 'CLOSED' ? 'success' : 'primary'"
                  bg-color="surface-variant"
                  rounded
                  height="6"
                />
              </div>
            </template>

            <v-divider class="mb-3" />

            <!-- Metrics -->
            <div class="d-flex ga-4">
              <div class="text-center">
                <div class="text-h6 font-weight-bold text-primary">{{ board.entries.length }}</div>
                <div class="text-caption text-medium-emphasis">シフト</div>
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
                <div class="text-caption text-medium-emphasis">期間</div>
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
              開く
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script setup lang="ts">
import { useMockData } from '~/composables/useMockData'
import type { CollectionStatus } from '~/types'

const { boards, getCollectionForBoard } = useMockData()

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

function getSubmissionRate(boardId: string): number {
  const coll = getCollectionForBoard(boardId)
  if (!coll || coll.totalTargets === 0) return 0
  return Math.round((coll.submittedCount / coll.totalTargets) * 100)
}

function collectionStatusColor(status: CollectionStatus): string {
  const map: Record<CollectionStatus, string> = {
    DRAFT: 'default',
    SENT: 'info',
    COLLECTING: 'warning',
    CLOSED: 'success',
  }
  return map[status]
}

function collectionStatusLabel(status: CollectionStatus): string {
  const map: Record<CollectionStatus, string> = {
    DRAFT: 'DRAFT',
    SENT: '送信済み',
    COLLECTING: '収集中',
    CLOSED: '収集完了',
  }
  return map[status]
}

function getWorkflowSteps(board: typeof boards[number]) {
  const coll = getCollectionForBoard(board.id)
  const collDone = coll ? coll.status === 'CLOSED' : false
  const collActive = coll ? (coll.status === 'COLLECTING' || coll.status === 'SENT') : false
  const boardDone = board.status === 'PUBLISHED'
  // ボード編集 is always accessible while DRAFT — collection running in parallel is fine
  const boardActive = !boardDone

  return [
    { label: '収集', done: collDone, active: collActive },
    { label: 'ボード編集', done: boardDone, active: boardActive },
    { label: '公開', done: boardDone, active: false },
  ]
}
</script>

<style scoped>
.board-card {
  transition: box-shadow 0.2s, transform 0.1s;
}

.board-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1) !important;
  transform: translateY(-1px);
}
</style>
