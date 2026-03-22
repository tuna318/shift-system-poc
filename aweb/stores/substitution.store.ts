import { defineStore } from 'pinia'
import type { SubstitutionRequest } from '~/types'
import { useMockData } from '~/composables/useMockData'
import { useShiftStore } from '~/stores/shift.store'

// Seed data: 3 realistic requests referencing March 2026 board entries
const SEED_REQUESTS: SubstitutionRequest[] = [
  {
    id: 'sub-seed-001',
    type: 'SUBSTITUTE',
    boardId: 'board-2026-03',
    sourceEntryId: 'mar26-070',
    sourceEmployeeId: 'emp-001',
    sourceDate: '2026-03-10',
    sourceStartTime: '07:00',
    sourceEndTime: '15:00',
    sourceDepartment: 'キッチン',
    targetEmployeeId: 'emp-002',
    status: 'PENDING',
    reason: '体調不良のため欠勤',
    createdAt: '2026-03-09T10:00:00',
  },
  {
    id: 'sub-seed-002',
    type: 'SUBSTITUTE',
    boardId: 'board-2026-03',
    sourceEntryId: 'mar26-034',
    sourceEmployeeId: 'emp-006',
    sourceDate: '2026-03-05',
    sourceStartTime: '15:00',
    sourceEndTime: '22:00',
    sourceDepartment: 'ホール',
    targetEmployeeId: 'emp-007',
    status: 'ACCEPTED',
    reason: '急な所用',
    createdAt: '2026-03-04T09:30:00',
  },
  {
    id: 'sub-seed-003',
    type: 'SUBSTITUTE',
    boardId: 'board-2026-03',
    sourceEntryId: 'mar26-061',
    sourceEmployeeId: 'emp-012',
    sourceDate: '2026-03-08',
    sourceStartTime: '15:00',
    sourceEndTime: '22:00',
    sourceDepartment: 'レジ',
    targetEmployeeId: 'emp-013',
    status: 'REJECTED',
    createdAt: '2026-03-07T14:00:00',
  },
]

export const useSubstitutionStore = defineStore('substitution', {
  state: () => ({
    requests: [...SEED_REQUESTS] as SubstitutionRequest[],
  }),

  getters: {
    pendingRequests(): SubstitutionRequest[] {
      return this.requests.filter(r => r.status === 'PENDING')
    },

    requestsForEntry(): (entryId: string) => SubstitutionRequest | undefined {
      return (entryId: string) =>
        this.requests.find(r => r.sourceEntryId === entryId && r.status === 'PENDING')
    },
  },

  actions: {
    createRequest(payload: Omit<SubstitutionRequest, 'id' | 'status' | 'createdAt'>) {
      const req: SubstitutionRequest = {
        ...payload,
        id: `sub-${Date.now()}`,
        status: 'PENDING',
        createdAt: new Date().toISOString(),
      }
      this.requests.push(req)
      const shiftStore = useShiftStore()
      shiftStore.showSnackbar('依頼を送りました')
    },

    approveRequest(id: string) {
      const req = this.requests.find(r => r.id === id)
      if (!req) return
      req.status = 'ACCEPTED'

      const { getEmployee } = useMockData()
      const shiftStore = useShiftStore()
      const emp = getEmployee(req.targetEmployeeId)
      const [sh, sm] = req.sourceStartTime.split(':').map(Number)
      const [eh, em] = req.sourceEndTime.split(':').map(Number)
      const hours = (eh * 60 + em - sh * 60 - sm) / 60
      const estimatedWage = emp ? Math.round(emp.hourlyWage * hours) : 0

      shiftStore.addEntry({
        id: `entry-sub-${id}`,
        employeeId: req.targetEmployeeId,
        shiftDate: req.sourceDate,
        startTime: req.sourceStartTime,
        endTime: req.sourceEndTime,
        department: req.sourceDepartment,
        cellStatus: 'CONFIRMED',
        estimatedWage,
      })
      shiftStore.showSnackbar('承認しました。シフトが作成されました。')
    },

    rejectRequest(id: string) {
      const req = this.requests.find(r => r.id === id)
      if (!req) return
      req.status = 'REJECTED'
      const shiftStore = useShiftStore()
      shiftStore.showSnackbar('拒否しました')
    },

    cancelRequest(id: string) {
      const req = this.requests.find(r => r.id === id)
      if (!req) return
      req.status = 'CANCELLED'
      const shiftStore = useShiftStore()
      shiftStore.showSnackbar('依頼をキャンセルしました')
    },
  },
})
