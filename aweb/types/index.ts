export type AttendanceStatus = 'NOT_STARTED' | 'WORKING' | 'ON_BREAK' | 'COMPLETED' | 'APPROVED'
export type PunchType = 'CHECK_IN' | 'BREAK_START' | 'BREAK_END' | 'CHECK_OUT'
export type CellStatus = 'SHIFT_REQUESTED' | 'CONFIRMED' | 'DAY_OFF_REQUESTED' | 'DAY_OFF_CONFIRMED' | 'ADJUSTING'
export type PreferenceAvailability = 'PREFERRED' | 'AVAILABLE' | 'UNAVAILABLE'
export type BoardStatus = 'DRAFT' | 'PUBLISHED'
export type CollectionStatus = 'DRAFT' | 'SENT' | 'COLLECTING' | 'CLOSED'
export type EmploymentType = 'FULL_TIME' | 'PART_TIME' | 'FLEX' | 'DISCRETIONARY'

export interface Employee {
  id: string
  name: string
  nameKana: string
  department: string
  position: string
  hourlyWage: number
  employmentType: EmploymentType
  status: 'ACTIVE' | 'INACTIVE'
  hireDate: string
  pin: string
  skills: string[]
}

export interface ShiftEntry {
  id: string
  employeeId: string
  shiftDate: string
  startTime: string
  endTime: string
  department: string
  cellStatus: CellStatus
  estimatedWage: number
  note?: string
}

export interface ShiftPreferenceEntry {
  date: string
  availability: PreferenceAvailability
  preferredStart?: string
  preferredEnd?: string
}

export interface ShiftBoard {
  id: string
  name: string
  status: BoardStatus
  periodStart: string
  periodEnd: string
  budgetAmount: number
  entries: ShiftEntry[]
  createdAt: string
  collectionId?: string
}

export interface AttendanceRecord {
  id: string
  employeeId: string
  workDate: string
  status: AttendanceStatus
  checkIn?: string
  checkOut?: string
  breakMinutes: number
  actualMinutes: number
  overtimeMinutes: number
  punchEvents: PunchEvent[]
}

export interface PunchEvent {
  id: string
  punchType: PunchType
  punchedAt: string
  isVoided: boolean
}

export interface CollectionRequest {
  id: string
  name: string
  status: CollectionStatus
  periodStart: string
  periodEnd: string
  deadline: string
  totalTargets: number
  submittedCount: number
  submissions?: CollectionSubmission[]
}

export interface CollectionSubmission {
  employeeId: string
  submitted: boolean
  submittedAt?: string
}

export interface ComplianceAlert {
  id: string
  employeeId: string
  type: string
  level: 'warning' | 'critical'
  message: string
  createdAt: string
}

export interface ShiftPreference {
  employeeId: string
  entries: ShiftPreferenceEntry[]
}
