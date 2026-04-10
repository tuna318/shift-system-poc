<template>
  <div>
    <!-- ── Breadcrumb ──────────────────────────────────────────── -->
    <div class="d-flex align-center ga-2 mb-4">
      <v-btn :to="`/attendance/${employeeId}`" icon size="small" variant="text">
        <v-icon>mdi-arrow-left</v-icon>
      </v-btn>
      <v-breadcrumbs :items="breadcrumbs" density="compact" class="pa-0" />
    </div>

    <!-- ── Header card: employee + date + status + actions ──────── -->
    <div class="hdr-card mb-4">
      <div class="hdr-left">
        <v-avatar size="44" color="primary" variant="tonal" rounded="lg">
          <span class="text-subtitle-1 font-weight-bold">{{ employee?.name[0] }}</span>
        </v-avatar>
        <div>
          <div class="d-flex align-center ga-2 flex-wrap">
            <span class="text-h6 font-weight-bold">{{ employee?.name }}</span>
            <v-chip size="x-small" color="surface-variant" variant="flat">{{ employee?.department }}</v-chip>
            <v-chip size="x-small" color="surface-variant" variant="flat">{{ employee?.position }}</v-chip>
          </div>
          <div class="text-body-2 text-medium-emphasis mt-1">{{ dateLabel }}</div>
        </div>
      </div>
      <div class="hdr-right">
        <div class="d-flex align-center ga-2 flex-wrap justify-end">
          <v-chip v-if="record" :color="statusColor" size="small" variant="flat">
            <v-icon start size="13">{{ statusIcon }}</v-icon>
            {{ statusLabel }}
          </v-chip>
          <template v-if="record?.status === 'PENDING_APPROVAL'">
            <v-btn size="small" variant="outlined" color="warning" rounded="lg" @click="openReturn">
              <v-icon start size="14">mdi-undo-variant</v-icon>差し戻す
            </v-btn>
            <v-btn size="small" color="success" rounded="lg" @click="handleApprove">
              <v-icon start size="14">mdi-check</v-icon>承認する
            </v-btn>
          </template>
          <template v-else-if="record?.status === 'CORRECTION_REQUESTED'">
            <v-btn size="small" variant="tonal" color="primary" rounded="lg" @click="attStore.cancelReturn(record.id)">
              差し戻しを取消す
            </v-btn>
            <v-btn size="small" color="success" rounded="lg" @click="handleApprove">
              <v-icon start size="14">mdi-check</v-icon>このまま承認
            </v-btn>
          </template>
          <template v-else-if="record?.status === 'APPROVED'">
            <v-btn size="small" variant="text" color="medium-emphasis" rounded="lg" @click="attStore.revertApproval(record.id)">
              承認を取消す
            </v-btn>
          </template>
        </div>
        <!-- Correction comment note -->
        <div v-if="record?.status === 'CORRECTION_REQUESTED' && record.correctionComment" class="hdr-return-note mt-2">
          <v-icon size="12" color="warning">mdi-comment-alert-outline</v-icon>
          <span class="ml-1 text-caption">{{ record.correctionComment }}</span>
        </div>
      </div>
    </div>

    <!-- ── Empty state ─────────────────────────────────────────── -->
    <template v-if="!record && shifts.length === 0">
      <v-card rounded="xl" elevation="0" border class="text-center py-10">
        <v-icon size="48" color="medium-emphasis">mdi-calendar-remove-outline</v-icon>
        <div class="text-h6 mt-3">記録なし</div>
        <div class="text-body-2 text-medium-emphasis mt-1">この日の勤怠データもシフトもありません</div>
        <v-btn :to="`/attendance/${employeeId}`" variant="tonal" rounded="lg" class="mt-4">一覧に戻る</v-btn>
      </v-card>
    </template>

    <template v-else>
      <v-row>
        <!-- ─────────────────── LEFT: Sessions + Corrections ───── -->
        <v-col cols="12" lg="7">

          <!-- Absent warning -->
          <v-alert
            v-if="!record && shifts.length > 0"
            type="warning" variant="tonal" rounded="xl" density="compact" class="mb-4"
          >
            <div class="font-weight-medium">打刻記録がありません</div>
            <div class="text-caption mt-1">シフトが組まれていますが、この日の出退勤記録が存在しません。</div>
          </v-alert>

          <!-- Sessions -->
          <template v-if="record">
            <div class="sec-title mb-2">
              <v-icon size="14">mdi-clock-check-outline</v-icon>
              出退勤記録
              <span class="sec-count">{{ sessions.length }}セッション</span>
            </div>

            <div v-for="(sess, i) in sessions" :key="sess.id ?? i" class="sess-card mb-3">
              <!-- Session header -->
              <div class="sess-hdr">
                <div class="d-flex align-center ga-2 flex-wrap">
                  <span class="sess-num">{{ i + 1 }}</span>
                  <v-chip v-if="sess.punchVariant === 'HELP'" size="x-small" color="orange" variant="tonal">
                    <v-icon start size="10">mdi-handshake-outline</v-icon>
                    応援{{ sess.helpStore ? ` — ${sess.helpStore}` : '' }}
                  </v-chip>
                  <v-chip v-else-if="sess.punchVariant === 'TRAINING'" size="x-small" color="purple" variant="tonal">
                    研修
                  </v-chip>
                  <v-chip
                    v-if="sess.department && sess.department !== employee?.department"
                    size="x-small" color="blue" variant="tonal"
                  >
                    {{ sess.department }}
                  </v-chip>
                  <template v-for="cr in correctionsForSession(sess, i)" :key="`badge-${cr.id}`">
                    <v-chip v-if="cr.status === 'pending'" size="x-small" color="warning" variant="tonal" prepend-icon="mdi-pencil-clock">
                      修正申請中
                    </v-chip>
                    <v-chip v-else-if="cr.status === 'approved'" size="x-small" color="amber-darken-2" variant="tonal" prepend-icon="mdi-pencil-check">
                      修正済
                    </v-chip>
                  </template>
                </div>
                <!-- Per-session compliance icons -->
                <div class="d-flex ga-1">
                  <v-tooltip
                    v-for="f in sessionFlags(sess)"
                    :key="f.key"
                    :text="f.message"
                    location="top"
                  >
                    <template #activator="{ props: tp }">
                      <v-icon v-bind="tp" size="15" :color="f.level === 'error' ? 'error' : 'warning'">
                        {{ f.icon }}
                      </v-icon>
                    </template>
                  </v-tooltip>
                </div>
              </div>

              <!-- Times row -->
              <div class="sess-times">
                <div class="st-col">
                  <div class="st-lbl">出勤</div>
                  <div class="st-val">{{ sess.checkIn ?? '—' }}</div>
                </div>
                <span class="st-arrow">→</span>
                <div class="st-col">
                  <div class="st-lbl">退勤</div>
                  <div class="st-val" :class="{ 'st-val--missing': !sess.checkOut }">
                    {{ sess.checkOut ?? '未打刻' }}
                  </div>
                </div>
                <div class="st-divider" />
                <div class="st-col">
                  <div class="st-lbl">休憩</div>
                  <div class="st-val">{{ sess.breakMinutes }}分</div>
                </div>
                <div class="st-col st-col--em">
                  <div class="st-lbl">実働</div>
                  <div class="st-val st-val--bold">{{ fmtMins(sess.actualMinutes) }}</div>
                </div>
                <div v-if="(sess.nightMinutes ?? 0) > 0" class="st-col">
                  <div class="st-lbl">深夜</div>
                  <div class="st-val st-val--night">{{ sess.nightMinutes }}分</div>
                </div>
              </div>

              <!-- Compliance flags inline -->
              <div v-if="sessionFlags(sess).length > 0" class="sess-flags">
                <v-chip
                  v-for="f in sessionFlags(sess)"
                  :key="f.key"
                  size="x-small"
                  :color="f.level === 'error' ? 'error' : 'warning'"
                  variant="tonal"
                  :prepend-icon="f.icon"
                >
                  {{ f.message }}
                </v-chip>
              </div>

              <!-- Expandable footer: corrections + punch log -->
              <v-expansion-panels flat multiple class="sess-expand-group">
                <!-- Correction requests (embedded) -->
                <v-expansion-panel v-if="correctionsForSession(sess, i).length > 0">
                  <v-expansion-panel-title class="sess-expand-title">
                    <v-icon size="11" class="mr-1">mdi-file-edit-outline</v-icon>
                    修正申請（{{ correctionsForSession(sess, i).length }}件）
                    <v-chip
                      v-if="correctionsForSession(sess, i).some(c => c.status === 'pending')"
                      size="x-small" color="warning" variant="flat" class="ml-2"
                    >要対応</v-chip>
                  </v-expansion-panel-title>
                  <v-expansion-panel-text class="sess-expand-body">
                    <div
                      v-for="cr in correctionsForSession(sess, i)"
                      :key="cr.id"
                      class="corr-item"
                    >
                      <!-- Header row -->
                      <div class="corr-hdr">
                        <div class="d-flex align-center ga-1 flex-wrap">
                          <v-chip size="x-small" :color="cr.type === 'edit' ? 'blue' : 'teal'" variant="tonal">
                            {{ cr.type === 'edit' ? '時刻修正' : 'セッション追加' }}
                          </v-chip>
                          <v-chip size="x-small" :color="crStatusColor(cr.status)" variant="flat">
                            {{ crStatusLabel(cr.status) }}
                          </v-chip>
                        </div>
                        <span class="corr-date">{{ fmtDateTime(cr.createdAt) }}</span>
                      </div>
                      <!-- Time comparison -->
                      <div v-if="cr.type === 'edit'" class="corr-times">
                        <div class="ct-row">
                          <span class="ct-lbl ct-lbl--before">修正前</span>
                          <span class="ct-time ct-time--before">{{ cr.originalCheckIn ?? '—' }} → {{ cr.originalCheckOut ?? '未打刻' }}</span>
                        </div>
                        <div class="ct-row">
                          <span class="ct-lbl ct-lbl--after">修正後</span>
                          <span class="ct-time ct-time--after">{{ cr.requestedCheckIn }} → {{ cr.requestedCheckOut }}</span>
                        </div>
                      </div>
                      <div v-else class="corr-times">
                        <div class="ct-row">
                          <span class="ct-lbl ct-lbl--after">追加</span>
                          <span class="ct-time ct-time--after">{{ cr.requestedCheckIn }} → {{ cr.requestedCheckOut }}</span>
                        </div>
                      </div>
                      <!-- Reason -->
                      <div class="corr-reason">「{{ cr.reason }}」</div>
                      <!-- Manager note -->
                      <div v-if="cr.managerNote" class="corr-mgr-note">
                        <v-icon size="11">mdi-account-tie-outline</v-icon>
                        {{ cr.managerNote }}
                      </div>
                      <!-- Actions (pending only) -->
                      <template v-if="cr.status === 'pending'">
                        <div v-if="!rejectOpen[cr.id]" class="d-flex ga-2 justify-end mt-2">
                          <v-btn size="x-small" variant="outlined" color="error" rounded="lg" @click="rejectOpen[cr.id] = true">却下</v-btn>
                          <v-btn size="x-small" color="success" rounded="lg" @click="attStore.approveCorrection(cr.id)">承認</v-btn>
                        </div>
                        <template v-else>
                          <v-textarea
                            v-model="rejectNote[cr.id]"
                            label="却下理由" variant="outlined" density="compact"
                            rows="2" hide-details rounded="lg" class="mt-2"
                          />
                          <div class="d-flex ga-2 justify-end mt-2">
                            <v-btn size="x-small" variant="text" @click="rejectOpen[cr.id] = false; rejectNote[cr.id] = ''">キャンセル</v-btn>
                            <v-btn size="x-small" color="error" rounded="lg" :disabled="!rejectNote[cr.id]?.trim()" @click="submitReject(cr.id)">却下確定</v-btn>
                          </div>
                        </template>
                      </template>
                    </div>
                  </v-expansion-panel-text>
                </v-expansion-panel>

                <!-- Punch log -->
                <v-expansion-panel v-if="punchEventsForSession(i).length > 0">
                  <v-expansion-panel-title class="sess-expand-title">
                    <v-icon size="11" class="mr-1">mdi-timeline-clock-outline</v-icon>
                    打刻ログ（{{ punchEventsForSession(i).length }}件）
                  </v-expansion-panel-title>
                  <v-expansion-panel-text class="sess-expand-body">
                    <div class="punch-list">
                      <div
                        v-for="ev in punchEventsForSession(i)"
                        :key="ev.id"
                        class="punch-item"
                        :class="{ 'punch-item--voided': ev.isVoided }"
                      >
                        <v-icon :color="punchColor(ev.punchType)" size="12">{{ punchIcon(ev.punchType) }}</v-icon>
                        <span class="pi-time">{{ ev.punchedAt.slice(11, 16) }}</span>
                        <span class="pi-type">{{ punchLabel(ev.punchType) }}</span>
                        <span v-if="ev.isVoided" class="pi-void">（無効）</span>
                      </div>
                    </div>
                  </v-expansion-panel-text>
                </v-expansion-panel>
              </v-expansion-panels>
            </div>
          </template>

        </v-col>

        <!-- ─────────────────── RIGHT: Shift + Summary ─────────── -->
        <v-col cols="12" lg="5">

          <!-- ── Shift comparison ──────────────────────────────── -->
          <div class="sec-title mb-2">
            <v-icon size="14">mdi-calendar-clock-outline</v-icon>
            シフト比較
          </div>
          <div class="r-card mb-4">
            <template v-if="shifts.length === 0">
              <div class="text-center py-4 text-body-2 text-medium-emphasis">
                <v-icon size="28" class="d-block mb-1 opacity-40">mdi-calendar-remove-outline</v-icon>
                この日のシフト登録はありません
              </div>
            </template>
            <template v-else>
              <!-- Unified comparison timeline: 1 row = 予定, 1 row = 実績 -->
              <div class="stl-wrap mb-3">
                <!-- Scale -->
                <div class="stl-scale-row">
                  <span class="stl-lbl" />
                  <div class="stl-track stl-track--scale">
                    <span
                      v-for="h in [6, 9, 12, 15, 18, 21, 24]"
                      :key="h"
                      class="stl-tick"
                      :style="{ left: tlPct(h * 60) }"
                    >{{ String(h).padStart(2, '0') }}:00</span>
                  </div>
                  <span class="stl-total" />
                </div>

                <!-- 予定 row — all shifts as segments -->
                <div class="stl-row">
                  <span class="stl-lbl stl-lbl--shift">予定</span>
                  <div class="stl-track">
                    <v-tooltip
                      v-for="sh in shifts"
                      :key="sh.id"
                      :text="`${sh.startTime}–${sh.endTime}  ${sh.department}  ${fmtMins(toMins(sh.endTime) - toMins(sh.startTime))}`"
                      location="top"
                    >
                      <template #activator="{ props: tp }">
                        <div v-bind="tp" class="stl-seg stl-seg--shift" :style="segStyle(sh.startTime, sh.endTime)">
                          <div class="stl-seg-inner">
                            <span class="stl-seg-time">{{ sh.startTime }}–{{ sh.endTime }}</span>
                            <span class="stl-seg-sub">{{ sh.department }}</span>
                          </div>
                        </div>
                      </template>
                    </v-tooltip>
                  </div>
                  <span class="stl-total">{{ fmtMins(scheduledMins) }}</span>
                </div>

                <!-- 実績 row — all sessions as segments -->
                <div class="stl-row">
                  <span class="stl-lbl stl-lbl--actual">実績</span>
                  <div class="stl-track">
                    <v-tooltip
                      v-for="(sess, i) in sessions"
                      :key="i"
                      :text="sess.checkIn && sess.checkOut
                        ? `${sess.checkIn}–${sess.checkOut}  ${fmtMins(sess.actualMinutes)}${sess.department && sess.department !== employee?.department ? '  ' + sess.department : ''}`
                        : '未打刻'"
                      location="top"
                    >
                      <template #activator="{ props: tp }">
                        <div
                          v-bind="tp"
                          class="stl-seg"
                          :class="sess.checkIn && sess.checkOut ? 'stl-seg--actual' : 'stl-seg--missing'"
                          :style="sess.checkIn && sess.checkOut ? segStyle(sess.checkIn, sess.checkOut) : { left: '0%', width: '100%' }"
                        >
                          <div v-if="sess.checkIn && sess.checkOut" class="stl-seg-inner">
                            <span class="stl-seg-time">{{ sess.checkIn }}–{{ sess.checkOut }}</span>
                            <span v-if="sess.department && sess.department !== employee?.department" class="stl-seg-sub">{{ sess.department }}</span>
                          </div>
                        </div>
                      </template>
                    </v-tooltip>
                  </div>
                  <span class="stl-total" :class="{ 'text-error': beyondScheduleMins > 0 }">
                    {{ record ? fmtMins(record.actualMinutes) : '—' }}
                  </span>
                </div>
              </div>

              <!-- Deviation table -->
              <div class="dev-table">
                <div class="dev-row">
                  <span class="dev-key">出勤差異</span>
                  <span class="dev-val" :class="deviationCls(inDeviation)">{{ inDeviationText }}</span>
                </div>
                <div class="dev-row">
                  <span class="dev-key">退勤差異</span>
                  <span class="dev-val" :class="deviationCls(outDeviation)">{{ outDeviationText }}</span>
                </div>
                <div class="dev-row">
                  <span class="dev-key">実働差異</span>
                  <span class="dev-val" :class="workDeviationCls">{{ workDeviationText }}</span>
                </div>
              </div>
            </template>
          </div>

          <!-- ── Daily summary ─────────────────────────────────── -->
          <div class="sec-title mb-2">
            <v-icon size="14">mdi-sigma</v-icon>
            日次集計
          </div>
          <div class="r-card mb-4">
            <div class="stats-grid">
              <div class="si si--primary">
                <div class="si-val">{{ record ? fmtMins(record.actualMinutes) : '—' }}</div>
                <div class="si-lbl">総労働</div>
              </div>
              <div class="si">
                <div class="si-val">{{ scheduledMins > 0 ? fmtMins(scheduledMins) : '—' }}</div>
                <div class="si-lbl">所定</div>
              </div>
              <div class="si" :class="{ 'si--alert': beyondScheduleMins > 0 }">
                <div class="si-val">{{ beyondScheduleMins > 0 ? fmtMins(beyondScheduleMins) : '—' }}</div>
                <div class="si-lbl">所定外</div>
              </div>
              <div class="si" :class="{ 'si--alert': (record?.overtimeMinutes ?? 0) > 0 }">
                <div class="si-val">{{ (record?.overtimeMinutes ?? 0) > 0 ? fmtMins(record!.overtimeMinutes) : '—' }}</div>
                <div class="si-lbl">法定外</div>
              </div>
              <div class="si" :class="{ 'si--night': totalNightMins > 0 }">
                <div class="si-val">{{ totalNightMins > 0 ? fmtMins(totalNightMins) : '—' }}</div>
                <div class="si-lbl">深夜</div>
              </div>
              <div class="si" :class="{ 'si--alert': lateMinutes > 0 }">
                <div class="si-val">{{ lateMinutes > 0 ? fmtMins(lateMinutes) : '—' }}</div>
                <div class="si-lbl">遅刻</div>
              </div>
              <div class="si" :class="{ 'si--alert': earlyLeaveMinutes > 0 }">
                <div class="si-val">{{ earlyLeaveMinutes > 0 ? fmtMins(earlyLeaveMinutes) : '—' }}</div>
                <div class="si-lbl">早退</div>
              </div>
              <div class="si">
                <div class="si-val">{{ record ? (record.breakMinutes + '分') : '—' }}</div>
                <div class="si-lbl">休憩計</div>
              </div>
            </div>
            <!-- Timestamps -->
            <div class="stats-footer">
              <div v-if="record?.submittedAt" class="sf-row">
                <v-icon size="11" color="primary">mdi-send-outline</v-icon>
                <span>{{ fmtDateTime(record.submittedAt) }} 申請</span>
              </div>
              <div v-if="record?.approvedAt" class="sf-row sf-row--approved">
                <v-icon size="11" color="success">mdi-check-circle-outline</v-icon>
                <span>{{ fmtDateTime(record.approvedAt) }} 承認</span>
              </div>
            </div>
          </div>
        </v-col>
      </v-row>
    </template>

    <!-- ── Return dialog ───────────────────────────────────────── -->
    <v-dialog v-model="returnDialog" max-width="440">
      <v-card rounded="xl">
        <v-card-title class="text-subtitle-1 font-weight-bold pa-4 pb-2">差し戻しコメント</v-card-title>
        <v-card-text class="pa-4 pt-0">
          <v-textarea
            v-model="returnNote"
            label="従業員に通知されます"
            variant="outlined" density="compact" rows="3"
            rounded="lg" hide-details auto-grow
          />
        </v-card-text>
        <v-card-actions class="pa-4 pt-0 ga-2">
          <v-spacer />
          <v-btn variant="text" @click="returnDialog = false">キャンセル</v-btn>
          <v-btn color="warning" :disabled="!returnNote.trim()" @click="submitReturn">差し戻し確定</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- ── Compliance confirm dialog ───────────────────────────── -->
    <v-dialog v-model="complianceDialog" max-width="400">
      <v-card rounded="xl">
        <v-card-title class="text-subtitle-1 font-weight-bold pa-4 pb-2">コンプライアンス警告</v-card-title>
        <v-card-text class="pa-4 pt-0">
          <p class="text-body-2 mb-3">以下の警告があります。このまま承認しますか？</p>
          <v-alert
            v-for="f in allFlags" :key="f.key"
            :type="f.level === 'error' ? 'error' : 'warning'"
            density="compact" variant="tonal" :icon="f.icon" class="mb-2"
          >
            <span class="text-caption">{{ f.message }}</span>
          </v-alert>
        </v-card-text>
        <v-card-actions class="pa-4 pt-0 ga-2">
          <v-spacer />
          <v-btn variant="text" @click="complianceDialog = false">キャンセル</v-btn>
          <v-btn color="success" @click="confirmApprove">承認する</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import type { WorkSession, PunchType, ComplianceFlag, ShiftEntry } from '~/types'
import { useAttendanceStore } from '~/stores/attendance.store'
import { useMockData, getComplianceFlags, computeNightMins } from '~/composables/useMockData'

const route   = useRoute()
const attStore = useAttendanceStore()
const { employees, getEmpShiftsForDate } = useMockData()

const employeeId = computed(() => route.params.employeeId as string)
const dateParam  = computed(() => route.params.date as string)

const employee   = computed(() => employees.find(e => e.id === employeeId.value))
const record     = computed(() => attStore.getRecord(employeeId.value, dateParam.value))
const corrections = computed(() => attStore.getCorrectionsForDay(employeeId.value, dateParam.value))
const pendingCorrections = computed(() => corrections.value.filter(c => c.status === 'pending'))

const shifts = computed<ShiftEntry[]>(() =>
  getEmpShiftsForDate(employeeId.value, dateParam.value)
    .filter(s => s.cellStatus === 'CONFIRMED' || s.cellStatus === 'ADJUSTING'),
)

const sessions = computed<WorkSession[]>(() => {
  if (!record.value) return []
  if (record.value.sessions?.length) return record.value.sessions
  return [{
    id: record.value.id,
    sessionIdx: 0,
    checkIn:       record.value.checkIn,
    checkOut:      record.value.checkOut,
    breakMinutes:  record.value.breakMinutes,
    actualMinutes: record.value.actualMinutes,
    department:    employee.value?.department,
    punchVariant:  'NORMAL',
    nightMinutes:  computeNightMins(record.value.checkIn, record.value.checkOut),
  }]
})

// ── Punch events per session ─────────────────────────────────
function punchEventsForSession(idx: number) {
  if (!record.value) return []
  const all = record.value.punchEvents
  if (sessions.value.length <= 1) return all
  const groups: typeof all[] = []
  let cur: typeof all = []
  for (const ev of all) {
    cur.push(ev)
    if (ev.punchType === 'CHECK_OUT') { groups.push(cur); cur = [] }
  }
  return groups[idx] ?? []
}

// ── Correction ↔ session matching ────────────────────────────
function correctionsForSession(sess: WorkSession, idx: number) {
  return corrections.value.filter(cr =>
    cr.sessionId === sess.id || (!cr.sessionId && idx === 0),
  )
}

// ── Correction reject state ───────────────────────────────────
const rejectOpen = ref<Record<string, boolean>>({})
const rejectNote = ref<Record<string, string>>({})

function submitReject(correctionId: string) {
  const note = rejectNote.value[correctionId]
  if (!note?.trim()) return
  attStore.rejectCorrection(correctionId, note)
  rejectOpen.value[correctionId] = false
  rejectNote.value[correctionId] = ''
}

function crStatusLabel(status: string): string {
  if (status === 'pending')  return '承認待ち'
  if (status === 'approved') return '承認済み'
  return '却下済み'
}
function crStatusColor(status: string): string {
  if (status === 'pending')  return 'warning'
  if (status === 'approved') return 'success'
  return 'error'
}

// ── Per-session compliance flags ──────────────────────────────
function sessionFlags(sess: WorkSession): ComplianceFlag[] {
  const flags: ComplianceFlag[] = []
  if (sess.actualMinutes >= 360 && sess.breakMinutes === 0) {
    flags.push({ key: 'no_break', level: 'error', icon: 'mdi-coffee-off-outline', message: '6時間以上休憩なし（労基法違反の可能性）' })
  }
  const night = sess.nightMinutes ?? computeNightMins(sess.checkIn, sess.checkOut)
  if (night > 0) {
    flags.push({ key: 'night', level: 'info', icon: 'mdi-moon-waning-crescent', message: `深夜時間帯 ${night}分（割増対象）` })
  }
  return flags
}

const allFlags = computed<ComplianceFlag[]>(() => record.value ? getComplianceFlags(record.value) : [])

// ── Calculations ──────────────────────────────────────────────
function toMins(t?: string): number {
  if (!t) return 0
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

const scheduledMins = computed(() =>
  shifts.value.reduce((s, sh) => s + Math.max(0, toMins(sh.endTime) - toMins(sh.startTime)), 0),
)

const beyondScheduleMins = computed(() => {
  if (!record.value || scheduledMins.value === 0) return 0
  return Math.max(0, record.value.actualMinutes - scheduledMins.value)
})

const totalNightMins = computed(() =>
  sessions.value.reduce((s, sess) => s + (sess.nightMinutes ?? computeNightMins(sess.checkIn, sess.checkOut)), 0),
)

const lateMinutes = computed(() => {
  if (!record.value || shifts.value.length === 0 || !sessions.value[0]?.checkIn) return 0
  return Math.max(0, toMins(sessions.value[0].checkIn) - toMins(shifts.value[0].startTime))
})

const earlyLeaveMinutes = computed(() => {
  if (!record.value || shifts.value.length === 0) return 0
  const lastSess  = sessions.value[sessions.value.length - 1]
  const lastShift = shifts.value[shifts.value.length - 1]
  if (!lastSess?.checkOut) return 0
  return Math.max(0, toMins(lastShift.endTime) - toMins(lastSess.checkOut))
})

// ── Timeline helpers (06:00 – 24:00) ─────────────────────────
const TL_START = 6 * 60
const TL_END   = 24 * 60
const TL_SPAN  = TL_END - TL_START

function tlPct(mins: number): string {
  return `${Math.max(0, Math.min(100, (mins - TL_START) / TL_SPAN * 100))}%`
}

function segStyle(start: string, end: string) {
  const left  = Math.max(0, Math.min(100, (toMins(start) - TL_START) / TL_SPAN * 100))
  const width = Math.max(0.5, Math.min(100 - left, (toMins(end) - toMins(start)) / TL_SPAN * 100))
  return { left: `${left}%`, width: `${width}%` }
}

// ── Shift vs actual deviations ────────────────────────────────
const inDeviation = computed<number | null>(() => {
  if (!shifts.value.length || !sessions.value[0]?.checkIn) return null
  return toMins(sessions.value[0].checkIn) - toMins(shifts.value[0].startTime)
})
const outDeviation = computed<number | null>(() => {
  if (!shifts.value.length) return null
  const lastSess = sessions.value[sessions.value.length - 1]
  if (!lastSess?.checkOut) return null
  return toMins(lastSess.checkOut) - toMins(shifts.value[shifts.value.length - 1].endTime)
})
const workDeviation = computed(() => {
  if (!record.value) return 0
  return record.value.actualMinutes - scheduledMins.value
})

function deviationCls(dev: number | null): string {
  if (dev === null || dev === 0) return 'text-medium-emphasis'
  return dev > 0 ? 'text-error' : 'text-info'
}
const workDeviationCls = computed(() => {
  if (workDeviation.value === 0) return 'text-medium-emphasis'
  return workDeviation.value > 0 ? 'text-error' : 'text-info'
})

const inDeviationText = computed(() => {
  const d = inDeviation.value
  if (d === null) return '—'
  if (d === 0) return '定刻通り'
  return d > 0 ? `${d}分 遅刻` : `${Math.abs(d)}分 早出`
})
const outDeviationText = computed(() => {
  const d = outDeviation.value
  if (d === null) return '—'
  if (d === 0) return '定刻通り'
  return d > 0 ? `${d}分 残業` : `${Math.abs(d)}分 早退`
})
const workDeviationText = computed(() => {
  const d = workDeviation.value
  if (d === 0 || scheduledMins.value === 0) return '—'
  const h = Math.floor(Math.abs(d) / 60)
  const m = Math.abs(d) % 60
  const str = h > 0 ? `${h}h${String(m).padStart(2, '0')}` : `${m}分`
  return d > 0 ? `+${str} 超過` : `-${str} 不足`
})

// ── Status display ────────────────────────────────────────────
const statusLabel = computed(() => {
  switch (record.value?.status) {
    case 'APPROVED':             return '承認済み'
    case 'PENDING_APPROVAL':     return '承認待ち'
    case 'CORRECTION_REQUESTED': return '差し戻し中'
    case 'NOT_SUBMITTED':        return '未申請'
    default: return record.value ? '未申請' : 'データなし'
  }
})
const statusColor = computed(() => {
  switch (record.value?.status) {
    case 'APPROVED':             return 'success'
    case 'PENDING_APPROVAL':     return 'primary'
    case 'CORRECTION_REQUESTED': return 'warning'
    default: return 'default'
  }
})
const statusIcon = computed(() => {
  switch (record.value?.status) {
    case 'APPROVED':             return 'mdi-check-circle'
    case 'PENDING_APPROVAL':     return 'mdi-clock-outline'
    case 'CORRECTION_REQUESTED': return 'mdi-alert-circle-outline'
    default: return 'mdi-circle-outline'
  }
})

// ── Date / breadcrumb ─────────────────────────────────────────
const dateLabel = computed(() => {
  const d   = new Date(dateParam.value)
  const dow = ['日', '月', '火', '水', '木', '金', '土'][d.getDay()]
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日（${dow}）`
})

const breadcrumbs = computed(() => [
  { title: '勤怠一覧', to: '/attendance' },
  { title: employee.value?.name ?? '—', to: `/attendance/${employeeId.value}` },
  { title: dateLabel.value },
])

// ── Approval flow ─────────────────────────────────────────────
const returnDialog     = ref(false)
const returnNote       = ref('')
const complianceDialog = ref(false)

function handleApprove() {
  if (allFlags.value.length > 0) complianceDialog.value = true
  else attStore.approveDay(record.value!.id)
}
function confirmApprove() {
  attStore.approveDay(record.value!.id)
  complianceDialog.value = false
}
function openReturn() { returnNote.value = ''; returnDialog.value = true }
function submitReturn() {
  attStore.returnDay(record.value!.id, returnNote.value)
  returnDialog.value = false
}

// ── Format helpers ────────────────────────────────────────────
function fmtMins(m: number): string {
  const h   = Math.floor(m / 60)
  const min = m % 60
  return min > 0 ? `${h}h${String(min).padStart(2, '0')}` : `${h}h`
}
function fmtDateTime(iso: string): string {
  const d = new Date(iso)
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

// ── Punch event helpers ───────────────────────────────────────
function punchIcon(type: PunchType): string {
  const map: Record<PunchType, string> = {
    CHECK_IN: 'mdi-login', CHECK_OUT: 'mdi-logout',
    BREAK_START: 'mdi-coffee', BREAK_END: 'mdi-coffee-off',
  }
  return map[type]
}
function punchColor(type: PunchType): string {
  const map: Record<PunchType, string> = {
    CHECK_IN: '#4caf50', CHECK_OUT: '#ef5350',
    BREAK_START: '#fb8c00', BREAK_END: '#1976d2',
  }
  return map[type]
}
function punchLabel(type: PunchType): string {
  const map: Record<PunchType, string> = {
    CHECK_IN: '出勤', CHECK_OUT: '退勤',
    BREAK_START: '休憩開始', BREAK_END: '休憩終了',
  }
  return map[type]
}
</script>

<style scoped>
/* ── Header card ───────────────────────── */
.hdr-card {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  padding: 16px 20px;
}
.hdr-left  { display: flex; align-items: center; gap: 12px; }
.hdr-right { display: flex; flex-direction: column; align-items: flex-end; }
.hdr-return-note {
  display: flex; align-items: flex-start;
  background: #fff8e1; border-radius: 6px;
  padding: 4px 8px; max-width: 320px;
  color: #92400e; font-size: 12px; line-height: 1.4;
}

/* ── Section titles ────────────────────── */
.sec-title {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  font-weight: 700;
  color: #6b7280;
  letter-spacing: 0.03em;
  text-transform: uppercase;
}
.sec-count {
  font-size: 11px; font-weight: 500;
  background: #f3f4f6; color: #6b7280;
  border-radius: 10px; padding: 1px 6px;
  margin-left: 2px;
}

/* ── Session card ──────────────────────── */
.sess-card {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  overflow: hidden;
}
.sess-hdr {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px 6px;
}
.sess-num {
  width: 20px; height: 20px; border-radius: 50%;
  background: #e0e7ff; color: #3730a3;
  font-size: 11px; font-weight: 800;
  display: inline-flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}

/* Times row */
.sess-times {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 14px 10px;
  flex-wrap: wrap;
}
.st-col {
  display: flex; flex-direction: column; align-items: center; min-width: 44px;
}
.st-col--em .st-val { color: #111827; }
.st-lbl { font-size: 9px; color: #9ca3af; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; }
.st-val { font-size: 16px; font-weight: 700; font-feature-settings: "tnum"; color: #1f2937; line-height: 1.2; }
.st-val--bold { font-size: 16px; font-weight: 800; }
.st-val--missing { color: #ef5350; }
.st-val--night { color: #7e57c2; }
.st-arrow { font-size: 14px; color: #9ca3af; margin-top: 12px; }
.st-divider { width: 1px; height: 32px; background: #e5e7eb; margin: 4px 4px 0; }

/* Compliance flags */
.sess-flags {
  display: flex; flex-wrap: wrap; gap: 4px;
  padding: 0 14px 8px;
}

/* Shared expansion group */
.sess-expand-group { background: transparent; border-top: 1px solid #f1f5f9; }
.sess-expand-group :deep(.v-expansion-panel) { background: transparent !important; }
.sess-expand-group :deep(.v-expansion-panel--active > .v-expansion-panel-title) { background: #f8fafc; }
.sess-expand-title {
  font-size: 11px !important; color: #9ca3af;
  padding: 6px 14px !important; min-height: 34px !important;
}
.sess-expand-body :deep(.v-expansion-panel-text__wrapper) { padding: 6px 14px 12px; }

/* Correction items inside expansion */
.corr-item {
  padding: 8px 0;
  border-bottom: 1px solid #f1f5f9;
}
.corr-item:last-child { border-bottom: none; padding-bottom: 0; }
.corr-hdr {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 6px; flex-wrap: wrap; gap: 4px;
}
.corr-date { font-size: 10px; color: #9ca3af; }
.corr-times {
  display: flex; flex-direction: column; gap: 3px;
  background: #f8fafc; border-radius: 6px;
  padding: 6px 8px; margin-bottom: 6px;
  font-feature-settings: "tnum";
}
.ct-row { display: flex; align-items: center; gap: 8px; }
.ct-lbl { font-size: 10px; font-weight: 700; min-width: 36px; }
.ct-lbl--before { color: #9ca3af; }
.ct-lbl--after  { color: #15803d; }
.ct-time { font-size: 12px; }
.ct-time--before { color: #9ca3af; text-decoration: line-through; }
.ct-time--after  { color: #1f2937; font-weight: 600; }
.corr-reason {
  font-size: 11px; color: #6b7280; font-style: italic;
  margin-bottom: 4px; line-height: 1.5;
}
.corr-mgr-note {
  display: flex; align-items: flex-start; gap: 4px;
  font-size: 11px; color: #92400e;
  background: #fff7ed; border-radius: 5px;
  padding: 4px 8px; margin-top: 4px;
}
.punch-list { display: flex; flex-direction: column; gap: 5px; }
.punch-item { display: flex; align-items: center; gap: 8px; }
.punch-item--voided { opacity: 0.4; text-decoration: line-through; }
.pi-time  { font-size: 12px; font-feature-settings: "tnum"; font-weight: 600; color: #374151; min-width: 36px; }
.pi-type  { font-size: 12px; color: #6b7280; }
.pi-void  { font-size: 11px; color: #9ca3af; }

/* ── Right column card ─────────────────── */
.r-card {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 14px 16px;
}

/* Unified shift comparison timeline */
.stl-wrap { padding: 4px 0; }
.stl-scale-row { display: flex; align-items: flex-end; gap: 8px; margin-bottom: 0; }
.stl-row { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
.stl-lbl {
  min-width: 30px; font-size: 10px; font-weight: 700;
  text-align: right; flex-shrink: 0;
}
.stl-lbl--shift  { color: #2563eb; }
.stl-lbl--actual { color: #16a34a; }
.stl-total {
  min-width: 38px; font-size: 11px; font-weight: 700;
  font-feature-settings: "tnum"; text-align: right; color: #374151; flex-shrink: 0;
}
/* Scale track */
.stl-track {
  flex: 1; height: 38px; background: #f1f5f9;
  border-radius: 6px; position: relative; overflow: hidden;
}
.stl-track--scale {
  height: 14px; background: transparent; overflow: visible;
}
.stl-tick {
  position: absolute; transform: translateX(-50%);
  font-size: 9px; color: #cbd5e1; font-feature-settings: "tnum";
  white-space: nowrap; line-height: 1;
}
/* Segments */
.stl-seg {
  position: absolute; top: 3px; bottom: 3px;
  border-radius: 4px; overflow: hidden;
  display: flex; align-items: center;
  min-width: 2px; cursor: default;
}
.stl-seg--shift   { background: #3b82f6; }
.stl-seg--actual  { background: #22c55e; }
.stl-seg--missing { background: #fca5a5; top: 12px; bottom: 12px; }
.stl-seg-inner { padding: 0 5px; overflow: hidden; min-width: 0; flex: 1; }
.stl-seg-time {
  display: block; font-size: 10px; font-weight: 600; color: #fff;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis; line-height: 1.4;
}
.stl-seg-sub {
  display: block; font-size: 9px; color: rgba(255,255,255,0.75);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis; line-height: 1.2;
}

/* Deviation table */
.dev-table { display: flex; flex-direction: column; gap: 4px; border-top: 1px solid #f1f5f9; padding-top: 10px; }
.dev-row   { display: flex; justify-content: space-between; align-items: center; }
.dev-key   { font-size: 12px; color: #9ca3af; }
.dev-val   { font-size: 12px; font-weight: 700; font-feature-settings: "tnum"; }

/* Daily summary stats */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 4px;
  margin-bottom: 10px;
}
.si {
  display: flex; flex-direction: column; align-items: center;
  padding: 8px 4px; border-radius: 8px; background: #f8fafc;
}
.si--primary .si-val { color: #111827; font-size: 15px; }
.si--alert   .si-val { color: #dc2626; }
.si--night   .si-val { color: #7e57c2; }
.si-val { font-size: 13px; font-weight: 700; font-feature-settings: "tnum"; white-space: nowrap; }
.si-lbl { font-size: 9px; color: #9ca3af; margin-top: 2px; white-space: nowrap; }

.stats-footer { display: flex; flex-direction: column; gap: 3px; border-top: 1px solid #f1f5f9; padding-top: 8px; }
.sf-row { display: flex; align-items: center; gap: 5px; font-size: 11px; color: #9ca3af; }
.sf-row--approved { color: #16a34a; }
</style>
