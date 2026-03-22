export const useTimeNow = () => {
  const now = ref(new Date())
  let timer: ReturnType<typeof setInterval>

  onMounted(() => {
    timer = setInterval(() => {
      now.value = new Date()
    }, 1000)
  })

  onUnmounted(() => {
    clearInterval(timer)
  })

  const timeDisplay = computed(() => {
    const h = String(now.value.getHours()).padStart(2, '0')
    const m = String(now.value.getMinutes()).padStart(2, '0')
    const s = String(now.value.getSeconds()).padStart(2, '0')
    return `${h}:${m}:${s}`
  })

  const timeShort = computed(() => {
    const h = String(now.value.getHours()).padStart(2, '0')
    const m = String(now.value.getMinutes()).padStart(2, '0')
    return `${h}:${m}`
  })

  const dateLabel = computed(() => {
    const dow = ['日', '月', '火', '水', '木', '金', '土']
    const mo = now.value.getMonth() + 1
    const da = now.value.getDate()
    const dw = dow[now.value.getDay()]
    return `${mo}月${da}日 (${dw})`
  })

  const todayStr = computed(() => {
    const y = now.value.getFullYear()
    const mo = String(now.value.getMonth() + 1).padStart(2, '0')
    const da = String(now.value.getDate()).padStart(2, '0')
    return `${y}-${mo}-${da}`
  })

  return { now, timeDisplay, timeShort, dateLabel, todayStr }
}
