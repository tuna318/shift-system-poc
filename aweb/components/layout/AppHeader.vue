<template>
  <v-app-bar height="70" color="white" elevation="1" :border="false">
    <!-- Hamburger -->
    <v-btn
      icon
      variant="text"
      @click="emit('toggleSidebar')"
      class="ml-2"
    >
      <v-icon>mdi-menu</v-icon>
    </v-btn>

    <!-- Breadcrumb / Title -->
    <v-app-bar-title class="ml-2">
      <v-breadcrumbs :items="breadcrumbs" density="compact" class="pa-0">
        <template #divider>
          <v-icon size="14" color="medium-emphasis">mdi-chevron-right</v-icon>
        </template>
        <template #item="{ item, index }">
          <v-breadcrumbs-item
            :to="index < breadcrumbs.length - 1 ? item.to : undefined"
            :disabled="index === breadcrumbs.length - 1"
            class="text-body-2"
            :class="index === breadcrumbs.length - 1 ? 'font-weight-medium text-high-emphasis' : 'text-medium-emphasis'"
          >
            {{ item.title }}
          </v-breadcrumbs-item>
        </template>
      </v-breadcrumbs>
    </v-app-bar-title>

    <v-spacer />

    <!-- Store selector -->
    <v-select
      v-model="selectedStore"
      :items="stores"
      style="max-width: 200px"
      density="compact"
      variant="outlined"
      hide-details
      class="mr-3"
    />

    <!-- Notifications -->
    <v-btn icon variant="text" class="mr-1" @click="notifSheet = true">
      <v-badge :content="3" color="error" :dot="false">
        <v-icon>mdi-bell-outline</v-icon>
      </v-badge>
    </v-btn>

    <!-- User avatar menu -->
    <v-menu v-model="userMenu" :close-on-content-click="true">
      <template #activator="{ props }">
        <v-btn v-bind="props" variant="text" class="mr-2 pa-2" rounded="lg">
          <v-avatar color="primary" size="32" class="mr-2">
            <span class="text-caption text-white font-weight-bold">{{ userInitial }}</span>
          </v-avatar>
          <span class="text-body-2">{{ authStore.user?.name ?? '山田 店長' }}</span>
          <v-icon size="16" class="ml-1">mdi-chevron-down</v-icon>
        </v-btn>
      </template>
      <v-list width="200" density="compact">
        <v-list-item prepend-icon="mdi-account-outline" title="プロフィール" />
        <v-list-item prepend-icon="mdi-cog-outline" title="設定" />
        <v-divider />
        <v-list-item
          prepend-icon="mdi-logout"
          title="ログアウト"
          @click="authStore.logout()"
        />
      </v-list>
    </v-menu>
  </v-app-bar>

  <!-- Notification sheet (simple mock) -->
  <v-navigation-drawer
    v-model="notifSheet"
    location="right"
    temporary
    width="360"
  >
    <v-toolbar title="通知" density="compact">
      <template #append>
        <v-btn icon variant="text" @click="notifSheet = false">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </template>
    </v-toolbar>
    <v-list density="compact">
      <v-list-item
        v-for="notif in notifications"
        :key="notif.id"
        :subtitle="notif.time"
        class="py-3"
      >
        <template #prepend>
          <v-icon :color="notif.color" size="20" class="mr-2">{{ notif.icon }}</v-icon>
        </template>
        <template #title>
          <span class="text-body-2">{{ notif.message }}</span>
        </template>
      </v-list-item>
    </v-list>
  </v-navigation-drawer>
</template>

<script setup lang="ts">
const emit = defineEmits<{
  toggleSidebar: []
}>()

const authStore = useAuthStore()
const route = useRoute()

const selectedStore = ref('渋谷本店')
const stores = ['渋谷本店', '新宿店', '池袋店']
const userMenu = ref(false)
const notifSheet = ref(false)

const userInitial = computed(() => {
  const name = authStore.user?.name ?? '山田 店長'
  return name.charAt(0)
})

// Build breadcrumbs from route
const breadcrumbs = computed(() => {
  const pathMap: Record<string, string> = {
    '/dashboard': 'ダッシュボード',
    '/shifts': 'シフト管理',
    '/shifts/board': 'シフトボード',
    '/shifts/substitutions': '代打・交代',
    '/shifts/cross-shop': '他店舗応援',
    '/attendance': '勤怠管理',
    '/attendance/approval': '勤怠承認',
    '/attendance/modifications': '修正申請',
    '/employees': 'スタッフ管理',
    '/reports': 'レポート',
  }

  const segments = route.path.split('/').filter(Boolean)
  const crumbs = [{ title: 'ホーム', to: '/dashboard' }]

  let path = ''
  for (const seg of segments) {
    path += `/${seg}`
    const title = pathMap[path] ?? seg
    crumbs.push({ title, to: path })
  }

  return crumbs
})

const notifications = [
  { id: 1, message: '佐藤 花子さんの勤怠修正申請があります', time: '10分前', icon: 'mdi-clock-edit-outline', color: 'warning' },
  { id: 2, message: '2026年4月シフト収集の締切が近づいています', time: '1時間前', icon: 'mdi-calendar-alert', color: 'primary' },
  { id: 3, message: '松本 幸子さんの残業時間が上限に近づいています', time: '2時間前', icon: 'mdi-alert-outline', color: 'error' },
]
</script>
