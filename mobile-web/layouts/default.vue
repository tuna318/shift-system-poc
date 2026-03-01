<template>
  <div class="mobile-frame">
    <!-- Top App Bar -->
    <v-app-bar
      :elevation="0"
      color="white"
      height="56"
      border="b"
      style="position: sticky; top: 0; z-index: 10;"
    >
      <template v-if="canGoBack">
        <v-btn icon="mdi-arrow-left" variant="text" @click="$router.back()" />
      </template>
      <template v-else>
        <div style="width: 48px;" />
      </template>

      <v-app-bar-title class="text-subtitle-1 font-weight-bold">
        {{ pageTitle }}
      </v-app-bar-title>

      <template #append>
        <v-btn icon variant="text" @click="navigateTo('/notifications')">
          <v-badge
            v-if="appStore.unreadCount > 0"
            :content="appStore.unreadCount"
            color="error"
          >
            <v-icon>mdi-bell-outline</v-icon>
          </v-badge>
          <v-icon v-else>mdi-bell-outline</v-icon>
        </v-btn>
      </template>
    </v-app-bar>

    <!-- Main Content -->
    <v-main style="background: #f5f5f7; padding-bottom: 64px;">
      <slot />
    </v-main>

    <!-- Bottom Navigation -->
    <v-bottom-navigation
      v-model="activeTab"
      color="primary"
      height="64"
      style="position: fixed; bottom: 0; left: 50%; transform: translateX(-50%); width: 100%; max-width: 430px; border-top: 1px solid #e0e0e0;"
      bg-color="white"
    >
      <v-btn value="home" @click="navigateTo('/home')">
        <v-icon>mdi-home-outline</v-icon>
        <span style="font-size: 11px;">ホーム</span>
      </v-btn>

      <v-btn value="clock" @click="navigateTo('/clock')">
        <v-icon>mdi-clock-outline</v-icon>
        <span style="font-size: 11px;">打刻</span>
      </v-btn>

      <v-btn value="shifts" @click="navigateTo('/shifts')">
        <v-icon>mdi-calendar-outline</v-icon>
        <span style="font-size: 11px;">シフト</span>
      </v-btn>

      <v-btn value="attendance" @click="navigateTo('/attendance')">
        <v-icon>mdi-clipboard-text-outline</v-icon>
        <span style="font-size: 11px;">勤怠</span>
      </v-btn>

      <v-btn value="notifications" @click="navigateTo('/notifications')">
        <v-badge
          v-if="appStore.unreadCount > 0"
          :content="appStore.unreadCount"
          color="error"
        >
          <v-icon>mdi-bell-outline</v-icon>
        </v-badge>
        <v-icon v-else>mdi-bell-outline</v-icon>
        <span style="font-size: 11px;">通知</span>
      </v-btn>
    </v-bottom-navigation>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const appStore = useAppStore()

const pageTitles: Record<string, string> = {
  '/home': 'ホーム',
  '/clock': '打刻',
  '/shifts': 'シフト',
  '/shifts/submit': '希望シフト提出',
  '/attendance': '勤怠履歴',
  '/notifications': '通知',
}

const pageTitle = computed(() => {
  // Dynamic routes
  if (route.path.startsWith('/attendance/')) return '勤怠詳細'
  return pageTitles[route.path] ?? 'Sugeシフト'
})

const subPages = ['/shifts/submit']
const canGoBack = computed(() => subPages.includes(route.path) || route.path.startsWith('/attendance/'))

const tabMap: Record<string, string> = {
  '/home': 'home',
  '/clock': 'clock',
  '/shifts': 'shifts',
  '/shifts/submit': 'shifts',
  '/attendance': 'attendance',
  '/notifications': 'notifications',
}

const activeTab = computed({
  get() {
    if (route.path.startsWith('/attendance/')) return 'attendance'
    return tabMap[route.path] ?? 'home'
  },
  set() {},
})
</script>
