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
export type PunchVariant = 'NORMAL' | 'HELP' | 'TRAINING'

export interface PunchEvent {
  type: PunchType
  time: string
  timestamp: string
  department?: Department
  variant?: PunchVariant
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

export type CellStatus =
  | 'SHIFT_REQUESTED'
  | 'CONFIRMED'
  | 'DAY_OFF_REQUESTED'
  | 'DAY_OFF_CONFIRMED'
  | 'ADJUSTING'

export type ShiftStatus = 'CONFIRMED' | 'DRAFT' | 'CANCELLED'
export type AdjustingResponseStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED'

export interface ShiftEntry {
  id: string
  employeeId: string
  date: string
  startTime: string
  endTime: string
  department: Department
  status: ShiftStatus
  cellStatus?: CellStatus
  adjustingReason?: string
  adjustingResponse?: string
  adjustingResponseStatus?: AdjustingResponseStatus
}

export type PreferenceAvailability = 'PREFERRED' | 'AVAILABLE' | 'UNAVAILABLE'

export interface ShiftPreference {
  id: string
  employeeId: string
  date: string
  availability: PreferenceAvailability
  preferredStart?: string
  preferredEnd?: string
  submitted: boolean
}

export type CollectionStatus = 'DRAFT' | 'SENT' | 'COLLECTING' | 'CLOSED'

export interface CollectionRequest {
  id: string
  name: string
  status: CollectionStatus
  periodStart: string
  periodEnd: string
  deadline: string
}

export type SubstitutionStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED'
export type SubstitutionType = 'SUBSTITUTE' | 'SWAP'

export interface SubstitutionRequest {
  id: string
  type: SubstitutionType
  sourceEmployeeId: string
  targetEmployeeId: string | null
  sourceDate: string
  sourceStartTime: string
  sourceEndTime: string
  sourceDepartment: Department
  status: SubstitutionStatus
  reason?: string
  createdAt: string
}

export interface AdjustRequestPayload {
  entryId: string
  shiftDate: string
  startTime: string
  endTime: string
  currentStatus: string
  targetStatus: 'CONFIRMED' | 'DAY_OFF_CONFIRMED'
  responseStatus: 'PENDING' | 'ACCEPTED' | 'DECLINED'
}

export interface ChatMessage {
  id: string
  sender: 'manager' | 'employee'
  body: string
  sentAt: string
  read?: boolean
  shiftDate?: string
  adjustRequest?: AdjustRequestPayload
}

export type NotificationType =
  | 'CORRECTION_REQUEST'
  | 'SHIFT_CONFIRMED'
  | 'SHIFT_CHANGED'
  | 'SHIFT_REMINDER'
  | 'SUBSTITUTION_REQUEST'
  | 'ADJUSTMENT_REQUEST'
  | 'SHIFT_PUBLISHED'

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
