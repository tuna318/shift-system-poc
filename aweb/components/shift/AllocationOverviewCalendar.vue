<template>
  <div class="alloc-cal" @selectstart.prevent>

    <!-- View toggle + week nav -->
    <div class="d-flex align-center justify-space-between mb-3">
      <v-btn-toggle v-model="view" mandatory density="compact" rounded="lg" color="primary">
        <v-btn value="month" size="small">月表示</v-btn>
        <v-btn value="week" size="small">週表示</v-btn>
      </v-btn-toggle>
      <div v-if="view === 'week'" class="d-flex align-center ga-1">
        <v-btn icon size="small" variant="text" :disabled="!canGoPrev" @click="prevWeek"><v-icon>mdi-chevron-left</v-icon></v-btn>
        <span class="text-body-2 font-weight-medium" style="min-width:140px;text-align:center">{{ weekLabel }}</span>
        <v-btn icon size="small" variant="text" :disabled="!canGoNext" @click="nextWeek"><v-icon>mdi-chevron-right</v-icon></v-btn>
      </div>
    </div>

    <!-- ═══ MONTHLY VIEW ══════════════════════════════════════ -->
    <template v-if="view === 'month'">
      <div class="d-flex flex-wrap align-center ga-4 mb-4">
        <div class="d-flex align-center ga-3">
          <span class="text-caption text-medium-emphasis font-weight-medium">スロット</span>
          <div v-for="slot in allocationSetup.slots" :key="slot.id" class="d-flex align-center ga-1">
            <span class="slot-dot" :style="{ background: slot.color }" />
            <span class="text-caption">{{ slot.label }}</span>
          </div>
        </div>
        <v-divider vertical style="height:16px" />
        <div class="d-flex align-center ga-3">
          <span class="text-caption text-medium-emphasis font-weight-medium">充足率（確定のみ）</span>
          <span class="cov-badge cov-ok text-caption">充足</span>
          <span class="cov-badge cov-short text-caption">不足</span>
          <span class="cov-badge cov-none text-caption">未配置</span>
        </div>
      </div>

      <div class="dow-header">
        <div v-for="(label, i) in DOW_LABELS" :key="label" class="dow-cell text-caption font-weight-medium" :class="i === 0 || i === 6 ? 'text-error' : 'text-medium-emphasis'">{{ label }}</div>
      </div>

      <template v-for="(week, wi) in weeks" :key="wi">
        <div v-if="monthLabel(week)" class="month-divider">
          <span class="text-caption font-weight-bold text-medium-emphasis">{{ monthLabel(week) }}</span>
        </div>
        <div class="cal-week">
          <div v-for="day in week" :key="day.date" class="cal-day" :class="{ 'cal-day--out': !day.inPeriod, 'cal-day--weekend': day.isWeekend && day.inPeriod, 'cal-day--today': day.isToday }">
            <div class="date-num text-caption font-weight-bold" :class="{ 'text-error': day.isWeekend && day.inPeriod, 'date-num--today': day.isToday, 'text-disabled': !day.inPeriod }">{{ day.dayNum }}</div>
            <template v-if="day.inPeriod">
              <div class="day-slots">
                <div v-for="slot in getDaySlots(day.date)" :key="slot.id" class="slot-row">
                  <span class="slot-dot" :style="{ background: slot.color }" />
                  <span class="slot-name">{{ slot.label }}</span>
                  <span class="slot-time">{{ slot.startTime }}–{{ slot.endTime }}</span>
                  <span class="slot-cov" :class="covClass(day.date, slot)">{{ covText(day.date, slot) }}</span>
                </div>
                <div v-if="getDaySlots(day.date).length === 0" class="no-slot-row"><span class="text-disabled" style="font-size:10px">配置なし</span></div>
              </div>
            </template>
          </div>
        </div>
      </template>
    </template>

    <!-- ═══ WEEKLY VIEW ═══════════════════════════════════════ -->
    <template v-else>
      <div class="cal-frame">
        <div class="cal-header">
          <div class="time-gutter" />
          <div v-for="(day, i) in weekDays" :key="day.date" class="day-header-cell" :class="{ 'day-header-cell--out': !day.inPeriod, 'day-header-cell--today': day.isToday }">
            <div class="text-caption" :class="day.isWeekend ? 'text-error' : 'text-medium-emphasis'">{{ DOW_LABELS[i] }}</div>
            <div class="text-body-2 font-weight-bold" :class="{ 'text-error': day.isWeekend, 'text-disabled': !day.inPeriod }">{{ day.monthDay }}</div>
          </div>
        </div>
        <div ref="scrollRef" class="cal-scroll">
          <div class="cal-body">
            <div class="time-gutter" style="position:relative">
              <div :style="{ height: `${TOTAL_HEIGHT}px` }" />
              <div v-for="h in hourMarkers" :key="h" class="hour-label" :style="{ top: `${(h - START_HOUR) * HOUR_PX - 8}px` }">{{ String(h).padStart(2, '0') }}:00</div>
            </div>
            <div v-for="day in weekDays" :key="day.date" class="day-col" :class="{ 'day-col--out': !day.inPeriod, 'day-col--today': day.isToday }" :style="{ height: `${TOTAL_HEIGHT}px` }">
              <template v-for="h in hourMarkers" :key="h">
                <div class="hour-line" :style="{ top: `${(h - START_HOUR) * HOUR_PX}px` }" />
                <div class="half-line" :style="{ top: `${(h - START_HOUR) * HOUR_PX + HOUR_PX / 2}px` }" />
              </template>
              <template v-if="day.inPeriod">
                <div v-for="slot in getDaySlots(day.date)" :key="slot.id" class="slot-block" :style="getSlotBlockStyle(slot)" @click="openDetail(day.date, slot)">
                  <div class="sb-label">{{ slot.label }}</div>
                  <div class="sb-time">{{ slot.startTime }}–{{ slot.endTime }}</div>
                  <template v-for="dept in getSlotBreakdown(day.date, slot).departments" :key="dept.department">
                    <div class="sb-dept-block">
                      <div class="sb-dept-header">
                        <span class="sb-dept-name">{{ dept.department }}</span>
                        <div class="sb-dept-counts">
                          <span class="sb-count-confirmed">✓{{ dept.confirmed }}</span>
                          <span v-if="dept.pending > 0" class="sb-count-pending"> →{{ dept.pending }}</span>
                          <span v-if="dept.adjusting > 0" class="sb-count-adjusting"> ⚠{{ dept.adjusting }}</span>
                          <span class="sb-count-required">/{{ dept.required }}</span>
                        </div>
                      </div>
                      <div v-for="emp in dept.topEmployees" :key="emp.entry.id" class="sb-emp-row">
                        <span class="sb-emp-icon" :class="`icon-${emp.entry.cellStatus}`">{{ statusIcon(emp.entry.cellStatus) }}</span>
                        <span class="sb-emp-name">{{ emp.name }}</span>
                      </div>
                      <div v-if="dept.hiddenCount > 0" class="sb-more">+{{ dept.hiddenCount }}名</div>
                    </div>
                  </template>
                  <div class="sb-hint">クリックで詳細・変更</div>
                </div>
              </template>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- ═══ DETAIL DIALOG ════════════════════════════════════ -->
    <v-dialog v-model="detailDialog.show" max-width="600" scrollable>
      <v-card v-if="detailDialog.slot" rounded="xl">
        <!-- Colored header -->
        <div class="detail-header" :style="{ background: detailDialog.slot.color }">
          <div class="d-flex align-center justify-space-between">
            <div>
              <div class="text-h6 font-weight-bold" style="color:white">{{ detailDialog.slot.label }}</div>
              <div style="color:rgba(255,255,255,.82);font-size:13px">{{ formatDetailDate(detailDialog.date) }}　{{ detailDialog.slot.startTime }}–{{ detailDialog.slot.endTime }}</div>
            </div>
            <v-btn icon size="small" variant="text" style="color:white" @click="closeDetail"><v-icon>mdi-close</v-icon></v-btn>
          </div>
          <!-- Coverage stats -->
          <div class="d-flex align-center ga-3 mt-3 flex-wrap">
            <div v-for="stat in detailBreakdown?.coverageStats ?? []" :key="stat.department" class="d-flex align-center ga-1">
              <span style="color:rgba(255,255,255,.65);font-size:11px">{{ stat.department }}</span>
              <span class="detail-cov-chip" :class="stat.confirmed >= stat.required ? 'cov-chip--ok' : 'cov-chip--short'">確定 {{ stat.confirmed }}/{{ stat.required }}</span>
              <span v-if="stat.adjusting > 0" class="detail-cov-chip cov-chip--adjusting">調整中 {{ stat.adjusting }}</span>
              <span v-if="stat.pending > 0" class="detail-cov-chip cov-chip--pending">申請 {{ stat.pending }}</span>
            </div>
          </div>
        </div>

        <v-card-text class="pa-0" style="max-height:72vh">
          <div v-if="boardStatus === 'PUBLISHED'" class="mx-4 mt-3">
            <v-alert type="info" variant="tonal" density="compact" icon="mdi-lock-outline">確定済みのステータスはボード公開後は変更できません。</v-alert>
          </div>

          <div class="pa-4">
            <div v-for="dept in detailBreakdown?.departments ?? []" :key="dept.department" class="mb-5">
              <!-- Dept header -->
              <div class="d-flex align-center ga-2 mb-3">
                <span class="text-subtitle-2 font-weight-bold">{{ dept.department }}</span>
                <v-chip :color="dept.confirmed >= dept.required ? 'success' : 'warning'" size="x-small" variant="flat">確定 {{ dept.confirmed }}/{{ dept.required }}名</v-chip>
                <v-chip v-if="dept.adjusting > 0" color="warning" size="x-small" variant="tonal">調整中 {{ dept.adjusting }}名</v-chip>
                <v-chip v-if="dept.pending > 0" color="info" size="x-small" variant="tonal">申請中 {{ dept.pending }}名</v-chip>
              </div>

              <div v-for="role in dept.roles" :key="role.role" class="role-section mb-3">
                <div class="role-title mb-2">
                  <span class="text-caption font-weight-medium text-medium-emphasis">{{ role.role }}（{{ role.required }}名必要・確定 {{ role.confirmedCount }}名）</span>
                  <v-btn
                    size="x-small" color="primary" variant="text" rounded="lg"
                    prepend-icon="mdi-account-plus-outline"
                    @click="addExtraSlot(dept.department, role.role)"
                  >
                    + シフトを追加
                  </v-btn>
                </div>

                <!-- ── Employee rows ── -->
                <template v-for="emp in role.employees" :key="emp.entry.id">
                  <!-- Main row -->
                  <div class="emp-row" :class="{ 'emp-row--active': activeEntryId === emp.entry.id }">
                    <div class="emp-row-info">
                      <StatusChip :status="emp.entry.cellStatus" />
                      <span class="text-body-2 ml-2 font-weight-medium">{{ emp.name }}</span>
                      <span v-if="emp.entry.managerRequested" class="ml-2">
                        <v-chip size="x-small" color="purple" variant="tonal">マネージャー依頼</v-chip>
                      </span>
                    </div>
                    <div class="emp-row-actions">
                      <!-- SHIFT_REQUESTED -->
                      <template v-if="emp.entry.cellStatus === 'SHIFT_REQUESTED'">
                        <v-btn size="x-small" color="primary" variant="flat" rounded="lg" @click="quickConfirm(emp.entry, 'CONFIRMED')">シフト確定</v-btn>
                        <v-btn size="x-small" color="warning" variant="tonal" rounded="lg" class="ml-1" @click="toggleAdjust(emp.entry)">調整依頼…</v-btn>
                      </template>
                      <!-- DAY_OFF_REQUESTED -->
                      <template v-else-if="emp.entry.cellStatus === 'DAY_OFF_REQUESTED'">
                        <v-btn size="x-small" color="default" variant="flat" rounded="lg" @click="quickConfirm(emp.entry, 'DAY_OFF_CONFIRMED')">休み確定</v-btn>
                        <v-btn size="x-small" color="warning" variant="tonal" rounded="lg" class="ml-1" @click="toggleAdjust(emp.entry)">調整依頼…</v-btn>
                      </template>
                      <!-- ADJUSTING — final resolution buttons -->
                      <template v-else-if="emp.entry.cellStatus === 'ADJUSTING'">
                        <v-btn size="x-small" color="primary" variant="flat" rounded="lg" @click="shiftStore.finalizeAdjustment(emp.entry.id, 'CONFIRMED')">シフト確定</v-btn>
                        <v-btn size="x-small" color="default" variant="tonal" rounded="lg" class="ml-1" @click="shiftStore.finalizeAdjustment(emp.entry.id, 'DAY_OFF_CONFIRMED')">休み確定</v-btn>
                      </template>
                      <!-- DAY_OFF_CONFIRMED: allow urgent adjustment + revert if DRAFT -->
                      <template v-else-if="emp.entry.cellStatus === 'DAY_OFF_CONFIRMED' && boardStatus === 'DRAFT'">
                        <v-btn size="x-small" color="warning" variant="tonal" rounded="lg" @click="toggleAdjust(emp.entry)">調整依頼…</v-btn>
                        <v-btn size="x-small" color="error" variant="text" rounded="lg" class="ml-1" @click="toggleRevert(emp.entry)">取り消し</v-btn>
                      </template>
                      <!-- CONFIRMED: revert if DRAFT -->
                      <template v-else-if="emp.entry.cellStatus === 'CONFIRMED' && boardStatus === 'DRAFT'">
                        <v-btn size="x-small" color="error" variant="text" rounded="lg" @click="toggleRevert(emp.entry)">取り消し</v-btn>
                      </template>
                      <!-- PUBLISHED + confirmed -->
                      <template v-else-if="boardStatus === 'PUBLISHED'">
                        <span class="text-caption text-medium-emphasis">確定済</span>
                      </template>
                    </div>
                  </div>

                  <!-- ──── ADJUSTING: negotiation card ──── -->
                  <v-expand-transition>
                    <div v-if="emp.entry.cellStatus === 'ADJUSTING'" class="negotiation-card">
                      <!-- Before / After -->
                      <div class="d-flex align-items-center ga-2 mb-3">
                        <div class="nego-side">
                          <div class="nego-side-label">スタッフの希望</div>
                          <StatusChip :status="emp.entry.preAdjustStatus ?? 'SHIFT_REQUESTED'" />
                        </div>
                        <v-icon size="20" color="warning" class="mx-1">mdi-arrow-right-bold</v-icon>
                        <div class="nego-side">
                          <div class="nego-side-label">マネージャーの要望</div>
                          <StatusChip :status="(emp.entry.preAdjustStatus === 'DAY_OFF_REQUESTED' || emp.entry.preAdjustStatus === 'DAY_OFF_CONFIRMED') ? 'CONFIRMED' : 'DAY_OFF_CONFIRMED'" />
                        </div>
                        <v-spacer />
                        <!-- Response badge -->
                        <div class="response-badge" :class="`response-badge--${emp.entry.adjustingResponseStatus ?? 'PENDING'}`">
                          <v-icon size="13">{{ responseIcon(emp.entry.adjustingResponseStatus) }}</v-icon>
                          {{ responseLabel(emp.entry.adjustingResponseStatus) }}
                        </div>
                      </div>

                      <!-- Message thread -->
                      <div class="message-thread">
                        <!-- Manager message -->
                        <div class="message-bubble message-bubble--manager">
                          <div class="message-sender">
                            <v-icon size="13">mdi-briefcase-outline</v-icon> マネージャー
                          </div>
                          <div class="message-body">{{ emp.entry.adjustingReason ?? '調整を依頼しています。' }}</div>
                        </div>

                        <!-- Employee reply -->
                        <div v-if="emp.entry.adjustingResponse" class="message-bubble message-bubble--employee">
                          <div class="message-sender">
                            <v-icon size="13">mdi-account-outline</v-icon> {{ emp.name }}
                          </div>
                          <div class="message-body">{{ emp.entry.adjustingResponse }}</div>
                        </div>
                        <div v-else class="message-waiting">
                          <v-icon size="13" color="medium-emphasis">mdi-clock-outline</v-icon>
                          <span class="text-caption text-medium-emphasis">スタッフの返答待ち...</span>
                        </div>
                      </div>
                    </div>
                  </v-expand-transition>

                  <!-- ──── Inline: Adjustment form ──── -->
                  <v-expand-transition>
                    <div v-if="adjustState.entryId === emp.entry.id && adjustState.mode === 'adjust'" class="inline-panel inline-panel--warn">
                      <div class="d-flex align-center ga-2 mb-2">
                        <v-icon size="15" color="warning">mdi-cellphone-message</v-icon>
                        <span class="text-caption font-weight-medium" style="color:#92400e">スタッフのデバイスに通知が送信されます</span>
                      </div>
                      <div class="text-caption text-medium-emphasis mb-2">
                        <template v-if="emp.entry.cellStatus === 'DAY_OFF_REQUESTED' || emp.entry.cellStatus === 'DAY_OFF_CONFIRMED'">休みの予定を変更し、出勤をお願いする理由を入力してください。</template>
                        <template v-else>シフト希望を承認できない理由と、調整内容を入力してください。</template>
                      </div>
                      <v-textarea v-model="adjustState.reason" label="従業員へのメッセージ（必須）" auto-grow rows="2" max-rows="4" density="compact" variant="outlined" rounded="lg" hide-details="auto" class="mb-3" placeholder="例：〇日は人員が不足しているため、ご出勤をお願いできますか？" />
                      <div class="d-flex justify-end ga-2">
                        <v-btn size="small" variant="text" @click="clearState">キャンセル</v-btn>
                        <v-btn size="small" color="warning" variant="flat" rounded="lg" prepend-icon="mdi-send-outline" :disabled="!adjustState.reason.trim()" @click="submitAdjustment(emp.entry)">送信して調整中にする</v-btn>
                      </div>
                    </div>
                  </v-expand-transition>

                  <!-- ──── Inline: Revert confirm ──── -->
                  <v-expand-transition>
                    <div v-if="adjustState.entryId === emp.entry.id && adjustState.mode === 'revert'" class="inline-panel inline-panel--error">
                      <div class="d-flex align-center ga-2 mb-2">
                        <v-icon size="15" color="error">mdi-undo-variant</v-icon>
                        <span class="text-caption font-weight-medium" style="color:#b91c1c">確定を取り消しますか？</span>
                      </div>
                      <div class="text-caption text-medium-emphasis mb-3">「{{ revertTargetLabel(emp.entry) }}」に戻します。この操作は取り消せます。</div>
                      <div class="d-flex justify-end ga-2">
                        <v-btn size="small" variant="text" @click="clearState">キャンセル</v-btn>
                        <v-btn size="small" color="error" variant="flat" rounded="lg" @click="confirmRevert(emp.entry)">取り消す</v-btn>
                      </div>
                    </div>
                  </v-expand-transition>
                </template>

                <!-- ── Required unfilled rows (disappear naturally as workingCount rises) ── -->
                <template v-for="n in Math.max(role.required - role.workingCount, 0)" :key="`req-${n}`">
                  <div class="emp-row emp-row--empty">
                    <div class="emp-row-info">
                      <span class="unfilled-badge">未割当</span>
                    </div>
                    <v-btn size="x-small" color="primary" variant="tonal" rounded="lg" prepend-icon="mdi-account-plus-outline"
                      @click="toggleRequestPanel(dept.department, role.role, detailDialog.date, detailDialog.slot!, `req-${n}`)">
                      スタッフを招集
                    </v-btn>
                  </div>
                  <v-expand-transition>
                    <div v-if="requestPanel?.rowKey === `req-${n}` && requestPanel?.dept === dept.department && requestPanel?.role === role.role" class="inline-panel inline-panel--request">
                      <div class="d-flex align-center ga-2 mb-2">
                        <v-icon size="15" color="primary">mdi-send-outline</v-icon>
                        <span class="text-caption font-weight-medium">シフト依頼を送るスタッフを選択</span>
                        <span class="text-caption text-medium-emphasis">（複数選択可）</span>
                      </div>
                      <div v-if="availableForRequest(dept.department, role.role, detailDialog.date, detailDialog.slot!).length === 0" class="text-caption text-medium-emphasis pa-2">対象のスタッフが見つかりません</div>
                      <div v-else class="request-emp-list mb-3">
                        <div v-for="candidate in availableForRequest(dept.department, role.role, detailDialog.date, detailDialog.slot!)" :key="candidate.id"
                          class="request-emp-row" :class="{ 'request-emp-row--selected': requestPanel.selectedIds.includes(candidate.id) }"
                          @click="toggleRequestSelection(candidate.id)">
                          <v-checkbox-btn :model-value="requestPanel.selectedIds.includes(candidate.id)" density="compact" color="primary" hide-details @click.stop="toggleRequestSelection(candidate.id)" />
                          <div class="flex-1-1">
                            <div class="text-body-2 font-weight-medium">{{ candidate.name }}</div>
                            <div class="text-caption text-medium-emphasis">{{ candidate.position }} · ¥{{ candidate.hourlyWage.toLocaleString() }}/h</div>
                          </div>
                        </div>
                      </div>
                      <div class="d-flex justify-space-between align-center">
                        <span class="text-caption text-medium-emphasis">{{ requestPanel.selectedIds.length }}名選択中</span>
                        <div class="d-flex ga-2">
                          <v-btn size="small" variant="text" @click="clearState">キャンセル</v-btn>
                          <v-btn size="small" color="primary" variant="flat" rounded="lg" prepend-icon="mdi-send-outline" :disabled="requestPanel.selectedIds.length === 0"
                            @click="submitDirectRequest(dept.department, role.role, detailDialog.date, detailDialog.slot!)">
                            依頼を送信（{{ requestPanel.selectedIds.length }}名）
                          </v-btn>
                        </div>
                      </div>
                    </div>
                  </v-expand-transition>
                </template>

                <!-- ── Extra rows (manager-added, each independently removable) ── -->
                <template v-for="extraId in getExtraSlotIds(dept.department, role.role)" :key="extraId">
                  <div class="emp-row emp-row--empty">
                    <div class="emp-row-info">
                      <span class="unfilled-badge">未割当</span>
                      <v-btn icon size="x-small" variant="text" class="ml-1" @click="removeExtraSlot(dept.department, role.role, extraId)">
                        <v-icon size="14" color="medium-emphasis">mdi-close</v-icon>
                      </v-btn>
                    </div>
                    <v-btn size="x-small" color="primary" variant="tonal" rounded="lg" prepend-icon="mdi-account-plus-outline"
                      @click="toggleRequestPanel(dept.department, role.role, detailDialog.date, detailDialog.slot!, extraId)">
                      スタッフを招集
                    </v-btn>
                  </div>
                  <v-expand-transition>
                    <div v-if="requestPanel?.rowKey === extraId && requestPanel?.dept === dept.department && requestPanel?.role === role.role" class="inline-panel inline-panel--request">
                      <div class="d-flex align-center ga-2 mb-2">
                        <v-icon size="15" color="primary">mdi-send-outline</v-icon>
                        <span class="text-caption font-weight-medium">シフト依頼を送るスタッフを選択</span>
                        <span class="text-caption text-medium-emphasis">（複数選択可）</span>
                      </div>
                      <div v-if="availableForRequest(dept.department, role.role, detailDialog.date, detailDialog.slot!).length === 0" class="text-caption text-medium-emphasis pa-2">対象のスタッフが見つかりません</div>
                      <div v-else class="request-emp-list mb-3">
                        <div v-for="candidate in availableForRequest(dept.department, role.role, detailDialog.date, detailDialog.slot!)" :key="candidate.id"
                          class="request-emp-row" :class="{ 'request-emp-row--selected': requestPanel.selectedIds.includes(candidate.id) }"
                          @click="toggleRequestSelection(candidate.id)">
                          <v-checkbox-btn :model-value="requestPanel.selectedIds.includes(candidate.id)" density="compact" color="primary" hide-details @click.stop="toggleRequestSelection(candidate.id)" />
                          <div class="flex-1-1">
                            <div class="text-body-2 font-weight-medium">{{ candidate.name }}</div>
                            <div class="text-caption text-medium-emphasis">{{ candidate.position }} · ¥{{ candidate.hourlyWage.toLocaleString() }}/h</div>
                          </div>
                        </div>
                      </div>
                      <div class="d-flex justify-space-between align-center">
                        <span class="text-caption text-medium-emphasis">{{ requestPanel.selectedIds.length }}名選択中</span>
                        <div class="d-flex ga-2">
                          <v-btn size="small" variant="text" @click="clearState">キャンセル</v-btn>
                          <v-btn size="small" color="primary" variant="flat" rounded="lg" prepend-icon="mdi-send-outline" :disabled="requestPanel.selectedIds.length === 0"
                            @click="submitDirectRequest(dept.department, role.role, detailDialog.date, detailDialog.slot!)">
                            依頼を送信（{{ requestPanel.selectedIds.length }}名）
                          </v-btn>
                        </div>
                      </div>
                    </div>
                  </v-expand-transition>
                </template>
              </div>
            </div>
          </div>
        </v-card-text>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import type { AllocationSetup, ShiftSlot, ShiftEntry, CellStatus, AdjustingResponseStatus, Employee } from '~/types'
import { useMockData } from '~/composables/useMockData'
import { useShiftStore } from '~/stores/shift.store'

const props = defineProps<{
  periodStart: string
  periodEnd: string
  allocationSetup: AllocationSetup
  entries: ShiftEntry[]
}>()

const { getEmployee, employees: allEmployees } = useMockData()
const shiftStore = useShiftStore()
const boardStatus = computed(() => shiftStore.currentBoard?.status ?? 'DRAFT')

const START_HOUR = 6
const END_HOUR = 23
const HOUR_PX = 60
const TOTAL_HEIGHT = (END_HOUR - START_HOUR) * HOUR_PX
const hourMarkers = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i)
const DOW_LABELS = ['日', '月', '火', '水', '木', '金', '土']
const todayStr = '2026-03-15'
const MAX_COMPACT = 3

const view = ref<'month' | 'week'>('month')

// ─── Status display ───────────────────────────────────────────
function statusIcon(s: CellStatus): string {
  return { CONFIRMED: '✓', SHIFT_REQUESTED: '→', DAY_OFF_REQUESTED: '✕', DAY_OFF_CONFIRMED: '✕', ADJUSTING: '⚠' }[s] ?? '?'
}

function responseIcon(s?: AdjustingResponseStatus): string {
  if (s === 'ACCEPTED') return 'mdi-check-circle'
  if (s === 'REJECTED') return 'mdi-close-circle'
  return 'mdi-clock-outline'
}
function responseLabel(s?: AdjustingResponseStatus): string {
  if (s === 'ACCEPTED') return '承諾'
  if (s === 'REJECTED') return '拒否'
  return '返答待ち'
}

// ─── Slot helpers ──────────────────────────────────────────────
const slotMap = computed(() => {
  const m = new Map<string, ShiftSlot>()
  for (const s of props.allocationSetup.slots) m.set(s.id, s)
  return m
})

function getDaySlots(date: string): ShiftSlot[] {
  const asgn = props.allocationSetup.assignments.find(a => a.date === date)
  if (!asgn) return []
  return asgn.slotIds.flatMap(id => slotMap.value.get(id) ? [slotMap.value.get(id)!] : [])
}

function timeToMin(t: string): number {
  const [h, m] = t.split(':').map(Number); return h * 60 + m
}
function timeToY(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return ((h - START_HOUR) * 60 + m) * (HOUR_PX / 60)
}

function getSlotEntries(date: string, slot: ShiftSlot) {
  const slotStart = timeToMin(slot.startTime)
  const slotEnd = timeToMin(slot.endTime)
  return props.entries.filter(e =>
    e.shiftDate === date
    && timeToMin(e.startTime) < slotEnd
    && timeToMin(e.endTime) > slotStart,
  )
}

function covClass(date: string, slot: ShiftSlot): string {
  const req = slot.departmentConfigs.reduce((s, dc) => s + dc.roleRequirements.reduce((a, r) => a + r.count, 0), 0)
  const conf = getSlotEntries(date, slot).filter(e => e.cellStatus === 'CONFIRMED').length
  if (req === 0) return ''; if (conf === 0) return 'cov-none'
  return conf >= req ? 'cov-ok' : 'cov-short'
}
function covText(date: string, slot: ShiftSlot): string {
  const req = slot.departmentConfigs.reduce((s, dc) => s + dc.roleRequirements.reduce((a, r) => a + r.count, 0), 0)
  const conf = getSlotEntries(date, slot).filter(e => e.cellStatus === 'CONFIRMED').length
  return `${conf}/${req}`
}

// ─── Breakdown ────────────────────────────────────────────────
interface EmpInfo { entry: ShiftEntry; name: string }
interface RoleInfo { role: string; required: number; employees: EmpInfo[]; confirmedCount: number; workingCount: number }
interface DeptBreakdown { department: string; confirmed: number; pending: number; adjusting: number; required: number; roles: RoleInfo[]; topEmployees: EmpInfo[]; hiddenCount: number }
interface CoverageStat { department: string; confirmed: number; pending: number; adjusting: number; required: number }
interface Breakdown { departments: DeptBreakdown[]; coverageStats: CoverageStat[] }

function getSlotBreakdown(date: string, slot: ShiftSlot): Breakdown {
  const overlapping = getSlotEntries(date, slot)
  const departments: DeptBreakdown[] = []
  const coverageStats: CoverageStat[] = []

  for (const dc of slot.departmentConfigs) {
    const deptEntries = overlapping.filter(e => e.department === dc.department)
    const required = dc.roleRequirements.reduce((s, r) => s + r.count, 0)
    const confirmed = deptEntries.filter(e => e.cellStatus === 'CONFIRMED').length
    const pending = deptEntries.filter(e => e.cellStatus === 'SHIFT_REQUESTED').length
    const adjusting = deptEntries.filter(e => e.cellStatus === 'ADJUSTING').length

    const roles: RoleInfo[] = dc.roleRequirements.map((rr) => {
      const roleEmps = deptEntries
        .filter(e => getEmployee(e.employeeId)?.position === rr.role)
        .map(e => ({ entry: e, name: getEmployee(e.employeeId)?.name ?? e.employeeId }))
      const confirmedCount = roleEmps.filter(e => e.entry.cellStatus === 'CONFIRMED').length
      const workingCount = roleEmps.filter(e => ['CONFIRMED', 'SHIFT_REQUESTED', 'ADJUSTING'].includes(e.entry.cellStatus)).length
      return { role: rr.role, required: rr.count, employees: roleEmps, confirmedCount, workingCount }
    })

    const allEmps = roles.flatMap(r => r.employees)
    departments.push({ department: dc.department, confirmed, pending, adjusting, required, roles, topEmployees: allEmps.slice(0, MAX_COMPACT), hiddenCount: Math.max(allEmps.length - MAX_COMPACT, 0) })
    coverageStats.push({ department: dc.department, confirmed, pending, adjusting, required })
  }
  return { departments, coverageStats }
}

function getSlotBlockStyle(slot: ShiftSlot): Record<string, string | number> {
  const top = timeToY(slot.startTime)
  return { top: `${top}px`, height: `${Math.max(timeToY(slot.endTime) - top, 40)}px`, background: slot.color }
}

// ─── Detail dialog ────────────────────────────────────────────
const detailDialog = ref<{ show: boolean; date: string; slot: ShiftSlot | null }>({ show: false, date: '', slot: null })
const detailBreakdown = computed(() => detailDialog.value.slot ? getSlotBreakdown(detailDialog.value.date, detailDialog.value.slot) : null)

// Inline panel state — shared; only one panel open at a time
const adjustState = reactive<{ entryId: string | null; mode: 'adjust' | 'revert' | null; reason: string }>({
  entryId: null, mode: null, reason: '',
})
const activeEntryId = computed(() => adjustState.entryId)

interface RequestPanelState { dept: string; role: string; date: string; slotId: string; selectedIds: string[]; rowKey: string }
const requestPanel = ref<RequestPanelState | null>(null)

function openDetail(date: string, slot: ShiftSlot) {
  clearState()
  extraSlots.value = {}
  detailDialog.value = { show: true, date, slot }
}
function closeDetail() { clearState(); detailDialog.value.show = false }
function clearState() {
  adjustState.entryId = null; adjustState.mode = null; adjustState.reason = ''
  requestPanel.value = null
}

function formatDetailDate(dateStr: string): string {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' })
}

// ─── Status actions ───────────────────────────────────────────
function quickConfirm(entry: ShiftEntry, status: CellStatus) {
  clearState(); shiftStore.updateCellStatus(entry.id, status)
}

function toggleAdjust(entry: ShiftEntry) {
  if (adjustState.entryId === entry.id && adjustState.mode === 'adjust') { clearState(); return }
  requestPanel.value = null
  adjustState.entryId = entry.id; adjustState.mode = 'adjust'; adjustState.reason = ''
}

function toggleRevert(entry: ShiftEntry) {
  if (adjustState.entryId === entry.id && adjustState.mode === 'revert') { clearState(); return }
  requestPanel.value = null
  adjustState.entryId = entry.id; adjustState.mode = 'revert'; adjustState.reason = ''
}

function submitAdjustment(entry: ShiftEntry) {
  shiftStore.requestAdjustment(entry.id, adjustState.reason.trim()); clearState()
}
function confirmRevert(entry: ShiftEntry) {
  shiftStore.revertToRequested(entry.id); clearState()
}

function revertTargetLabel(entry: ShiftEntry): string {
  const target = entry.preAdjustStatus ?? (entry.cellStatus === 'DAY_OFF_CONFIRMED' ? 'DAY_OFF_REQUESTED' : 'SHIFT_REQUESTED')
  return { SHIFT_REQUESTED: 'シフト希望', DAY_OFF_REQUESTED: '休み希望', CONFIRMED: 'シフト確定', DAY_OFF_CONFIRMED: '休み確定', ADJUSTING: '調整中' }[target] ?? target
}

// ─── Direct request (filling unfilled slots) ──────────────────
function toggleRequestPanel(dept: string, role: string, date: string, slot: ShiftSlot, rowKey: string) {
  if (requestPanel.value?.dept === dept && requestPanel.value?.role === role && requestPanel.value?.date === date && requestPanel.value?.rowKey === rowKey) {
    requestPanel.value = null; return
  }
  adjustState.entryId = null; adjustState.mode = null
  requestPanel.value = { dept, role, date, slotId: slot.id, selectedIds: [], rowKey }
}

const extraSlots = ref<Record<string, string[]>>({})
let extraSlotSeq = 0

function addExtraSlot(dept: string, role: string) {
  const key = `${dept}|${role}`
  if (!extraSlots.value[key]) extraSlots.value[key] = []
  extraSlots.value[key].push(`extra-${++extraSlotSeq}`)
}

function removeExtraSlot(dept: string, role: string, slotId: string) {
  const key = `${dept}|${role}`
  const arr = extraSlots.value[key]
  if (!arr) return
  const idx = arr.indexOf(slotId)
  if (idx !== -1) arr.splice(idx, 1)
  if (requestPanel.value?.rowKey === slotId) requestPanel.value = null
}

function getExtraSlotIds(dept: string, role: string): string[] {
  return extraSlots.value[`${dept}|${role}`] ?? []
}

function availableForRequest(dept: string, role: string, date: string, slot: ShiftSlot): Employee[] {
  const slotStart = timeToMin(slot.startTime)
  const slotEnd = timeToMin(slot.endTime)
  const alreadyAssigned = new Set(
    props.entries
      .filter(e => e.shiftDate === date && e.department === dept && timeToMin(e.startTime) < slotEnd && timeToMin(e.endTime) > slotStart)
      .map(e => e.employeeId),
  )
  return (allEmployees as Employee[]).filter(e => e.status === 'ACTIVE' && e.department === dept && e.position === role && !alreadyAssigned.has(e.id))
}

function toggleRequestSelection(empId: string) {
  if (!requestPanel.value) return
  const idx = requestPanel.value.selectedIds.indexOf(empId)
  if (idx === -1) requestPanel.value.selectedIds.push(empId)
  else requestPanel.value.selectedIds.splice(idx, 1)
}

function submitDirectRequest(dept: string, role: string, date: string, slot: ShiftSlot) {
  if (!requestPanel.value || requestPanel.value.selectedIds.length === 0) return
  const rowKey = requestPanel.value.rowKey
  const newEntries: ShiftEntry[] = requestPanel.value.selectedIds.map((empId, i) => {
    const employee = getEmployee(empId)
    const wage = employee ? Math.round(employee.hourlyWage * (timeToMin(slot.endTime) - timeToMin(slot.startTime)) / 60) : 0
    return {
      id: `direct-${Date.now()}-${i}`,
      employeeId: empId,
      shiftDate: date,
      startTime: slot.startTime,
      endTime: slot.endTime,
      department: dept,
      cellStatus: 'SHIFT_REQUESTED' as CellStatus,
      estimatedWage: wage,
      note: `${slot.label}の緊急募集`,
      managerRequested: true,
    }
  })
  shiftStore.addDirectRequests(newEntries)
  // If this was an extra row, remove it; required rows vanish naturally as workingCount increases
  if (rowKey.startsWith('extra-')) removeExtraSlot(dept, role, rowKey)
  else clearState()
}

// ═══════════════════════════════════════════════════════════════
// Monthly
// ═══════════════════════════════════════════════════════════════
function sundayOf(d: Date): Date { const r = new Date(d); r.setDate(r.getDate() - r.getDay()); return r }

const weeks = computed(() => {
  const pStart = new Date(props.periodStart), pEnd = new Date(props.periodEnd)
  const calStart = sundayOf(new Date(props.periodStart))
  const calEnd = (() => { const e = new Date(props.periodEnd); const s = new Date(e); s.setDate(e.getDate() + (6 - e.getDay())); return s })()
  const result: Array<Array<{ date: string; dayNum: number; month: number; isWeekend: boolean; isToday: boolean; inPeriod: boolean }>> = []
  const cursor = new Date(calStart)
  while (cursor <= calEnd) {
    const week = []
    for (let i = 0; i < 7; i++) {
      const dow = cursor.getDay(); const dateStr = cursor.toISOString().slice(0, 10)
      week.push({ date: dateStr, dayNum: cursor.getDate(), month: cursor.getMonth() + 1, isWeekend: dow === 0 || dow === 6, isToday: dateStr === todayStr, inPeriod: cursor >= pStart && cursor <= pEnd })
      cursor.setDate(cursor.getDate() + 1)
    }
    result.push(week)
  }
  return result
})

function monthLabel(week: typeof weeks.value[0]): string | null {
  const first = week.find(d => d.inPeriod && d.dayNum === 1)
  if (first) return `${first.date.slice(0, 4)}年${first.month}月`
  if (weeks.value.indexOf(week) === 0) { const ip = week.find(d => d.inPeriod); if (ip) return `${ip.date.slice(0, 4)}年${ip.month}月` }
  return null
}

// ═══════════════════════════════════════════════════════════════
// Weekly
// ═══════════════════════════════════════════════════════════════
const weekStart = ref<Date>(new Date())
watch(() => props.periodStart, val => { if (val) weekStart.value = sundayOf(new Date(val)) }, { immediate: true })

const weekDays = computed(() => {
  const pStart = new Date(props.periodStart), pEnd = new Date(props.periodEnd)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart.value); d.setDate(d.getDate() + i)
    const dow = d.getDay(); const date = d.toISOString().slice(0, 10)
    return { date, dowLabel: DOW_LABELS[dow], monthDay: `${d.getMonth() + 1}/${d.getDate()}`, isWeekend: dow === 0 || dow === 6, isToday: date === todayStr, inPeriod: d >= pStart && d <= pEnd }
  })
})

const weekLabel = computed(() => {
  const [f, l] = [weekDays.value[0], weekDays.value[6]]
  const fd = new Date(f.date), ld = new Date(l.date)
  return fd.getMonth() === ld.getMonth()
    ? `${fd.getFullYear()}年${fd.getMonth() + 1}月 ${fd.getDate()}〜${ld.getDate()}日`
    : `${fd.getFullYear()}年${fd.getMonth() + 1}月${fd.getDate()}日〜${ld.getMonth() + 1}月${ld.getDate()}日`
})

const canGoPrev = computed(() => { const p = new Date(weekStart.value); p.setDate(p.getDate() - 7); const s = new Date(p); s.setDate(s.getDate() + 6); return s >= new Date(props.periodStart) })
const canGoNext = computed(() => { const n = new Date(weekStart.value); n.setDate(n.getDate() + 7); return n <= new Date(props.periodEnd) })
function prevWeek() { const d = new Date(weekStart.value); d.setDate(d.getDate() - 7); weekStart.value = d }
function nextWeek() { const d = new Date(weekStart.value); d.setDate(d.getDate() + 7); weekStart.value = d }

const scrollRef = ref<HTMLElement>()
onMounted(() => { nextTick(() => { if (scrollRef.value) scrollRef.value.scrollTop = (7 - START_HOUR) * HOUR_PX }) })
</script>

<!-- StatusChip inline component -->
<script lang="ts">
import { defineComponent, h } from 'vue'
import type { CellStatus } from '~/types'

const STATUS_CFG: Record<CellStatus, { label: string; bg: string; color: string; border?: string }> = {
  SHIFT_REQUESTED:   { label: 'シフト希望', bg: 'transparent', color: '#1d4ed8', border: '1.5px solid #3587dc' },
  CONFIRMED:         { label: 'シフト確定', bg: '#3587dc',     color: '#fff' },
  DAY_OFF_REQUESTED: { label: '休み希望',   bg: 'transparent', color: '#475569', border: '1.5px solid #64748b' },
  DAY_OFF_CONFIRMED: { label: '休み確定',   bg: '#64748b',     color: '#fff' },
  ADJUSTING:         { label: '調整中',     bg: '#f59e0b',     color: '#1c1917' },
}

export const StatusChip = defineComponent({
  props: { status: { type: String as () => CellStatus, required: true } },
  setup(props) {
    return () => {
      const cfg = STATUS_CFG[props.status]
      return h('span', {
        style: {
          display: 'inline-flex', alignItems: 'center', padding: '2px 8px',
          borderRadius: '10px', fontSize: '11px', fontWeight: 600, whiteSpace: 'nowrap', flexShrink: 0,
          background: cfg.bg, color: cfg.color, border: cfg.border ?? 'none',
        },
      }, cfg.label)
    }
  },
})
</script>

<style scoped>
.alloc-cal { font-size: 12px; }

/* ── Monthly ──────────────────────────────────────────── */
.dow-header { display:grid; grid-template-columns:repeat(7,1fr); border-top:1px solid rgba(0,0,0,.08); border-left:1px solid rgba(0,0,0,.08); }
.dow-cell { text-align:center; padding:6px 4px; border-right:1px solid rgba(0,0,0,.08); border-bottom:1px solid rgba(0,0,0,.08); background:#f8f9fa; }
.month-divider { padding:6px 8px 2px; border-left:1px solid rgba(0,0,0,.08); border-right:1px solid rgba(0,0,0,.08); background:rgba(var(--v-theme-primary),.04); }
.cal-week { display:grid; grid-template-columns:repeat(7,1fr); border-left:1px solid rgba(0,0,0,.08); }
.cal-day { border-right:1px solid rgba(0,0,0,.08); border-bottom:1px solid rgba(0,0,0,.08); min-height:80px; padding:4px 5px; display:flex; flex-direction:column; gap:2px; background:white; box-sizing:border-box; }
.cal-day--out { background:#f9f9f9; pointer-events:none; }
.cal-day--weekend { background:rgba(230,39,62,.025); }
.cal-day--today { outline:2px solid rgb(var(--v-theme-primary)); outline-offset:-2px; }
.date-num { font-size:11px; line-height:1; margin-bottom:3px; }
.date-num--today { color:rgb(var(--v-theme-primary)) !important; font-weight:800 !important; }
.day-slots { display:flex; flex-direction:column; gap:2px; flex:1; }
.slot-row { display:flex; align-items:center; gap:3px; line-height:1.2; }
.slot-dot { width:7px; height:7px; border-radius:2px; flex-shrink:0; }
.slot-name { font-size:10px; font-weight:600; white-space:nowrap; }
.slot-time { font-size:9px; color:rgba(0,0,0,.45); flex:1; white-space:nowrap; overflow:hidden; }
.slot-cov { font-size:10px; font-weight:600; white-space:nowrap; flex-shrink:0; }
.slot-cov.cov-ok { color:#16a34a; } .slot-cov.cov-short { color:#d97706; } .slot-cov.cov-none { color:rgba(0,0,0,.35); }
.no-slot-row { flex:1; display:flex; align-items:center; }
.cov-badge { font-size:10px; padding:1px 5px; border-radius:4px; font-weight:600; }
.cov-badge.cov-ok { color:#16a34a; background:rgba(22,163,74,.1); }
.cov-badge.cov-short { color:#d97706; background:rgba(217,119,6,.1); }
.cov-badge.cov-none { color:rgba(0,0,0,.4); background:rgba(0,0,0,.06); }

/* ── Weekly frame ────────────────────────────────────── */
.cal-frame { border:1px solid rgba(0,0,0,.12); border-radius:10px; overflow:hidden; }
.cal-header { display:flex; border-bottom:1px solid rgba(0,0,0,.1); background:rgba(0,0,0,.015); }
.time-gutter { width:52px; flex-shrink:0; }
.day-header-cell { flex:1; text-align:center; padding:8px 4px; border-left:1px solid rgba(0,0,0,.06); }
.day-header-cell--out { opacity:.35; }
.day-header-cell--today { background:rgba(var(--v-theme-primary),.06); }
.cal-scroll { overflow-y:auto; max-height:580px; }
.cal-body { display:flex; position:relative; }
.hour-label { position:absolute; right:6px; font-size:10px; color:rgba(0,0,0,.38); white-space:nowrap; line-height:1; }
.day-col { flex:1; position:relative; border-left:1px solid rgba(0,0,0,.06); min-width:90px; }
.day-col--out { background:rgba(0,0,0,.018); pointer-events:none; }
.day-col--today { background:rgba(var(--v-theme-primary),.02); }
.hour-line { position:absolute; left:0; right:0; border-top:1px solid rgba(0,0,0,.07); pointer-events:none; }
.half-line { position:absolute; left:0; right:0; border-top:1px dashed rgba(0,0,0,.04); pointer-events:none; }

/* ── Slot blocks ─────────────────────────────────────── */
.slot-block { position:absolute; left:3px; right:3px; border-radius:7px; padding:6px 8px 20px; cursor:pointer; overflow:hidden; z-index:1; transition:filter .12s,box-shadow .12s; box-sizing:border-box; }
.slot-block:hover { filter:brightness(1.06); box-shadow:0 4px 16px rgba(0,0,0,.22); z-index:2; }
.sb-label { color:white; font-size:13px; font-weight:700; line-height:1.3; }
.sb-time  { color:rgba(255,255,255,.75); font-size:10px; margin-bottom:5px; }
.sb-dept-block { margin-top:4px; padding-top:4px; border-top:1px solid rgba(255,255,255,.18); }
.sb-dept-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:2px; }
.sb-dept-name { color:rgba(255,255,255,.6); font-size:9px; font-weight:700; text-transform:uppercase; letter-spacing:.06em; }
.sb-dept-counts { font-size:10px; font-weight:700; }
.sb-count-confirmed { color:#a7f3d0; }
.sb-count-pending   { color:rgba(255,255,255,.75); }
.sb-count-adjusting { color:#fde68a; }
.sb-count-required  { color:rgba(255,255,255,.45); }
.sb-emp-row { display:flex; align-items:center; gap:4px; line-height:1.6; }
.sb-emp-icon { font-size:10px; width:12px; flex-shrink:0; }
.icon-CONFIRMED { color:#a7f3d0; } .icon-SHIFT_REQUESTED { color:rgba(255,255,255,.8); }
.icon-DAY_OFF_REQUESTED,.icon-DAY_OFF_CONFIRMED { color:rgba(255,255,255,.5); }
.icon-ADJUSTING { color:#fde68a; }
.sb-emp-name { color:rgba(255,255,255,.92); font-size:10px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.sb-more { color:rgba(255,255,255,.45); font-size:9px; margin-top:1px; }
.sb-hint { position:absolute; bottom:4px; right:7px; font-size:9px; color:rgba(255,255,255,.32); }

/* ── Detail dialog ───────────────────────────────────── */
.detail-header { padding:16px 16px 14px 20px; }
.detail-cov-chip { display:inline-flex; padding:2px 8px; border-radius:8px; font-size:11px; font-weight:700; margin-left:4px; }
.cov-chip--ok       { background:rgba(255,255,255,.22); color:white; }
.cov-chip--short    { background:rgba(253,230,138,.3);  color:#fff; }
.cov-chip--adjusting{ background:rgba(245,158,11,.35);  color:#fff; }
.cov-chip--pending  { background:rgba(255,255,255,.12); color:rgba(255,255,255,.8); }

.role-section { padding-left:12px; border-left:2px solid rgba(0,0,0,.07); }
.role-title { display:flex; align-items:center; justify-content:space-between; }

.emp-row { display:flex; align-items:center; justify-content:space-between; padding:7px 6px; border-bottom:1px solid rgba(0,0,0,.05); border-radius:6px; transition:background .1s; }
.emp-row--active { background:rgba(245,158,11,.06); }
.emp-row:last-of-type { border-bottom:none; }
.emp-row--empty { opacity:.65; }
.emp-row-info { display:flex; align-items:center; flex:1; min-width:0; }
.emp-row-actions { display:flex; align-items:center; flex-shrink:0; gap:2px; }

/* ── Negotiation card (always visible when ADJUSTING) ── */
.negotiation-card {
  margin: 0 0 8px 0;
  padding: 12px 14px;
  background: rgba(245, 158, 11, 0.06);
  border-left: 3px solid #f59e0b;
  border-radius: 0 8px 8px 0;
}
.nego-side { display:flex; flex-direction:column; gap:4px; }
.nego-side-label { font-size:10px; color:rgba(0,0,0,.5); font-weight:500; }

.response-badge {
  display:inline-flex; align-items:center; gap:4px;
  padding:3px 8px; border-radius:12px; font-size:11px; font-weight:600; flex-shrink:0;
}
.response-badge--PENDING  { background:rgba(0,0,0,.07);  color:rgba(0,0,0,.5); }
.response-badge--ACCEPTED { background:rgba(22,163,74,.12); color:#15803d; }
.response-badge--REJECTED { background:rgba(220,38,38,.1); color:#b91c1c; }

/* ── Message thread ──────────────────────────────────── */
.message-thread { display:flex; flex-direction:column; gap:8px; margin-top:10px; }
.message-bubble { padding:8px 10px; border-radius:8px; }
.message-bubble--manager {
  background: rgba(var(--v-theme-primary), 0.08);
  border: 1px solid rgba(var(--v-theme-primary), 0.15);
  align-self: flex-start; max-width: 95%;
}
.message-bubble--employee {
  background: white;
  border: 1px solid rgba(0,0,0,.12);
  align-self: flex-end; max-width: 95%;
}
.message-sender { font-size:10px; color:rgba(0,0,0,.45); margin-bottom:3px; display:flex; align-items:center; gap:3px; }
.message-body   { font-size:12px; line-height:1.5; color:rgba(0,0,0,.8); }
.message-waiting { display:flex; align-items:center; gap:5px; padding:6px 2px; }

/* ── Inline panels ───────────────────────────────────── */
.inline-panel { padding:12px 14px; border-radius:8px; margin:2px 0 8px; }
.inline-panel--warn  { border-left:3px solid #f59e0b; background:rgba(245,158,11,.06); }
.inline-panel--error { border-left:3px solid #ef4444; background:rgba(239,68,68,.05); }
.inline-panel--request { border-left:3px solid rgb(var(--v-theme-primary)); background:rgba(var(--v-theme-primary),.04); }

/* ── Direct request employee list ───────────────────── */
.request-emp-list { border:1px solid rgba(0,0,0,.1); border-radius:8px; overflow:hidden; }
.request-emp-row { display:flex; align-items:center; gap:8px; padding:8px 10px; cursor:pointer; transition:background .1s; border-bottom:1px solid rgba(0,0,0,.06); }
.request-emp-row:last-child { border-bottom:none; }
.request-emp-row:hover { background:rgba(0,0,0,.03); }
.request-emp-row--selected { background:rgba(var(--v-theme-primary),.06); }

.unfilled-badge { display:inline-flex; padding:2px 8px; border-radius:10px; font-size:11px; font-weight:600; border:1.5px dashed rgba(0,0,0,.2); color:rgba(0,0,0,.4); }
</style>
