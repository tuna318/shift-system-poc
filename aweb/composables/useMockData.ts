import type {
  Employee, ShiftBoard, ShiftEntry, AttendanceRecord, PunchEvent,
  CollectionRequest, CollectionSubmission, ComplianceAlert,
  ShiftPreference, ShiftPreferenceEntry, CellStatus
} from '~/types'

// ============================================================
// EMPLOYEES
// ============================================================
const employees: Employee[] = [
  // キッチン (5)
  { id: 'emp-001', name: '山田 太郎', nameKana: 'ヤマダ タロウ', department: 'キッチン', position: 'キッチンリーダー', hourlyWage: 1200, employmentType: 'PART_TIME', status: 'ACTIVE', hireDate: '2022-04-01', pin: '1234', skills: ['調理', '発注管理', '開閉店', 'トレーナー', '食品衛生管理者'] },
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
// SHIFT ENTRIES for March 2026
// ============================================================
function calcWage(empId: string, start: string, end: string): number {
  const emp = employees.find(e => e.id === empId)
  if (!emp) return 0
  const [sh, sm] = start.split(':').map(Number)
  const [eh, em] = end.split(':').map(Number)
  const hours = (eh * 60 + em - (sh * 60 + sm)) / 60
  return Math.round(emp.hourlyWage * hours)
}

const marchEntries: ShiftEntry[] = []
let entryId = 1

const shiftPatterns = [
  { start: '10:00', end: '18:00' },
  { start: '11:00', end: '20:00' },
  { start: '17:00', end: '22:00' },
  { start: '09:00', end: '15:00' },
  { start: '13:00', end: '21:00' },
  { start: '08:00', end: '16:00' },
  { start: '15:00', end: '22:00' },
]

// 0=CONFIRMED, 1=SHIFT_REQUESTED, 2=CONFIRMED, 3=SHIFT_REQUESTED, 4=ADJUSTING, 5=DAY_OFF_CONFIRMED, 6=DAY_OFF_REQUESTED
const cellStatuses: CellStatus[] = ['CONFIRMED', 'SHIFT_REQUESTED', 'CONFIRMED', 'SHIFT_REQUESTED', 'ADJUSTING', 'DAY_OFF_CONFIRMED', 'DAY_OFF_REQUESTED']

// Generate ~60 shift entries spread across March 2026
const entryPlan: Array<{ empId: string, day: number, patternIdx: number, statusIdx: number }> = [
  // emp-001 キッチン山田
  { empId: 'emp-001', day: 1, patternIdx: 0, statusIdx: 0 },
  { empId: 'emp-001', day: 3, patternIdx: 1, statusIdx: 0 },
  { empId: 'emp-001', day: 5, patternIdx: 2, statusIdx: 0 },
  { empId: 'emp-001', day: 8, patternIdx: 0, statusIdx: 0 },
  { empId: 'emp-001', day: 10, patternIdx: 3, statusIdx: 1 },
  { empId: 'emp-001', day: 15, patternIdx: 0, statusIdx: 0 },
  // emp-002 鈴木
  { empId: 'emp-002', day: 2, patternIdx: 3, statusIdx: 0 },
  { empId: 'emp-002', day: 6, patternIdx: 2, statusIdx: 0 },
  { empId: 'emp-002', day: 9, patternIdx: 1, statusIdx: 3 },
  { empId: 'emp-002', day: 12, patternIdx: 0, statusIdx: 0 },
  { empId: 'emp-002', day: 16, patternIdx: 4, statusIdx: 1 },
  { empId: 'emp-002', day: 20, patternIdx: 2, statusIdx: 0 },
  // emp-003 田中
  { empId: 'emp-003', day: 1, patternIdx: 2, statusIdx: 0 },
  { empId: 'emp-003', day: 4, patternIdx: 3, statusIdx: 0 },
  { empId: 'emp-003', day: 7, patternIdx: 1, statusIdx: 4 },
  { empId: 'emp-003', day: 11, patternIdx: 0, statusIdx: 0 },
  { empId: 'emp-003', day: 14, patternIdx: 2, statusIdx: 0 },
  // emp-004 渡辺
  { empId: 'emp-004', day: 2, patternIdx: 5, statusIdx: 0 },
  { empId: 'emp-004', day: 5, patternIdx: 0, statusIdx: 0 },
  { empId: 'emp-004', day: 9, patternIdx: 1, statusIdx: 0 },
  { empId: 'emp-004', day: 13, patternIdx: 0, statusIdx: 1 },
  { empId: 'emp-004', day: 17, patternIdx: 3, statusIdx: 0 },
  { empId: 'emp-004', day: 21, patternIdx: 2, statusIdx: 0 },
  // emp-005 伊藤
  { empId: 'emp-005', day: 3, patternIdx: 6, statusIdx: 3 },
  { empId: 'emp-005', day: 7, patternIdx: 2, statusIdx: 0 },
  { empId: 'emp-005', day: 10, patternIdx: 0, statusIdx: 0 },
  // emp-006 佐藤
  { empId: 'emp-006', day: 1, patternIdx: 0, statusIdx: 0 },
  { empId: 'emp-006', day: 2, patternIdx: 0, statusIdx: 0 },
  { empId: 'emp-006', day: 3, patternIdx: 0, statusIdx: 0 },
  { empId: 'emp-006', day: 4, patternIdx: 0, statusIdx: 0 },
  { empId: 'emp-006', day: 5, patternIdx: 0, statusIdx: 0 },
  { empId: 'emp-006', day: 8, patternIdx: 0, statusIdx: 0 },
  { empId: 'emp-006', day: 9, patternIdx: 0, statusIdx: 0 },
  // emp-007 高橋
  { empId: 'emp-007', day: 4, patternIdx: 2, statusIdx: 0 },
  { empId: 'emp-007', day: 8, patternIdx: 1, statusIdx: 3 },
  { empId: 'emp-007', day: 11, patternIdx: 0, statusIdx: 0 },
  { empId: 'emp-007', day: 15, patternIdx: 4, statusIdx: 0 },
  { empId: 'emp-007', day: 18, patternIdx: 2, statusIdx: 1 },
  // emp-008 中村
  { empId: 'emp-008', day: 2, patternIdx: 3, statusIdx: 0 },
  { empId: 'emp-008', day: 6, patternIdx: 2, statusIdx: 0 },
  { empId: 'emp-008', day: 13, patternIdx: 0, statusIdx: 4 },
  { empId: 'emp-008', day: 20, patternIdx: 1, statusIdx: 0 },
  // emp-009 小林
  { empId: 'emp-009', day: 3, patternIdx: 5, statusIdx: 0 },
  { empId: 'emp-009', day: 7, patternIdx: 0, statusIdx: 0 },
  { empId: 'emp-009', day: 12, patternIdx: 2, statusIdx: 0 },
  { empId: 'emp-009', day: 16, patternIdx: 3, statusIdx: 1 },
  { empId: 'emp-009', day: 22, patternIdx: 1, statusIdx: 0 },
  // emp-010 加藤
  { empId: 'emp-010', day: 5, patternIdx: 2, statusIdx: 3 },
  { empId: 'emp-010', day: 9, patternIdx: 1, statusIdx: 0 },
  { empId: 'emp-010', day: 14, patternIdx: 0, statusIdx: 0 },
  // emp-012 松本
  { empId: 'emp-012', day: 1, patternIdx: 0, statusIdx: 0 },
  { empId: 'emp-012', day: 4, patternIdx: 1, statusIdx: 0 },
  { empId: 'emp-012', day: 6, patternIdx: 0, statusIdx: 0 },
  { empId: 'emp-012', day: 10, patternIdx: 3, statusIdx: 0 },
  { empId: 'emp-012', day: 15, patternIdx: 0, statusIdx: 0 },
  // emp-013 木村
  { empId: 'emp-013', day: 2, patternIdx: 6, statusIdx: 0 },
  { empId: 'emp-013', day: 8, patternIdx: 2, statusIdx: 3 },
  { empId: 'emp-013', day: 12, patternIdx: 0, statusIdx: 0 },
  { empId: 'emp-013', day: 18, patternIdx: 1, statusIdx: 0 },
  // emp-014 清水
  { empId: 'emp-014', day: 3, patternIdx: 3, statusIdx: 0 },
  { empId: 'emp-014', day: 7, patternIdx: 1, statusIdx: 4 },
  { empId: 'emp-014', day: 11, patternIdx: 2, statusIdx: 0 },
  // emp-015 斎藤
  { empId: 'emp-015', day: 5, patternIdx: 0, statusIdx: 3 },
  { empId: 'emp-015', day: 10, patternIdx: 2, statusIdx: 0 },
  { empId: 'emp-015', day: 16, patternIdx: 1, statusIdx: 0 },
  // Day off requests
  { empId: 'emp-002', day: 14, patternIdx: 0, statusIdx: 6 },
  { empId: 'emp-005', day: 12, patternIdx: 0, statusIdx: 6 },
  { empId: 'emp-007', day: 22, patternIdx: 0, statusIdx: 5 },
  { empId: 'emp-009', day: 5, patternIdx: 0, statusIdx: 6 },
  { empId: 'emp-013', day: 20, patternIdx: 0, statusIdx: 5 },
]

for (const plan of entryPlan) {
  const emp = employees.find(e => e.id === plan.empId)!
  const pattern = shiftPatterns[plan.patternIdx % shiftPatterns.length]
  const dayStr = String(plan.day).padStart(2, '0')
  const shiftDate = `2026-03-${dayStr}`
  marchEntries.push({
    id: `entry-${String(entryId++).padStart(3, '0')}`,
    employeeId: plan.empId,
    shiftDate,
    startTime: pattern.start,
    endTime: pattern.end,
    department: emp.department,
    cellStatus: cellStatuses[plan.statusIdx % cellStatuses.length],
    estimatedWage: calcWage(plan.empId, pattern.start, pattern.end),
    note: plan.statusIdx === 4 ? '調整中：希望シフト確認' : plan.statusIdx === 6 ? '休み希望申請中' : undefined,
  })
}

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
    entries: [],
    createdAt: '2026-03-05T09:00:00',
    collectionId: 'coll-002',
  },
  {
    id: 'board-2026-03',
    name: '2026年3月 シフトボード',
    status: 'DRAFT',
    periodStart: '2026-03-01',
    periodEnd: '2026-03-31',
    budgetAmount: 800000,
    entries: marchEntries,
    createdAt: '2026-02-15T09:00:00',
    collectionId: 'coll-001',
  },
  {
    id: 'board-2026-02',
    name: '2026年2月 シフトボード',
    status: 'PUBLISHED',
    periodStart: '2026-02-01',
    periodEnd: '2026-02-28',
    budgetAmount: 750000,
    entries: [],
    createdAt: '2026-01-20T09:00:00',
    collectionId: 'coll-000',
  },
]

// ============================================================
// SHIFT PREFERENCES (March 2026)
// ============================================================
function makePreferences(): Map<string, ShiftPreference> {
  const map = new Map<string, ShiftPreference>()
  const activeEmps = employees.filter(e => e.status === 'ACTIVE')
  for (const emp of activeEmps) {
    const entries: ShiftPreferenceEntry[] = []
    for (let day = 1; day <= 31; day++) {
      const dayStr = String(day).padStart(2, '0')
      const date = `2026-03-${dayStr}`
      const dow = new Date(date).getDay() // 0=Sun, 6=Sat
      // Weekends mostly unavailable for part-timers, full-timers available
      let availability: 'PREFERRED' | 'AVAILABLE' | 'UNAVAILABLE'
      if (emp.employmentType === 'FULL_TIME') {
        availability = (dow === 0 || dow === 6) ? 'AVAILABLE' : 'PREFERRED'
      } else {
        if (dow === 0) {
          availability = 'UNAVAILABLE'
        } else if (dow === 6) {
          availability = day % 3 === 0 ? 'AVAILABLE' : 'UNAVAILABLE'
        } else {
          const rand = (parseInt(emp.id.slice(-3)) + day) % 5
          availability = rand === 0 ? 'UNAVAILABLE' : rand <= 2 ? 'PREFERRED' : 'AVAILABLE'
        }
      }
      entries.push({ date, availability })
    }
    map.set(emp.id, { employeeId: emp.id, entries })
  }
  return map
}
const preferencesMap = makePreferences()

// ============================================================
// ATTENDANCE RECORDS (Last 7 days)
// ============================================================
function makeAttendanceRecords(): AttendanceRecord[] {
  const records: AttendanceRecord[] = []
  const today = new Date('2026-03-01')
  let recId = 1
  let punchId = 1

  for (let d = 6; d >= 0; d--) {
    const date = new Date(today)
    date.setDate(date.getDate() - d)
    const workDate = date.toISOString().split('T')[0]

    const activeEmps = employees.filter(e => e.status === 'ACTIVE').slice(0, 12)
    const dayEmps = activeEmps.filter((_, i) => (i + d) % 3 !== 0).slice(0, 10)

    for (const emp of dayEmps) {
      const checkInHour = 9 + (parseInt(emp.id.slice(-1)) % 4)
      const checkInMin = (parseInt(emp.id.slice(-2)) % 3) * 15
      const checkInTime = `${String(checkInHour).padStart(2, '0')}:${String(checkInMin).padStart(2, '0')}`
      const workHours = 7 + (parseInt(emp.id.slice(-1)) % 3)
      const checkOutHour = checkInHour + workHours
      const checkOutTime = `${String(checkOutHour).padStart(2, '0')}:${String(checkInMin).padStart(2, '0')}`
      const breakMinutes = 45
      const actualMinutes = workHours * 60 - breakMinutes
      const overtimeMinutes = actualMinutes > 480 ? actualMinutes - 480 : 0

      const isToday = d === 0
      let status: 'NOT_STARTED' | 'WORKING' | 'ON_BREAK' | 'COMPLETED' | 'APPROVED'
      if (isToday) {
        const todayStatuses = ['WORKING', 'WORKING', 'WORKING', 'ON_BREAK', 'NOT_STARTED'] as const
        status = todayStatuses[parseInt(emp.id.slice(-1)) % 5]
      } else if (d === 1) {
        status = 'COMPLETED'
      } else {
        status = parseInt(emp.id.slice(-1)) % 3 === 0 ? 'APPROVED' : 'COMPLETED'
      }

      const punchEvents: PunchEvent[] = []
      if (status !== 'NOT_STARTED') {
        punchEvents.push({
          id: `punch-${punchId++}`,
          punchType: 'CHECK_IN',
          punchedAt: `${workDate}T${checkInTime}:00`,
          isVoided: false,
        })
        if (status === 'ON_BREAK' || status === 'COMPLETED' || status === 'APPROVED') {
          const breakStartHour = checkInHour + 3
          punchEvents.push({
            id: `punch-${punchId++}`,
            punchType: 'BREAK_START',
            punchedAt: `${workDate}T${String(breakStartHour).padStart(2, '0')}:00:00`,
            isVoided: false,
          })
          if (status === 'COMPLETED' || status === 'APPROVED') {
            punchEvents.push({
              id: `punch-${punchId++}`,
              punchType: 'BREAK_END',
              punchedAt: `${workDate}T${String(breakStartHour).padStart(2, '0')}:45:00`,
              isVoided: false,
            })
            punchEvents.push({
              id: `punch-${punchId++}`,
              punchType: 'CHECK_OUT',
              punchedAt: `${workDate}T${checkOutTime}:00`,
              isVoided: false,
            })
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
    submissions: allEmpIds.slice(0, 14).map(id => ({
      employeeId: id,
      submitted: true,
      submittedAt: '2026-01-18T10:00:00',
    })),
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
    submissions: allEmpIds.slice(0, 14).map(id => ({
      employeeId: id,
      submitted: true,
      submittedAt: '2026-02-18T10:00:00',
    })),
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
    submissions: allEmpIds.slice(0, 14).map((id, i) => ({
      employeeId: id,
      submitted: i < 8,
      submittedAt: i < 8 ? '2026-03-10T10:00:00' : undefined,
    })),
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
    submissions: allEmpIds.slice(0, 14).map(id => ({
      employeeId: id,
      submitted: false,
    })),
  },
]

// ============================================================
// COMPLIANCE ALERTS
// ============================================================
const alerts: ComplianceAlert[] = [
  {
    id: 'alert-001',
    employeeId: 'emp-004',
    type: 'OVERTIME_WARNING',
    level: 'warning',
    message: '渡辺 健司：今月の残業時間が35時間に達しました（上限45時間）',
    createdAt: '2026-02-28T09:00:00',
  },
  {
    id: 'alert-002',
    employeeId: 'emp-006',
    type: 'CONSECUTIVE_DAYS',
    level: 'warning',
    message: '佐藤 花子：6日連続勤務が予定されています（法定上限：6日）',
    createdAt: '2026-02-28T09:30:00',
  },
  {
    id: 'alert-003',
    employeeId: 'emp-012',
    type: 'OVERTIME_CRITICAL',
    level: 'critical',
    message: '松本 幸子：今月の時間外労働が42時間に達しました（上限45時間・要注意）',
    createdAt: '2026-03-01T08:00:00',
  },
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
  const pref = preferencesMap.get(empId)
  if (!pref) return undefined
  return pref.entries.find(e => e.date === date)
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
    empMap.set(entry.employeeId, {
      hours: existing.hours + hours,
      cost: existing.cost + entry.estimatedWage,
    })
  }

  const perEmployee = Array.from(empMap.entries()).map(([empId, data]) => ({
    employee: getEmployee(empId)!,
    hours: Math.round(data.hours * 10) / 10,
    cost: data.cost,
  })).filter(e => e.employee)

  const totalCost = perEmployee.reduce((sum, e) => sum + e.cost, 0)
  return {
    totalCost,
    budget: board.budgetAmount,
    variance: totalCost - board.budgetAmount,
    perEmployee,
  }
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
    preferences: preferencesMap,
    getEmployee,
    getEntriesForDate,
    getPreference,
    getCostSummary,
    getCollectionForBoard,
  }
}
