import type {
  Employee,
  ShiftEntry,
  ShiftPreference,
  AttendanceRecord,
  Notification,
  PunchStatus,
  SubstitutionRequest,
  CollectionRequest,
  ChatMessage,
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
    { id: 's-001', employeeId: 'emp-003', date: '2026-03-02', startTime: '10:00', endTime: '15:00', department: 'ホール', status: 'CONFIRMED', cellStatus: 'CONFIRMED' },
    { id: 's-002', employeeId: 'emp-003', date: '2026-03-04', startTime: '11:00', endTime: '17:00', department: 'ホール', status: 'CONFIRMED', cellStatus: 'CONFIRMED' },
    { id: 's-003', employeeId: 'emp-003', date: '2026-03-06', startTime: '09:00', endTime: '14:00', department: 'ホール', status: 'CONFIRMED', cellStatus: 'CONFIRMED' },
    { id: 's-004', employeeId: 'emp-003', date: '2026-03-08', startTime: '13:00', endTime: '18:00', department: 'ホール', status: 'CONFIRMED', cellStatus: 'CONFIRMED' },
    { id: 's-005', employeeId: 'emp-003', date: '2026-03-10', startTime: '18:00', endTime: '22:00', department: 'ホール', status: 'CONFIRMED', cellStatus: 'CONFIRMED' },
    { id: 's-006', employeeId: 'emp-003', date: '2026-03-12', startTime: '10:00', endTime: '16:00', department: 'ホール', status: 'CONFIRMED', cellStatus: 'CONFIRMED' },
    { id: 's-007', employeeId: 'emp-003', date: '2026-03-14', startTime: '11:00', endTime: '17:00', department: 'ホール', status: 'CONFIRMED', cellStatus: 'CONFIRMED' },
    { id: 's-008', employeeId: 'emp-003', date: '2026-03-16', startTime: '09:00', endTime: '15:00', department: 'ホール', status: 'CONFIRMED', cellStatus: 'CONFIRMED' },
    // ADJUSTING — manager wants to change this shift; requires employee response
    {
      id: 's-009', employeeId: 'emp-003', date: '2026-03-22', startTime: '14:00', endTime: '20:00',
      department: 'ホール', status: 'CONFIRMED', cellStatus: 'ADJUSTING',
      adjustingReason: '3/22のシフト、ランチタイムも入っていただけますか？11:00〜に変更をお願いしたいです。',
      adjustingResponseStatus: 'PENDING',
    },
    { id: 's-010', employeeId: 'emp-003', date: '2026-03-24', startTime: '10:00', endTime: '15:00', department: 'ホール', status: 'CONFIRMED', cellStatus: 'CONFIRMED' },
    { id: 's-011', employeeId: 'emp-003', date: '2026-03-26', startTime: '11:00', endTime: '17:00', department: 'ホール', status: 'CONFIRMED', cellStatus: 'CONFIRMED' },
    { id: 's-012', employeeId: 'emp-003', date: '2026-03-28', startTime: '09:00', endTime: '14:00', department: 'ホール', status: 'CONFIRMED', cellStatus: 'CONFIRMED' },
    { id: 's-013', employeeId: 'emp-003', date: '2026-03-30', startTime: '13:00', endTime: '19:00', department: 'ホール', status: 'CONFIRMED', cellStatus: 'CONFIRMED' },
    // Today (using real date for demo; keeping 2026-03-22 for other references)
    { id: 's-014', employeeId: 'emp-003', date: '2026-03-22', startTime: '09:00', endTime: '15:00', department: 'ホール', status: 'CONFIRMED', cellStatus: 'CONFIRMED' },
    // Split-shift day — 3/19: morning (朝番) + evening (夕番)
    { id: 's-015a', employeeId: 'emp-003', date: '2026-03-19', startTime: '09:00', endTime: '14:00', department: 'ホール', status: 'CONFIRMED', cellStatus: 'CONFIRMED' },
    { id: 's-015b', employeeId: 'emp-003', date: '2026-03-19', startTime: '17:00', endTime: '21:00', department: 'ホール', status: 'CONFIRMED', cellStatus: 'CONFIRMED' },
    // 未退勤 demo day
    { id: 's-016', employeeId: 'emp-003', date: '2026-03-27', startTime: '10:00', endTime: '16:00', department: 'ホール', status: 'CONFIRMED', cellStatus: 'CONFIRMED' },
  ]

  // ── Shift preferences submitted for April 2026 ─────────────────────────────
  const myPreferences: ShiftPreference[] = [
    { id: 'pref-001', employeeId: 'emp-003', date: '2026-04-01', availability: 'PREFERRED', preferredStart: '10:00', preferredEnd: '16:00', submitted: true },
    { id: 'pref-002', employeeId: 'emp-003', date: '2026-04-02', availability: 'UNAVAILABLE', submitted: true },
    { id: 'pref-003', employeeId: 'emp-003', date: '2026-04-03', availability: 'PREFERRED', preferredStart: '11:00', preferredEnd: '17:00', submitted: true },
    { id: 'pref-004', employeeId: 'emp-003', date: '2026-04-05', availability: 'AVAILABLE', preferredStart: '09:00', preferredEnd: '15:00', submitted: true },
    { id: 'pref-005', employeeId: 'emp-003', date: '2026-04-06', availability: 'UNAVAILABLE', submitted: true },
    { id: 'pref-006', employeeId: 'emp-003', date: '2026-04-07', availability: 'PREFERRED', preferredStart: '14:00', preferredEnd: '20:00', submitted: true },
  ]

  // ── Active collection request for April ─────────────────────────────────────
  // Slots: 朝番 09-15, 夕番 15-22. All 30 days in April have both slots.
  const aprSlots: import('~/types').ShiftSlot[] = [
    { id: 'apr-s1', label: '朝番', startTime: '09:00', endTime: '15:00', color: '#3587dc' },
    { id: 'apr-s2', label: '夕番', startTime: '15:00', endTime: '22:00', color: '#f8c076' },
  ]
  const aprAssignments: import('~/types').DaySlotAssignment[] = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(2026, 3, i + 1) // April 2026
    const dow = d.getDay()
    // Sundays: only 夕番; all other days: both
    return { date: d.toISOString().slice(0, 10), slotIds: dow === 0 ? ['apr-s2'] : ['apr-s1', 'apr-s2'] }
  })

  const activeCollection: CollectionRequest = {
    id: 'coll-002',
    name: '2026年4月 シフト収集',
    status: 'COLLECTING',
    periodStart: '2026-04-01',
    periodEnd: '2026-04-30',
    deadline: '2026-03-25',
    allocationSetup: { slots: aprSlots, assignments: aprAssignments },
  }

  // ── March shift board ────────────────────────────────────────────────────────
  const marSlots: import('~/types').ShiftSlot[] = [
    { id: 'mar-s1', label: '朝番', startTime: '09:00', endTime: '15:00', color: '#3587dc' },
    { id: 'mar-s2', label: '夕番', startTime: '15:00', endTime: '22:00', color: '#f8c076' },
  ]
  const marAssignments: import('~/types').DaySlotAssignment[] = Array.from({ length: 31 }, (_, i) => {
    const d = new Date(2026, 2, i + 1)
    return { date: d.toISOString().slice(0, 10), slotIds: d.getDay() === 0 ? ['mar-s2'] : ['mar-s1', 'mar-s2'] }
  })

  const marchBoard: import('~/types').ShiftBoardInfo = {
    id: 'board-2026-03',
    name: '2026年3月 シフトボード',
    status: 'PUBLISHED',
    periodStart: '2026-03-01',
    periodEnd: '2026-03-31',
    allocationSetup: { slots: marSlots, assignments: marAssignments },
    collectionId: 'coll-002',
  }

  // Fixed colleagues per slot for the board lineup display
  const SLOT_COLLEAGUES: Record<string, import('~/types').BoardEntry[]> = {
    'mar-s1': [
      { employeeId: 'emp-002', name: '鈴木 梅子', department: 'ホール',   role: 'ホールリーダー' },
      { employeeId: 'emp-001', name: '山田 太郎', department: 'キッチン', role: 'キッチンリーダー' },
      { employeeId: 'emp-004', name: '中村 彩',   department: 'キッチン', role: 'クルー' },
      { employeeId: 'emp-007', name: '木村 誠',   department: 'レジ',     role: 'レジリーダー' },
    ],
    'mar-s2': [
      { employeeId: 'emp-005', name: '伊藤 智子', department: 'ホール',   role: 'ホールリーダー' },
      { employeeId: 'emp-006', name: '高橋 愛',   department: 'ホール',   role: 'クルー' },
      { employeeId: 'emp-008', name: '小林 健二', department: 'キッチン', role: 'キッチンリーダー' },
    ],
  }

  function getBoardLineup(date: string, slotId: string): import('~/types').BoardEntry[] {
    const colleagues = (SLOT_COLLEAGUES[slotId] ?? []).map(e => ({ ...e }))
    // Include current user (emp-003 / 田中花子) if she has a confirmed shift on this date
    const myShift = myShifts.find(s => s.date === date)
    if (myShift && (slotId === 'mar-s1' ? myShift.startTime < '15:00' : myShift.startTime >= '15:00')) {
      colleagues.push({
        employeeId: 'emp-003',
        name: '田中 花子',
        department: myShift.department,
        role: 'クルー',
        isCurrentUser: true,
      })
    }
    return colleagues
  }

  // ── Attendance records for February + March 2026 ────────────────────────────
  const myAttendance: AttendanceRecord[] = [
    { id: 'att-001', employeeId: 'emp-003', date: '2026-02-02', status: 'APPROVED', checkIn: '10:03', checkOut: '15:12', breakMinutes: 0, breaks: [], totalMinutes: 309, overtimeMinutes: 0, scheduledStart: '10:00', scheduledEnd: '15:00', department: 'ホール' },
    { id: 'att-002', employeeId: 'emp-003', date: '2026-02-05', status: 'APPROVED', checkIn: '11:02', checkOut: '17:05', breakMinutes: 60, breaks: [{ start: '13:30', end: '14:30' }], totalMinutes: 303, overtimeMinutes: 0, scheduledStart: '11:00', scheduledEnd: '17:00', department: 'ホール' },
    { id: 'att-003', employeeId: 'emp-003', date: '2026-02-09', status: 'APPROVED', checkIn: '09:05', checkOut: '14:58', breakMinutes: 0, breaks: [], totalMinutes: 293, overtimeMinutes: 0, scheduledStart: '09:00', scheduledEnd: '15:00', department: 'ホール' },
    { id: 'att-004', employeeId: 'emp-003', date: '2026-02-12', status: 'APPROVED', checkIn: '13:01', checkOut: '18:30', breakMinutes: 0, breaks: [], totalMinutes: 329, overtimeMinutes: 30, scheduledStart: '13:00', scheduledEnd: '18:00', department: 'ホール' },
    { id: 'att-005', employeeId: 'emp-003', date: '2026-02-16', status: 'APPROVED', checkIn: '10:00', checkOut: '16:02', breakMinutes: 60, breaks: [{ start: '12:30', end: '13:30' }], totalMinutes: 302, overtimeMinutes: 0, scheduledStart: '10:00', scheduledEnd: '16:00', department: 'ホール' },
    { id: 'att-006', employeeId: 'emp-003', date: '2026-02-19', status: 'APPROVED', checkIn: '11:00', checkOut: '17:10', breakMinutes: 60, breaks: [{ start: '13:00', end: '14:00' }], totalMinutes: 310, overtimeMinutes: 10, scheduledStart: '11:00', scheduledEnd: '17:00', department: 'ホール' },
    { id: 'att-007', employeeId: 'emp-003', date: '2026-03-02', status: 'APPROVED', checkIn: '10:02', checkOut: '15:05', breakMinutes: 0, breaks: [], totalMinutes: 303, overtimeMinutes: 0, scheduledStart: '10:00', scheduledEnd: '15:00', department: 'ホール' },
    { id: 'att-008', employeeId: 'emp-003', date: '2026-03-04', status: 'APPROVED', checkIn: '11:00', checkOut: '17:15', breakMinutes: 60, breaks: [{ start: '13:00', end: '14:00' }], totalMinutes: 315, overtimeMinutes: 15, scheduledStart: '11:00', scheduledEnd: '17:00', department: 'ホール', punchMethod: 'app', originalCheckIn: '11:03', originalCheckOut: '17:08' },
    { id: 'att-009', employeeId: 'emp-003', date: '2026-03-06', status: 'APPROVED', checkIn: '09:00', checkOut: '14:00', breakMinutes: 0, breaks: [], totalMinutes: 300, overtimeMinutes: 0, scheduledStart: '09:00', scheduledEnd: '14:00', department: 'ホール' },
    { id: 'att-010', employeeId: 'emp-003', date: '2026-03-08', status: 'CORRECTION_REQUESTED', checkIn: '13:05', checkOut: null, breakMinutes: 0, breaks: [], totalMinutes: 0, overtimeMinutes: 0, scheduledStart: '13:00', scheduledEnd: '18:00', correctionComment: '退勤打刻が記録されていません。正確な退勤時刻を入力してください。', department: 'ホール' },
    // Night shift: 22:00 → 02:30 next day (3/11) — 270 min work, 270 min deep night
    { id: 'att-011', employeeId: 'emp-003', date: '2026-03-10', status: 'APPROVED', checkIn: '22:00', checkOut: '02:30', breakMinutes: 0, breaks: [], totalMinutes: 270, overtimeMinutes: 30, scheduledStart: '22:00', scheduledEnd: '02:00', department: 'ホール', punchMethod: 'app' },
    { id: 'att-012', employeeId: 'emp-003', date: '2026-03-12', status: 'APPROVED', checkIn: '10:00', checkOut: '16:30', breakMinutes: 60, breaks: [{ start: '12:00', end: '12:30' }, { start: '14:30', end: '15:00' }], totalMinutes: 330, overtimeMinutes: 30, scheduledStart: '10:00', scheduledEnd: '16:00', department: 'キッチン', punchVariant: 'HELP', helpStore: '池袋店' },
    { id: 'att-013', employeeId: 'emp-003', date: '2026-03-14', status: 'APPROVED', checkIn: '11:00', checkOut: '17:20', breakMinutes: 60, breaks: [{ start: '13:00', end: '14:00' }], totalMinutes: 320, overtimeMinutes: 20, scheduledStart: '11:00', scheduledEnd: '17:00', department: 'ホール' },
    { id: 'att-014', employeeId: 'emp-003', date: '2026-03-16', status: 'APPROVED', checkIn: '09:02', checkOut: '17:45', breakMinutes: 60, breaks: [{ start: '12:00', end: '13:00' }], totalMinutes: 463, overtimeMinutes: 103, scheduledStart: '09:00', scheduledEnd: '15:00', department: 'ホール' },
    { id: 'att-015', employeeId: 'emp-003', date: '2026-03-23', status: 'APPROVED', checkIn: '09:00', checkOut: '19:00', breakMinutes: 60, breaks: [{ start: '12:30', end: '13:30' }], totalMinutes: 540, overtimeMinutes: 240, scheduledStart: '09:00', scheduledEnd: '15:00', department: 'ホール' },
    { id: 'att-016', employeeId: 'emp-003', date: '2026-03-24', status: 'PENDING_APPROVAL', checkIn: '10:00', checkOut: '19:30', breakMinutes: 60, breaks: [{ start: '12:30', end: '13:30' }], totalMinutes: 510, overtimeMinutes: 270, scheduledStart: '10:00', scheduledEnd: '15:00', department: 'ホール' },
    { id: 'att-017', employeeId: 'emp-003', date: '2026-03-25', status: 'APPROVED', checkIn: '11:00', checkOut: '20:30', breakMinutes: 60, breaks: [{ start: '13:30', end: '14:30' }], totalMinutes: 510, overtimeMinutes: 210, scheduledStart: '11:00', scheduledEnd: '17:00', department: 'ホール' },
    { id: 'att-018', employeeId: 'emp-003', date: '2026-03-26', status: 'PENDING_APPROVAL', checkIn: '11:05', checkOut: '19:00', breakMinutes: 60, breaks: [{ start: '13:00', end: '14:00' }], totalMinutes: 415, overtimeMinutes: 15, scheduledStart: '11:00', scheduledEnd: '17:00', department: 'ホール' },
    // Split-shift day: morning (09:05–14:10, 30 min break) + evening (17:02–21:15, no break)
    {
      id: 'att-019', employeeId: 'emp-003', date: '2026-03-19', status: 'APPROVED',
      checkIn: '09:05', checkOut: '21:15',
      breakMinutes: 30, totalMinutes: 498, overtimeMinutes: 0,
      scheduledStart: '09:00', scheduledEnd: '21:00', department: 'ホール',
      breaks: [{ start: '12:00', end: '12:30' }],
      sessions: [
        { checkIn: '09:05', checkOut: '14:10', breaks: [{ start: '12:00', end: '12:30' }], department: 'ホール', punchVariant: 'NORMAL' },
        { checkIn: '17:02', checkOut: '21:15', breaks: [], department: 'キッチン', punchVariant: 'HELP', helpStore: '新宿店' },
      ],
    },
    // 未退勤: checked in but forgot to clock out (3/27, has shift)
    { id: 'att-020', employeeId: 'emp-003', date: '2026-03-27', status: 'NOT_SUBMITTED', checkIn: '10:00', checkOut: null, breakMinutes: 0, breaks: [], totalMinutes: 0, overtimeMinutes: 0, scheduledStart: '10:00', scheduledEnd: '16:00', department: 'ホール' },

    // ── NOT_SUBMITTED — complete data, 申請 active ──────────────────────────
    // 3/17 (Tue) — research/training day at a different dept, no scheduled shift
    { id: 'att-021', employeeId: 'emp-003', date: '2026-03-17', status: 'NOT_SUBMITTED', checkIn: '10:00', checkOut: '16:00', breakMinutes: 60, breaks: [{ start: '13:00', end: '14:00' }], totalMinutes: 300, overtimeMinutes: 0, scheduledStart: null, scheduledEnd: null, department: 'キッチン', punchVariant: 'TRAINING' },
    // 3/18 (Wed) — regular shift, clock-in slightly late, clocked out on time
    { id: 'att-022', employeeId: 'emp-003', date: '2026-03-18', status: 'NOT_SUBMITTED', checkIn: '11:08', checkOut: '17:05', breakMinutes: 60, breaks: [{ start: '13:00', end: '14:00' }], totalMinutes: 297, overtimeMinutes: 0, scheduledStart: '11:00', scheduledEnd: '17:00', department: 'ホール' },
    // 3/20 (Fri) — ヘルプ勤務 at a nearby store, short shift
    { id: 'att-023', employeeId: 'emp-003', date: '2026-03-20', status: 'NOT_SUBMITTED', checkIn: '17:00', checkOut: '22:00', breakMinutes: 30, breaks: [{ start: '19:30', end: '20:00' }], totalMinutes: 270, overtimeMinutes: 0, scheduledStart: '17:00', scheduledEnd: '22:00', department: 'ホール', punchVariant: 'HELP', helpStore: '六本木店' },
    // 3/21 (Sat) — weekend volunteer shift, overtime all holiday
    { id: 'att-024', employeeId: 'emp-003', date: '2026-03-21', status: 'NOT_SUBMITTED', checkIn: '10:00', checkOut: '15:30', breakMinutes: 0, breaks: [], totalMinutes: 330, overtimeMinutes: 0, scheduledStart: null, scheduledEnd: null, department: 'ホール' },

    // ── CORRECTION_REQUESTED — manager asked to fix, employee corrected data, 申請 active ──
    // 3/22 (Sun, has shift) — original punch was missing; employee has now entered the times
    { id: 'att-025', employeeId: 'emp-003', date: '2026-03-22', status: 'CORRECTION_REQUESTED', checkIn: '09:05', checkOut: '14:58', breakMinutes: 0, breaks: [], totalMinutes: 353, overtimeMinutes: 0, scheduledStart: '09:00', scheduledEnd: '15:00', correctionComment: '出勤打刻が見つかりません。正確な時刻を入力して再申請してください。', department: 'ホール' },
  ]

  // ── Historical monthly data ─────────────────────────────────────────────────
  const historicalMonthly: Record<string, { workDays: number; totalMinutes: number; overtimeMinutes: number }> = {
    '2025-01': { workDays: 11, totalMinutes: 3300, overtimeMinutes: 30 },
    '2025-02': { workDays: 10, totalMinutes: 3000, overtimeMinutes: 0 },
    '2025-03': { workDays: 13, totalMinutes: 3900, overtimeMinutes: 60 },
    '2025-04': { workDays: 12, totalMinutes: 3600, overtimeMinutes: 30 },
    '2025-05': { workDays: 13, totalMinutes: 3900, overtimeMinutes: 75 },
    '2025-06': { workDays: 11, totalMinutes: 3300, overtimeMinutes: 15 },
    '2025-07': { workDays: 14, totalMinutes: 4200, overtimeMinutes: 150 },
    '2025-08': { workDays: 15, totalMinutes: 4500, overtimeMinutes: 195 },
    '2025-09': { workDays: 12, totalMinutes: 3600, overtimeMinutes: 45 },
    '2025-10': { workDays: 13, totalMinutes: 3900, overtimeMinutes: 60 },
    '2025-11': { workDays: 12, totalMinutes: 3600, overtimeMinutes: 30 },
    '2025-12': { workDays: 11, totalMinutes: 3300, overtimeMinutes: 60 },
    '2026-01': { workDays: 14, totalMinutes: 4200, overtimeMinutes: 90 },
  }

  // ── Current punch status (today) ────────────────────────────────────────────
  const currentPunchStatus = ref<PunchStatus>({
    status: 'NOT_STARTED',
    checkInTime: null,
    breakMinutes: 0,
    events: [],
  })

  // ── Substitution requests ───────────────────────────────────────────────────
  const substitutionRequests = ref<SubstitutionRequest[]>([
    // Incoming: emp-007 asks emp-003 to cover
    {
      id: 'sub-001',
      type: 'SUBSTITUTE',
      sourceEmployeeId: 'emp-007',
      targetEmployeeId: 'emp-003',
      sourceDate: '2026-03-25',
      sourceStartTime: '15:00',
      sourceEndTime: '22:00',
      sourceDepartment: 'ホール',
      status: 'PENDING',
      reason: '急用のため出勤できなくなりました。代わりに入っていただけますか？',
      createdAt: '2026-03-20T09:00:00',
    },
    // Outgoing: emp-003 sent a request to emp-008
    {
      id: 'sub-002',
      type: 'SUBSTITUTE',
      sourceEmployeeId: 'emp-003',
      targetEmployeeId: 'emp-008',
      sourceDate: '2026-03-30',
      sourceStartTime: '13:00',
      sourceEndTime: '19:00',
      sourceDepartment: 'ホール',
      status: 'PENDING',
      reason: '予定が入ってしまいました',
      createdAt: '2026-03-19T14:00:00',
    },
    // Past accepted
    {
      id: 'sub-003',
      type: 'SWAP',
      sourceEmployeeId: 'emp-008',
      targetEmployeeId: 'emp-003',
      sourceDate: '2026-03-10',
      sourceStartTime: '18:00',
      sourceEndTime: '22:00',
      sourceDepartment: 'ホール',
      status: 'ACCEPTED',
      reason: 'シフト交換をお願いしたいです',
      createdAt: '2026-03-05T10:00:00',
    },
  ])

  // ── Chat messages (emp-003 ↔ manager thread) ────────────────────────────────
  const chatMessages = ref<ChatMessage[]>([
    {
      id: 'msg-001',
      sender: 'manager',
      body: '3月のシフトが確定しました。ご確認ください。',
      sentAt: '2026-02-28T10:00:00',
      read: true,
    },
    {
      id: 'msg-002',
      sender: 'manager',
      body: '4月のシフト希望提出をお願いします。期限は3/25（水）です。',
      sentAt: '2026-03-15T09:00:00',
      read: true,
    },
    {
      id: 'msg-003',
      sender: 'manager',
      body: '3/22のシフトについて調整依頼があります。ご確認をお願いします。',
      sentAt: '2026-03-18T11:00:00',
      read: false,
      shiftDate: '2026-03-22',
      adjustRequest: {
        entryId: 's-009',
        shiftDate: '2026-03-22',
        startTime: '11:00',
        endTime: '20:00',
        currentStatus: 'CONFIRMED',
        targetStatus: 'CONFIRMED',
        responseStatus: 'PENDING',
      },
    },
    {
      id: 'msg-004',
      sender: 'manager',
      body: '3/8の退勤打刻が記録されていないようです。正確な時刻を教えていただけますか？',
      sentAt: '2026-03-09T08:30:00',
      read: true,
    },
  ])

  // ── Notifications ──────────────────────────────────────────────────────────
  const notifications = ref<Notification[]>([
    {
      id: 'n1',
      type: 'ADJUSTMENT_REQUEST',
      title: 'シフト調整依頼',
      body: '3/22のシフトについて店長から調整依頼があります',
      date: '2026-03-18',
      read: false,
      relatedId: 'msg-003',
      actionRequired: true,
    },
    {
      id: 'n2',
      type: 'SUBSTITUTION_REQUEST',
      title: '代打依頼',
      body: '高橋 誠さんから3/25 15:00-22:00の代打依頼が届いています',
      date: '2026-03-20',
      read: false,
      relatedId: 'sub-001',
      actionRequired: true,
    },
    {
      id: 'n3',
      type: 'CORRECTION_REQUEST',
      title: '打刻修正依頼',
      body: '3/8の退勤時刻が記録されていません。確認してください',
      date: '2026-03-09',
      read: false,
      relatedId: '2026-03-08',
    },
    {
      id: 'n4',
      type: 'SHIFT_PUBLISHED',
      title: 'シフト公開',
      body: '3月のシフトが公開されました',
      date: '2026-02-28',
      read: true,
    },
    {
      id: 'n5',
      type: 'SHIFT_REMINDER',
      title: 'シフト提出リマインダー',
      body: '4月の希望シフト提出期限は3/25です。まだの方はお早めに。',
      date: '2026-03-15',
      read: true,
    },
    {
      id: 'n6',
      type: 'SHIFT_CHANGED',
      title: 'シフト変更',
      body: '3/22のシフトに調整依頼が来ています',
      date: '2026-03-18',
      read: true,
    },
  ])

  // ── Helpers ────────────────────────────────────────────────────────────────
  function getShiftForDate(date: string) {
    // Prefer CONFIRMED entries; avoid ADJUSTING duplicates
    return myShifts.filter(s => s.date === date)
      .sort((a, b) => {
        // prefer non-adjusting for display
        const aAdj = a.cellStatus === 'ADJUSTING' ? 1 : 0
        const bAdj = b.cellStatus === 'ADJUSTING' ? 1 : 0
        return aAdj - bAdj
      })[0] ?? null
  }

  /** Returns all shifts for a date (split-shift days have 2+) */
  function getShiftsForDate(date: string) {
    return myShifts.filter(s => s.date === date).sort((a, b) => a.startTime.localeCompare(b.startTime))
  }

  function getShiftById(id: string) {
    return myShifts.find((s) => s.id === id) ?? null
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

  function getEmployeeById(id: string) {
    return employees.find((e) => e.id === id) ?? null
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
        return d.getFullYear() === year && d.getMonth() + 1 === month && a.status !== 'NOT_SUBMITTED' && a.totalMinutes > 0
      })
      .reduce((sum, a) => sum + a.totalMinutes, 0)
  }

  function getMondayStr(dateStr: string): string {
    const d = new Date(dateStr)
    const day = d.getDay()
    const diff = day === 0 ? -6 : 1 - day
    d.setDate(d.getDate() + diff)
    return d.toISOString().slice(0, 10)
  }

  function getMonthOvertimeMinutes(year: number, month: number): number {
    return myAttendance
      .filter((a) => {
        const d = new Date(a.date)
        return d.getFullYear() === year && d.getMonth() + 1 === month
      })
      .reduce((sum, a) => sum + (a.overtimeMinutes ?? 0), 0)
  }

  function getWeekTotalMinutes(mondayStr: string): number {
    const sunday = new Date(mondayStr)
    sunday.setDate(sunday.getDate() + 6)
    const sundayStr = sunday.toISOString().slice(0, 10)
    return myAttendance
      .filter((a) => a.date >= mondayStr && a.date <= sundayStr && (a.totalMinutes ?? 0) > 0)
      .reduce((sum, a) => sum + (a.totalMinutes ?? 0), 0)
  }

  function getMonthlySummary(year: number, month: number): { workDays: number; totalMinutes: number; overtimeMinutes: number } {
    const key = `${year}-${String(month).padStart(2, '0')}`
    const fromRecords = myAttendance.filter((a) => {
      const d = new Date(a.date)
      return d.getFullYear() === year && d.getMonth() + 1 === month
    })
    if (fromRecords.length > 0) {
      return {
        workDays: fromRecords.filter((a) => a.checkIn).length,
        totalMinutes: fromRecords.reduce((sum, a) => sum + (a.totalMinutes ?? 0), 0),
        overtimeMinutes: fromRecords.reduce((sum, a) => sum + (a.overtimeMinutes ?? 0), 0),
      }
    }
    return historicalMonthly[key] ?? { workDays: 0, totalMinutes: 0, overtimeMinutes: 0 }
  }

  function getYearlySummary(year: number) {
    const today = new Date()
    return Array.from({ length: 12 }, (_, i) => {
      const month = i + 1
      const isFuture = year > today.getFullYear() || (year === today.getFullYear() && month > today.getMonth() + 1)
      const summary = isFuture ? { workDays: 0, totalMinutes: 0, overtimeMinutes: 0 } : getMonthlySummary(year, month)
      return {
        year,
        month,
        monthLabel: `${month}月`,
        isCurrentMonth: year === today.getFullYear() && month === today.getMonth() + 1,
        isFuture,
        ...summary,
      }
    })
  }

  return {
    employees,
    loggedInEmployee,
    myShifts,
    myPreferences,
    activeCollection,
    marchBoard,
    getBoardLineup,
    myAttendance,
    currentPunchStatus,
    substitutionRequests,
    chatMessages,
    notifications,
    getShiftForDate,
    getShiftsForDate,
    getShiftById,
    getAttendanceForDate,
    getPreferenceForDate,
    getUpcomingShifts,
    getEmployeeById,
    formatMinutes,
    getMonthTotalMinutes,
    getMondayStr,
    getMonthOvertimeMinutes,
    getWeekTotalMinutes,
    getMonthlySummary,
    getYearlySummary,
  }
}
