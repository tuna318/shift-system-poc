import { defineStore } from 'pinia'
import type { ShiftEntry, ShiftPreference, PreferenceAvailability } from '~/types'

export const useShiftStore = defineStore('shiftEmployee', () => {
  const mockData = useMockData()

  const entries = ref<ShiftEntry[]>([...mockData.myShifts])
  const preferences = ref<ShiftPreference[]>([...mockData.myPreferences])
  const collection = ref(mockData.activeCollection)
  const board = ref(mockData.marchBoard)

  function getBoardLineup(date: string, slotId: string) {
    return mockData.getBoardLineup(date, slotId)
  }

  const today = computed(() => {
    const now = new Date()
    const y = now.getFullYear()
    const mo = String(now.getMonth() + 1).padStart(2, '0')
    const da = String(now.getDate()).padStart(2, '0')
    return `${y}-${mo}-${da}`
  })

  const todayEntry = computed(() =>
    entries.value.find((e) => e.date === today.value) ?? null
  )

  const adjustingEntries = computed(() =>
    entries.value.filter(
      (e) => e.cellStatus === 'ADJUSTING' && e.adjustingResponseStatus === 'PENDING'
    )
  )

  const upcomingConfirmed = computed(() =>
    entries.value
      .filter((e) => e.date >= today.value && e.cellStatus === 'CONFIRMED')
      .sort((a, b) => a.date.localeCompare(b.date))
  )

  function respondToAdjustment(entryId: string, response: 'ACCEPTED' | 'DECLINED', message: string) {
    const entry = entries.value.find((e) => e.id === entryId)
    if (entry) {
      entry.adjustingResponseStatus = response
      entry.adjustingResponse = message
      if (response === 'ACCEPTED') {
        entry.cellStatus = 'CONFIRMED'
      }
    }
  }

  function submitPreferences(collectionId: string, newPrefs: { date: string; availability: PreferenceAvailability; start?: string; end?: string }[]) {
    // Remove old prefs for the collection period and add new ones
    const period = collection.value
    if (!period || period.id !== collectionId) return

    // Remove existing prefs in this period
    const startDate = period.periodStart
    const endDate = period.periodEnd
    preferences.value = preferences.value.filter(
      (p) => p.date < startDate || p.date > endDate
    )

    // Add new prefs
    newPrefs.forEach((np, i) => {
      preferences.value.push({
        id: `pref-new-${i}-${Date.now()}`,
        employeeId: 'emp-003',
        date: np.date,
        availability: np.availability,
        preferredStart: np.start,
        preferredEnd: np.end,
        submitted: true,
      })
    })
  }

  function getPreferenceForDate(date: string) {
    return preferences.value.find((p) => p.date === date) ?? null
  }

  function getShiftForDate(date: string) {
    return entries.value.find((e) => e.date === date) ?? null
  }

  return {
    entries,
    preferences,
    collection,
    board,
    todayEntry,
    adjustingEntries,
    upcomingConfirmed,
    respondToAdjustment,
    submitPreferences,
    getPreferenceForDate,
    getShiftForDate,
    getBoardLineup,
  }
})
