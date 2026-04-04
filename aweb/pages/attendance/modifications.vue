<template>
  <div>
    <div class="d-flex align-center justify-space-between mb-4">
      <div>
        <h1 class="text-h5 font-weight-bold">修正申請</h1>
        <p class="text-body-2 text-medium-emphasis mt-1">スタッフからの打刻修正申請を確認・対応します</p>
      </div>
    </div>

    <v-tabs v-model="activeTab" color="primary" class="mb-4">
      <v-tab value="pending">
        対応待ち
        <v-badge
          v-if="pendingCount > 0"
          :content="pendingCount"
          color="warning"
          inline
          class="ml-2"
        />
      </v-tab>
      <v-tab value="resolved">
        対応済み
        <v-badge
          v-if="resolvedCount > 0"
          :content="resolvedCount"
          color="default"
          inline
          class="ml-2"
        />
      </v-tab>
    </v-tabs>

    <v-tabs-window v-model="activeTab">

      <!-- ── 対応待ち ─────────────────────────────── -->
      <v-tabs-window-item value="pending">
        <div v-if="pending.length === 0" class="text-center py-16">
          <v-icon size="56" color="success">mdi-check-circle-outline</v-icon>
          <p class="text-h6 text-medium-emphasis mt-3">対応待ちの申請はありません</p>
        </div>

        <template v-else>
          <!-- Bulk approve bar -->
          <div v-if="pending.length > 1" class="d-flex align-center justify-space-between mb-4 pa-3 rounded-xl" style="background: #F8F9FA">
            <span class="text-body-2 text-medium-emphasis">{{ pending.length }}件の申請が対応待ちです</span>
            <v-btn
              size="small"
              color="success"
              variant="tonal"
              rounded="lg"
              prepend-icon="mdi-check-all"
              @click="bulkApproveAll"
            >
              全て承認
            </v-btn>
          </div>

          <TransitionGroup tag="div" name="list">
            <ModificationCard
              v-for="mod in pending"
              :key="mod.id"
              :modification="toCardMod(mod)"
              @approve="handleApprove"
              @reject="handleReject"
            />
          </TransitionGroup>
        </template>
      </v-tabs-window-item>

      <!-- ── 対応済み ─────────────────────────────── -->
      <v-tabs-window-item value="resolved">
        <div v-if="resolved.length === 0" class="text-center py-16">
          <v-icon size="56" color="medium-emphasis">mdi-history</v-icon>
          <p class="text-h6 text-medium-emphasis mt-3">対応済みの申請はありません</p>
        </div>

        <template v-else>
          <!-- Filter chips -->
          <div class="d-flex ga-2 mb-4 flex-wrap">
            <v-chip
              :variant="resolvedFilter === 'all' ? 'flat' : 'tonal'"
              :color="resolvedFilter === 'all' ? 'primary' : 'default'"
              size="small"
              @click="resolvedFilter = 'all'"
            >全て ({{ resolved.length }})</v-chip>
            <v-chip
              :variant="resolvedFilter === 'approved' ? 'flat' : 'tonal'"
              color="success"
              size="small"
              @click="resolvedFilter = 'approved'"
            >承認済み ({{ approvedCount }})</v-chip>
            <v-chip
              :variant="resolvedFilter === 'rejected' ? 'flat' : 'tonal'"
              color="error"
              size="small"
              @click="resolvedFilter = 'rejected'"
            >拒否済み ({{ rejectedCount }})</v-chip>
          </div>

          <v-card
            v-for="mod in filteredResolved"
            :key="mod.id"
            rounded="xl"
            elevation="0"
            border
            class="mb-3"
          >
            <v-card-text class="pa-4">
              <div class="d-flex align-start justify-space-between mb-3">
                <div class="d-flex align-center ga-2">
                  <v-avatar :color="mod.status === 'approved' ? 'success' : 'error'" size="36">
                    <v-icon size="18" color="white">
                      {{ mod.status === 'approved' ? 'mdi-check' : 'mdi-close' }}
                    </v-icon>
                  </v-avatar>
                  <div>
                    <div class="text-body-2 font-weight-medium">{{ getEmployee(mod.employeeId)?.name }}</div>
                    <div class="text-caption text-medium-emphasis">{{ mod.workDate }}</div>
                  </div>
                </div>
                <div class="d-flex align-center ga-2">
                  <v-chip
                    :color="mod.type === 'add_missing' ? 'purple' : 'primary'"
                    size="x-small"
                    variant="tonal"
                  >
                    {{ mod.type === 'add_missing' ? 'セッション追加' : '打刻修正' }}
                  </v-chip>
                  <v-chip
                    :color="mod.status === 'approved' ? 'success' : 'error'"
                    size="small"
                    variant="flat"
                  >
                    {{ mod.status === 'approved' ? '承認済み' : '拒否済み' }}
                  </v-chip>
                </div>
              </div>

              <!-- edit: before/after -->
              <div v-if="mod.type === 'edit'" class="d-flex ga-2">
                <div class="flex-1-1 pa-2 rounded-lg" style="background: #F3F4F6">
                  <div class="text-caption text-medium-emphasis mb-1">元の記録</div>
                  <div class="text-caption">{{ mod.originalCheckIn ?? '—' }} 〜 {{ mod.originalCheckOut ?? '未打刻' }}</div>
                </div>
                <v-icon size="16" color="medium-emphasis" class="align-self-center">mdi-arrow-right</v-icon>
                <div class="flex-1-1 pa-2 rounded-lg" style="background: #EBF3FC">
                  <div class="text-caption text-primary mb-1">修正後</div>
                  <div class="text-caption text-primary">{{ mod.requestedCheckIn }} 〜 {{ mod.requestedCheckOut }}</div>
                </div>
              </div>

              <!-- add_missing: new session -->
              <div v-else class="pa-2 rounded-lg" style="background: #F3E8FF">
                <div class="text-caption font-weight-medium mb-1" style="color: #7C3AED">追加セッション</div>
                <div class="text-caption" style="color: #7C3AED">{{ mod.requestedCheckIn }} 〜 {{ mod.requestedCheckOut }}</div>
              </div>

              <!-- Manager rejection note -->
              <div v-if="mod.status === 'rejected' && mod.managerNote" class="mt-2 pa-2 rounded-lg" style="background: #FEF2F2">
                <div class="text-caption text-error">
                  <v-icon size="12" start>mdi-comment-alert-outline</v-icon>
                  管理者コメント: {{ mod.managerNote }}
                </div>
              </div>
            </v-card-text>
          </v-card>
        </template>
      </v-tabs-window-item>

    </v-tabs-window>

    <v-snackbar v-model="snackbar.show" location="top center" :color="snackbar.color" rounded="pill" :timeout="2500">
      {{ snackbar.message }}
    </v-snackbar>
  </div>
</template>

<script setup lang="ts">
import { useMockData } from '~/composables/useMockData'
import type { CorrectionRequest } from '~/types'

const { correctionRequests, getEmployee } = useMockData()

const localRequests = ref<CorrectionRequest[]>(correctionRequests.map(r => ({ ...r })))

const activeTab     = ref<'pending' | 'resolved'>('pending')
const resolvedFilter = ref<'all' | 'approved' | 'rejected'>('all')

const pending  = computed(() => localRequests.value.filter(r => r.status === 'pending'))
const resolved = computed(() => localRequests.value.filter(r => r.status !== 'pending'))

const pendingCount  = computed(() => pending.value.length)
const resolvedCount = computed(() => resolved.value.length)
const approvedCount = computed(() => resolved.value.filter(r => r.status === 'approved').length)
const rejectedCount = computed(() => resolved.value.filter(r => r.status === 'rejected').length)

const filteredResolved = computed(() => {
  if (resolvedFilter.value === 'all') return resolved.value
  return resolved.value.filter(r => r.status === resolvedFilter.value)
})

const snackbar = reactive({ show: false, message: '', color: 'success' })

function toCardMod(r: CorrectionRequest) {
  return {
    id: r.id,
    type: r.type,
    employeeName: getEmployee(r.employeeId)?.name ?? r.employeeId,
    workDate: r.workDate,
    originalCheckIn: r.originalCheckIn,
    originalCheckOut: r.originalCheckOut,
    requestedCheckIn: r.requestedCheckIn,
    requestedCheckOut: r.requestedCheckOut,
    reason: r.reason,
  }
}

function handleApprove(id: string) {
  const req = localRequests.value.find(r => r.id === id)
  if (req) req.status = 'approved'
  snackbar.message = '修正申請を承認しました'
  snackbar.color = 'success'
  snackbar.show = true
}

function handleReject(id: string, note: string) {
  const req = localRequests.value.find(r => r.id === id)
  if (req) {
    req.status = 'rejected'
    req.managerNote = note || undefined
  }
  snackbar.message = '修正申請を拒否しました'
  snackbar.color = 'error'
  snackbar.show = true
}

function bulkApproveAll() {
  const count = pending.value.length
  for (const req of pending.value) {
    req.status = 'approved'
  }
  activeTab.value = 'resolved'
  snackbar.message = `${count}件を一括承認しました`
  snackbar.color = 'success'
  snackbar.show = true
}
</script>

<style scoped>
.list-leave-active {
  position: absolute;
  width: 100%;
}
.list-enter-active,
.list-leave-active {
  transition: all 0.3s ease;
}
.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateX(-12px);
}
</style>
