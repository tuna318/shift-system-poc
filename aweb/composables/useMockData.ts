import type {
  Employee, ShiftBoard, ShiftEntry, AttendanceRecord, AttendanceStatus, PunchEvent,
  CollectionRequest, CollectionSubmission, ComplianceAlert,
  ShiftPreference, ShiftPreferenceEntry, CellStatus, AdjustingResponseStatus,
  ShiftSlot, DaySlotAssignment, AllocationSetup,
  CrossShopRequest, ConfirmedEmployee,
  CorrectionRequest, ComplianceFlag,
} from '~/types'

// ============================================================
// EMPLOYEES
// ============================================================
const employees: Employee[] = [
  // キッチン (5)
  { id: 'emp-001', name: '山田 太郎', nameKana: 'ヤマダ タロウ', department: 'キッチン', position: 'キッチンリーダー', hourlyWage: 1200, employmentType: 'FULL_TIME', status: 'ACTIVE', hireDate: '2022-04-01', pin: '1234', skills: ['調理', '発注管理', '開閉店', 'トレーナー', '食品衛生管理者'] },
  { id: 'emp-002', name: '鈴木 一郎', nameKana: 'スズキ イチロウ', department: 'キッチン', position: 'クルー', hourlyWage: 1050, employmentType: 'PART_TIME', status: 'ACTIVE', hireDate: '2023-06-15', pin: '2345', skills: ['調理'] },
  { id: 'emp-003', name: '田中 恵子', nameKana: 'タナカ ケイコ', department: 'キッチン', position: 'クルー', hourlyWage: 1050, employmentType: 'PART_TIME', status: 'ACTIVE', hireDate: '2023-09-01', pin: '3456', skills: ['調理', 'ドリンク'] },
  { id: 'emp-004', name: '渡辺 健司', nameKana: 'ワタナベ ケンジ', department: 'キッチン', position: 'クルー', hourlyWage: 1100, employmentType: 'FULL_TIME', status: 'ACTIVE', hireDate: '2021-10-01', pin: '4567', skills: ['調理', '発注管理', '食品衛生管理者'] },
  { id: 'emp-005', name: '伊藤 美咲', nameKana: 'イトウ ミサキ', department: 'キッチン', position: 'クルー', hourlyWage: 1050, employmentType: 'PART_TIME', status: 'ACTIVE', hireDate: '2024-04-01', pin: '5678', skills: ['調理'] },
  // ホール (6)
  { id: 'emp-006', name: '佐藤 花子', nameKana: 'サトウ ハナコ', department: 'ホール', position: 'ホールリーダー', hourlyWage: 1200, employmentType: 'FULL_TIME', status: 'ACTIVE', hireDate: '2020-07-01', pin: '6789', skills: ['接客', '開閉店', 'トレーナー', 'レジ操作'] },
  { id: 'emp-007', name: '高橋 和也', nameKana: 'タカハシ カズヤ', department: 'ホール', position: 'クルー', hourlyWage: 1050, employmentType: 'PART_TIME', status: 'ACTIVE', hireDate: '2023-03-01', pin: '7890', skills: ['接客', 'ドリンク'] },
  { id: 'emp-008', name: '中村 さくら', nameKana: 'ナカムラ サクラ', department: 'ホール', position: 'クルー', hourlyWage: 1050, employmentType: 'PART_TIME', status: 'ACTIVE', hireDate: '2024-01-15', pin: '8901', skills: ['接客'] },
  { id: 'emp-009', name: '小林 正樹', nameKana: 'コバヤシ マサキ', department: 'ホール', position: 'クルー', hourlyWage: 1100, employmentType: 'PART_TIME', status: 'ACTIVE', hireDate: '2022-11-01', pin: '9012', skills: ['接客', 'ドリンク', 'レジ操作'] },
  { id: 'emp-010', name: '加藤 真由', nameKana: 'カトウ マユ', department: 'ホール', position: 'クルー', hourlyWage: 1050, employmentType: 'PART_TIME', status: 'ACTIVE', hireDate: '2024-06-01', pin: '0123', skills: ['接客'] },
  { id: 'emp-011', name: '吉田 隼人', nameKana: 'ヨシダ ハヤト', department: 'ホール', position: 'クルー', hourlyWage: 1050, employmentType: 'PART_TIME', status: 'INACTIVE', hireDate: '2023-08-01', pin: '1357', skills: ['接客', 'ドリンク'] },
  // レジ (4)
  { id: 'emp-012', name: '松本 幸子', nameKana: 'マツモト サチコ', department: 'レジ', position: 'レジリーダー', hourlyWage: 1150, employmentType: 'FULL_TIME', status: 'ACTIVE', hireDate: '2021-04-01', pin: '2468', skills: ['レジ操作', '売上管理', '開閉店', 'トレーナー'] },
  { id: 'emp-013', name: '木村 大輔', nameKana: 'キムラ ダイスケ', department: 'レジ', position: 'クルー', hourlyWage: 1050, employmentType: 'PART_TIME', status: 'ACTIVE', hireDate: '2023-10-01', pin: '3579', skills: ['レジ操作'] },
  { id: 'emp-014', name: '清水 麻衣', nameKana: 'シミズ マイ', department: 'レジ', position: 'クルー', hourlyWage: 1050, employmentType: 'PART_TIME', status: 'ACTIVE', hireDate: '2024-03-01', pin: '4680', skills: ['レジ操作', '接客'] },
  { id: 'emp-015', name: '斎藤 凛', nameKana: 'サイトウ リン', department: 'レジ', position: 'クルー', hourlyWage: 1050, employmentType: 'PART_TIME', status: 'ACTIVE', hireDate: '2024-09-01', pin: '5791', skills: ['レジ操作'] },
]

// ============================================================
// HELPERS
// ============================================================
function calcWage(empId: string, start: string, end: string): number {
  const emp = employees.find(e => e.id === empId)
  if (!emp) return 0
  const [sh, sm] = start.split(':').map(Number)
  const [eh, em] = end.split(':').map(Number)
  const hours = (eh * 60 + em - (sh * 60 + sm)) / 60
  return Math.round(emp.hourlyWage * hours)
}

function dStr(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function monthDays(year: number, month: number): number {
  return new Date(year, month, 0).getDate()
}

// ============================================================
// ALLOCATION SETUP FACTORY
// ============================================================
function makeAllocationSetup(prefix: string, year: number, month: number): AllocationSetup {
  const days = monthDays(year, month)
  const slots: ShiftSlot[] = [
    {
      id: `${prefix}-s1`,
      label: '朝番',
      startTime: '07:00',
      endTime: '15:00',
      color: '#3587dc',
      departmentConfigs: [
        { department: 'キッチン', roleRequirements: [{ role: 'キッチンリーダー', count: 1 }, { role: 'クルー', count: 2 }] },
      ],
    },
    {
      id: `${prefix}-s2`,
      label: 'ランチ',
      startTime: '10:00',
      endTime: '15:00',
      color: '#4bd08b',
      departmentConfigs: [
        { department: 'ホール', roleRequirements: [{ role: 'ホールリーダー', count: 1 }, { role: 'クルー', count: 3 }] },
      ],
    },
    {
      id: `${prefix}-s3`,
      label: '夕番',
      startTime: '15:00',
      endTime: '22:00',
      color: '#f8c076',
      departmentConfigs: [
        { department: 'ホール', roleRequirements: [{ role: 'ホールリーダー', count: 1 }, { role: 'クルー', count: 2 }] },
        { department: 'レジ', roleRequirements: [{ role: 'レジリーダー', count: 1 }, { role: 'クルー', count: 1 }] },
      ],
    },
  ]
  const assignments: DaySlotAssignment[] = []
  for (let d = 1; d <= days; d++) {
    const date = dStr(year, month, d)
    const dow = new Date(date).getDay()
    const isWknd = dow === 0 || dow === 6
    assignments.push({
      date,
      slotIds: isWknd ? [`${prefix}-s2`, `${prefix}-s3`] : [`${prefix}-s1`, `${prefix}-s3`],
    })
  }
  return { slots, assignments }
}

// ============================================================
// SHIFT ENTRY GENERATION
// Profile: 'past' = mostly CONFIRMED; 'current' = mixed; 'future' = mostly SHIFT_REQUESTED, sparse
// ============================================================
const kitchenCrew = ['emp-002', 'emp-003', 'emp-004', 'emp-005']
const hallCrew    = ['emp-007', 'emp-008', 'emp-009', 'emp-010']
const rejiCrew    = ['emp-013', 'emp-014', 'emp-015']

function makeMonthEntries(
  prefix: string,
  year: number,
  month: number,
  profile: 'past' | 'current' | 'future',
): ShiftEntry[] {
  const entries: ShiftEntry[] = []
  let seq = 1
  const days = monthDays(year, month)

  function id(): string { return `${prefix}-${String(seq++).padStart(3, '0')}` }

  function status(d: number, i: number = 0): CellStatus {
    if (profile === 'past') return 'CONFIRMED'
    if (profile === 'future') return 'SHIFT_REQUESTED'
    const r = (d * 3 + i) % 10
    if (r < 6) return 'CONFIRMED'
    if (r < 8) return 'SHIFT_REQUESTED'
    return 'ADJUSTING'
  }

  function entry(empId: string, date: string, s: string, e: string, dept: string, st: CellStatus, note?: string): ShiftEntry {
    return { id: id(), employeeId: empId, shiftDate: date, startTime: s, endTime: e, department: dept, cellStatus: st, estimatedWage: calcWage(empId, s, e), note }
  }

  for (let d = 1; d <= days; d++) {
    // Future boards: sparse — only ~60% of days have entries
    if (profile === 'future' && (d % 5 === 0 || d % 7 === 3)) continue

    const date = dStr(year, month, d)
    const dow = new Date(date).getDay()
    const isWknd = dow === 0 || dow === 6
    const ci = (d - 1) % 4 // crew index for rotation

    if (!isWknd) {
      // ── 朝番 07:00-15:00 キッチン ──────────────────────────
      // Leader always present
      entries.push(entry('emp-001', date, '07:00', '15:00', 'キッチン', status(d, 0)))
      // Crew 1 — skip on d≡2 mod 7 (one short day per week)
      if (d % 7 !== 2) {
        entries.push(entry(kitchenCrew[ci], date, '07:00', '15:00', 'キッチン', status(d, 1)))
      }
      // Crew 2 — skip on d≡1 mod 5
      if (d % 5 !== 1) {
        entries.push(entry(kitchenCrew[(ci + 1) % 4], date, '07:00', '15:00', 'キッチン', status(d, 2)))
      }
    }

    if (isWknd) {
      // ── ランチ 10:00-15:00 ホール ───────────────────────────
      // Required: 1 leader + 3 crew = 4; provide 3-4
      const lunchSt = status(d, 0)
      entries.push(entry('emp-006', date, '10:00', '15:00', 'ホール', lunchSt))
      entries.push(entry(hallCrew[ci % 4], date, '10:00', '15:00', 'ホール', lunchSt))
      entries.push(entry(hallCrew[(ci + 1) % 4], date, '10:00', '15:00', 'ホール', lunchSt))
      // 3rd crew — present most weekends (2 out of 3)
      if (d % 3 !== 0) {
        entries.push(entry(hallCrew[(ci + 2) % 4], date, '10:00', '15:00', 'ホール', lunchSt))
      }
    }

    // ── 夕番 15:00-22:00 ホール + レジ ──────────────────────
    const eveSt = status(d, 3)
    // ホール: leader + 2 crew (sometimes 1 crew)
    entries.push(entry('emp-006', date, '15:00', '22:00', 'ホール', eveSt))
    entries.push(entry(hallCrew[(ci + 2) % 4], date, '15:00', '22:00', 'ホール', eveSt))
    if (d % 6 !== 4) {
      entries.push(entry(hallCrew[(ci + 3) % 4], date, '15:00', '22:00', 'ホール', eveSt))
    }
    // レジ: leader + 1 crew (sometimes no crew = understaffed)
    entries.push(entry('emp-012', date, '15:00', '22:00', 'レジ', eveSt))
    if (d % 4 !== 3) {
      entries.push(entry(rejiCrew[ci % 3], date, '15:00', '22:00', 'レジ', eveSt))
    }
  }

  // Sprinkle a few day-off entries for realism
  // Each entry maps to a specific shift slot (startTime/endTime), not the whole day.
  // emp-009 and emp-007 (ホール) get two entries on day 14 — one per slot (ランチ + 夕番).
  const dayOffPlan: Array<[string, number, string, string]> = [
    ['emp-002', 9,  '07:00', '15:00'],  // キッチン 朝番 (月)
    ['emp-009', 14, '10:00', '15:00'],  // ホール ランチ (土)
    ['emp-009', 14, '15:00', '22:00'],  // ホール 夕番 (土)
    ['emp-013', 20, '15:00', '22:00'],  // レジ 夕番 (金)
    ['emp-007', 25, '15:00', '22:00'],  // ホール 夕番 (水)
  ]
  for (const [empId, d, startTime, endTime] of dayOffPlan) {
    if (d <= days && !(profile === 'future' && (d % 5 === 0 || d % 7 === 3))) {
      const st: CellStatus = profile === 'past' ? 'DAY_OFF_CONFIRMED' : 'DAY_OFF_REQUESTED'
      entries.push({ id: id(), employeeId: empId, shiftDate: dStr(year, month, d), startTime, endTime, department: employees.find(e => e.id === empId)!.department, cellStatus: st, estimatedWage: 0, note: '休み希望' })
    }
  }

  // Add realistic adjusting context for ADJUSTING entries (current profile only)
  if (profile === 'current') {
    const adjReasons = [
      'この日はキッチンの人手が足りていません。出勤していただくことは可能でしょうか？',
      '急な欠員が出てしまいました。大変申し訳ないのですが、シフトに入っていただけますか？',
      'ホールの混雑が予想されるため、この日のご出勤をお願いできますか？',
    ]
    const adjReplies = [
      '承知しました。出勤いたします。',
      '申し訳ありません。その日はどうしても都合がつかない状況です。',
    ]
    const responseScenarios: Array<{ responseStatus: AdjustingResponseStatus; reply?: string; preStatus: CellStatus }> = [
      { responseStatus: 'ACCEPTED', reply: adjReplies[0], preStatus: 'DAY_OFF_REQUESTED' },
      { responseStatus: 'PENDING', preStatus: 'DAY_OFF_REQUESTED' },
      { responseStatus: 'REJECTED', reply: adjReplies[1], preStatus: 'SHIFT_REQUESTED' },
      { responseStatus: 'PENDING', preStatus: 'SHIFT_REQUESTED' },
    ]
    let adjIdx = 0
    for (const e of entries) {
      if (e.cellStatus === 'ADJUSTING') {
        const sc = responseScenarios[adjIdx % responseScenarios.length]
        e.preAdjustStatus = sc.preStatus
        e.adjustingReason = adjReasons[adjIdx % adjReasons.length]
        e.adjustingResponseStatus = sc.responseStatus
        if (sc.reply) e.adjustingResponse = sc.reply
        adjIdx++
      }
    }
  }

  return entries
}

// ============================================================
// GENERATE BOARD DATA
// ============================================================
const febAllocation  = makeAllocationSetup('feb26',  2026, 2)
const marAllocation  = makeAllocationSetup('mar26',  2026, 3)
const aprAllocation  = makeAllocationSetup('apr26',  2026, 4)

const febEntries = makeMonthEntries('feb26', 2026, 2, 'past')
const marEntries = makeMonthEntries('mar26', 2026, 3, 'past')
const aprEntries = makeMonthEntries('apr26', 2026, 4, 'future')

// ============================================================
// SHIFT BOARDS
// ============================================================
const boards: ShiftBoard[] = [
  {
    id: 'board-2026-04',
    name: '2026年4月 シフトボード',
    status: 'DRAFT',
    periodStart: '2026-04-01',
    periodEnd: '2026-04-30',
    budgetAmount: 820000,
    entries: aprEntries,
    createdAt: '2026-03-05T09:00:00',
    collectionId: 'coll-002',
    allocationSetup: aprAllocation,
  },
  {
    id: 'board-2026-03',
    name: '2026年3月 シフトボード',
    status: 'DRAFT',
    periodStart: '2026-03-01',
    periodEnd: '2026-03-31',
    budgetAmount: 800000,
    entries: marEntries,
    createdAt: '2026-02-15T09:00:00',
    collectionId: 'coll-001',
    allocationSetup: marAllocation,
  },
  {
    id: 'board-2026-02',
    name: '2026年2月 シフトボード',
    status: 'PUBLISHED',
    periodStart: '2026-02-01',
    periodEnd: '2026-02-28',
    budgetAmount: 750000,
    entries: febEntries,
    createdAt: '2026-01-20T09:00:00',
    collectionId: 'coll-000',
    allocationSetup: febAllocation,
  },
]

// ============================================================
// SHIFT PREFERENCES — generated for each board month
// ============================================================
function makePreferences(year: number, month: number): Map<string, ShiftPreference> {
  const map = new Map<string, ShiftPreference>()
  const days = monthDays(year, month)
  const activeEmps = employees.filter(e => e.status === 'ACTIVE')
  for (const emp of activeEmps) {
    const entries: ShiftPreferenceEntry[] = []
    for (let d = 1; d <= days; d++) {
      const date = dStr(year, month, d)
      const dow = new Date(date).getDay()
      let availability: 'PREFERRED' | 'AVAILABLE' | 'UNAVAILABLE'
      if (emp.employmentType === 'FULL_TIME') {
        availability = (dow === 0 || dow === 6) ? 'AVAILABLE' : 'PREFERRED'
      }
      else {
        if (dow === 0) {
          availability = 'UNAVAILABLE'
        }
        else if (dow === 6) {
          availability = d % 3 === 0 ? 'AVAILABLE' : 'UNAVAILABLE'
        }
        else {
          const r = (parseInt(emp.id.slice(-3)) + d) % 5
          availability = r === 0 ? 'UNAVAILABLE' : r <= 2 ? 'PREFERRED' : 'AVAILABLE'
        }
      }
      entries.push({ date, availability })
    }
    map.set(emp.id, { employeeId: emp.id, entries })
  }
  return map
}

const febPreferences = makePreferences(2026, 2)
const marPreferences = makePreferences(2026, 3)
const aprPreferences = makePreferences(2026, 4)

// Keyed by boardId for easy lookup
const preferencesByBoard: Record<string, Map<string, ShiftPreference>> = {
  'board-2026-02': febPreferences,
  'board-2026-03': marPreferences,
  'board-2026-04': aprPreferences,
}

// ============================================================
// ATTENDANCE RECORDS — covers March 1 → April 4 2026 (today = 2026-04-04)
// ============================================================
const CORRECTION_COMMENTS = [
  '退勤打刻が確認できません。正確な退勤時刻を入力して再申請してください。',
  '勤務時間が予定シフトと大きくずれています。理由を添えて再申請してください。',
  '深夜帯の勤務記録がありましたが、事前申請がありませんでした。確認・修正の上、再申請してください。',
]

function makeAttendanceRecords(): AttendanceRecord[] {
  const records: AttendanceRecord[] = []
  let recId = 1
  let punchId = 1
  let sessId = 1

  const hm = (h: number, m = 0) =>
    `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`

  const mins = (t: string) => { const [h, m] = t.split(':').map(Number); return h * 60 + m }

  function nightMins(ci: string, co: string): number {
    let s = mins(ci); let e = mins(co)
    if (e <= s) e += 1440
    let n = 0
    if (e > 1320) n += Math.min(e, 1440) - Math.max(s, 1320)
    if (e > 1440) n += Math.min(e, 1740) - Math.max(s, 1440)
    return Math.max(0, n)
  }

  function approvedAt(workDate: string): string | undefined {
    return `${workDate}T10:00:00`
  }

  // Single-session record
  function pushRec(
    empId: string,
    workDate: string,
    checkIn: string,
    checkOut: string,
    breakMins: number,
    status: AttendanceStatus,
    opts: { dept?: string; variant?: 'NORMAL' | 'HELP' | 'TRAINING'; correctionComment?: string; submittedAt?: string } = {},
  ) {
    const actualMins = mins(checkOut) - mins(checkIn) - breakMins
    const bH = Number(checkIn.split(':')[0]) + 3
    const sid = `sess-${String(sessId++).padStart(3, '0')}`
    const recIdStr = `att-${String(recId++).padStart(3, '0')}`
    const dept = opts.dept ?? (employees.find(e => e.id === empId)?.department ?? 'キッチン')
    const variant = opts.variant ?? 'NORMAL'
    records.push({
      id: recIdStr,
      employeeId: empId,
      workDate,
      status,
      checkIn,
      checkOut,
      breakMinutes: breakMins,
      actualMinutes: actualMins,
      overtimeMinutes: Math.max(0, actualMins - 480),
      submittedAt: status === 'PENDING_APPROVAL' || status === 'APPROVED' || status === 'CORRECTION_REQUESTED'
        ? opts.submittedAt ?? `${workDate}T${checkOut}:00`
        : undefined,
      approvedAt: status === 'APPROVED' ? approvedAt(workDate) : undefined,
      punchEvents: [
        { id: `p${punchId++}`, punchType: 'CHECK_IN',    punchedAt: `${workDate}T${checkIn}:00`,       isVoided: false },
        { id: `p${punchId++}`, punchType: 'BREAK_START', punchedAt: `${workDate}T${hm(bH)}:00`,        isVoided: false },
        { id: `p${punchId++}`, punchType: 'BREAK_END',   punchedAt: `${workDate}T${hm(bH, 45)}:00`,    isVoided: false },
        { id: `p${punchId++}`, punchType: 'CHECK_OUT',   punchedAt: `${workDate}T${checkOut}:00`,      isVoided: false },
      ],
      sessions: [{
        id: sid,
        sessionIdx: 0,
        checkIn,
        checkOut,
        breakMinutes: breakMins,
        actualMinutes: actualMins,
        department: dept,
        punchVariant: variant,
        nightMinutes: nightMins(checkIn, checkOut),
      }],
      correctionComment: opts.correctionComment,
    })
  }

  // Split-session record (2 sessions in one day)
  function pushSplitRec(
    empId: string,
    workDate: string,
    s1: { ci: string; co: string; dept: string; variant?: 'NORMAL' | 'HELP' | 'TRAINING' },
    s2: { ci: string; co: string; dept: string; variant?: 'NORMAL' | 'HELP' | 'TRAINING' },
    status: AttendanceStatus,
  ) {
    const act1 = mins(s1.co) - mins(s1.ci)
    const act2 = mins(s2.co) - mins(s2.ci) - 30
    const total = act1 + act2
    const sid1 = `sess-${String(sessId++).padStart(3, '0')}`
    const sid2 = `sess-${String(sessId++).padStart(3, '0')}`
    // break is in session 2 around midpoint
    const bHour = Number(s2.ci.split(':')[0]) + Math.floor((mins(s2.co) - mins(s2.ci)) / 120)
    records.push({
      id: `att-${String(recId++).padStart(3, '0')}`,
      employeeId: empId,
      workDate,
      status,
      checkIn: s1.ci,
      checkOut: s2.co,
      breakMinutes: 30,
      actualMinutes: total,
      overtimeMinutes: Math.max(0, total - 480),
      submittedAt: status === 'PENDING_APPROVAL' || status === 'APPROVED' || status === 'CORRECTION_REQUESTED'
        ? `${workDate}T${s2.co}:00`
        : undefined,
      approvedAt: status === 'APPROVED' ? approvedAt(workDate) : undefined,
      punchEvents: [
        { id: `p${punchId++}`, punchType: 'CHECK_IN',    punchedAt: `${workDate}T${s1.ci}:00`,      isVoided: false },
        { id: `p${punchId++}`, punchType: 'CHECK_OUT',   punchedAt: `${workDate}T${s1.co}:00`,      isVoided: false },
        { id: `p${punchId++}`, punchType: 'CHECK_IN',    punchedAt: `${workDate}T${s2.ci}:00`,      isVoided: false },
        { id: `p${punchId++}`, punchType: 'BREAK_START', punchedAt: `${workDate}T${hm(bHour)}:00`,  isVoided: false },
        { id: `p${punchId++}`, punchType: 'BREAK_END',   punchedAt: `${workDate}T${hm(bHour, 30)}:00`, isVoided: false },
        { id: `p${punchId++}`, punchType: 'CHECK_OUT',   punchedAt: `${workDate}T${s2.co}:00`,      isVoided: false },
      ],
      sessions: [
        { id: sid1, sessionIdx: 0, checkIn: s1.ci, checkOut: s1.co, breakMinutes: 0,  actualMinutes: act1, department: s1.dept, punchVariant: s1.variant ?? 'NORMAL', nightMinutes: nightMins(s1.ci, s1.co) },
        { id: sid2, sessionIdx: 1, checkIn: s2.ci, checkOut: s2.co, breakMinutes: 30, actualMinutes: act2, department: s2.dept, punchVariant: s2.variant ?? 'NORMAL', nightMinutes: nightMins(s2.ci, s2.co) },
      ],
    })
  }

  // ── March 1–15: APPROVED / PENDING / CORRECTION_REQUESTED ────
  pushRec('emp-001', '2026-03-02', '07:05', '15:10', 45, 'APPROVED')
  pushRec('emp-001', '2026-03-03', '06:58', '15:05', 45, 'APPROVED')
  pushRec('emp-001', '2026-03-04', '07:00', '15:30', 45, 'APPROVED')
  pushRec('emp-001', '2026-03-05', '07:00', '15:00', 45, 'APPROVED')
  pushRec('emp-001', '2026-03-06', '07:00', '16:45', 45, 'APPROVED')

  pushSplitRec('emp-006', '2026-03-04', { ci: '10:00', co: '14:30', dept: 'ホール' }, { ci: '17:00', co: '21:30', dept: 'ホール' }, 'APPROVED')
  pushSplitRec('emp-006', '2026-03-06', { ci: '10:00', co: '14:30', dept: 'ホール' }, { ci: '17:00', co: '22:00', dept: 'ホール' }, 'APPROVED')
  pushRec('emp-006', '2026-03-07', '15:00', '22:00', 45, 'APPROVED', { dept: 'ホール' })

  pushRec('emp-002', '2026-03-02', '09:15', '17:00', 45, 'APPROVED', { dept: 'キッチン' })
  pushRec('emp-002', '2026-03-04', '09:00', '16:45', 45, 'APPROVED', { dept: 'キッチン' })
  pushRec('emp-002', '2026-03-06', '09:00', '15:30', 45, 'APPROVED', { dept: 'キッチン' })

  pushRec('emp-004', '2026-03-02', '09:00', '18:30', 60, 'APPROVED', { dept: 'キッチン' })
  pushRec('emp-004', '2026-03-03', '09:00', '18:00', 60, 'APPROVED', { dept: 'キッチン' })
  pushRec('emp-004', '2026-03-05', '09:00', '18:45', 60, 'APPROVED', { dept: 'キッチン' })

  pushRec('emp-007', '2026-03-03', '15:00', '21:30', 45, 'APPROVED', { dept: 'ホール' })
  pushRec('emp-007', '2026-03-05', '15:00', '22:00', 45, 'APPROVED', { dept: 'ホール' })

  pushSplitRec('emp-009', '2026-03-07', { ci: '10:00', co: '15:00', dept: 'ホール' }, { ci: '16:00', co: '21:30', dept: 'ホール' }, 'APPROVED')

  pushRec('emp-008', '2026-03-01', '10:00', '16:30', 45, 'APPROVED', { dept: 'ホール' })
  pushRec('emp-008', '2026-03-03', '10:00', '14:30', 0,  'APPROVED', { dept: 'ホール' })
  pushRec('emp-008', '2026-03-05', '10:00', '16:00', 45, 'APPROVED', { dept: 'ホール' })

  pushRec('emp-003', '2026-03-02', '10:00', '16:00', 45, 'APPROVED', { dept: 'キッチン' })
  pushRec('emp-003', '2026-03-04', '10:00', '16:30', 45, 'APPROVED', { dept: 'キッチン' })

  pushRec('emp-012', '2026-03-02', '09:00', '17:00', 60, 'APPROVED', { dept: 'レジ' })
  pushRec('emp-012', '2026-03-03', '09:00', '17:00', 60, 'APPROVED', { dept: 'レジ' })
  pushRec('emp-012', '2026-03-04', '09:00', '17:30', 60, 'APPROVED', { dept: 'レジ' })
  pushRec('emp-012', '2026-03-05', '09:00', '17:00', 60, 'APPROVED', { dept: 'レジ' })
  pushRec('emp-012', '2026-03-06', '09:00', '18:00', 60, 'APPROVED', { dept: 'レジ' })

  // March 9–15
  pushRec('emp-001', '2026-03-09', '07:00', '15:10', 45, 'APPROVED')
  pushRec('emp-001', '2026-03-10', '07:00', '15:00', 45, 'APPROVED')
  pushRec('emp-001', '2026-03-11', '07:20', '15:00', 45, 'CORRECTION_REQUESTED', { correctionComment: CORRECTION_COMMENTS[0] })
  pushRec('emp-001', '2026-03-12', '07:00', '16:30', 45, 'APPROVED')
  pushRec('emp-001', '2026-03-13', '07:00', '15:00', 45, 'APPROVED')
  pushRec('emp-001', '2026-03-14', '07:00', '15:00', 45, 'APPROVED')
  pushRec('emp-001', '2026-03-15', '07:02', '15:00', 45, 'APPROVED')

  pushSplitRec('emp-006', '2026-03-09', { ci: '10:00', co: '14:30', dept: 'ホール' }, { ci: '17:00', co: '21:15', dept: 'ホール' }, 'APPROVED')
  pushRec('emp-006', '2026-03-10', '10:00', '15:00', 30, 'APPROVED', { dept: 'ホール' })
  pushSplitRec('emp-006', '2026-03-12', { ci: '10:00', co: '14:30', dept: 'ホール' }, { ci: '17:00', co: '21:15', dept: 'キッチン', variant: 'HELP' }, 'APPROVED')
  pushRec('emp-006', '2026-03-13', '15:00', '22:00', 45, 'APPROVED', { dept: 'ホール' })
  pushRec('emp-006', '2026-03-14', '10:00', '15:00', 30, 'APPROVED', { dept: 'ホール' })
  pushRec('emp-006', '2026-03-15', '10:00', '14:30', 30, 'APPROVED', { dept: 'ホール' })

  pushRec('emp-002', '2026-03-09', '09:15', '17:00', 45, 'APPROVED', { dept: 'キッチン' })
  pushRec('emp-002', '2026-03-11', '09:00', '17:00', 45, 'APPROVED', { dept: 'キッチン' })
  pushRec('emp-002', '2026-03-13', '09:00', '16:45', 45, 'APPROVED', { dept: 'キッチン' })

  pushRec('emp-004', '2026-03-09', '09:00', '18:30', 60, 'APPROVED', { dept: 'キッチン' })
  pushRec('emp-004', '2026-03-10', '09:00', '18:00', 60, 'CORRECTION_REQUESTED', { dept: 'キッチン', correctionComment: CORRECTION_COMMENTS[1] })
  pushRec('emp-004', '2026-03-12', '09:00', '18:45', 60, 'APPROVED', { dept: 'キッチン' })
  pushRec('emp-004', '2026-03-14', '09:00', '18:00', 60, 'APPROVED', { dept: 'キッチン' })
  pushRec('emp-004', '2026-03-15', '09:00', '17:30', 60, 'APPROVED', { dept: 'キッチン' })

  pushRec('emp-007', '2026-03-10', '15:00', '21:30', 45, 'APPROVED', { dept: 'ホール' })
  pushRec('emp-007', '2026-03-12', '15:00', '22:15', 45, 'APPROVED', { dept: 'ホール' })
  pushRec('emp-007', '2026-03-14', '15:00', '22:00', 45, 'APPROVED', { dept: 'ホール' })
  pushRec('emp-007', '2026-03-15', '15:10', '22:00', 45, 'APPROVED', { dept: 'ホール' })

  pushSplitRec('emp-009', '2026-03-14', { ci: '10:00', co: '15:00', dept: 'ホール' }, { ci: '15:00', co: '22:00', dept: 'ホール' }, 'APPROVED')

  pushRec('emp-008', '2026-03-09', '10:00', '16:00', 45, 'APPROVED', { dept: 'ホール' })
  pushRec('emp-008', '2026-03-11', '10:00', '16:30', 45, 'APPROVED', { dept: 'ホール' })
  pushRec('emp-008', '2026-03-13', '10:00', '14:30', 0,  'APPROVED', { dept: 'ホール' })

  pushRec('emp-003', '2026-03-09', '10:00', '16:00', 45, 'APPROVED', { dept: 'キッチン' })
  pushRec('emp-003', '2026-03-11', '10:30', '16:00', 45, 'APPROVED', { dept: 'キッチン' })
  pushRec('emp-003', '2026-03-13', '10:00', '16:30', 45, 'APPROVED', { dept: 'キッチン' })
  pushRec('emp-003', '2026-03-14', '10:00', '16:00', 45, 'APPROVED', { dept: 'キッチン' })

  pushRec('emp-005', '2026-03-10', '11:00', '17:00', 45, 'APPROVED', { dept: 'キッチン' })
  pushRec('emp-005', '2026-03-12', '11:00', '16:00', 45, 'APPROVED', { dept: 'キッチン' })

  pushRec('emp-012', '2026-03-09', '09:00', '17:00', 60, 'APPROVED', { dept: 'レジ' })
  pushRec('emp-012', '2026-03-10', '09:00', '17:00', 60, 'APPROVED', { dept: 'レジ' })
  pushRec('emp-012', '2026-03-11', '09:00', '17:30', 60, 'APPROVED', { dept: 'レジ' })
  pushRec('emp-012', '2026-03-12', '09:00', '17:00', 60, 'APPROVED', { dept: 'レジ' })
  pushRec('emp-012', '2026-03-13', '09:00', '17:00', 60, 'APPROVED', { dept: 'レジ' })

  // ── March 16–22 ── APPROVED ──────────────────────────────────
  pushRec('emp-001', '2026-03-16', '07:00', '15:15', 45, 'APPROVED')
  pushRec('emp-001', '2026-03-17', '07:05', '15:00', 45, 'APPROVED')
  pushRec('emp-001', '2026-03-18', '07:00', '15:00', 45, 'APPROVED')
  pushRec('emp-001', '2026-03-19', '07:00', '16:00', 45, 'APPROVED')
  pushRec('emp-001', '2026-03-20', '07:00', '15:30', 45, 'APPROVED')

  pushRec('emp-004', '2026-03-16', '09:00', '18:30', 60, 'APPROVED', { dept: 'キッチン' })
  pushRec('emp-004', '2026-03-17', '09:00', '18:00', 60, 'APPROVED', { dept: 'キッチン' })
  pushRec('emp-004', '2026-03-18', '09:00', '18:15', 60, 'APPROVED', { dept: 'キッチン' })
  pushRec('emp-004', '2026-03-19', '09:00', '18:45', 60, 'APPROVED', { dept: 'キッチン' })
  pushRec('emp-004', '2026-03-20', '09:00', '18:00', 60, 'APPROVED', { dept: 'キッチン' })

  pushSplitRec('emp-006', '2026-03-16', { ci: '10:00', co: '14:30', dept: 'ホール' }, { ci: '17:00', co: '21:30', dept: 'ホール' }, 'APPROVED')
  pushRec('emp-006', '2026-03-17', '10:00', '16:00', 30, 'APPROVED', { dept: 'ホール' })
  pushSplitRec('emp-006', '2026-03-18', { ci: '10:00', co: '14:30', dept: 'ホール' }, { ci: '17:00', co: '22:00', dept: 'ホール' }, 'APPROVED')
  pushRec('emp-006', '2026-03-19', '15:00', '22:00', 45, 'APPROVED', { dept: 'ホール' })
  pushSplitRec('emp-006', '2026-03-21', { ci: '10:00', co: '14:00', dept: 'ホール' }, { ci: '16:00', co: '21:30', dept: 'ホール' }, 'APPROVED')
  pushSplitRec('emp-006', '2026-03-22', { ci: '10:00', co: '14:00', dept: 'ホール' }, { ci: '16:00', co: '22:00', dept: 'ホール' }, 'APPROVED')

  pushRec('emp-002', '2026-03-16', '09:00', '16:45', 45, 'APPROVED', { dept: 'キッチン' })
  pushRec('emp-002', '2026-03-18', '09:00', '17:00', 45, 'APPROVED', { dept: 'キッチン' })
  pushRec('emp-002', '2026-03-20', '09:00', '16:30', 45, 'APPROVED', { dept: 'キッチン' })

  pushRec('emp-007', '2026-03-17', '15:00', '22:00', 45, 'APPROVED', { dept: 'ホール' })
  pushRec('emp-007', '2026-03-19', '15:00', '21:45', 45, 'APPROVED', { dept: 'ホール' })
  pushRec('emp-007', '2026-03-20', '15:00', '22:15', 45, 'APPROVED', { dept: 'ホール' })

  pushRec('emp-003', '2026-03-16', '10:00', '16:00', 45, 'APPROVED', { dept: 'キッチン' })
  pushRec('emp-003', '2026-03-18', '10:00', '16:30', 45, 'APPROVED', { dept: 'キッチン' })
  pushRec('emp-003', '2026-03-20', '10:00', '16:00', 45, 'APPROVED', { dept: 'キッチン' })

  pushRec('emp-008', '2026-03-16', '10:00', '16:00', 45, 'APPROVED', { dept: 'ホール' })
  pushRec('emp-008', '2026-03-18', '10:00', '15:30', 45, 'APPROVED', { dept: 'ホール' })
  pushRec('emp-008', '2026-03-21', '10:00', '16:00', 45, 'APPROVED', { dept: 'ホール' })

  pushRec('emp-012', '2026-03-16', '09:00', '17:00', 60, 'APPROVED', { dept: 'レジ' })
  pushRec('emp-012', '2026-03-17', '09:00', '17:00', 60, 'APPROVED', { dept: 'レジ' })
  pushRec('emp-012', '2026-03-18', '09:00', '17:30', 60, 'APPROVED', { dept: 'レジ' })
  pushRec('emp-012', '2026-03-19', '09:00', '17:00', 60, 'APPROVED', { dept: 'レジ' })
  pushRec('emp-012', '2026-03-20', '09:00', '17:00', 60, 'APPROVED', { dept: 'レジ' })

  pushRec('emp-009', '2026-03-21', '10:00', '21:30', 60, 'APPROVED', { dept: 'ホール' })
  pushRec('emp-009', '2026-03-22', '10:00', '22:00', 60, 'APPROVED', { dept: 'ホール' })

  // ── March 23–29 ── APPROVED ──────────────────────────────────
  pushRec('emp-001', '2026-03-23', '07:00', '15:00', 45, 'APPROVED')
  pushRec('emp-001', '2026-03-24', '07:00', '15:20', 45, 'APPROVED')
  pushRec('emp-001', '2026-03-25', '07:00', '16:00', 45, 'APPROVED')
  pushRec('emp-001', '2026-03-26', '07:05', '15:00', 45, 'APPROVED')
  pushRec('emp-001', '2026-03-27', '07:00', '15:00', 45, 'APPROVED')

  pushRec('emp-004', '2026-03-23', '09:00', '18:30', 60, 'APPROVED', { dept: 'キッチン' })
  pushRec('emp-004', '2026-03-24', '09:00', '19:00', 60, 'APPROVED', { dept: 'キッチン' })
  pushRec('emp-004', '2026-03-25', '09:00', '18:00', 60, 'APPROVED', { dept: 'キッチン' })
  pushRec('emp-004', '2026-03-26', '09:00', '18:30', 60, 'APPROVED', { dept: 'キッチン' })
  pushRec('emp-004', '2026-03-27', '09:00', '18:00', 60, 'APPROVED', { dept: 'キッチン' })

  pushSplitRec('emp-006', '2026-03-23', { ci: '10:00', co: '14:30', dept: 'ホール' }, { ci: '17:00', co: '21:30', dept: 'ホール' }, 'APPROVED')
  pushRec('emp-006', '2026-03-24', '10:00', '16:00', 30, 'APPROVED', { dept: 'ホール' })
  pushSplitRec('emp-006', '2026-03-25', { ci: '10:00', co: '14:30', dept: 'ホール' }, { ci: '17:00', co: '22:00', dept: 'ホール' }, 'APPROVED')
  pushRec('emp-006', '2026-03-26', '15:00', '22:00', 45, 'APPROVED', { dept: 'ホール' })
  pushSplitRec('emp-006', '2026-03-28', { ci: '10:00', co: '14:00', dept: 'ホール' }, { ci: '16:00', co: '21:30', dept: 'ホール' }, 'APPROVED')
  pushSplitRec('emp-006', '2026-03-29', { ci: '10:00', co: '14:00', dept: 'ホール' }, { ci: '16:00', co: '22:00', dept: 'ホール' }, 'APPROVED')

  pushRec('emp-002', '2026-03-23', '09:00', '17:00', 45, 'APPROVED', { dept: 'キッチン' })
  pushRec('emp-002', '2026-03-25', '09:00', '16:45', 45, 'APPROVED', { dept: 'キッチン' })
  pushRec('emp-002', '2026-03-27', '09:00', '16:30', 45, 'APPROVED', { dept: 'キッチン' })

  pushRec('emp-007', '2026-03-24', '15:00', '22:00', 45, 'APPROVED', { dept: 'ホール' })
  pushRec('emp-007', '2026-03-26', '15:00', '22:00', 45, 'APPROVED', { dept: 'ホール' })
  pushRec('emp-007', '2026-03-27', '15:00', '21:30', 45, 'APPROVED', { dept: 'ホール' })

  pushRec('emp-003', '2026-03-23', '10:00', '16:00', 45, 'APPROVED', { dept: 'キッチン' })
  pushRec('emp-003', '2026-03-25', '10:00', '16:30', 45, 'APPROVED', { dept: 'キッチン' })
  pushRec('emp-003', '2026-03-27', '10:00', '16:00', 45, 'APPROVED', { dept: 'キッチン' })

  pushRec('emp-008', '2026-03-23', '10:00', '16:00', 45, 'APPROVED', { dept: 'ホール' })
  pushRec('emp-008', '2026-03-25', '10:00', '15:30', 45, 'APPROVED', { dept: 'ホール' })
  pushRec('emp-008', '2026-03-28', '10:00', '16:30', 45, 'APPROVED', { dept: 'ホール' })

  pushRec('emp-012', '2026-03-23', '09:00', '17:00', 60, 'APPROVED', { dept: 'レジ' })
  pushRec('emp-012', '2026-03-24', '09:00', '17:00', 60, 'APPROVED', { dept: 'レジ' })
  pushRec('emp-012', '2026-03-25', '09:00', '17:30', 60, 'APPROVED', { dept: 'レジ' })
  pushRec('emp-012', '2026-03-26', '09:00', '17:00', 60, 'APPROVED', { dept: 'レジ' })
  pushRec('emp-012', '2026-03-27', '09:00', '17:00', 60, 'APPROVED', { dept: 'レジ' })

  pushRec('emp-009', '2026-03-28', '10:00', '21:30', 60, 'APPROVED', { dept: 'ホール' })
  pushRec('emp-009', '2026-03-29', '10:00', '22:00', 60, 'APPROVED', { dept: 'ホール' })

  // ── March 30–31 ── PENDING_APPROVAL ──────────────────────────
  pushRec('emp-001', '2026-03-30', '07:00', '15:00', 45, 'PENDING_APPROVAL')
  pushRec('emp-001', '2026-03-31', '07:05', '15:30', 45, 'PENDING_APPROVAL')

  pushRec('emp-004', '2026-03-30', '09:00', '18:30', 60, 'PENDING_APPROVAL', { dept: 'キッチン' })
  pushRec('emp-004', '2026-03-31', '09:00', '19:00', 60, 'PENDING_APPROVAL', { dept: 'キッチン' })

  pushSplitRec('emp-006', '2026-03-30', { ci: '10:00', co: '14:30', dept: 'ホール' }, { ci: '17:00', co: '21:30', dept: 'ホール' }, 'PENDING_APPROVAL')
  pushSplitRec('emp-006', '2026-03-31', { ci: '10:00', co: '14:00', dept: 'ホール' }, { ci: '16:00', co: '21:00', dept: 'ホール' }, 'PENDING_APPROVAL')

  pushRec('emp-002', '2026-03-30', '09:00', '17:00', 45, 'PENDING_APPROVAL', { dept: 'キッチン' })

  pushRec('emp-007', '2026-03-31', '15:00', '22:00', 45, 'PENDING_APPROVAL', { dept: 'ホール' })

  pushRec('emp-003', '2026-03-30', '10:00', '16:00', 45, 'PENDING_APPROVAL', { dept: 'キッチン' })

  pushRec('emp-008', '2026-03-30', '10:00', '16:00', 45, 'PENDING_APPROVAL', { dept: 'ホール' })

  pushRec('emp-012', '2026-03-30', '09:00', '17:00', 60, 'PENDING_APPROVAL', { dept: 'レジ' })
  pushRec('emp-012', '2026-03-31', '09:00', '17:00', 60, 'PENDING_APPROVAL', { dept: 'レジ' })

  // ── April 1–2 ── PENDING_APPROVAL ────────────────────────────
  pushRec('emp-001', '2026-04-01', '07:00', '15:00', 45, 'PENDING_APPROVAL')
  pushRec('emp-001', '2026-04-02', '07:00', '15:20', 45, 'PENDING_APPROVAL')

  pushRec('emp-004', '2026-04-01', '09:00', '18:15', 60, 'PENDING_APPROVAL', { dept: 'キッチン' })
  pushRec('emp-004', '2026-04-02', '09:00', '18:30', 60, 'PENDING_APPROVAL', { dept: 'キッチン' })

  pushSplitRec('emp-006', '2026-04-01', { ci: '10:00', co: '14:30', dept: 'ホール' }, { ci: '17:00', co: '21:30', dept: 'ホール' }, 'PENDING_APPROVAL')
  pushSplitRec('emp-006', '2026-04-02', { ci: '10:00', co: '14:00', dept: 'ホール' }, { ci: '17:00', co: '22:00', dept: 'ホール' }, 'PENDING_APPROVAL')

  pushRec('emp-002', '2026-04-01', '09:00', '17:00', 45, 'PENDING_APPROVAL', { dept: 'キッチン' })
  // emp-002 April 2: has correction request cr-008 (forgot clock-out)
  pushRec('emp-002', '2026-04-02', '09:05', '18:00', 45, 'PENDING_APPROVAL', { dept: 'キッチン' })

  pushRec('emp-007', '2026-04-01', '15:00', '22:00', 45, 'PENDING_APPROVAL', { dept: 'ホール' })

  pushRec('emp-003', '2026-04-01', '10:00', '16:30', 45, 'PENDING_APPROVAL', { dept: 'キッチン' })

  pushRec('emp-008', '2026-04-02', '10:00', '16:00', 45, 'PENDING_APPROVAL', { dept: 'ホール' })

  pushRec('emp-012', '2026-04-01', '09:00', '17:00', 60, 'PENDING_APPROVAL', { dept: 'レジ' })
  pushRec('emp-012', '2026-04-02', '09:00', '17:30', 60, 'PENDING_APPROVAL', { dept: 'レジ' })

  // ── April 3 ── PENDING_APPROVAL / NOT_SUBMITTED ───────────────
  pushRec('emp-001', '2026-04-03', '07:00', '15:00', 45, 'PENDING_APPROVAL')
  pushRec('emp-004', '2026-04-03', '09:00', '18:00', 60, 'PENDING_APPROVAL', { dept: 'キッチン' })
  pushSplitRec('emp-006', '2026-04-03', { ci: '10:00', co: '14:30', dept: 'ホール' }, { ci: '17:00', co: '21:30', dept: 'ホール' }, 'PENDING_APPROVAL')
  // emp-007 April 3: has correction request cr-007
  pushRec('emp-007', '2026-04-03', '15:00', '22:00', 45, 'PENDING_APPROVAL', { dept: 'ホール' })
  pushRec('emp-002', '2026-04-03', '09:00', '16:45', 45, 'NOT_SUBMITTED', { dept: 'キッチン' })
  pushRec('emp-012', '2026-04-03', '09:00', '17:00', 60, 'NOT_SUBMITTED', { dept: 'レジ' })
  pushRec('emp-003', '2026-04-03', '10:00', '16:00', 45, 'NOT_SUBMITTED', { dept: 'キッチン' })

  // ── April 4 (today) ── NOT_SUBMITTED / still working ─────────
  pushRec('emp-001', '2026-04-04', '07:02', '15:00', 45, 'NOT_SUBMITTED')
  pushRec('emp-004', '2026-04-04', '09:00', '18:00', 60, 'NOT_SUBMITTED', { dept: 'キッチン' })
  pushSplitRec('emp-006', '2026-04-04', { ci: '10:00', co: '14:30', dept: 'ホール' }, { ci: '17:00', co: '22:00', dept: 'ホール' }, 'NOT_SUBMITTED')
  pushRec('emp-012', '2026-04-04', '09:05', '17:00', 60, 'NOT_SUBMITTED', { dept: 'レジ' })

  return records
}

const attendanceRecords = makeAttendanceRecords()

// ============================================================
// COLLECTIONS
// ============================================================
const allEmpIds = employees.filter(e => e.status === 'ACTIVE').map(e => e.id)

const collections: CollectionRequest[] = [
  {
    id: 'coll-000',
    name: '2026年2月 シフト収集',
    status: 'CLOSED',
    periodStart: '2026-02-01',
    periodEnd: '2026-02-28',
    deadline: '2026-01-20',
    totalTargets: 14,
    submittedCount: 14,
    submissions: allEmpIds.slice(0, 14).map(id => ({ employeeId: id, submitted: true, submittedAt: '2026-01-18T10:00:00' })),
  },
  {
    id: 'coll-001',
    name: '2026年3月 シフト収集',
    status: 'CLOSED',
    periodStart: '2026-03-01',
    periodEnd: '2026-03-31',
    deadline: '2026-02-20',
    totalTargets: 14,
    submittedCount: 14,
    submissions: allEmpIds.slice(0, 14).map(id => ({ employeeId: id, submitted: true, submittedAt: '2026-02-18T10:00:00' })),
  },
  {
    id: 'coll-002',
    name: '2026年4月 シフト収集',
    status: 'COLLECTING',
    periodStart: '2026-04-01',
    periodEnd: '2026-04-30',
    deadline: '2026-03-20',
    totalTargets: 14,
    submittedCount: 8,
    submissions: allEmpIds.slice(0, 14).map((id, i) => ({ employeeId: id, submitted: i < 8, submittedAt: i < 8 ? '2026-03-10T10:00:00' : undefined })),
  },
  {
    id: 'coll-003',
    name: '2026年5月 シフト収集',
    status: 'DRAFT',
    periodStart: '2026-05-01',
    periodEnd: '2026-05-31',
    deadline: '2026-04-20',
    totalTargets: 14,
    submittedCount: 0,
    submissions: allEmpIds.slice(0, 14).map(id => ({ employeeId: id, submitted: false })),
  },
]

// ============================================================
// COMPLIANCE ALERTS
// ============================================================
const alerts: ComplianceAlert[] = [
  { id: 'alert-001', employeeId: 'emp-004', type: 'OVERTIME_WARNING', level: 'warning', message: '渡辺 健司：今月の残業時間が35時間に達しました（上限45時間）', createdAt: '2026-02-28T09:00:00' },
  { id: 'alert-002', employeeId: 'emp-006', type: 'CONSECUTIVE_DAYS', level: 'warning', message: '佐藤 花子：6日連続勤務が予定されています（法定上限：6日）', createdAt: '2026-02-28T09:30:00' },
  { id: 'alert-003', employeeId: 'emp-012', type: 'OVERTIME_CRITICAL', level: 'critical', message: '松本 幸子：今月の時間外労働が42時間に達しました（上限45時間・要注意）', createdAt: '2026-03-01T08:00:00' },
]

// ============================================================
// HELPERS
// ============================================================
function getEmployee(id: string): Employee | undefined {
  return employees.find(e => e.id === id)
}

function getCollectionForBoard(boardId: string): CollectionRequest | undefined {
  const board = boards.find(b => b.id === boardId)
  if (!board?.collectionId) return undefined
  return collections.find(c => c.id === board.collectionId)
}

function getEntriesForDate(boardId: string, date: string): ShiftEntry[] {
  const board = boards.find(b => b.id === boardId)
  if (!board) return []
  return board.entries.filter(e => e.shiftDate === date)
}

function getPreference(empId: string, date: string): ShiftPreferenceEntry | undefined {
  // Find which board/month this date belongs to
  for (const prefs of Object.values(preferencesByBoard)) {
    const pref = prefs.get(empId)
    const entry = pref?.entries.find(e => e.date === date)
    if (entry) return entry
  }
  return undefined
}

function getCostSummary(boardId: string): {
  totalCost: number
  budget: number
  variance: number
  perEmployee: Array<{ employee: Employee; hours: number; cost: number }>
} {
  const board = boards.find(b => b.id === boardId)
  if (!board) return { totalCost: 0, budget: 0, variance: 0, perEmployee: [] }

  const empMap = new Map<string, { hours: number; cost: number }>()
  for (const entry of board.entries) {
    const [sh, sm] = entry.startTime.split(':').map(Number)
    const [eh, em] = entry.endTime.split(':').map(Number)
    const hours = (eh * 60 + em - (sh * 60 + sm)) / 60
    const existing = empMap.get(entry.employeeId) ?? { hours: 0, cost: 0 }
    empMap.set(entry.employeeId, { hours: existing.hours + hours, cost: existing.cost + entry.estimatedWage })
  }

  const perEmployee = Array.from(empMap.entries()).map(([empId, data]) => ({
    employee: getEmployee(empId)!,
    hours: Math.round(data.hours * 10) / 10,
    cost: data.cost,
  })).filter(e => e.employee)

  const totalCost = perEmployee.reduce((sum, e) => sum + e.cost, 0)
  return { totalCost, budget: board.budgetAmount, variance: totalCost - board.budgetAmount, perEmployee }
}

// ============================================================
// CROSS-SHOP REQUESTS
// ============================================================
const crossShopRequests: CrossShopRequest[] = [
  {
    // csr-001: outgoing, PARTIALLY_FILLED — 新宿店 proposed 田中 花子 (already confirmed),
    // 原宿店 is NEW. Need 1 more.
    id: 'csr-001',
    boardId: 'board-1',
    requestingShopId: 'shop-shibuya',
    requestingShopName: '渋谷本店',
    date: '2026-03-20',
    startTime: '11:00',
    endTime: '16:00',
    department: 'ホール',
    position: 'ホールスタッフ',
    requiredCount: 2,
    securedCount: 1,
    status: 'PARTIALLY_FILLED',
    targetResponses: [
      {
        shopId: 'shop-shinjuku', shopName: '新宿店', status: 'FULFILLED',
        proposedEmployees: [{ id: 'emp-ext-1', name: '田中 花子', department: 'ホール', position: 'ホールスタッフ', hourlyWage: 1050 }],
        respondedAt: '2026-03-14T10:00:00',
      },
      { shopId: 'shop-harajuku', shopName: '原宿店', status: 'NEW' },
    ],
    confirmedEmployees: [
      { id: 'emp-ext-1', name: '田中 花子', department: 'ホール', position: 'ホールスタッフ', hourlyWage: 1050, fromShopId: 'shop-shinjuku', fromShopName: '新宿店' },
    ] as ConfirmedEmployee[],
    note: '週末イベントのため増員希望',
    createdAt: '2026-03-13T09:00:00',
  },
  {
    // csr-002: outgoing, FULFILLED — 新宿店 proposed 佐藤 健 (confirmed)
    id: 'csr-002',
    boardId: 'board-1',
    requestingShopId: 'shop-shibuya',
    requestingShopName: '渋谷本店',
    date: '2026-03-21',
    startTime: '17:00',
    endTime: '22:00',
    department: 'キッチン',
    position: 'キッチンスタッフ',
    requiredCount: 1,
    securedCount: 1,
    status: 'FULFILLED',
    targetResponses: [
      {
        shopId: 'shop-shinjuku', shopName: '新宿店', status: 'FULFILLED',
        proposedEmployees: [{ id: 'emp-ext-2', name: '佐藤 健', department: 'キッチン', position: 'キッチンスタッフ', hourlyWage: 1100 }],
        respondedAt: '2026-03-13T14:00:00',
      },
    ],
    confirmedEmployees: [
      { id: 'emp-ext-2', name: '佐藤 健', department: 'キッチン', position: 'キッチンスタッフ', hourlyWage: 1100, fromShopId: 'shop-shinjuku', fromShopName: '新宿店' },
    ] as ConfirmedEmployee[],
    createdAt: '2026-03-12T11:00:00',
  },
  {
    // csr-003: outgoing, PENDING — 原宿店 proposed 2 candidates but NOT yet confirmed by us.
    // This demonstrates the "enough proposals → show confirm button" flow.
    id: 'csr-003',
    boardId: 'board-1',
    requestingShopId: 'shop-shibuya',
    requestingShopName: '渋谷本店',
    date: '2026-03-22',
    startTime: '10:00',
    endTime: '15:00',
    department: 'レジ',
    position: 'レジスタッフ',
    requiredCount: 1,
    securedCount: 0,
    status: 'PENDING',
    targetResponses: [
      {
        shopId: 'shop-harajuku', shopName: '原宿店', status: 'FORWARDED',
        proposedEmployees: [
          { id: 'emp-ext-3', name: '木村 涼子', department: 'レジ', position: 'レジスタッフ', hourlyWage: 1050 },
          { id: 'emp-ext-4', name: '橋本 翔', department: 'レジ', position: 'クルー', hourlyWage: 1000 },
        ],
        respondedAt: '2026-03-14T09:00:00',
      },
    ],
    createdAt: '2026-03-14T08:30:00',
  },
  {
    // csr-004: incoming from 新宿店 — our (渋谷本店) response is NEW
    id: 'csr-004',
    boardId: 'board-2',
    requestingShopId: 'shop-shinjuku',
    requestingShopName: '新宿店',
    date: '2026-03-19',
    startTime: '12:00',
    endTime: '17:00',
    department: 'ホール',
    position: 'ホールスタッフ',
    requiredCount: 1,
    securedCount: 0,
    status: 'PENDING',
    targetResponses: [
      { shopId: 'shop-shibuya', shopName: '渋谷本店', status: 'NEW' },
    ],
    note: 'ランチタイム応援希望',
    createdAt: '2026-03-14T13:00:00',
  },
  {
    // csr-005: incoming from 原宿店 — our (渋谷本店) response is REVIEWING,
    // 池袋店 already proposed 山本 太郎 (FORWARDED, not yet confirmed by 原宿店)
    id: 'csr-005',
    boardId: 'board-2',
    requestingShopId: 'shop-harajuku',
    requestingShopName: '原宿店',
    date: '2026-03-23',
    startTime: '14:00',
    endTime: '20:00',
    department: 'キッチン',
    position: 'キッチンスタッフ',
    requiredCount: 2,
    securedCount: 0,
    status: 'PENDING',
    targetResponses: [
      { shopId: 'shop-shibuya', shopName: '渋谷本店', status: 'REVIEWING' },
      {
        shopId: 'shop-ikebukuro', shopName: '池袋店', status: 'FORWARDED',
        proposedEmployees: [{ id: 'emp-ext-5', name: '山本 太郎', department: 'キッチン', position: 'キッチンスタッフ', hourlyWage: 1050 }],
        respondedAt: '2026-03-14T16:00:00',
      },
    ],
    createdAt: '2026-03-13T15:00:00',
  },
]

// ============================================================
// CORRECTION REQUESTS
// ============================================================
const correctionRequests: CorrectionRequest[] = [
  // pending — edit: forgot to clock out (emp-006 佐藤花子, 3/09)
  {
    id: 'cr-001',
    type: 'edit',
    employeeId: 'emp-006',
    workDate: '2026-03-09',
    originalCheckIn: '10:00',
    originalCheckOut: undefined,
    requestedCheckIn: '10:00',
    requestedCheckOut: '18:00',
    reason: '退勤打刻を忘れてしまいました。実際は18:00まで勤務していました。',
    status: 'pending',
    createdAt: '2026-03-09T19:00:00',
  },
  // pending — edit: slightly off times (emp-004 渡辺健司, 3/10)
  {
    id: 'cr-002',
    type: 'edit',
    employeeId: 'emp-004',
    workDate: '2026-03-10',
    originalCheckIn: '09:15',
    originalCheckOut: '17:15',
    requestedCheckIn: '09:00',
    requestedCheckOut: '17:30',
    reason: '打刻機の不具合で時刻がずれて記録されました',
    status: 'pending',
    createdAt: '2026-03-10T18:00:00',
  },
  // pending — add_missing: entire session not recorded (emp-012 松本幸子, 3/11)
  {
    id: 'cr-003',
    type: 'add_missing',
    employeeId: 'emp-012',
    workDate: '2026-03-11',
    requestedCheckIn: '10:00',
    requestedCheckOut: '16:00',
    reason: '早出対応があり、アプリを開かずに仕事を開始してしまいました',
    status: 'pending',
    createdAt: '2026-03-11T17:00:00',
  },
  // approved — edit (emp-002 鈴木一郎, 3/05)
  {
    id: 'cr-004',
    type: 'edit',
    employeeId: 'emp-002',
    workDate: '2026-03-05',
    originalCheckIn: '09:00',
    originalCheckOut: '14:00',
    requestedCheckIn: '09:00',
    requestedCheckOut: '15:00',
    reason: '業務延長があり退勤打刻が1時間遅れました',
    status: 'approved',
    createdAt: '2026-03-05T16:00:00',
  },
  // approved — add_missing (emp-008 中村さくら, 3/04)
  {
    id: 'cr-005',
    type: 'add_missing',
    employeeId: 'emp-008',
    workDate: '2026-03-04',
    requestedCheckIn: '11:00',
    requestedCheckOut: '17:00',
    reason: '入店時のICカード読み取りエラーで記録されませんでした',
    status: 'approved',
    createdAt: '2026-03-04T18:30:00',
  },
  // rejected — edit (emp-007 高橋和也, 3/03)
  {
    id: 'cr-006',
    type: 'edit',
    employeeId: 'emp-007',
    workDate: '2026-03-03',
    originalCheckIn: '13:00',
    originalCheckOut: '19:00',
    requestedCheckIn: '10:00',
    requestedCheckOut: '19:00',
    reason: '準備作業の時間を追加したい',
    status: 'rejected',
    managerNote: '準備時間はシフト前には含まれません。不明点はリーダーに確認してください。',
    createdAt: '2026-03-03T20:00:00',
  },
  // pending — edit: 高橋和也 forgot to clock out on 4/3
  {
    id: 'cr-007',
    type: 'edit',
    employeeId: 'emp-007',
    workDate: '2026-04-03',
    originalCheckIn: '15:00',
    originalCheckOut: undefined,
    requestedCheckIn: '15:00',
    requestedCheckOut: '22:00',
    reason: '退勤時に打刻を忘れてしまいました。22:00に退勤しています。',
    status: 'pending',
    createdAt: '2026-04-03T23:00:00',
  },
  // pending — edit: 鈴木一郎 clock-in time shifted by system on 4/2
  {
    id: 'cr-008',
    type: 'edit',
    employeeId: 'emp-002',
    workDate: '2026-04-02',
    originalCheckIn: '09:05',
    originalCheckOut: '18:00',
    requestedCheckIn: '09:00',
    requestedCheckOut: '18:00',
    reason: '出勤時に打刻機の反応が遅く、5分ずれて記録されました。シフト開始は09:00です。',
    status: 'pending',
    createdAt: '2026-04-02T18:30:00',
  },
  // pending — add_missing: 加藤真由 entire shift on 3/29 not recorded
  {
    id: 'cr-009',
    type: 'add_missing',
    employeeId: 'emp-010',
    workDate: '2026-03-29',
    requestedCheckIn: '10:00',
    requestedCheckOut: '16:00',
    reason: 'スマートフォンの不具合でアプリが起動せず、勤務全体が未記録になりました。',
    status: 'pending',
    createdAt: '2026-03-29T16:30:00',
  },
  // pending — add_missing: 木村大輔 training session on 4/3 not recorded
  {
    id: 'cr-010',
    type: 'add_missing',
    employeeId: 'emp-013',
    workDate: '2026-04-03',
    requestedCheckIn: '14:00',
    requestedCheckOut: '18:00',
    reason: 'レジ研修のため別フロアで勤務しており、打刻機を利用できませんでした。',
    status: 'pending',
    createdAt: '2026-04-03T19:00:00',
  },
]

// ── Shared attendance utilities ────────────────────────────────────────────
export function computeNightMins(checkIn?: string, checkOut?: string): number {
  if (!checkIn || !checkOut) return 0
  const [ih, im] = checkIn.split(':').map(Number)
  const [oh, om] = checkOut.split(':').map(Number)
  let startM = ih * 60 + im
  let endM = oh * 60 + om
  if (endM <= startM) endM += 1440
  let night = 0
  // band 1: 22:00–24:00
  if (endM > 1320) night += Math.min(endM, 1440) - Math.max(startM, 1320)
  // band 2: 00:00–05:00 (shifted to 1440–1740)
  if (endM > 1440) night += Math.min(endM, 1740) - Math.max(startM, 1440)
  return Math.max(0, night)
}

export function getComplianceFlags(record: AttendanceRecord): ComplianceFlag[] {
  const flags: ComplianceFlag[] = []
  if (record.actualMinutes >= 360 && record.breakMinutes === 0) {
    flags.push({ key: 'no_break', level: 'error', icon: 'mdi-coffee-off-outline', message: `6時間以上休憩なし（労基法違反の可能性）` })
  }
  if (record.actualMinutes > 600) {
    flags.push({ key: 'overwork', level: 'warning', icon: 'mdi-clock-alert-outline', message: `${Math.floor(record.actualMinutes / 60)}時間超過（過重労働注意）` })
  }
  const night = computeNightMins(record.checkIn, record.checkOut)
  if (night > 0) {
    flags.push({ key: 'night', level: 'info', icon: 'mdi-moon-waning-crescent', message: `深夜時間帯 ${night}分（割増対象）` })
  }
  return flags
}

function getRecordsForDate(date: string): AttendanceRecord[] {
  return attendanceRecords.filter(r => r.workDate === date)
}

function getRecordForEmployee(empId: string, date: string): AttendanceRecord | undefined {
  return attendanceRecords.find(r => r.employeeId === empId && r.workDate === date)
}

function getCorrectionRequestsForEmployee(empId: string): CorrectionRequest[] {
  return correctionRequests.filter(r => r.employeeId === empId)
}

function getCorrectionRequestsForDate(empId: string, date: string): CorrectionRequest[] {
  return correctionRequests.filter(r => r.employeeId === empId && r.workDate === date)
}

function getPendingCorrectionRequests(): CorrectionRequest[] {
  return correctionRequests.filter(r => r.status === 'pending')
}

function getEmpShiftsForDate(empId: string, date: string): ShiftEntry[] {
  for (const board of boards) {
    const entries = board.entries.filter(
      e => e.employeeId === empId && e.shiftDate === date
        && e.cellStatus !== 'DAY_OFF_CONFIRMED' && e.cellStatus !== 'DAY_OFF_REQUESTED',
    )
    if (entries.length > 0) return entries
  }
  return []
}

function getOutgoingCrossShopRequests() {
  return crossShopRequests.filter(r => r.requestingShopId === 'shop-shibuya')
}

function getIncomingCrossShopRequests() {
  return crossShopRequests.filter(r =>
    r.requestingShopId !== 'shop-shibuya'
    && r.targetResponses.some(t => t.shopId === 'shop-shibuya'),
  )
}

// ============================================================
// EXPORT
// ============================================================
export function useMockData() {
  return {
    employees,
    boards,
    currentBoard: boards.find(b => b.id === 'board-2026-03')!,
    collections,
    attendanceRecords,
    alerts,
    preferences: marPreferences,
    preferencesByBoard,
    getEmployee,
    getEntriesForDate,
    getPreference,
    getCostSummary,
    getCollectionForBoard,
    crossShopRequests,
    getOutgoingCrossShopRequests,
    getIncomingCrossShopRequests,
    correctionRequests,
    getCorrectionRequestsForEmployee,
    getCorrectionRequestsForDate,
    getPendingCorrectionRequests,
    getRecordsForDate,
    getRecordForEmployee,
    computeNightMins,
    getComplianceFlags,
    getEmpShiftsForDate,
  }
}
