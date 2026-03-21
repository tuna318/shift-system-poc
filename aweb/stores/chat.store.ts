import { defineStore } from 'pinia'

export const useChatStore = defineStore('chat', {
  state: () => ({
    isOpen: false,
    activeEmployeeId: null as string | null,
  }),
  actions: {
    open(employeeId?: string) {
      this.isOpen = true
      if (employeeId) this.activeEmployeeId = employeeId
    },
    openConversation(employeeId: string) {
      this.isOpen = true
      this.activeEmployeeId = employeeId
    },
    close() {
      this.isOpen = false
    },
    clearEmployee() {
      this.activeEmployeeId = null
    },
  },
})
