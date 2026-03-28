import { defineStore } from 'pinia'
import type { ClockStatus, PunchType, PunchEvent, PunchVariant, Department } from '~/types'

export const useClockStore = defineStore('clock', () => {
  const status = ref<ClockStatus>('NOT_STARTED')
  const checkInTime = ref<string | null>(null)
  const breakMinutes = ref(0)
  const breakStartTime = ref<Date | null>(null)
  const events = ref<PunchEvent[]>([])
  const todayDate = ref('')
  const department = ref<Department>('ホール')
  const punchVariant = ref<PunchVariant>('NORMAL')
  const helpStore = ref<string>('')   // store name when punchVariant === 'HELP'
  const lastPunchAt = ref<Date | null>(null)

  // Reset if day has changed
  function checkNewDay(currentDate: string) {
    if (todayDate.value && todayDate.value !== currentDate) {
      status.value = 'NOT_STARTED'
      checkInTime.value = null
      breakMinutes.value = 0
      breakStartTime.value = null
      events.value = []
      lastPunchAt.value = null
    }
    todayDate.value = currentDate
  }

  function isDuplicate(now: Date): boolean {
    if (!lastPunchAt.value) return false
    const diffMs = now.getTime() - lastPunchAt.value.getTime()
    return diffMs < 5 * 60 * 1000 // 5 minutes
  }

  function punch(type: PunchType, now: Date): { success: boolean; reason?: string } {
    if (isDuplicate(now)) {
      return { success: false, reason: '直前に同じ打刻が記録されています（5分以内）' }
    }

    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
    const event: PunchEvent = {
      type,
      time: timeStr,
      timestamp: now.toISOString(),
      department: department.value,
      variant: type === 'CHECK_IN' ? punchVariant.value : undefined,
    }
    events.value.push(event)
    lastPunchAt.value = now

    if (type === 'CHECK_IN') {
      status.value = 'WORKING'
      checkInTime.value = timeStr
    } else if (type === 'BREAK_START') {
      status.value = 'ON_BREAK'
      breakStartTime.value = now
    } else if (type === 'BREAK_END') {
      status.value = 'WORKING'
      if (breakStartTime.value) {
        const diffMin = Math.floor((now.getTime() - breakStartTime.value.getTime()) / 60000)
        breakMinutes.value += diffMin
        breakStartTime.value = null
      }
    } else if (type === 'CHECK_OUT') {
      status.value = 'COMPLETED'
    }

    return { success: true }
  }

  const elapsedWorkMinutes = computed(() => {
    if (!checkInTime.value) return 0
    const [h, m] = checkInTime.value.split(':').map(Number)
    const now = new Date()
    const elapsedTotal = (now.getHours() * 60 + now.getMinutes()) - (h * 60 + m)
    return Math.max(0, elapsedTotal - breakMinutes.value)
  })

  const elapsedDisplay = computed(() => {
    const total = elapsedWorkMinutes.value
    const h = Math.floor(total / 60)
    const m = total % 60
    return `${h}時間${String(m).padStart(2, '0')}分`
  })

  const variantLabel = computed(() => {
    const labels: Record<PunchVariant, string> = { NORMAL: '通常', HELP: 'ヘルプ', TRAINING: '研修' }
    return labels[punchVariant.value]
  })

  return {
    status,
    checkInTime,
    breakMinutes,
    events,
    department,
    punchVariant,
    helpStore,
    elapsedWorkMinutes,
    elapsedDisplay,
    variantLabel,
    checkNewDay,
    isDuplicate,
    punch,
  }
})
