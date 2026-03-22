<template>
  <div class="pa-4">
    <!-- Filter chips -->
    <div class="d-flex gap-2 mb-4 overflow-x-auto pb-1">
      <v-chip
        v-for="f in filters"
        :key="f.value"
        :color="activeFilter === f.value ? 'primary' : undefined"
        :variant="activeFilter === f.value ? 'tonal' : 'outlined'"
        size="small"
        @click="activeFilter = f.value"
      >
        {{ f.label }}
      </v-chip>
    </div>

    <!-- Notification list -->
    <div v-if="filteredNotifications.length === 0" class="text-center pa-8 text-grey">
      <v-icon size="48" color="grey-lighten-2">mdi-bell-off-outline</v-icon>
      <div class="text-body-2 mt-2">通知はありません</div>
    </div>

    <div v-else class="d-flex flex-column gap-3">
      <!-- Group by date -->
      <template v-for="group in groupedNotifications" :key="group.date">
        <div class="text-caption text-grey font-weight-bold mb-1">{{ group.dateLabel }}</div>
        <NotificationItem
          v-for="n in group.items"
          :key="n.id"
          :notification="n"
          @tap="handleTap"
        />
      </template>
    </div>

    <!-- Mark all read -->
    <div v-if="unreadNotifications.length > 0" class="text-center mt-4">
      <v-btn variant="text" size="small" color="primary" @click="markAllRead">
        すべて既読にする
      </v-btn>
    </div>
  </div>
</template>

<script setup lang="ts">
const { notifications } = useMockData()
const appStore = useAppStore()

const filters = [
  { label: 'すべて', value: 'ALL' },
  { label: '調整依頼', value: 'ADJUSTMENT_REQUEST' },
  { label: '代打', value: 'SUBSTITUTION_REQUEST' },
  { label: '修正依頼', value: 'CORRECTION_REQUEST' },
  { label: 'シフト', value: 'SHIFT' },
]

const activeFilter = ref('ALL')

const filteredNotifications = computed(() => {
  if (activeFilter.value === 'ALL') return notifications.value
  if (activeFilter.value === 'SHIFT') {
    return notifications.value.filter((n) =>
      n.type === 'SHIFT_CONFIRMED' || n.type === 'SHIFT_CHANGED' ||
      n.type === 'SHIFT_REMINDER' || n.type === 'SHIFT_PUBLISHED'
    )
  }
  return notifications.value.filter((n) => n.type === activeFilter.value)
})

const todayStr = new Date().toISOString().slice(0, 10)
const yesterdayStr = new Date(Date.now() - 86400000).toISOString().slice(0, 10)

const groupedNotifications = computed(() => {
  const groups = new Map<string, typeof notifications.value>()
  for (const n of filteredNotifications.value) {
    if (!groups.has(n.date)) groups.set(n.date, [])
    groups.get(n.date)!.push(n)
  }

  return [...groups.entries()]
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([date, items]) => ({
      date,
      dateLabel: date === todayStr ? '今日' : date === yesterdayStr ? '昨日' : date,
      items,
    }))
})

const unreadNotifications = computed(() => notifications.value.filter((n) => !n.read))

function handleTap(id: string) {
  const n = notifications.value.find((n) => n.id === id)
  if (!n) return

  if (!n.read) {
    n.read = true
    if (appStore.unreadCount > 0) appStore.unreadCount--
  }

  // Navigate to related page
  if (n.type === 'CORRECTION_REQUEST' && n.relatedId) {
    navigateTo(`/attendance/${n.relatedId}`)
  } else if (n.type === 'ADJUSTMENT_REQUEST') {
    navigateTo('/chat/emp-003')
  } else if (n.type === 'SUBSTITUTION_REQUEST') {
    navigateTo('/substitutions')
  } else if (n.type === 'SHIFT_CONFIRMED' || n.type === 'SHIFT_CHANGED' || n.type === 'SHIFT_PUBLISHED') {
    navigateTo('/shifts')
  }
}

function markAllRead() {
  notifications.value.forEach((n) => { n.read = true })
  appStore.unreadCount = 0
  appStore.showSnackbar('すべて既読にしました', 'success')
}
</script>

<style scoped>
.gap-2 { gap: 8px; }
.gap-3 { gap: 12px; }
.overflow-x-auto { overflow-x: auto; }
</style>
