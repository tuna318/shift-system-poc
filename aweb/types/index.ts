export type AdjustingResponseStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED'

export type AttendanceStatus =
  | 'NOT_STARTED' | 'WORKING' | 'ON_BREAK' | 'COMPLETED'  // legacy clock-in states
  | 'NOT_SUBMITTED'         // work done but employee hasn't submitted for approval yet
  | 'PENDING_APPROVAL'      // employee submitted — manager action required
  | 'CORRECTION_REQUESTED'  // manager sent back to employee for correction
  | 'APPROVED'              // manager approved
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
  adjustingReason?: string         // manager's message to employee
  adjustingResponse?: string       // employee's reply
  adjustingResponseStatus?: AdjustingResponseStatus  // employee's response state
  preAdjustStatus?: CellStatus     // status before ADJUSTING, for revert
  adjustTargetStatus?: 'CONFIRMED' | 'DAY_OFF_CONFIRMED'  // what manager wants to reach
  managerRequested?: boolean       // true when manager initiated the request (not employee)
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
  allocationSetup?: AllocationSetup
}

export interface WorkSession {
  checkIn?: string
  checkOut?: string
  breakMinutes: number
  actualMinutes: number
  department?: string
  punchVariant?: 'NORMAL' | 'HELP' | 'TRAINING'
  helpStore?: string
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
  sessions?: WorkSession[]
  correctionComment?: string
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

export type SlotColor =
  | '#3587dc' | '#4bd08b' | '#f8c076'
  | '#e879a0' | '#9c7fe0' | '#f97316'

export interface RoleRequirement {
  role: string
  count: number
}

export interface DepartmentConfig {
  department: string
  roleRequirements: RoleRequirement[]
}

export interface ShiftSlot {
  id: string
  label: string
  startTime: string
  endTime: string
  color: SlotColor
  departmentConfigs: DepartmentConfig[]
}

export interface DaySlotAssignment {
  date: string
  slotIds: string[]
}

export interface AllocationTemplate {
  id: string
  name: string
  isRecurring: boolean
  slots: ShiftSlot[]
  assignments: DaySlotAssignment[]
}

export interface AllocationSetup {
  slots: ShiftSlot[]
  assignments: DaySlotAssignment[]
}

export interface ComplianceFlag {
  key: 'no_break' | 'overwork' | 'night'
  level: 'error' | 'warning' | 'info'
  icon: string
  message: string
}

export type CorrectionRequestStatus = 'pending' | 'approved' | 'rejected'
export type CorrectionRequestType   = 'edit' | 'add_missing'

export interface CorrectionRequest {
  id: string
  type: CorrectionRequestType
  employeeId: string
  workDate: string
  sessionId?: string
  originalCheckIn?: string
  originalCheckOut?: string
  requestedCheckIn: string
  requestedCheckOut: string
  reason: string
  status: CorrectionRequestStatus
  managerNote?: string
  createdAt: string
}

export type SubstitutionStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED'
export type SubstitutionType   = 'SUBSTITUTE' | 'SWAP'

export interface SubstitutionRequest {
  id: string
  type: SubstitutionType
  boardId: string
  sourceEntryId: string
  sourceEmployeeId: string
  sourceDate: string
  sourceStartTime: string
  sourceEndTime: string
  sourceDepartment: string
  targetEmployeeId: string
  targetEntryId?: string
  status: SubstitutionStatus
  reason?: string
  createdAt: string
}

export type CrossShopRequestStatus = 'PENDING' | 'PARTIALLY_FILLED' | 'FULFILLED' | 'CANCELLED'
export type CrossShopResponseStatus = 'NEW' | 'REVIEWING' | 'FORWARDED' | 'FULFILLED' | 'DECLINED'

export interface ProposedEmployee {
  id: string
  name: string
  department: string
  position: string
  hourlyWage?: number
}

export interface ConfirmedEmployee extends ProposedEmployee {
  fromShopId: string
  fromShopName: string
}

export interface CrossShopResponse {
  shopId: string
  shopName: string
  status: CrossShopResponseStatus
  proposedEmployees?: ProposedEmployee[]
  respondedAt?: string
}

export interface CrossShopRequest {
  id: string
  boardId: string
  requestingShopId: string
  requestingShopName: string
  date: string
  startTime: string
  endTime: string
  department: string
  position: string
  requiredCount: number
  securedCount: number
  status: CrossShopRequestStatus
  targetResponses: CrossShopResponse[]
  confirmedEmployees?: ConfirmedEmployee[]
  note?: string
  createdAt: string
}
