import { defineStore } from 'pinia'
import type {
  AttendanceRecord, CorrectionRequest, AttendanceStatus,
  DayAttendanceSummary, AttendanceApprovalStatus, ShiftEntry,
} from '~/types'
import { useMockData, getComplianceFlags } from '~/composables/useMockData'

function toApprovalStatus(s: AttendanceStatus): AttendanceApprovalStatus {
  if (s === 'APPROVED') return 'APPROVED'
  if (s === 'PENDING_APPROVAL') return 'PENDING_APPROVAL'
  if (s === 'CORRECTION_REQUESTED') return 'CORRECTION_REQUESTED'
  return 'NOT_SUBMITTED'
}

export const useAttendanceStore = defineStore('attendance', {
  state: () => {
    const mock = useMockData()
    return {
      records: [...mock.attendanceRecords] as AttendanceRecord[],
      corrections: [...mock.correctionRequests] as CorrectionRequest[],
    }
  },

  getters: {
    pendingApprovalCount(): number {
      return this.records.filter(r => r.status === 'PENDING_APPROVAL').length
    },
    pendingCorrectionCount(): number {
      return this.corrections.filter(c => c.status === 'pending').length
    },
    pendingApprovalRecords(): AttendanceRecord[] {
      return this.records
        .filter(r => r.status === 'PENDING_APPROVAL')
        .sort((a, b) => (a.submittedAt ?? '') < (b.submittedAt ?? '') ? -1 : 1)
    },
  },

  actions: {
    // ── Queries ────────────────────────────────────────────────

    getRecord(employeeId: string, date: string): AttendanceRecord | null {
      return this.records.find(r => r.employeeId === employeeId && r.workDate === date) ?? null
    },

    getCorrectionsForDay(employeeId: string, date: string): CorrectionRequest[] {
      return this.corrections.filter(c => c.employeeId === employeeId && c.workDate === date)
    },

    /** Build DayAttendanceSummary for every active employee for a given date */
    getDaySummaries(date: string): DayAttendanceSummary[] {
      const mock = useMockData()
      const activeEmps = mock.employees.filter(e => e.status === 'ACTIVE')
      return activeEmps.map((emp) => {
        const rec = this.records.find(r => r.employeeId === emp.id && r.workDate === date)
        const shifts = mock.getEmpShiftsForDate(emp.id, date)
        const shift = shifts[0] as ShiftEntry | undefined

        if (!rec) {
          // No record — check if there's a scheduled shift
          const hasShift = shift && shift.cellStatus === 'CONFIRMED'
          return {
            employeeId: emp.id,
            workDate: date,
            status: hasShift ? 'NO_RECORD' : 'NO_RECORD',
            totalMinutes: 0,
            sessionCount: 0,
            pendingCorrectionCount: this.corrections.filter(c => c.employeeId === emp.id && c.workDate === date && c.status === 'pending').length,
            complianceFlags: [],
            shiftEntry: shift ? { id: shift.id, startTime: shift.startTime, endTime: shift.endTime, department: shift.department } : undefined,
          } satisfies DayAttendanceSummary
        }

        const pendingCorrCount = this.corrections.filter(
          c => c.employeeId === emp.id && c.workDate === date && c.status === 'pending',
        ).length
        const sessions = rec.sessions ?? []
        return {
          employeeId: emp.id,
          workDate: date,
          status: toApprovalStatus(rec.status),
          totalMinutes: rec.actualMinutes,
          sessionCount: sessions.length || 1,
          pendingCorrectionCount: pendingCorrCount,
          complianceFlags: getComplianceFlags(rec),
          shiftEntry: shift ? { id: shift.id, startTime: shift.startTime, endTime: shift.endTime, department: shift.department } : undefined,
          recordId: rec.id,
        } satisfies DayAttendanceSummary
      })
    },

    /** Build week summaries: for each date in dates[], return getDaySummaries */
    getWeekSummaries(dates: string[]): Map<string, DayAttendanceSummary[]> {
      const map = new Map<string, DayAttendanceSummary[]>()
      for (const d of dates) {
        map.set(d, this.getDaySummaries(d))
      }
      return map
    },

    // ── Day-level approval actions ─────────────────────────────

    approveDay(recordId: string) {
      const rec = this.records.find(r => r.id === recordId)
      if (!rec) return
      rec.status = 'APPROVED'
      rec.approvedAt = new Date().toISOString()
      rec.approvedBy = 'manager-001'
      // Also approve any pending corrections for this day
      this.corrections
        .filter(c => c.employeeId === rec.employeeId && c.workDate === rec.workDate && c.status === 'pending')
        .forEach(c => { c.status = 'approved' })
    },

    returnDay(recordId: string, note: string) {
      const rec = this.records.find(r => r.id === recordId)
      if (!rec) return
      rec.status = 'CORRECTION_REQUESTED'
      rec.correctionComment = note
    },

    // ── Correction request actions ─────────────────────────────

    approveCorrection(correctionId: string) {
      const cr = this.corrections.find(c => c.id === correctionId)
      if (!cr) return
      cr.status = 'approved'
      // Apply corrected times to the attendance record's session
      const rec = this.records.find(r => r.employeeId === cr.employeeId && r.workDate === cr.workDate)
      if (rec && cr.type === 'edit') {
        rec.checkIn = cr.requestedCheckIn
        rec.checkOut = cr.requestedCheckOut
        if (rec.sessions?.length) {
          rec.sessions[0].checkIn = cr.requestedCheckIn
          rec.sessions[0].checkOut = cr.requestedCheckOut
        }
        if (rec.status === 'CORRECTION_REQUESTED') {
          rec.status = 'PENDING_APPROVAL'
          rec.correctionComment = undefined
        }
      }
    },

    rejectCorrection(correctionId: string, note: string) {
      const cr = this.corrections.find(c => c.id === correctionId)
      if (!cr) return
      cr.status = 'rejected'
      cr.managerNote = note
    },

    /** Revert an approved record back to pending — e.g. manager made a mistake */
    revertApproval(recordId: string) {
      const rec = this.records.find(r => r.id === recordId)
      if (!rec || rec.status !== 'APPROVED') return
      rec.status = 'PENDING_APPROVAL'
      rec.approvedAt = undefined
      rec.approvedBy = undefined
    },

    /** Cancel a correction request — puts the record back to pending for re-review */
    cancelReturn(recordId: string) {
      const rec = this.records.find(r => r.id === recordId)
      if (!rec || rec.status !== 'CORRECTION_REQUESTED') return
      rec.status = 'PENDING_APPROVAL'
      rec.correctionComment = undefined
    },
  },
})
