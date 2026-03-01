export type Department = 'キッチン' | 'ホール' | 'レジ'
export type EmploymentType = 'FULL_TIME' | 'PART_TIME'

export interface Employee {
  id: string
  name: string
  nameKana: string
  department: Department
  employmentType: EmploymentType
  hourlyWage?: number
  pin: string
  avatar?: string
}

export type PunchType = 'CHECK_IN' | 'BREAK_START' | 'BREAK_END' | 'CHECK_OUT'
export type ClockStatus = 'NOT_STARTED' | 'WORKING' | 'ON_BREAK' | 'COMPLETED'

export interface PunchEvent {
  type: PunchType
  time: string
  timestamp: string
}

export interface PunchStatus {
  status: ClockStatus
  checkInTime: string | null
  breakMinutes: number
  events: PunchEvent[]
}

export type AttendanceStatus =
  | 'APPROVED'
  | 'PENDING_APPROVAL'
  | 'CORRECTION_REQUESTED'
  | 'NOT_SUBMITTED'
  | 'ABSENT'

export interface AttendanceRecord {
  id: string
  employeeId: string
  date: string
  status: AttendanceStatus
  checkIn: string | null
  checkOut: string | null
  breakMinutes: number
  totalMinutes: number
  overtimeMinutes: number
  scheduledStart: string | null
  scheduledEnd: string | null
  note?: string
  correctionComment?: string
}

export type ShiftStatus = 'CONFIRMED' | 'DRAFT' | 'CANCELLED'
export type PreferenceType = 'WORK' | 'OFF' | 'UNSUBMITTED'

export interface ShiftEntry {
  id: string
  employeeId: string
  date: string
  startTime: string
  endTime: string
  department: Department
  status: ShiftStatus
}

export interface ShiftPreference {
  id: string
  employeeId: string
  date: string
  type: PreferenceType
  preferredStart?: string
  preferredEnd?: string
  submitted: boolean
}

export type NotificationType =
  | 'CORRECTION_REQUEST'
  | 'SHIFT_CONFIRMED'
  | 'SHIFT_CHANGED'
  | 'SUBSTITUTION_REQUEST'
  | 'SHIFT_REMINDER'

export interface Notification {
  id: string
  type: NotificationType
  title: string
  body: string
  date: string
  read: boolean
  relatedId?: string
  actionRequired?: boolean
}
