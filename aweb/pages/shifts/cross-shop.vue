<template>
  <v-container fluid class="pa-6">
    <!-- Header -->
    <div class="d-flex align-center justify-space-between mb-6">
      <div>
        <h1 class="text-h5 font-weight-bold">他店舗応援</h1>
        <p class="text-body-2 text-medium-emphasis mt-1">応援依頼の送受信を管理します</p>
      </div>
      <v-btn
        v-if="activeTab === 0"
        color="primary"
        prepend-icon="mdi-plus"
        @click="createDialog = true"
      >
        応援を依頼する
      </v-btn>
    </div>

    <!-- Tabs -->
    <v-tabs v-model="activeTab" color="primary" class="mb-4">
      <v-tab :value="0">
        <v-icon start>mdi-store-plus-outline</v-icon>
        応援を依頼する
        <v-chip size="x-small" class="ml-2" color="primary" variant="tonal">{{ outgoing.length }}</v-chip>
      </v-tab>
      <v-tab :value="1">
        <v-icon start>mdi-store-check-outline</v-icon>
        応援を受ける
        <v-chip size="x-small" class="ml-2" color="secondary" variant="tonal">{{ incoming.length }}</v-chip>
      </v-tab>
    </v-tabs>

    <v-window v-model="activeTab">
      <!-- Tab 0: Outgoing requests -->
      <v-window-item :value="0">
        <div v-if="outgoing.length === 0" class="text-center pa-12 text-medium-emphasis">
          <v-icon size="48" class="mb-3">mdi-store-plus-outline</v-icon>
          <div>応援依頼はありません</div>
        </div>
        <v-row v-else>
          <v-col v-for="req in outgoing" :key="req.id" cols="12">
            <v-card border rounded="lg">
              <v-card-text class="pa-4">
                <!-- Header row -->
                <div class="d-flex align-start justify-space-between mb-3">
                  <div>
                    <div class="d-flex align-center ga-2 mb-1">
                      <v-icon size="16" color="medium-emphasis">mdi-calendar</v-icon>
                      <span class="text-body-2 font-weight-medium">{{ formatDate(req.date) }}</span>
                      <span class="text-body-2 text-medium-emphasis">{{ req.startTime }}〜{{ req.endTime }}</span>
                    </div>
                    <div class="d-flex align-center ga-2">
                      <v-chip size="x-small" variant="tonal" color="secondary">{{ req.department }}</v-chip>
                      <span class="text-body-2">{{ req.position }}</span>
                      <span class="text-body-2 text-medium-emphasis">
                        {{ req.securedCount }}/{{ req.requiredCount }}名確保
                      </span>
                    </div>
                  </div>
                  <v-chip :color="requestStatusColor(req.status)" size="small" variant="tonal">
                    {{ requestStatusLabel(req.status) }}
                  </v-chip>
                </div>

                <div v-if="req.note" class="text-caption text-medium-emphasis mb-3 pa-2 rounded" style="background: rgba(0,0,0,0.04)">
                  <v-icon size="12" class="mr-1">mdi-note-text-outline</v-icon>{{ req.note }}
                </div>

                <!-- Shop response sub-rows -->
                <div class="text-caption text-medium-emphasis mb-1 font-weight-medium">依頼先の状況</div>
                <div
                  v-for="resp in req.targetResponses"
                  :key="resp.shopId"
                  class="rounded mb-1 pa-2"
                  style="background: rgba(0,0,0,0.03)"
                >
                  <div class="d-flex align-center justify-space-between">
                    <div class="d-flex align-center ga-2">
                      <v-icon size="14" color="medium-emphasis">mdi-store-outline</v-icon>
                      <span class="text-body-2">{{ resp.shopName }}</span>
                    </div>
                    <v-chip :color="responseStatusColor(resp.status)" size="x-small" variant="tonal">
                      {{ responseStatusLabel(resp.status) }}
                    </v-chip>
                  </div>
                  <!-- Only show employee names when FULFILLED (確定) -->
                  <template v-if="resp.status === 'FULFILLED'">
                    <div
                      v-for="emp in confirmedFromShop(req, resp.shopId)"
                      :key="emp.id"
                      class="d-flex align-center ga-2 mt-1 ml-4"
                    >
                      <v-icon size="13" color="success">mdi-account-check</v-icon>
                      <span class="text-caption font-weight-medium">{{ emp.name }}</span>
                      <span class="text-caption text-medium-emphasis">{{ emp.department }} / {{ emp.position }}</span>
                      <v-spacer />
                      <span class="text-caption font-weight-medium" style="color: rgb(var(--v-theme-success))">
                        {{ fmtYen(shiftSalary(emp.hourlyWage ?? 0, req.startTime, req.endTime)) }}
                      </span>
                    </div>
                  </template>
                  <!-- FORWARDED: show how many candidates were proposed (not names) -->
                  <div v-else-if="resp.status === 'FORWARDED' && resp.proposedEmployees?.length" class="text-caption text-medium-emphasis mt-1 ml-4">
                    {{ resp.proposedEmployees.length }}名の候補者を提案中
                  </div>
                </div>

                <!-- Confirm button: shown when enough proposals to fill remaining slots -->
                <template v-if="hasEnoughProposals(req)">
                  <v-divider class="my-3" />
                  <v-btn
                    size="small"
                    color="success"
                    variant="tonal"
                    prepend-icon="mdi-check-circle-outline"
                    @click="toggleConfirming(req.id)"
                  >
                    担当者を確定する
                  </v-btn>

                  <v-expand-transition>
                    <div v-if="confirmingId === req.id" class="mt-3">
                      <div class="text-caption text-medium-emphasis mb-2 font-weight-medium">
                        候補者から {{ req.requiredCount - req.securedCount }}名を選択してください
                      </div>
                      <div class="d-flex flex-column ga-2 mb-3">
                        <div
                          v-for="candidate in allProposed(req)"
                          :key="`${candidate.shopId}:${candidate.id}`"
                          class="d-flex align-center ga-3 pa-2 rounded cursor-pointer candidate-row"
                          :class="confirmSelectedKeys.includes(`${candidate.shopId}:${candidate.id}`) ? 'candidate-selected' : ''"
                          @click="toggleConfirmEmployee(candidate.shopId, candidate.id)"
                        >
                          <v-icon size="18" :color="confirmSelectedKeys.includes(`${candidate.shopId}:${candidate.id}`) ? 'success' : 'medium-emphasis'">
                            {{ confirmSelectedKeys.includes(`${candidate.shopId}:${candidate.id}`) ? 'mdi-checkbox-marked-circle' : 'mdi-checkbox-blank-circle-outline' }}
                          </v-icon>
                          <div class="flex-grow-1">
                            <div class="text-body-2 font-weight-medium">{{ candidate.name }}</div>
                            <div class="d-flex align-center ga-1 mt-1">
                              <v-chip size="x-small" variant="tonal" color="secondary">{{ candidate.department }}</v-chip>
                              <span class="text-caption text-medium-emphasis">{{ candidate.position }}</span>
                              <span class="text-caption text-medium-emphasis">・{{ candidate.shopName }}</span>
                            </div>
                          </div>
                          <div class="text-right">
                            <div class="text-caption font-weight-medium">
                              {{ fmtYen(shiftSalary(candidate.hourlyWage ?? 0, req.startTime, req.endTime)) }}
                            </div>
                            <div class="text-caption text-medium-emphasis">推定給与</div>
                          </div>
                        </div>
                      </div>
                      <div class="text-caption text-medium-emphasis mb-2">
                        {{ confirmSelectedKeys.length }}名選択中 / {{ req.requiredCount - req.securedCount }}名必要
                      </div>
                      <div class="d-flex ga-2">
                        <v-btn
                          size="small"
                          color="success"
                          :disabled="confirmSelectedKeys.length === 0 || confirmSelectedKeys.length > req.requiredCount - req.securedCount"
                          @click="confirmRequest(req)"
                        >
                          確定する
                        </v-btn>
                        <v-btn size="small" variant="text" @click="toggleConfirming(null)">
                          キャンセル
                        </v-btn>
                      </div>
                    </div>
                  </v-expand-transition>
                </template>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-window-item>

      <!-- Tab 1: Incoming requests -->
      <v-window-item :value="1">
        <div v-if="incoming.length === 0" class="text-center pa-12 text-medium-emphasis">
          <v-icon size="48" class="mb-3">mdi-store-check-outline</v-icon>
          <div>応援依頼はありません</div>
        </div>
        <v-row v-else>
          <v-col v-for="req in incoming" :key="req.id" cols="12">
            <v-card border rounded="lg">
              <v-card-text class="pa-4">
                <!-- Header -->
                <div class="d-flex align-start justify-space-between mb-3">
                  <div>
                    <div class="d-flex align-center ga-2 mb-1">
                      <v-icon size="16" color="medium-emphasis">mdi-store-outline</v-icon>
                      <span class="text-body-2 font-weight-bold">{{ req.requestingShopName }}</span>
                      <span class="text-caption text-medium-emphasis">より応援依頼</span>
                    </div>
                    <div class="d-flex align-center ga-2 mb-1">
                      <v-icon size="16" color="medium-emphasis">mdi-calendar</v-icon>
                      <span class="text-body-2 font-weight-medium">{{ formatDate(req.date) }}</span>
                      <span class="text-body-2 text-medium-emphasis">{{ req.startTime }}〜{{ req.endTime }}</span>
                    </div>
                    <div class="d-flex align-center ga-2">
                      <v-chip size="x-small" variant="tonal" color="secondary">{{ req.department }}</v-chip>
                      <span class="text-body-2">{{ req.position }}</span>
                      <span class="text-body-2 text-medium-emphasis">{{ req.requiredCount }}名必要</span>
                    </div>
                  </div>
                  <v-chip
                    :color="responseStatusColor(myResponse(req)?.status ?? 'NEW')"
                    size="small"
                    variant="tonal"
                  >
                    {{ responseStatusLabel(myResponse(req)?.status ?? 'NEW') }}
                  </v-chip>
                </div>

                <div v-if="req.note" class="text-caption text-medium-emphasis mb-3 pa-2 rounded" style="background: rgba(0,0,0,0.04)">
                  <v-icon size="12" class="mr-1">mdi-note-text-outline</v-icon>{{ req.note }}
                </div>

                <!-- FORWARDED / FULFILLED: list proposed employees -->
                <template v-if="myResponse(req)?.status === 'FORWARDED' || myResponse(req)?.status === 'FULFILLED'">
                  <div class="text-caption text-medium-emphasis mb-1 font-weight-medium">
                    {{ myResponse(req)?.status === 'FULFILLED' ? '確定したスタッフ' : '提案したスタッフ' }}
                  </div>
                  <div
                    v-for="emp in myResponse(req)?.proposedEmployees ?? []"
                    :key="emp.id"
                    class="d-flex align-center ga-3 pa-2 rounded mb-1"
                    :style="myResponse(req)?.status === 'FULFILLED' ? 'background: rgba(76,175,80,0.08)' : 'background: rgba(33,150,243,0.08)'"
                  >
                    <v-icon size="16" :color="myResponse(req)?.status === 'FULFILLED' ? 'success' : 'info'">
                      mdi-account-check-outline
                    </v-icon>
                    <div class="flex-grow-1">
                      <div class="text-body-2 font-weight-medium">{{ emp.name }}</div>
                      <div class="d-flex align-center ga-1 mt-0">
                        <v-chip size="x-small" variant="tonal" color="secondary">{{ emp.department }}</v-chip>
                        <span class="text-caption text-medium-emphasis">{{ emp.position }}</span>
                      </div>
                    </div>
                    <div class="text-right">
                      <div class="text-caption font-weight-medium">
                        {{ fmtYen(shiftSalary(emp.hourlyWage ?? 0, req.startTime, req.endTime)) }}
                      </div>
                      <div class="text-caption text-medium-emphasis">推定給与</div>
                    </div>
                  </div>
                </template>

                <!-- DECLINED -->
                <div
                  v-else-if="myResponse(req)?.status === 'DECLINED'"
                  class="d-flex align-center ga-2 pa-2 rounded mb-2"
                  style="background: rgba(244,67,54,0.08)"
                >
                  <v-icon size="16" color="error">mdi-close-circle-outline</v-icon>
                  <span class="text-body-2 text-error">辞退しました</span>
                </div>

                <!-- NEW / REVIEWING: multi-select picker -->
                <template v-else-if="myResponse(req)?.status === 'NEW' || myResponse(req)?.status === 'REVIEWING'">
                  <div class="d-flex ga-2 mb-2">
                    <v-btn
                      size="small"
                      variant="tonal"
                      color="primary"
                      prepend-icon="mdi-account-search-outline"
                      @click="togglePicker(req.id)"
                    >
                      担当者を選ぶ
                    </v-btn>
                    <v-btn size="small" variant="outlined" color="error" @click="declineRequest(req)">
                      辞退する
                    </v-btn>
                  </div>

                  <v-expand-transition>
                    <div v-if="pickerOpenId === req.id" class="mt-2">
                      <v-divider class="mb-3" />
                      <div class="text-caption text-medium-emphasis mb-2 font-weight-medium">
                        スタッフを選択（複数可）
                      </div>

                      <!-- Employee cards -->
                      <div class="d-flex flex-column ga-2 mb-3">
                        <div
                          v-for="emp in employeesForDept(req.department)"
                          :key="emp.id"
                          class="d-flex align-center ga-3 pa-2 rounded cursor-pointer candidate-row"
                          :class="isPickerSelected(req.id, emp.id) ? 'candidate-selected' : ''"
                          @click="togglePickerEmployee(req.id, emp.id)"
                        >
                          <v-icon size="18" :color="isPickerSelected(req.id, emp.id) ? 'primary' : 'medium-emphasis'">
                            {{ isPickerSelected(req.id, emp.id) ? 'mdi-checkbox-marked-circle' : 'mdi-checkbox-blank-circle-outline' }}
                          </v-icon>
                          <div class="flex-grow-1">
                            <div class="text-body-2 font-weight-medium">{{ emp.name }}</div>
                            <div class="d-flex align-center ga-1 mt-1">
                              <v-chip size="x-small" variant="tonal" color="secondary">{{ emp.department }}</v-chip>
                              <span class="text-caption text-medium-emphasis">{{ emp.position }}</span>
                            </div>
                            <div class="d-flex align-center ga-2 mt-1">
                              <v-icon size="12" color="medium-emphasis">mdi-clock-outline</v-icon>
                              <span class="text-caption text-medium-emphasis">今月稼働 {{ empMonthlyHours(emp.id).toFixed(1) }}h</span>
                            </div>
                          </div>
                          <div class="text-right">
                            <div class="text-caption font-weight-medium">
                              {{ fmtYen(shiftSalary(emp.hourlyWage, req.startTime, req.endTime)) }}
                            </div>
                            <div class="text-caption text-medium-emphasis">推定給与</div>
                          </div>
                        </div>
                      </div>

                      <div class="text-caption text-medium-emphasis mb-2">
                        {{ (pickerSelectedIds[req.id] ?? []).length }}名選択中
                      </div>
                      <div class="d-flex ga-2">
                        <v-btn
                          size="small"
                          color="primary"
                          :disabled="(pickerSelectedIds[req.id] ?? []).length === 0"
                          @click="forwardRequest(req)"
                        >
                          転送する（{{ (pickerSelectedIds[req.id] ?? []).length }}名）
                        </v-btn>
                        <v-btn size="small" variant="text" @click="pickerOpenId = null">
                          キャンセル
                        </v-btn>
                      </div>
                    </div>
                  </v-expand-transition>
                </template>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-window-item>
    </v-window>

    <!-- Create dialog -->
    <v-dialog v-model="createDialog" max-width="560" persistent scrollable>
      <v-card rounded="lg">
        <v-card-title class="pa-4 pb-2 d-flex align-center ga-2">
          <v-icon color="primary">mdi-store-plus-outline</v-icon>
          <span class="text-h6">応援を依頼する</span>
        </v-card-title>
        <v-divider />

        <v-card-text class="pa-4" style="max-height: 72vh">
          <!-- Step 1: Board -->
          <div class="text-caption text-medium-emphasis font-weight-medium mb-1">
            <span class="text-primary font-weight-bold">1</span>　シフトボードを選択
          </div>
          <v-select
            v-model="form.boardId"
            :items="boardItems"
            item-title="name"
            item-value="id"
            label="シフトボード"
            density="compact"
            variant="outlined"
            hide-details="auto"
            class="mb-4"
            prepend-inner-icon="mdi-clipboard-text-outline"
          />

          <!-- Step 2: Date -->
          <template v-if="form.boardId">
            <div class="text-caption text-medium-emphasis font-weight-medium mb-1">
              <span class="text-primary font-weight-bold">2</span>　日付を選択
            </div>
            <v-select
              v-model="form.date"
              :items="availableDates"
              item-title="label"
              item-value="value"
              label="日付"
              density="compact"
              variant="outlined"
              hide-details="auto"
              class="mb-4"
              prepend-inner-icon="mdi-calendar"
              no-data-text="対象日程がありません"
            />
          </template>

          <!-- Step 3: Slot (allocation) -->
          <template v-if="form.date && slotsForDate.length">
            <div class="text-caption text-medium-emphasis font-weight-medium mb-2">
              <span class="text-primary font-weight-bold">3</span>　シフト枠を選択
            </div>
            <div class="d-flex flex-wrap ga-2 mb-4">
              <v-card
                v-for="slot in slotsForDate"
                :key="slot.id"
                :variant="form.slotId === slot.id ? 'tonal' : 'outlined'"
                :color="form.slotId === slot.id ? 'primary' : undefined"
                rounded="lg"
                class="pa-3 cursor-pointer slot-card"
                :style="form.slotId === slot.id ? '' : 'border-color: rgba(0,0,0,0.12)'"
                @click="selectSlot(slot.id)"
              >
                <div class="d-flex align-center ga-2">
                  <div
                    class="rounded-circle"
                    :style="`width:10px;height:10px;background:${slot.color};flex-shrink:0`"
                  />
                  <div>
                    <div class="text-body-2 font-weight-medium">{{ slot.label }}</div>
                    <div class="text-caption text-medium-emphasis">{{ slot.startTime }}〜{{ slot.endTime }}</div>
                  </div>
                </div>
              </v-card>
            </div>
          </template>

          <!-- Step 4: Department -->
          <template v-if="form.slotId && departmentsForSlot.length">
            <div class="text-caption text-medium-emphasis font-weight-medium mb-2">
              <span class="text-primary font-weight-bold">4</span>　部署を選択
            </div>
            <div class="d-flex flex-wrap ga-2 mb-4">
              <v-chip
                v-for="dept in departmentsForSlot"
                :key="dept"
                :color="form.department === dept ? 'primary' : undefined"
                :variant="form.department === dept ? 'tonal' : 'outlined'"
                class="cursor-pointer"
                @click="selectDepartment(dept)"
              >
                {{ dept }}
              </v-chip>
            </div>
          </template>

          <!-- Step 5: Position + Count -->
          <template v-if="form.department">
            <div class="text-caption text-medium-emphasis font-weight-medium mb-2">
              <span class="text-primary font-weight-bold">5</span>　ポジションと人数
            </div>
            <v-row dense class="mb-4">
              <v-col cols="8">
                <v-select
                  v-model="form.position"
                  :items="positionsForDept"
                  label="ポジション"
                  density="compact"
                  variant="outlined"
                  hide-details="auto"
                  prepend-inner-icon="mdi-badge-account-outline"
                />
              </v-col>
              <v-col cols="4">
                <v-text-field
                  v-model.number="form.requiredCount"
                  label="必要人数"
                  type="number"
                  min="1"
                  density="compact"
                  variant="outlined"
                  hide-details="auto"
                  suffix="名"
                />
              </v-col>
            </v-row>
          </template>

          <!-- Step 6: Target shops -->
          <template v-if="form.position">
            <div class="text-caption text-medium-emphasis font-weight-medium mb-1">
              <span class="text-primary font-weight-bold">6</span>　応援依頼先
            </div>
            <v-select
              v-model="form.targetShops"
              :items="otherShops"
              item-title="name"
              item-value="id"
              label="依頼先の店舗（複数選択可）"
              density="compact"
              variant="outlined"
              hide-details="auto"
              multiple
              chips
              closable-chips
              class="mb-4"
              prepend-inner-icon="mdi-store-outline"
            />
          </template>

          <!-- Step 7: Note -->
          <template v-if="form.targetShops.length > 0">
            <div class="text-caption text-medium-emphasis font-weight-medium mb-1">
              <span class="text-primary font-weight-bold">7</span>　メモ（任意）
            </div>
            <v-textarea
              v-model="form.note"
              label="依頼先へのメモ"
              density="compact"
              variant="outlined"
              hide-details="auto"
              rows="2"
              auto-grow
              prepend-inner-icon="mdi-note-text-outline"
            />
          </template>

          <!-- Summary preview -->
          <v-expand-transition>
            <v-alert
              v-if="isFormValid"
              type="info"
              variant="tonal"
              density="compact"
              class="mt-4"
              border="start"
            >
              <div class="text-body-2 font-weight-medium mb-1">依頼内容の確認</div>
              <div class="text-caption">
                {{ formatDate(form.date) }}　{{ form.startTime }}〜{{ form.endTime }}<br>
                {{ form.department }} / {{ form.position }}　{{ form.requiredCount }}名<br>
                依頼先: {{ form.targetShops.map(id => otherShops.find(s => s.id === id)?.name).join('・') }}
              </div>
            </v-alert>
          </v-expand-transition>
        </v-card-text>

        <v-divider />
        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn variant="text" @click="closeCreateDialog">キャンセル</v-btn>
          <v-btn color="primary" :disabled="!isFormValid" @click="submitRequest">依頼する</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
import type { CrossShopRequest, ConfirmedEmployee, ShiftSlot } from '~/types'

const { getOutgoingCrossShopRequests, getIncomingCrossShopRequests, employees, boards, currentBoard } = useMockData()

const outgoing = ref<CrossShopRequest[]>(getOutgoingCrossShopRequests())
const incoming = ref<CrossShopRequest[]>(getIncomingCrossShopRequests())
const activeTab = ref(0)
const createDialog = ref(false)

const otherShops = [
  { id: 'shop-shinjuku', name: '新宿店' },
  { id: 'shop-harajuku', name: '原宿店' },
  { id: 'shop-ikebukuro', name: '池袋店' },
]

// ── Salary / hours helpers ────────────────────────────────
function shiftSalary(hourlyWage: number, startTime: string, endTime: string): number {
  const [sh, sm] = startTime.split(':').map(Number)
  const [eh, em] = endTime.split(':').map(Number)
  const hours = (eh * 60 + em - (sh * 60 + sm)) / 60
  return Math.round(hourlyWage * hours)
}

function empMonthlyHours(empId: string): number {
  return currentBoard.entries
    .filter(e => e.employeeId === empId
      && e.cellStatus !== 'DAY_OFF_REQUESTED'
      && e.cellStatus !== 'DAY_OFF_CONFIRMED')
    .reduce((sum, e) => {
      const [sh, sm] = e.startTime.split(':').map(Number)
      const [eh, em] = e.endTime.split(':').map(Number)
      return sum + (eh * 60 + em - (sh * 60 + sm)) / 60
    }, 0)
}

function fmtYen(amount: number): string {
  return `¥${amount.toLocaleString()}`
}

// ── Shared helpers ────────────────────────────────────────
function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  return `${d.getMonth() + 1}月${d.getDate()}日（${'日月火水木金土'[d.getDay()]}）`
}

function requestStatusColor(status: string) {
  const map: Record<string, string> = { PENDING: 'warning', PARTIALLY_FILLED: 'info', FULFILLED: 'success', CANCELLED: 'default' }
  return map[status] ?? 'default'
}

function requestStatusLabel(status: string) {
  const map: Record<string, string> = { PENDING: '募集中', PARTIALLY_FILLED: '一部確保', FULFILLED: '完了', CANCELLED: 'キャンセル' }
  return map[status] ?? status
}

function responseStatusColor(status: string) {
  const map: Record<string, string> = { NEW: 'default', REVIEWING: 'warning', FORWARDED: 'info', FULFILLED: 'success', DECLINED: 'error' }
  return map[status] ?? 'default'
}

function responseStatusLabel(status: string) {
  const map: Record<string, string> = { NEW: '未対応', REVIEWING: '検討中', FORWARDED: '転送済み', FULFILLED: '確定', DECLINED: '辞退' }
  return map[status] ?? status
}

function myResponse(req: CrossShopRequest) {
  return req.targetResponses.find(r => r.shopId === 'shop-shibuya')
}

function employeesForDept(dept: string) {
  return employees.filter(e => e.department === dept && e.status === 'ACTIVE')
}

// ── Outgoing: confirmed employees per shop ────────────────
function confirmedFromShop(req: CrossShopRequest, shopId: string) {
  return (req.confirmedEmployees ?? []).filter(e => e.fromShopId === shopId)
}

// ── Outgoing: proposals pool + confirmation flow ──────────
interface Candidate extends ConfirmedEmployee { shopId: string, shopName: string }

function allProposed(req: CrossShopRequest): Candidate[] {
  return req.targetResponses
    .filter(r => r.status === 'FORWARDED')
    .flatMap(r => (r.proposedEmployees ?? []).map(emp => ({
      ...emp,
      fromShopId: r.shopId,
      fromShopName: r.shopName,
      shopId: r.shopId,
      shopName: r.shopName,
    })))
}

function hasEnoughProposals(req: CrossShopRequest) {
  if (req.status === 'FULFILLED') return false
  const remaining = req.requiredCount - req.securedCount
  return remaining > 0 && allProposed(req).length >= remaining
}

const confirmingId = ref<string | null>(null)
const confirmSelectedKeys = ref<string[]>([])

function toggleConfirming(id: string | null) {
  confirmingId.value = confirmingId.value === id ? null : id
  confirmSelectedKeys.value = []
}

function toggleConfirmEmployee(shopId: string, empId: string) {
  const key = `${shopId}:${empId}`
  const idx = confirmSelectedKeys.value.indexOf(key)
  if (idx >= 0) confirmSelectedKeys.value.splice(idx, 1)
  else confirmSelectedKeys.value.push(key)
}

function confirmRequest(req: CrossShopRequest) {
  const remaining = req.requiredCount - req.securedCount
  const keysToConfirm = confirmSelectedKeys.value.slice(0, remaining)

  if (!req.confirmedEmployees) req.confirmedEmployees = []

  for (const key of keysToConfirm) {
    const [shopId, empId] = key.split(':')
    const resp = req.targetResponses.find(r => r.shopId === shopId)
    const emp = resp?.proposedEmployees?.find(e => e.id === empId)
    if (emp && resp) {
      req.confirmedEmployees.push({
        ...emp,
        fromShopId: shopId,
        fromShopName: resp.shopName,
      })
    }
  }

  req.securedCount = req.confirmedEmployees.length

  // Update each FORWARDED response: FULFILLED if any selected, DECLINED otherwise
  for (const resp of req.targetResponses) {
    if (resp.status !== 'FORWARDED') continue
    const anyConfirmed = (resp.proposedEmployees ?? []).some(e =>
      keysToConfirm.includes(`${resp.shopId}:${e.id}`),
    )
    resp.status = anyConfirmed ? 'FULFILLED' : 'DECLINED'
  }

  req.status = req.securedCount >= req.requiredCount ? 'FULFILLED' : 'PARTIALLY_FILLED'

  confirmingId.value = null
  confirmSelectedKeys.value = []
}

// ── Incoming: multi-select picker ────────────────────────
const pickerOpenId = ref<string | null>(null)
const pickerSelectedIds = ref<Record<string, string[]>>({})

function togglePicker(reqId: string) {
  pickerOpenId.value = pickerOpenId.value === reqId ? null : reqId
  if (pickerOpenId.value && !pickerSelectedIds.value[reqId]) {
    pickerSelectedIds.value[reqId] = []
  }
}

function isPickerSelected(reqId: string, empId: string) {
  return (pickerSelectedIds.value[reqId] ?? []).includes(empId)
}

function togglePickerEmployee(reqId: string, empId: string) {
  if (!pickerSelectedIds.value[reqId]) pickerSelectedIds.value[reqId] = []
  const arr = pickerSelectedIds.value[reqId]
  const idx = arr.indexOf(empId)
  if (idx >= 0) arr.splice(idx, 1)
  else arr.push(empId)
}

function forwardRequest(req: CrossShopRequest) {
  const empIds = pickerSelectedIds.value[req.id] ?? []
  const resp = myResponse(req)
  if (resp && empIds.length > 0) {
    resp.proposedEmployees = empIds.map((id) => {
      const emp = employees.find(e => e.id === id)!
      return { id: emp.id, name: emp.name, department: emp.department, position: emp.position, hourlyWage: emp.hourlyWage }
    })
    resp.status = 'FORWARDED'
    resp.respondedAt = new Date().toISOString()
  }
  pickerOpenId.value = null
}

function declineRequest(req: CrossShopRequest) {
  const resp = myResponse(req)
  if (resp) resp.status = 'DECLINED'
}

// ── Create dialog: form + cascading selects ───────────────
const defaultForm = () => ({
  boardId: '',
  date: '',
  slotId: '',
  startTime: '',
  endTime: '',
  department: '',
  position: '',
  requiredCount: 1,
  targetShops: [] as string[],
  note: '',
})
const form = ref(defaultForm())

const boardItems = computed(() =>
  boards.filter(b => b.allocationSetup).map(b => ({ id: b.id, name: b.name })),
)

const selectedBoard = computed(() => boards.find(b => b.id === form.value.boardId))

const availableDates = computed(() => {
  const setup = selectedBoard.value?.allocationSetup
  if (!setup) return []
  return setup.assignments
    .filter(a => a.slotIds.length > 0)
    .map(a => ({ value: a.date, label: formatDate(a.date) }))
})

const slotsForDate = computed<ShiftSlot[]>(() => {
  const setup = selectedBoard.value?.allocationSetup
  if (!setup || !form.value.date) return []
  const assignment = setup.assignments.find(a => a.date === form.value.date)
  if (!assignment) return []
  return setup.slots.filter(s => assignment.slotIds.includes(s.id))
})

const selectedSlot = computed(() => slotsForDate.value.find(s => s.id === form.value.slotId))

const departmentsForSlot = computed(() =>
  selectedSlot.value?.departmentConfigs.map(dc => dc.department) ?? [],
)

const positionsForDept = computed(() => {
  const dc = selectedSlot.value?.departmentConfigs.find(d => d.department === form.value.department)
  return dc?.roleRequirements.map(r => r.role) ?? []
})

watch(() => form.value.boardId, () => {
  form.value.date = ''
  form.value.slotId = ''
  form.value.startTime = ''
  form.value.endTime = ''
  form.value.department = ''
  form.value.position = ''
})
watch(() => form.value.date, () => {
  form.value.slotId = ''
  form.value.startTime = ''
  form.value.endTime = ''
  form.value.department = ''
  form.value.position = ''
})
watch(() => form.value.slotId, (id) => {
  const slot = slotsForDate.value.find(s => s.id === id)
  form.value.startTime = slot?.startTime ?? ''
  form.value.endTime = slot?.endTime ?? ''
  form.value.department = ''
  form.value.position = ''
})
watch(() => form.value.department, () => { form.value.position = '' })

const isFormValid = computed(() =>
  form.value.boardId
  && form.value.date
  && form.value.slotId
  && form.value.department
  && form.value.position
  && form.value.requiredCount >= 1
  && form.value.targetShops.length > 0,
)

function selectSlot(id: string) { form.value.slotId = id }
function selectDepartment(dept: string) { form.value.department = dept }

function closeCreateDialog() {
  createDialog.value = false
  form.value = defaultForm()
}

function submitRequest() {
  const shopMap: Record<string, string> = {
    'shop-shinjuku': '新宿店',
    'shop-harajuku': '原宿店',
    'shop-ikebukuro': '池袋店',
  }
  outgoing.value.unshift({
    id: `csr-${Date.now()}`,
    boardId: form.value.boardId,
    requestingShopId: 'shop-shibuya',
    requestingShopName: '渋谷本店',
    date: form.value.date,
    startTime: form.value.startTime,
    endTime: form.value.endTime,
    department: form.value.department,
    position: form.value.position,
    requiredCount: form.value.requiredCount,
    securedCount: 0,
    status: 'PENDING',
    targetResponses: form.value.targetShops.map(shopId => ({
      shopId,
      shopName: shopMap[shopId] ?? shopId,
      status: 'NEW' as const,
    })),
    note: form.value.note || undefined,
    createdAt: new Date().toISOString(),
  })
  closeCreateDialog()
}
</script>

<style scoped>
.slot-card {
  cursor: pointer;
  transition: box-shadow 0.15s;
}
.slot-card:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
}
.candidate-row {
  border: 1px solid rgba(0, 0, 0, 0.08);
  transition: background 0.15s, border-color 0.15s;
}
.candidate-row:hover {
  background: rgba(0, 0, 0, 0.04);
}
.candidate-selected {
  background: rgba(76, 175, 80, 0.08) !important;
  border-color: rgba(76, 175, 80, 0.4) !important;
}
</style>
