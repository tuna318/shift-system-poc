import type {
  Employee,
  ShiftEntry,
  ShiftPreference,
  AttendanceRecord,
  Notification,
  PunchStatus,
} from '~/types'

export const useMockData = () => {
  // ── Employees ───────────────────────────────────────────────────────────────
  const employees: Employee[] = [
    { id: 'emp-001', name: '山田 太郎', nameKana: 'ヤマダ タロウ', department: 'キッチン', employmentType: 'PART_TIME', hourlyWage: 1200, pin: '111111' },
    { id: 'emp-002', name: '鈴木 次郎', nameKana: 'スズキ ジロウ', department: 'キッチン', employmentType: 'PART_TIME', hourlyWage: 1100, pin: '222222' },
    { id: 'emp-003', name: '田中 花子', nameKana: 'タナカ ハナコ', department: 'ホール', employmentType: 'PART_TIME', hourlyWage: 1150, pin: '333333' },
    { id: 'emp-004', name: '佐藤 美咲', nameKana: 'サトウ ミサキ', department: 'ホール', employmentType: 'FULL_TIME', hourlyWage: 1300, pin: '444444' },
    { id: 'emp-005', name: '伊藤 健司', nameKana: 'イトウ ケンジ', department: 'レジ', employmentType: 'PART_TIME', hourlyWage: 1050, pin: '555555' },
    { id: 'emp-006', name: '渡辺 彩', nameKana: 'ワタナベ アヤ', department: 'レジ', employmentType: 'PART_TIME', hourlyWage: 1050, pin: '666666' },
    { id: 'emp-007', name: '高橋 誠', nameKana: 'タカハシ マコト', department: 'キッチン', employmentType: 'FULL_TIME', hourlyWage: 1350, pin: '777777' },
    { id: 'emp-008', name: '中村 由美', nameKana: 'ナカムラ ユミ', department: 'ホール', employmentType: 'PART_TIME', hourlyWage: 1100, pin: '888888' },
  ]

  // Default logged-in employee: 田中 花子
  const loggedInEmployee = computed(() =>
    employees.find((e) => e.id === 'emp-003') ?? employees[0]
  )

  // ── Shifts for March 2026 (emp-003) ────────────────────────────────────────
  const myShifts: ShiftEntry[] = [
    { id: 's-001', employeeId: 'emp-003', date: '2026-03-02', startTime: '10:00', endTime: '15:00', department: 'ホール', status: 'CONFIRMED' },
    { id: 's-002', employeeId: 'emp-003', date: '2026-03-04', startTime: '11:00', endTime: '17:00', department: 'ホール', status: 'CONFIRMED' },
    { id: 's-003', employeeId: 'emp-003', date: '2026-03-06', startTime: '09:00', endTime: '14:00', department: 'ホール', status: 'CONFIRMED' },
    { id: 's-004', employeeId: 'emp-003', date: '2026-03-08', startTime: '13:00', endTime: '18:00', department: 'ホール', status: 'CONFIRMED' },
    { id: 's-005', employeeId: 'emp-003', date: '2026-03-10', startTime: '18:00', endTime: '22:00', department: 'ホール', status: 'CONFIRMED' },
    { id: 's-006', employeeId: 'emp-003', date: '2026-03-12', startTime: '10:00', endTime: '16:00', department: 'ホール', status: 'CONFIRMED' },
    { id: 's-007', employeeId: 'emp-003', date: '2026-03-14', startTime: '11:00', endTime: '17:00', department: 'ホール', status: 'CONFIRMED' },
    { id: 's-008', employeeId: 'emp-003', date: '2026-03-16', startTime: '09:00', endTime: '15:00', department: 'ホール', status: 'CONFIRMED' },
    { id: 's-009', employeeId: 'emp-003', date: '2026-03-18', startTime: '14:00', endTime: '20:00', department: 'ホール', status: 'CONFIRMED' },
    { id: 's-010', employeeId: 'emp-003', date: '2026-03-20', startTime: '10:00', endTime: '15:00', department: 'ホール', status: 'CONFIRMED' },
    { id: 's-011', employeeId: 'emp-003', date: '2026-03-23', startTime: '11:00', endTime: '17:00', department: 'ホール', status: 'CONFIRMED' },
    { id: 's-012', employeeId: 'emp-003', date: '2026-03-25', startTime: '09:00', endTime: '14:00', department: 'ホール', status: 'CONFIRMED' },
    { id: 's-013', employeeId: 'emp-003', date: '2026-03-27', startTime: '13:00', endTime: '19:00', department: 'ホール', status: 'CONFIRMED' },
    // Today
    { id: 's-014', employeeId: 'emp-003', date: '2026-03-01', startTime: '09:00', endTime: '15:00', department: 'ホール', status: 'CONFIRMED' },
  ]

  // ── Shift preferences submitted for April 2026 ─────────────────────────────
  const myPreferences: ShiftPreference[] = [
    { id: 'pref-001', employeeId: 'emp-003', date: '2026-04-01', type: 'WORK', preferredStart: '10:00', preferredEnd: '16:00', submitted: true },
    { id: 'pref-002', employeeId: 'emp-003', date: '2026-04-02', type: 'OFF', submitted: true },
    { id: 'pref-003', employeeId: 'emp-003', date: '2026-04-03', type: 'WORK', preferredStart: '11:00', preferredEnd: '17:00', submitted: true },
    { id: 'pref-004', employeeId: 'emp-003', date: '2026-04-05', type: 'WORK', preferredStart: '09:00', preferredEnd: '15:00', submitted: true },
    { id: 'pref-005', employeeId: 'emp-003', date: '2026-04-06', type: 'OFF', submitted: true },
    { id: 'pref-006', employeeId: 'emp-003', date: '2026-04-07', type: 'WORK', preferredStart: '14:00', preferredEnd: '20:00', submitted: true },
  ]

  // ── Attendance records for February + March 2026 ────────────────────────────
  const myAttendance: AttendanceRecord[] = [
    // February
    { id: 'att-001', employeeId: 'emp-003', date: '2026-02-02', status: 'APPROVED', checkIn: '10:03', checkOut: '15:12', breakMinutes: 0, totalMinutes: 309, overtimeMinutes: 0, scheduledStart: '10:00', scheduledEnd: '15:00' },
    { id: 'att-002', employeeId: 'emp-003', date: '2026-02-05', status: 'APPROVED', checkIn: '11:02', checkOut: '17:05', breakMinutes: 60, totalMinutes: 303, overtimeMinutes: 0, scheduledStart: '11:00', scheduledEnd: '17:00' },
    { id: 'att-003', employeeId: 'emp-003', date: '2026-02-09', status: 'APPROVED', checkIn: '09:05', checkOut: '14:58', breakMinutes: 0, totalMinutes: 293, overtimeMinutes: 0, scheduledStart: '09:00', scheduledEnd: '15:00' },
    { id: 'att-004', employeeId: 'emp-003', date: '2026-02-12', status: 'APPROVED', checkIn: '13:01', checkOut: '18:30', breakMinutes: 0, totalMinutes: 329, overtimeMinutes: 30, scheduledStart: '13:00', scheduledEnd: '18:00' },
    // March (before today)
    { id: 'att-005', employeeId: 'emp-003', date: '2026-03-01', status: 'PENDING_APPROVAL', checkIn: '09:15', checkOut: null, breakMinutes: 0, totalMinutes: 0, overtimeMinutes: 0, scheduledStart: '09:00', scheduledEnd: '15:00' },
  ]

  // ── Current punch status (today: emp-003 checked in at 09:15) ──────────────
  const currentPunchStatus = ref<PunchStatus>({
    status: 'WORKING',
    checkInTime: '09:15',
    breakMinutes: 0,
    events: [
      { type: 'CHECK_IN', time: '09:15', timestamp: '2026-03-01T09:15:00' },
    ],
  })

  // ── Notifications ──────────────────────────────────────────────────────────
  const notifications = ref<Notification[]>([
    {
      id: 'n1',
      type: 'CORRECTION_REQUEST',
      title: '打刻修正依頼',
      body: '3/1の退勤時刻を確認してください',
      date: '2026-03-01',
      read: false,
      relatedId: 'att-005',
    },
    {
      id: 'n2',
      type: 'SHIFT_CONFIRMED',
      title: 'シフト確定',
      body: '3月のシフトが確定しました',
      date: '2026-02-28',
      read: true,
    },
    {
      id: 'n3',
      type: 'SUBSTITUTION_REQUEST',
      title: '代打依頼',
      body: '3/10 (火) 18:00-22:00 出勤できますか？',
      date: '2026-03-01',
      read: false,
      actionRequired: true,
    },
    {
      id: 'n4',
      type: 'SHIFT_REMINDER',
      title: 'シフト提出リマインダー',
      body: '4月の希望シフト提出は3/15までです',
      date: '2026-02-27',
      read: true,
    },
    {
      id: 'n5',
      type: 'SHIFT_CHANGED',
      title: 'シフト変更',
      body: '3/18のシフトが14:00-20:00に変更されました',
      date: '2026-02-26',
      read: true,
    },
  ])

  // ── Helpers ────────────────────────────────────────────────────────────────
  function getShiftForDate(date: string) {
    return myShifts.find((s) => s.date === date) ?? null
  }

  function getAttendanceForDate(date: string) {
    return myAttendance.find((a) => a.date === date) ?? null
  }

  function getPreferenceForDate(date: string) {
    return myPreferences.find((p) => p.date === date) ?? null
  }

  function getUpcomingShifts(fromDate: string, count = 3) {
    return myShifts
      .filter((s) => s.date > fromDate)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, count)
  }

  function formatMinutes(minutes: number) {
    const h = Math.floor(minutes / 60)
    const m = minutes % 60
    return m > 0 ? `${h}時間${m}分` : `${h}時間`
  }

  function getMonthTotalMinutes(year: number, month: number) {
    return myAttendance
      .filter((a) => {
        const d = new Date(a.date)
        return d.getFullYear() === year && d.getMonth() + 1 === month && a.status !== 'NOT_SUBMITTED'
      })
      .reduce((sum, a) => sum + a.totalMinutes, 0)
  }

  return {
    employees,
    loggedInEmployee,
    myShifts,
    myPreferences,
    myAttendance,
    currentPunchStatus,
    notifications,
    getShiftForDate,
    getAttendanceForDate,
    getPreferenceForDate,
    getUpcomingShifts,
    formatMinutes,
    getMonthTotalMinutes,
  }
}
