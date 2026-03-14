import type { AllocationSetup } from '~/types'

export const useNewBoardForm = () => {
  const form = useState('newBoardForm', () => ({
    name: '',
    periodStart: '',
    periodEnd: '',
    deadline: '',
    message: '',
    budgetAmount: null as number | null,
  }))

  const allocationData = useState<AllocationSetup>('newBoardAllocation', () => ({
    slots: [],
    assignments: [],
  }))

  const selectedEmployeeIds = useState<string[]>('newBoardStaff', () => [])

  function resetForm() {
    form.value = {
      name: '',
      periodStart: '',
      periodEnd: '',
      deadline: '',
      message: '',
      budgetAmount: null,
    }
    allocationData.value = { slots: [], assignments: [] }
    selectedEmployeeIds.value = []
  }

  return { form, allocationData, selectedEmployeeIds, resetForm }
}
