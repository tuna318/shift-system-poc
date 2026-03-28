<template>
  <div class="att-det">

    <!-- ── Header ──────────────────────────────────────────────── -->
    <div class="att-det-header">
      <v-btn icon="mdi-arrow-left" variant="text" size="small" density="compact" @click="navigateTo('/attendance')" />
      <div class="att-det-header__center">
        <div class="att-det-header__date">{{ dateLabel }}</div>
        <div class="att-det-header__sub">{{ pageSubLabel }}</div>
      </div>
      <v-chip v-if="isAddMode" size="small" color="primary" variant="tonal">新規追加</v-chip>
      <v-chip v-else-if="record" :color="STATUS_COLORS[record.status]" size="small" variant="tonal">
        {{ STATUS_LABELS[record.status] }}
      </v-chip>
      <v-chip v-else size="small" color="grey" variant="tonal">未記録</v-chip>
    </div>

    <!-- ── Body ────────────────────────────────────────────────── -->
    <div class="att-det-body">

      <!-- ① 申請ステータス ───────────────────────────────────── -->
      <div v-if="record?.status === 'CORRECTION_REQUESTED'" class="status-card status-card--err">
        <v-icon size="22" color="#dc2626" class="sc-icon">mdi-alert-circle</v-icon>
        <div class="sc-content">
          <div class="sc-title">修正依頼</div>
          <div class="sc-desc">{{ record.correctionComment ?? '打刻内容を確認・修正して再申請してください。' }}</div>
        </div>
      </div>
      <div v-else-if="record?.status === 'PENDING_APPROVAL'" class="status-card status-card--pending">
        <v-icon size="22" color="#3587dc" class="sc-icon">mdi-clock-outline</v-icon>
        <div class="sc-content">
          <div class="sc-title">申請中</div>
          <div class="sc-desc">管理者の承認をお待ちください。</div>
        </div>
      </div>

      <!-- ② 勤怠打刻 ─────────────────────────────────────────── -->
      <div class="det-section">
        <div class="det-section-title">勤怠打刻</div>

        <div class="punch-list">
          <div
            v-for="(p, i) in punches"
            :key="i"
            class="punch-card"
            :class="punchCardClass(p.type)"
          >
            <!-- Primary row: type + day + time + delete -->
            <div class="pc-top">
              <v-select
                v-model="p.type"
                :items="PUNCH_TYPES"
                density="compact"
                variant="outlined"
                rounded="lg"
                hide-details
                class="pc-type-sel"
              />
              <v-select
                v-model="p.day"
                :items="DAY_OPTIONS"
                density="compact"
                variant="outlined"
                rounded="lg"
                hide-details
                class="pc-day-sel"
                :class="{ 'pc-day--next': p.day === '翌日' }"
              />
              <v-text-field
                v-model="p.time"
                type="time"
                density="compact"
                variant="outlined"
                rounded="lg"
                hide-details
                class="pc-time-input"
              />
              <button class="pc-del" @click="removePunch(i)" aria-label="削除">
                <v-icon size="14" color="#ef4444">mdi-close</v-icon>
              </button>
            </div>

            <!-- Meta summary bar: tap to expand/edit -->
            <button class="pc-meta-bar" @click="toggleExpand(i)">
              <span class="pmb-chip pmb-method">{{ p.method }}</span>
              <span class="pmb-chip pmb-dept">{{ p.dept }}</span>
              <span v-if="p.variant !== 'NORMAL'" class="pmb-chip" :class="p.variant === 'HELP' ? 'pmb-help' : 'pmb-train'">
                {{ VARIANT_LABEL[p.variant] }}
              </span>
              <span v-if="p.variant === 'HELP' && p.helpStore" class="pmb-chip pmb-store">{{ p.helpStore }}</span>
              <v-icon size="13" class="pmb-chevron">{{ expandedPunches.has(i) ? 'mdi-chevron-up' : 'mdi-chevron-down' }}</v-icon>
            </button>

            <!-- Expanded detail fields -->
            <div v-if="expandedPunches.has(i)" class="pc-expand">
              <div class="pc-meta-grid">
                <div class="pcm-field">
                  <span class="pcm-lbl">方法</span>
                  <v-select v-model="p.method" :items="METHOD_OPTIONS" density="compact" variant="outlined" rounded="lg" hide-details class="pc-meta-sel" />
                </div>
                <div class="pcm-field">
                  <span class="pcm-lbl">部署</span>
                  <v-select v-model="p.dept" :items="DEPT_OPTIONS" density="compact" variant="outlined" rounded="lg" hide-details class="pc-meta-sel" />
                </div>
                <div class="pcm-field">
                  <span class="pcm-lbl">種別</span>
                  <v-select v-model="p.variant" :items="VARIANT_OPTIONS" density="compact" variant="outlined" rounded="lg" hide-details class="pc-meta-sel" />
                </div>
              </div>
              <div v-if="p.variant === 'HELP'" class="pc-store">
                <div class="pcm-field" style="flex:1;">
                  <span class="pcm-lbl">応援先店舗</span>
                  <v-select v-model="p.helpStore" :items="HELP_STORE_OPTIONS" density="compact" variant="outlined" rounded="lg" hide-details class="pc-meta-sel" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="punch-add-row">
          <v-btn
            variant="text"
            size="small"
            rounded="lg"
            prepend-icon="mdi-plus"
            color="primary"
            block
            @click="addPunch"
          >
            打刻を追加
          </v-btn>
        </div>
      </div>

      <!-- ③ 勤務スケジュール ──────────────────────────────────── -->
      <div class="det-section">
        <div class="det-section-title">勤務スケジュール</div>
        <div v-if="scheduleItems.length === 0" class="sg-empty">スケジュールなし</div>
        <div v-else class="sg-list">
          <div v-for="(item, si) in scheduleItems" :key="si" class="sg-item">
            <div class="sg-time">
              <span class="sg-time-range">{{ item.startTime }} 〜 {{ item.endTime }}</span>
            </div>
            <div class="sg-badges">
              <span class="sg-badge sg-badge--dept">{{ item.department }}</span>
              <span v-if="item.variant !== 'NORMAL'" class="sg-badge" :class="item.variant === 'HELP' ? 'sg-badge--help' : 'sg-badge--train'">
                {{ VARIANT_LABEL[item.variant] }}
              </span>
              <span v-if="item.variant === 'HELP' && item.helpStore" class="sg-badge sg-badge--store">{{ item.helpStore }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- ④ 集計 ─────────────────────────────────────────────── -->
      <div class="det-section">
        <div class="det-section-title">集計（自動計算）</div>
        <div class="totals-grid">
          <div class="tg-item">
            <div class="tg-lbl">実働時間</div>
            <div class="tg-val">{{ previewTotalLabel }}</div>
          </div>
          <div class="tg-item">
            <div class="tg-lbl">休憩時間</div>
            <div class="tg-val tg-neutral">{{ previewBreakLabel }}</div>
          </div>
          <div v-if="previewOvertimeMins > 0" class="tg-item">
            <div class="tg-lbl">時間外</div>
            <div class="tg-val tg-overtime">{{ fmtM(previewOvertimeMins) }}</div>
          </div>
          <div v-if="previewNightMins > 0" class="tg-item">
            <div class="tg-lbl">深夜割増</div>
            <div class="tg-val tg-night">{{ fmtM(previewNightMins) }}</div>
          </div>
        </div>
        <div v-if="legalBreakAlert || previewData.totalMins >= 600 || previewNightMins > 0" class="alerts-list">
          <div v-if="legalBreakAlert" class="alert-row alert-warn">
            <v-icon size="13" class="alert-icon">mdi-coffee-alert-outline</v-icon>
            <span>6時間超の勤務 — 法定休憩（45分）が必要です</span>
          </div>
          <div v-if="previewData.totalMins >= 600" class="alert-row alert-err">
            <v-icon size="13" class="alert-icon">mdi-alert-circle-outline</v-icon>
            <span>1日の総勤務 {{ fmtM(previewData.totalMins) }} — 過重労働にご注意ください</span>
          </div>
          <div v-if="previewNightMins > 0" class="alert-row alert-info">
            <v-icon size="13" class="alert-icon">mdi-weather-night</v-icon>
            <span>深夜割増（22:00〜05:00）{{ fmtM(previewNightMins) }} が含まれます</span>
          </div>
        </div>
      </div>

      <!-- ⑤ 備考 ─────────────────────────────────────────────── -->
      <div class="det-section">
        <div class="det-section-title">備考</div>
        <div class="note-wrap">
          <v-textarea
            v-model="noteText"
            placeholder="例：遅刻の理由、特記事項など"
            density="compact"
            variant="outlined"
            rounded="lg"
            rows="2"
            hide-details
            auto-grow
          />
        </div>
      </div>

      <!-- ── Actions ───────────────────────────────────────────── -->
      <div class="det-actions">
        <v-btn
          variant="tonal"
          rounded="lg"
          color="primary"
          class="flex-1-1"
          :disabled="!isDirty"
          @click="saveRecord"
        >
          <v-icon start size="16">mdi-content-save-outline</v-icon>
          保存
        </v-btn>
        <v-btn
          color="primary"
          rounded="lg"
          elevation="0"
          class="flex-1-1"
          :disabled="!canApply"
          :loading="submitting"
          @click="submitApply"
        >
          <v-icon start size="16">mdi-send-outline</v-icon>
          申請
        </v-btn>
      </div>

    </div>

  </div>
</template>

<script setup lang="ts">
import type { AttendanceRecord } from '~/types'

const route  = useRoute()
const { myAttendance, getShiftForDate, getShiftsForDate, formatMinutes } = useMockData()
const appStore = useAppStore()

// ── Session / add-mode query params ──────────────────────────────
const sessionParam = computed(() => {
  const q = route.query.session
  return q !== undefined && q !== null && q !== '' ? Number(q) : null
})
const isAddMode = computed(() => route.query.add === 'true')

// ── Resolve record ────────────────────────────────────────────────
const dateParam = computed(() => {
  const p = route.params.id as string
  return /^\d{4}-\d{2}-\d{2}$/.test(p) ? p : null
})
const record = computed<AttendanceRecord | undefined>(() => {
  const p = route.params.id as string
  if (dateParam.value) return myAttendance.find(a => a.date === p)
  return myAttendance.find(a => a.id === p)
})
const recordDate = computed(() => dateParam.value ?? record.value?.date ?? '')

// ── Shifts ────────────────────────────────────────────────────────
const shifts = computed(() => getShiftsForDate(recordDate.value))
const shift  = computed(() => shifts.value[0] ?? null)

const scheduleItems = computed(() =>
  shifts.value.map((s, i) => {
    const session = record.value?.sessions?.[i]
    return {
      startTime:  s.startTime,
      endTime:    s.endTime,
      department: session?.department  ?? s.department,
      variant:    session?.punchVariant ?? record.value?.punchVariant ?? 'NORMAL',
      helpStore:  session?.helpStore   ?? record.value?.helpStore   ?? '',
    }
  })
)

// ── Labels ────────────────────────────────────────────────────────
const DOW = ['日', '月', '火', '水', '木', '金', '土']

const dateLabel = computed(() => {
  if (!recordDate.value) return '—'
  const d = new Date(recordDate.value)
  return `${d.getFullYear()}/${String(d.getMonth()+1).padStart(2,'0')}/${String(d.getDate()).padStart(2,'0')} (${DOW[d.getDay()]})`
})

const workTypeLabel = computed(() => {
  const d = new Date(recordDate.value)
  const dow = d.getDay()
  if (dow === 0 || dow === 6) return '公休・休日'
  if (shifts.value.length > 1) return `分割シフト（${shifts.value.length}本）`
  return shifts.value.length ? '所定労働日' : '公休'
})

const SESSION_LABELS_DET = ['朝番', '夕番', '深夜番']

const pageSubLabel = computed(() => {
  if (isAddMode.value) return 'セッション追加申請'
  if (sessionParam.value !== null) {
    return SESSION_LABELS_DET[sessionParam.value] ?? `セッション${sessionParam.value + 1}`
  }
  return workTypeLabel.value
})

const fmtShiftEnd = computed(() => {
  if (!shift.value) return '—'
  const last = shifts.value[shifts.value.length - 1]
  const { startTime } = shifts.value[0]
  const endTime = last.endTime
  const [sh, sm] = startTime.split(':').map(Number)
  const [eh, em] = endTime.split(':').map(Number)
  if (eh * 60 + em < sh * 60 + sm) return `${endTime}(翌)`
  if (shifts.value.length > 1) return `${shifts.value[0].startTime} 〜 ${endTime}`
  return endTime
})

const STATUS_LABELS: Record<string, string> = {
  APPROVED: '承認済み', PENDING_APPROVAL: '申請中',
  CORRECTION_REQUESTED: '修正依頼', NOT_SUBMITTED: '未提出', ABSENT: '欠勤',
}
const STATUS_COLORS: Record<string, string> = {
  APPROVED: 'success', PENDING_APPROVAL: 'primary',
  CORRECTION_REQUESTED: 'error', NOT_SUBMITTED: 'grey', ABSENT: 'warning',
}

// ── Punch rows ────────────────────────────────────────────────────
const PUNCH_TYPES    = ['出勤', '休憩入り', '休憩戻り', '退勤']
const DAY_OPTIONS    = ['当日', '翌日']
const METHOD_OPTIONS = ['アプリ', 'ICカード', 'iPad']
const DEPT_OPTIONS   = ['ホール', 'キッチン', 'レジ']
const VARIANT_OPTIONS = [
  { title: '通常', value: 'NORMAL' },
  { title: 'ヘルプ', value: 'HELP' },
  { title: '研修', value: 'TRAINING' },
]
const VARIANT_LABEL: Record<string, string> = { NORMAL: '通常', HELP: 'ヘルプ', TRAINING: '研修' }
const HELP_STORE_OPTIONS = ['新宿店', '池袋店', '六本木店', '表参道店']

interface PunchRow {
  type: string
  day: string
  time: string
  method: string
  dept: string
  variant: string
  helpStore: string
}

function sessionToPunchRows(
  checkIn: string,
  checkOut: string | null,
  breaks: { start: string; end: string | null }[],
  dept = 'ホール',
  variant = 'NORMAL',
  helpStore = '',
): PunchRow[] {
  const base = { method: 'アプリ', dept, variant, helpStore }
  const rows: PunchRow[] = [{ type: '出勤', day: '当日', time: checkIn, ...base }]
  for (const b of breaks) {
    if (b.start) rows.push({ type: '休憩入り', day: '当日', time: b.start, ...base })
    if (b.end)   rows.push({ type: '休憩戻り', day: '当日', time: b.end,   ...base })
  }
  if (checkOut) {
    const [ih, im] = checkIn.split(':').map(Number)
    const [oh, om] = checkOut.split(':').map(Number)
    rows.push({ type: '退勤', day: oh * 60 + om < ih * 60 + im ? '翌日' : '当日', time: checkOut, ...base })
  }
  return rows
}

function buildInitialPunches(): PunchRow[] {
  if (isAddMode.value) {
    return [{ type: '出勤', day: '当日', time: '', method: 'アプリ', dept: 'ホール', variant: 'NORMAL', helpStore: '' }]
  }
  const r = record.value
  if (!r) return []

  const rDept    = r.department  ?? 'ホール'
  const rVariant = r.punchVariant ?? 'NORMAL'
  const rStore   = r.helpStore   ?? ''

  if (sessionParam.value !== null && r.sessions && sessionParam.value < r.sessions.length) {
    const s = r.sessions[sessionParam.value]
    return sessionToPunchRows(s.checkIn, s.checkOut ?? null, s.breaks ?? [], s.department ?? rDept, s.punchVariant ?? rVariant, s.helpStore ?? rStore)
  }
  if (r.sessions && r.sessions.length > 0) {
    return r.sessions.flatMap(s =>
      sessionToPunchRows(s.checkIn, s.checkOut ?? null, s.breaks ?? [], s.department ?? rDept, s.punchVariant ?? rVariant, s.helpStore ?? rStore)
    )
  }
  if (!r.checkIn) return []
  return sessionToPunchRows(r.checkIn, r.checkOut, r.breaks ?? [], rDept, rVariant, rStore)
}

const punches  = reactive<PunchRow[]>(buildInitialPunches())
const noteText = ref(record.value?.note ?? '')

// ── Expand state (UI only, not tracked in dirty) ──────────────────
const expandedPunches = reactive(new Set<number>())
function toggleExpand(i: number) {
  if (expandedPunches.has(i)) expandedPunches.delete(i)
  else expandedPunches.add(i)
}

function addPunch() {
  const last = punches[punches.length - 1]
  punches.push({ type: '退勤', day: '当日', time: '', method: last?.method ?? 'アプリ', dept: last?.dept ?? 'ホール', variant: last?.variant ?? 'NORMAL', helpStore: last?.helpStore ?? '' })
}
function removePunch(i: number) { punches.splice(i, 1) }

function punchCardClass(type: string): string {
  return { '出勤': 'pc--checkin', '退勤': 'pc--checkout', '休憩入り': 'pc--break', '休憩戻り': 'pc--resume' }[type] ?? ''
}

// ── Schedule section: resolved dept/variant from record ───────────
function resolveSessionDept(): string {
  const r = record.value
  if (!r) return 'ホール'
  if (sessionParam.value !== null && r.sessions && sessionParam.value < r.sessions.length)
    return r.sessions[sessionParam.value].department ?? r.department ?? 'ホール'
  return r.department ?? 'ホール'
}
function resolveSessionVariant(): string {
  const r = record.value
  if (!r) return 'NORMAL'
  if (sessionParam.value !== null && r.sessions && sessionParam.value < r.sessions.length)
    return r.sessions[sessionParam.value].punchVariant ?? r.punchVariant ?? 'NORMAL'
  return r.punchVariant ?? 'NORMAL'
}
function resolveHelpStoreVal(): string {
  const r = record.value
  if (!r) return ''
  if (sessionParam.value !== null && r.sessions && sessionParam.value < r.sessions.length)
    return r.sessions[sessionParam.value].helpStore ?? ''
  return r.helpStore ?? ''
}
const resolvedDept      = computed(resolveSessionDept)
const resolvedVariant   = computed(resolveSessionVariant)
const resolvedHelpStore = computed(resolveHelpStoreVal)

// ── Totals ────────────────────────────────────────────────────────
function toAbsoluteMins(time: string, day: string, referenceTime?: string): number {
  if (!time) return -1
  const [h, m] = time.split(':').map(Number)
  let total = h * 60 + m
  if (day === '翌日') total += 24 * 60
  else if (referenceTime) {
    const [rh, rm] = referenceTime.split(':').map(Number)
    if (total < rh * 60 + rm) total += 24 * 60
  }
  return total
}
function computeNightMins(inMins: number, outMins: number): number {
  if (inMins < 0 || outMins < 0) return 0
  const bands = [{ s: 22*60, e: 24*60 }, { s: 24*60, e: 29*60 }]
  return bands.reduce((sum, b) => sum + Math.max(0, Math.min(outMins, b.e) - Math.max(inMins, b.s)), 0)
}

const previewData = computed(() => {
  let totalMins = 0, breakMins = 0, nightMins = 0
  let sessionIn: { time: string; day: string } | null = null
  let breakIn:   { time: string; day: string } | null = null
  let sessionBreak = 0

  for (const p of punches) {
    if (!p.time) continue
    if (p.type === '出勤') {
      sessionIn = { time: p.time, day: p.day }; breakIn = null; sessionBreak = 0
    } else if (p.type === '退勤' && sessionIn) {
      const inAbs  = toAbsoluteMins(sessionIn.time, sessionIn.day)
      const outAbs = toAbsoluteMins(p.time, p.day, sessionIn.time)
      totalMins += Math.max(0, outAbs - inAbs - sessionBreak)
      nightMins += computeNightMins(inAbs, outAbs)
      sessionIn = null; sessionBreak = 0
    } else if (p.type === '休憩入り') {
      breakIn = { time: p.time, day: p.day }
    } else if (p.type === '休憩戻り' && breakIn) {
      const dur = Math.max(0, toAbsoluteMins(p.time, p.day, breakIn.time) - toAbsoluteMins(breakIn.time, breakIn.day))
      sessionBreak += dur; breakMins += dur; breakIn = null
    }
  }
  const scheduledMins = shifts.value.reduce((sum, s) =>
    sum + toAbsoluteMins(s.endTime, '当日', s.startTime) - toAbsoluteMins(s.startTime, '当日'), 0)
  const overtimeMins = scheduledMins > 0 ? Math.max(0, totalMins - scheduledMins) : 0
  return { totalMins: Math.max(0, totalMins), breakMins, nightMins, overtimeMins }
})

const previewNightMins    = computed(() => previewData.value.nightMins)
const previewOvertimeMins = computed(() => previewData.value.overtimeMins)

function fmtM(mins: number): string {
  if (!mins) return '0分'
  const h = Math.floor(mins / 60), m = mins % 60
  return m > 0 ? `${h}時間${m}分` : `${h}時間`
}
const previewTotalLabel = computed(() => fmtM(previewData.value.totalMins) || '—')
const previewBreakLabel = computed(() => previewData.value.breakMins > 0 ? fmtM(previewData.value.breakMins) : '—')
const legalBreakAlert   = computed(() => previewData.value.totalMins >= 360 && previewData.value.breakMins === 0)

// ── Audit trail ───────────────────────────────────────────────────
const changeRows = computed(() => {
  const r = record.value
  if (!r) return []
  const rows: { label: string; from: string; to: string }[] = []
  if (r.originalCheckIn  !== undefined && r.originalCheckIn  !== r.checkIn)
    rows.push({ label: '出勤', from: r.originalCheckIn  ?? '—', to: r.checkIn  ?? '—' })
  if (r.originalCheckOut !== undefined && r.originalCheckOut !== r.checkOut)
    rows.push({ label: '退勤', from: r.originalCheckOut ?? '—', to: r.checkOut ?? '—' })
  return rows
})

// ── Dirty tracking ────────────────────────────────────────────────
const savedSnapshot = ref(JSON.stringify(buildInitialPunches()))
const isDirty = computed(() => JSON.stringify(punches) !== savedSnapshot.value)

// ── Actions ───────────────────────────────────────────────────────
const canApply = computed(() => {
  const s = record.value?.status
  return s !== 'PENDING_APPROVAL' && s !== 'APPROVED'
})
const submitting = ref(false)

async function submitApply() {
  submitting.value = true
  await new Promise(r => setTimeout(r, 600))
  submitting.value = false
  const msg = sessionParam.value !== null
    ? `${dateLabel.value}（${SESSION_LABELS_DET[sessionParam.value] ?? `セッション${sessionParam.value + 1}`}）の修正申請を送信しました`
    : `${dateLabel.value} の申請を送信しました`
  appStore.showSnackbar(msg, 'success')
  navigateTo('/attendance')
}

function saveRecord() {
  savedSnapshot.value = JSON.stringify(punches)
  appStore.showSnackbar('保存しました', 'success')
}
</script>

<style scoped>
/* ── Page shell ─────────────────────────────────────────────────── */
.att-det {
  display: flex;
  flex-direction: column;
  min-height: 100%;
  background: #f3f4f6;
}

/* ── Header ────────────────────────────────────────────────────── */
.att-det-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 12px 10px;
  background: #fff;
  border-bottom: 1px solid #e5e7eb;
  position: sticky;
  top: 0;
  z-index: 10;
}
.att-det-header__center { flex: 1; min-width: 0; }
.att-det-header__date   { font-size: 15px; font-weight: 700; color: #111827; }
.att-det-header__sub    { font-size: 11px; color: #9ca3af; margin-top: 1px; }

/* ── Body ──────────────────────────────────────────────────────── */
.att-det-body {
  flex: 1;
  padding: 12px 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

/* ── Status card ───────────────────────────────────────────────── */
.status-card {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  padding: 14px 16px;
  border-radius: 14px;
  border: 1px solid;
}
.status-card--err     { background: #fef2f2; border-color: #fca5a5; }
.status-card--pending { background: #eff6ff; border-color: #bfdbfe; }
.sc-icon   { flex-shrink: 0; margin-top: 1px; }
.sc-content { flex: 1; min-width: 0; }
.sc-title  { font-size: 13px; font-weight: 700; color: #111827; margin-bottom: 4px; }
.sc-desc   { font-size: 12px; color: #4b5563; line-height: 1.55; }

/* ── Section card ──────────────────────────────────────────────── */
.det-section {
  background: #fff;
  border-radius: 14px;
  border: 1px solid #e5e7eb;
  overflow: hidden;
}
.det-section-title {
  font-size: 10px;
  font-weight: 700;
  color: #6b7280;
  letter-spacing: 0.8px;
  text-transform: uppercase;
  background: #f9fafb;
  padding: 8px 16px;
  border-bottom: 1px solid #f3f4f6;
}

/* ── Punch list ────────────────────────────────────────────────── */
.punch-list { display: flex; flex-direction: column; }

.punch-card {
  padding: 10px 14px;
  border-bottom: 1px solid #f3f4f6;
  border-left: 3px solid transparent;
}
.punch-card:last-child { border-bottom: none; }
.pc--checkin  { border-left-color: #22c55e; }
.pc--checkout { border-left-color: #ef4444; }
.pc--break    { border-left-color: #f59e0b; }
.pc--resume   { border-left-color: #3b82f6; }

/* Row 1: type + day + time + del */
.pc-top {
  display: grid;
  grid-template-columns: 86px 1fr 96px 28px;
  gap: 6px;
  align-items: center;
  margin-bottom: 8px;
}
.pc-type-sel  :deep(.v-field__input) { font-size: 13px; font-weight: 600; min-height: 34px; padding: 0 4px; }
.pc-type-sel  :deep(.v-field__append-inner) { padding-inline-start: 0 !important; }
.pc-day-sel   :deep(.v-field__input) { font-size: 12px; font-weight: 600; min-height: 34px; padding: 0 4px; }
.pc-day--next :deep(.v-field__input) { color: #ea580c !important; }
.pc-day--next :deep(.v-field) { background: #fff7ed !important; }
.pc-time-input :deep(.v-field__input) { font-size: 15px; font-weight: 700; min-height: 34px; padding: 0 6px; font-variant-numeric: tabular-nums; letter-spacing: 0.5px; }
.pc-del {
  width: 26px; height: 26px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  background: #fee2e2; border: none; cursor: pointer; flex-shrink: 0;
}
.pc-del:active { background: #fecaca; }

/* Meta summary bar */
.pc-meta-bar {
  display: flex;
  align-items: center;
  gap: 5px;
  width: 100%;
  background: none;
  border: none;
  padding: 5px 0 2px;
  cursor: pointer;
  text-align: left;
}
.pmb-chip {
  font-size: 10px; font-weight: 600;
  padding: 2px 7px; border-radius: 10px;
  white-space: nowrap; line-height: 1.6;
}
.pmb-method { background: #dbeafe; color: #1d4ed8; }
.pmb-dept   { background: #f3f4f6; color: #374151; }
.pmb-help   { background: #fef3c7; color: #b45309; }
.pmb-train  { background: #ccfbf1; color: #0f766e; }
.pmb-store  { background: #fff7ed; color: #c2410c; }
.pmb-chevron { margin-left: auto; color: #d1d5db !important; flex-shrink: 0; }

/* Expanded panel */
.pc-expand {
  margin-top: 8px;
  padding-top: 10px;
  border-top: 1px dashed #e5e7eb;
}
.pc-meta-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
  margin-bottom: 2px;
}
.pcm-field {
  display: flex; flex-direction: column; gap: 3px;
  min-width: 0;
}
.pcm-lbl {
  font-size: 9px; color: #9ca3af; font-weight: 700;
  letter-spacing: 0.4px; line-height: 1; white-space: nowrap;
  padding-left: 2px;
}
.pc-meta-sel :deep(.v-field__input) { font-size: 11px; font-weight: 600; min-height: 30px; padding: 0 4px; }
.pc-meta-sel :deep(.v-field__append-inner) { padding-inline-start: 0 !important; }
.pc-meta-sel :deep(.v-field__append-inner .v-icon) { font-size: 14px !important; }

/* Help store row inside expanded */
.pc-store {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px dashed #fde68a;
}

/* Add punch row */
.punch-add-row {
  padding: 4px 14px 8px;
  border-top: 1px solid #f3f4f6;
}

/* ── Schedule list ─────────────────────────────────────────────── */
.sg-empty {
  padding: 14px 16px;
  font-size: 13px; color: #9ca3af;
}
.sg-list { display: flex; flex-direction: column; }
.sg-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 11px 16px;
  border-bottom: 1px solid #f3f4f6;
}
.sg-item:last-child { border-bottom: none; }
.sg-time { flex-shrink: 0; }
.sg-time-range {
  font-size: 14px; font-weight: 700; color: #111827;
  font-variant-numeric: tabular-nums; letter-spacing: 0.3px;
}
.sg-badges { display: flex; align-items: center; gap: 5px; flex-wrap: wrap; }
.sg-badge {
  font-size: 10px; font-weight: 600;
  padding: 2px 7px; border-radius: 10px;
  white-space: nowrap;
}
.sg-badge--dept  { background: #f3f4f6; color: #374151; }
.sg-badge--help  { background: #fef3c7; color: #b45309; }
.sg-badge--train { background: #ccfbf1; color: #0f766e; }
.sg-badge--store { background: #fff7ed; color: #c2410c; }

/* ── Totals grid ───────────────────────────────────────────────── */
.totals-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1px;
  background: #f3f4f6;
}
.tg-item {
  background: #fff;
  padding: 14px 12px;
  text-align: center;
}
.tg-lbl { font-size: 10px; color: #9ca3af; font-weight: 600; letter-spacing: 0.3px; margin-bottom: 4px; }
.tg-val { font-size: 20px; font-weight: 700; color: #111827; line-height: 1; }
.tg-neutral  { color: #6b7280; font-size: 18px; }
.tg-overtime { color: #ea580c; }
.tg-night    { color: #4338ca; }

/* ── Compliance alerts ─────────────────────────────────────────── */
.alerts-list { display: flex; flex-direction: column; gap: 4px; padding: 8px 14px 12px; }
.alert-row {
  display: flex; align-items: flex-start; gap: 6px;
  padding: 7px 10px;
  border-radius: 8px;
  font-size: 11px; line-height: 1.5; font-weight: 500;
}
.alert-icon { flex-shrink: 0; margin-top: 1px; }
.alert-warn { background: #fffbeb; color: #92400e; }
.alert-err  { background: #fef2f2; color: #991b1b; }
.alert-info { background: #eff6ff; color: #1e40af; }

/* ── Change history ────────────────────────────────────────────── */
.change-list { }
.change-row {
  display: flex; align-items: center; gap: 6px;
  padding: 9px 16px; font-size: 12px;
}
.change-row + .change-row { border-top: 1px solid #f3f4f6; }
.cr-label { min-width: 36px; color: #9ca3af; font-weight: 600; }
.cr-from  { text-decoration: line-through; color: #d1d5db; }
.cr-to    { color: #3587dc; font-weight: 700; }

/* ── Note ──────────────────────────────────────────────────────── */
.note-wrap { padding: 12px 14px; }

/* ── Session add ───────────────────────────────────────────────── */

/* ── Actions ───────────────────────────────────────────────────── */
.det-actions {
  display: flex;
  gap: 10px;
  padding-bottom: env(safe-area-inset-bottom, 0px);
}
.flex-1-1 { flex: 1 1 0; }
</style>
