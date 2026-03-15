import type {
  Employee, ShiftBoard, ShiftEntry, AttendanceRecord, PunchEvent,
  CollectionRequest, CollectionSubmission, ComplianceAlert,
  ShiftPreference, ShiftPreferenceEntry, CellStatus, AdjustingResponseStatus,
  ShiftSlot, DaySlotAssignment, AllocationSetup,
  CrossShopRequest, ConfirmedEmployee,
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
  const dayOffPlan: Array<[string, number]> = [
    ['emp-002', 8], ['emp-009', 14], ['emp-013', 20], ['emp-007', 25],
  ]
  for (const [empId, d] of dayOffPlan) {
    if (d <= days && !(profile === 'future' && (d % 5 === 0 || d % 7 === 3))) {
      const st: CellStatus = profile === 'past' ? 'DAY_OFF_CONFIRMED' : 'DAY_OFF_REQUESTED'
      entries.push({ id: id(), employeeId: empId, shiftDate: dStr(year, month, d), startTime: '10:00', endTime: '18:00', department: employees.find(e => e.id === empId)!.department, cellStatus: st, estimatedWage: 0, note: '休み希望' })
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
const marEntries = makeMonthEntries('mar26', 2026, 3, 'current')
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
// ATTENDANCE RECORDS (Last 7 days of current date 2026-03-15)
// ============================================================
function makeAttendanceRecords(): AttendanceRecord[] {
  const records: AttendanceRecord[] = []
  const base = new Date('2026-03-15')
  let recId = 1
  let punchId = 1

  for (let d = 6; d >= 0; d--) {
    const date = new Date(base)
    date.setDate(base.getDate() - d)
    const workDate = date.toISOString().split('T')[0]

    const activeEmps = employees.filter(e => e.status === 'ACTIVE').slice(0, 12)
    const dayEmps = activeEmps.filter((_, i) => (i + d) % 3 !== 0).slice(0, 10)

    for (const emp of dayEmps) {
      const checkInHour = 9 + (parseInt(emp.id.slice(-1)) % 4)
      const checkInMin = (parseInt(emp.id.slice(-2)) % 3) * 15
      const checkInTime = `${String(checkInHour).padStart(2, '0')}:${String(checkInMin).padStart(2, '0')}`
      const workHours = 7 + (parseInt(emp.id.slice(-1)) % 3)
      const checkOutTime = `${String(checkInHour + workHours).padStart(2, '0')}:${String(checkInMin).padStart(2, '0')}`
      const breakMinutes = 45
      const actualMinutes = workHours * 60 - breakMinutes
      const overtimeMinutes = actualMinutes > 480 ? actualMinutes - 480 : 0

      const isToday = d === 0
      let status: 'NOT_STARTED' | 'WORKING' | 'ON_BREAK' | 'COMPLETED' | 'APPROVED'
      if (isToday) {
        const todayStatuses = ['WORKING', 'WORKING', 'WORKING', 'ON_BREAK', 'NOT_STARTED'] as const
        status = todayStatuses[parseInt(emp.id.slice(-1)) % 5]
      }
      else if (d === 1) {
        status = 'COMPLETED'
      }
      else {
        status = parseInt(emp.id.slice(-1)) % 3 === 0 ? 'APPROVED' : 'COMPLETED'
      }

      const punchEvents: PunchEvent[] = []
      if (status !== 'NOT_STARTED') {
        punchEvents.push({ id: `punch-${punchId++}`, punchType: 'CHECK_IN', punchedAt: `${workDate}T${checkInTime}:00`, isVoided: false })
        if (status === 'ON_BREAK' || status === 'COMPLETED' || status === 'APPROVED') {
          const bh = checkInHour + 3
          punchEvents.push({ id: `punch-${punchId++}`, punchType: 'BREAK_START', punchedAt: `${workDate}T${String(bh).padStart(2, '0')}:00:00`, isVoided: false })
          if (status === 'COMPLETED' || status === 'APPROVED') {
            punchEvents.push({ id: `punch-${punchId++}`, punchType: 'BREAK_END', punchedAt: `${workDate}T${String(bh).padStart(2, '0')}:45:00`, isVoided: false })
            punchEvents.push({ id: `punch-${punchId++}`, punchType: 'CHECK_OUT', punchedAt: `${workDate}T${checkOutTime}:00`, isVoided: false })
          }
        }
      }

      records.push({
        id: `att-${String(recId++).padStart(3, '0')}`,
        employeeId: emp.id,
        workDate,
        status,
        checkIn: status !== 'NOT_STARTED' ? checkInTime : undefined,
        checkOut: (status === 'COMPLETED' || status === 'APPROVED') ? checkOutTime : undefined,
        breakMinutes: status === 'NOT_STARTED' ? 0 : breakMinutes,
        actualMinutes: status === 'NOT_STARTED' ? 0 : actualMinutes,
        overtimeMinutes: status === 'NOT_STARTED' ? 0 : overtimeMinutes,
        punchEvents,
      })
    }
  }
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
  }
}
