import { defineStore } from 'pinia'
import type { ShiftBoard, ShiftEntry, CellStatus, EmploymentType } from '~/types'
import { useMockData } from '~/composables/useMockData'

export const MAX_MONTHLY_HOURS: Record<EmploymentType, number> = {
  FULL_TIME: 176,
  PART_TIME: 120,
  FLEX: 160,
  DISCRETIONARY: 160,
}

interface PendingCellMenu {
  entryId: string
  x: number
  y: number
}

export const useShiftStore = defineStore('shift', {
  state: () => ({
    currentBoard: null as ShiftBoard | null,
    entries: [] as ShiftEntry[],
    pendingCellMenu: null as PendingCellMenu | null,
    snackbar: { show: false, message: '' },
  }),

  getters: {
    entriesByEmployee(): Map<string, ShiftEntry[]> {
      const map = new Map<string, ShiftEntry[]>()
      for (const entry of this.entries) {
        const list = map.get(entry.employeeId) ?? []
        list.push(entry)
        map.set(entry.employeeId, list)
      }
      return map
    },

    entriesByDate(): Map<string, ShiftEntry[]> {
      const map = new Map<string, ShiftEntry[]>()
      for (const entry of this.entries) {
        const list = map.get(entry.shiftDate) ?? []
        list.push(entry)
        map.set(entry.shiftDate, list)
      }
      return map
    },

    perEmployeeStats(): Array<{ employeeId: string; hours: number; cost: number; maxHours: number; isOver: boolean }> {
      const { getEmployee } = useMockData()
      const empMap = new Map<string, { hours: number; cost: number }>()
      for (const entry of this.entries) {
        const [sh, sm] = entry.startTime.split(':').map(Number)
        const [eh, em] = entry.endTime.split(':').map(Number)
        const h = (eh * 60 + em - (sh * 60 + sm)) / 60
        const cur = empMap.get(entry.employeeId) ?? { hours: 0, cost: 0 }
        empMap.set(entry.employeeId, { hours: cur.hours + h, cost: cur.cost + entry.estimatedWage })
      }
      return Array.from(empMap.entries()).map(([empId, data]) => {
        const emp = getEmployee(empId)
        const maxHours = emp ? MAX_MONTHLY_HOURS[emp.employmentType] : 160
        const hours = Math.round(data.hours * 10) / 10
        return { employeeId: empId, hours, cost: data.cost, maxHours, isOver: hours > maxHours }
      })
    },

    costSummary(): { totalCost: number; budget: number; variance: number } {
      if (!this.currentBoard) return { totalCost: 0, budget: 0, variance: 0 }
      const totalCost = this.entries.reduce((sum, e) => sum + e.estimatedWage, 0)
      return {
        totalCost,
        budget: this.currentBoard.budgetAmount,
        variance: totalCost - this.currentBoard.budgetAmount,
      }
    },
  },

  actions: {
    loadBoard(id: string) {
      const { boards } = useMockData()
      const board = boards.find(b => b.id === id)
      if (board) {
        this.currentBoard = { ...board }
        this.entries = board.entries.map(e => ({ ...e }))
      }
    },

    updateCellStatus(entryId: string, status: CellStatus) {
      const entry = this.entries.find(e => e.id === entryId)
      if (entry) {
        entry.cellStatus = status
        this.showSnackbar('ステータスを更新しました')
      }
    },

    requestAdjustment(entryId: string, reason: string, targetStatus?: 'CONFIRMED' | 'DAY_OFF_CONFIRMED') {
      const entry = this.entries.find(e => e.id === entryId)
      if (entry) {
        entry.preAdjustStatus = entry.cellStatus
        entry.cellStatus = 'ADJUSTING'
        entry.adjustingReason = reason
        entry.adjustTargetStatus = targetStatus
        this.showSnackbar('調整依頼を送信しました')
      }
    },

    revertToRequested(entryId: string) {
      const entry = this.entries.find(e => e.id === entryId)
      if (entry) {
        const target = entry.preAdjustStatus
          ?? (entry.cellStatus === 'DAY_OFF_CONFIRMED' ? 'DAY_OFF_REQUESTED' : 'SHIFT_REQUESTED')
        entry.cellStatus = target
        entry.adjustingReason = undefined
        entry.preAdjustStatus = undefined
        this.showSnackbar('ステータスを希望に戻しました')
      }
    },

    finalizeAdjustment(entryId: string, finalStatus: 'CONFIRMED' | 'DAY_OFF_CONFIRMED') {
      const entry = this.entries.find(e => e.id === entryId)
      if (entry) {
        entry.cellStatus = finalStatus
        entry.adjustingReason = undefined
        entry.preAdjustStatus = undefined
        this.showSnackbar('ステータスを確定しました')
      }
    },

    addEntry(entry: ShiftEntry) {
      this.entries.push(entry)
      this.showSnackbar('シフトを追加しました')
    },

    addDirectRequests(newEntries: ShiftEntry[]) {
      for (const e of newEntries) this.entries.push(e)
      this.showSnackbar(`${newEntries.length}名にシフト依頼を送信しました`)
    },

    updateEntry(entryId: string, changes: Partial<ShiftEntry>) {
      const idx = this.entries.findIndex(e => e.id === entryId)
      if (idx !== -1) {
        this.entries[idx] = { ...this.entries[idx], ...changes }
        this.showSnackbar('シフトを更新しました')
      }
    },

    deleteEntry(entryId: string) {
      const idx = this.entries.findIndex(e => e.id === entryId)
      if (idx !== -1) {
        this.entries.splice(idx, 1)
        this.showSnackbar('シフトを削除しました')
      }
    },

    publishBoard() {
      if (this.currentBoard) {
        this.currentBoard.status = 'PUBLISHED'
        this.showSnackbar('シフトボードを公開しました')
      }
    },

    showSnackbar(message: string) {
      this.snackbar = { show: true, message }
    },
  },
})
