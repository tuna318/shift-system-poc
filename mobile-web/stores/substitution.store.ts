import { defineStore } from 'pinia'
import type { SubstitutionRequest, SubstitutionType, Department } from '~/types'

const CURRENT_EMPLOYEE_ID = 'emp-003'

export const useSubstitutionStore = defineStore('substitutions', () => {
  const mockData = useMockData()
  const requests = ref<SubstitutionRequest[]>([...mockData.substitutionRequests.value])

  const sentRequests = computed(() =>
    requests.value
      .filter((r) => r.sourceEmployeeId === CURRENT_EMPLOYEE_ID)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  )

  const receivedRequests = computed(() =>
    requests.value
      .filter((r) => r.targetEmployeeId === CURRENT_EMPLOYEE_ID)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  )

  const pendingReceived = computed(() =>
    receivedRequests.value.filter((r) => r.status === 'PENDING')
  )

  function createRequest(payload: {
    type: SubstitutionType
    targetEmployeeId: string | null
    sourceDate: string
    sourceStartTime: string
    sourceEndTime: string
    sourceDepartment: Department
    reason?: string
  }) {
    requests.value.push({
      id: `sub-${Date.now()}`,
      ...payload,
      sourceEmployeeId: CURRENT_EMPLOYEE_ID,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
    })
  }

  function respondToRequest(id: string, accept: boolean) {
    const req = requests.value.find((r) => r.id === id)
    if (req) {
      req.status = accept ? 'ACCEPTED' : 'REJECTED'
    }
  }

  function cancelRequest(id: string) {
    const req = requests.value.find((r) => r.id === id)
    if (req && req.sourceEmployeeId === CURRENT_EMPLOYEE_ID) {
      req.status = 'CANCELLED'
    }
  }

  return {
    requests,
    sentRequests,
    receivedRequests,
    pendingReceived,
    createRequest,
    respondToRequest,
    cancelRequest,
  }
})
