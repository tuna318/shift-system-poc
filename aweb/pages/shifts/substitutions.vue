<template>
  <div>
    <div class="d-flex align-center justify-space-between mb-6">
      <div>
        <h1 class="text-h5 font-weight-bold">代打・交代</h1>
        <p class="text-body-2 text-medium-emphasis mt-1">シフトの代打・交代申請を管理します</p>
      </div>
    </div>

    <!-- Filter tabs -->
    <div class="d-flex align-center ga-2 mb-4 flex-wrap">
      <v-btn
        v-for="f in FILTERS"
        :key="f.value"
        :variant="activeFilter === f.value ? 'flat' : 'tonal'"
        :color="activeFilter === f.value ? 'primary' : 'default'"
        size="small"
        rounded="lg"
        @click="activeFilter = f.value"
      >
        {{ f.label }}
        <v-badge
          v-if="f.value === 'PENDING' && subStore.pendingRequests.length > 0"
          :content="subStore.pendingRequests.length"
          color="warning"
          inline
          class="ml-1"
        />
      </v-btn>
    </div>

    <v-row>
      <v-col cols="12">
        <v-card rounded="xl" elevation="0" border>
          <v-card-title class="pa-4 pb-2 text-subtitle-2 font-weight-bold">申請一覧</v-card-title>
          <v-card-text class="px-4 pb-4">

            <!-- Empty state -->
            <div v-if="filteredRequests.length === 0" class="d-flex flex-column align-center py-8 text-medium-emphasis">
              <v-icon size="40" class="mb-2">mdi-inbox-outline</v-icon>
              <span class="text-body-2">申請はありません</span>
            </div>

            <div v-else class="d-flex flex-column ga-3">
              <div
                v-for="req in filteredRequests"
                :key="req.id"
                class="req-row"
              >
                <!-- Left: type icon -->
                <v-icon
                  :color="req.type === 'SUBSTITUTE' ? 'primary' : 'warning'"
                  size="22"
                  class="mr-1 flex-shrink-0"
                >
                  {{ req.type === 'SUBSTITUTE' ? 'mdi-account-replace' : 'mdi-swap-horizontal-bold' }}
                </v-icon>

                <!-- Main info -->
                <div class="flex-1-1 min-width-0">
                  <div class="text-body-2 font-weight-medium">
                    {{ getEmployee(req.sourceEmployeeId)?.name ?? req.sourceEmployeeId }}
                    <span class="req-arrow">{{ req.type === 'SUBSTITUTE' ? '→' : '↔' }}</span>
                    {{ getEmployee(req.targetEmployeeId)?.name ?? req.targetEmployeeId }}
                    <span class="req-type-label">{{ req.type === 'SUBSTITUTE' ? '（代打）' : '（交代）' }}</span>
                  </div>
                  <div class="text-caption text-medium-emphasis mt-0.5">
                    {{ req.sourceDate }} ／ {{ req.sourceStartTime }}〜{{ req.sourceEndTime }}
                    · {{ req.sourceDepartment }}
                    <span v-if="req.reason" class="ml-2">・{{ req.reason }}</span>
                  </div>
                </div>

                <!-- Status + actions -->
                <div class="d-flex align-center ga-2 flex-shrink-0">
                  <v-chip
                    :color="statusColor(req.status)"
                    size="small"
                    variant="flat"
                  >
                    {{ statusLabel(req.status) }}
                  </v-chip>

                  <!-- Approve/Reject buttons for PENDING -->
                  <template v-if="req.status === 'PENDING'">
                    <v-btn
                      size="x-small"
                      color="success"
                      variant="tonal"
                      rounded="lg"
                      @click="approve(req.id)"
                    >
                      承認
                    </v-btn>
                    <v-btn
                      size="x-small"
                      color="error"
                      variant="tonal"
                      rounded="lg"
                      @click="reject(req.id)"
                    >
                      拒否
                    </v-btn>
                  </template>
                </div>
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script setup lang="ts">
import { useSubstitutionStore } from '~/stores/substitution.store'
import { useMockData } from '~/composables/useMockData'
import type { SubstitutionStatus } from '~/types'

const subStore = useSubstitutionStore()
const { getEmployee } = useMockData()

// ── Filter ──────────────────────────────────────────────────
type FilterValue = 'ALL' | 'SUBSTITUTE' | 'SWAP' | 'PENDING'

const FILTERS: Array<{ value: FilterValue; label: string }> = [
  { value: 'ALL',        label: '全て'   },
  { value: 'SUBSTITUTE', label: '代打'   },
  { value: 'SWAP',       label: '交代'   },
  { value: 'PENDING',    label: '処理待ち' },
]

const activeFilter = ref<FilterValue>('ALL')

const filteredRequests = computed(() => {
  const all = subStore.requests
  if (activeFilter.value === 'ALL')        return all
  if (activeFilter.value === 'SUBSTITUTE') return all.filter(r => r.type === 'SUBSTITUTE')
  if (activeFilter.value === 'SWAP')       return all.filter(r => r.type === 'SWAP')
  if (activeFilter.value === 'PENDING')    return all.filter(r => r.status === 'PENDING')
  return all
})

// ── Status helpers ──────────────────────────────────────────
function statusLabel(s: SubstitutionStatus): string {
  const map: Record<SubstitutionStatus, string> = {
    PENDING:   '承認待ち',
    ACCEPTED:  '承認済み',
    REJECTED:  '拒否',
    CANCELLED: 'キャンセル',
  }
  return map[s]
}

function statusColor(s: SubstitutionStatus): string {
  const map: Record<SubstitutionStatus, string> = {
    PENDING:   'warning',
    ACCEPTED:  'success',
    REJECTED:  'error',
    CANCELLED: 'default',
  }
  return map[s]
}

// ── Actions ─────────────────────────────────────────────────
function approve(id: string) {
  subStore.approveRequest(id)
}

function reject(id: string) {
  subStore.rejectRequest(id)
}
</script>

<style scoped>
.req-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid rgba(0,0,0,0.08);
  transition: background 0.1s;
}
.req-row:hover { background: rgba(0,0,0,0.02); }

.req-arrow {
  color: rgba(0,0,0,0.35);
  margin: 0 3px;
}

.req-type-label {
  font-size: 11px;
  color: rgba(0,0,0,0.45);
  font-weight: 400;
}
</style>
