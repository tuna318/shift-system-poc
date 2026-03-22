<template>
  <!-- Outer shell centers the app frame on wide screens -->
  <div class="app-shell">
    <div class="app-frame">

      <!-- Top App Bar -->
      <header class="top-bar">
        <div class="top-bar__inner">
          <!-- Left: back button or spacer -->
          <div class="top-bar__left">
            <v-btn
              v-if="canGoBack"
              icon="mdi-arrow-left"
              variant="text"
              size="small"
              @click="$router.back()"
            />
          </div>

          <!-- Center: page title -->
          <div class="top-bar__title text-subtitle-1 font-weight-bold">
            {{ pageTitle }}
          </div>

          <!-- Right: notification bell -->
          <div class="top-bar__right">
            <v-btn icon variant="text" size="small" @click="navigateTo('/notifications')">
              <v-badge
                v-if="appStore.unreadCount > 0"
                :content="appStore.unreadCount"
                color="error"
                floating
              >
                <v-icon size="22">mdi-bell-outline</v-icon>
              </v-badge>
              <v-icon v-else size="22">mdi-bell-outline</v-icon>
            </v-btn>
          </div>
        </div>
      </header>

      <!-- Scrollable content -->
      <main class="page-content">
        <slot />
      </main>

      <!-- Bottom Navigation -->
      <nav class="bottom-nav">
        <button
          v-for="tab in tabs"
          :key="tab.value"
          class="bottom-nav__item"
          :class="{ 'bottom-nav__item--active': activeTab === tab.value }"
          @click="navigateTo(tab.route)"
        >
          <div class="bottom-nav__icon-wrap">
            <!-- Chat badge -->
            <template v-if="tab.value === 'chat' && messageStore.unreadCount > 0">
              <v-badge :content="messageStore.unreadCount" color="error" floating>
                <v-icon size="22">{{ activeTab === tab.value ? tab.iconActive : tab.icon }}</v-icon>
              </v-badge>
            </template>
            <v-icon v-else size="22">{{ activeTab === tab.value ? tab.iconActive : tab.icon }}</v-icon>
          </div>
          <span class="bottom-nav__label">{{ tab.label }}</span>
        </button>
      </nav>

    </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const appStore = useAppStore()
const messageStore = useMessageStore()

const tabs = [
  { value: 'home',       label: 'ホーム',  route: '/home',        icon: 'mdi-home-outline',           iconActive: 'mdi-home' },
  { value: 'shifts',     label: 'シフト',  route: '/shifts',      icon: 'mdi-calendar-outline',        iconActive: 'mdi-calendar' },
  { value: 'attendance', label: '勤怠',    route: '/attendance',  icon: 'mdi-clipboard-text-outline',  iconActive: 'mdi-clipboard-text' },
  { value: 'chat',       label: 'チャット',route: '/chat',        icon: 'mdi-message-outline',          iconActive: 'mdi-message' },
  { value: 'account',    label: 'アカウント', route: '/profile',  icon: 'mdi-account-circle-outline',  iconActive: 'mdi-account-circle' },
]

const pageTitles: Record<string, string> = {
  '/home':               'ホーム',
  '/shifts':             'シフト',
  '/shifts/submit':      '希望シフト提出',
  '/attendance':         '勤怠履歴',
  '/notifications':      '通知',
  '/chat':               'チャット',
  '/substitutions':      '代打・シフト交換',
  '/substitutions/new':  '依頼を作成',
  '/profile':            'アカウント',
}

const pageTitle = computed(() => {
  if (route.path.startsWith('/attendance/'))        return '勤怠詳細'
  if (route.path.startsWith('/chat/'))              return 'チャット'
  if (route.path.startsWith('/shifts/collection/')) return 'シフト希望提出'
  if (route.path.startsWith('/shifts/') && route.path !== '/shifts' && route.path !== '/shifts/submit')
    return 'シフト詳細'
  return pageTitles[route.path] ?? 'Sugeシフト'
})

const canGoBack = computed(() =>
  route.path === '/shifts/submit' ||
  route.path === '/substitutions/new' ||
  route.path === '/notifications' ||
  route.path.startsWith('/attendance/') ||
  route.path.startsWith('/chat/') ||
  route.path.startsWith('/shifts/collection/') ||
  (route.path.startsWith('/shifts/') && route.path !== '/shifts') ||
  (route.path.startsWith('/substitutions/') && route.path !== '/substitutions')
)

const tabMap: Record<string, string> = {
  '/home':        'home',
  '/shifts':      'shifts',
  '/shifts/submit': 'shifts',
  '/attendance':  'attendance',
  '/chat':        'chat',
  '/profile':     'account',
  '/notifications': '',   // no tab selected
}

const activeTab = computed(() => {
  if (route.path.startsWith('/attendance/'))        return 'attendance'
  if (route.path.startsWith('/shifts/'))            return 'shifts'
  if (route.path.startsWith('/chat/'))              return 'chat'
  return tabMap[route.path] ?? ''
})
</script>

<style scoped>
/* ── Outer centering shell ────────────────────────────────────── */
.app-shell {
  min-height: 100dvh;
  background: #e8eaf0;
  display: flex;
  justify-content: center;
  align-items: flex-start;
}

/* ── Phone frame ──────────────────────────────────────────────── */
.app-frame {
  position: relative;
  width: 100%;
  max-width: 430px;
  min-height: 100dvh;
  background: #f5f5f7;
  display: flex;
  flex-direction: column;
  box-shadow: 0 0 40px rgba(0, 0, 0, 0.12);
}

/* ── Top bar ──────────────────────────────────────────────────── */
.top-bar {
  position: sticky;
  top: 0;
  z-index: 20;
  background: #ffffff;
  border-bottom: 1px solid #e8e8e8;
  height: 56px;
  flex-shrink: 0;
}

.top-bar__inner {
  display: flex;
  align-items: center;
  height: 100%;
  padding: 0 4px;
}

.top-bar__left {
  width: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.top-bar__title {
  flex: 1;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.top-bar__right {
  width: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

/* ── Scrollable page content ──────────────────────────────────── */
.page-content {
  flex: 1;
  overflow-y: auto;
  padding-bottom: 68px; /* clear bottom nav */
}

/* ── Bottom navigation ────────────────────────────────────────── */
.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: 430px;
  height: 64px;
  background: #ffffff;
  border-top: 1px solid #e8e8e8;
  display: flex;
  align-items: stretch;
  z-index: 20;
  /* subtle top shadow */
  box-shadow: 0 -2px 12px rgba(0, 0, 0, 0.06);
}

.bottom-nav__item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px 0 6px;
  color: #9e9e9e;
  transition: color 0.15s;
  -webkit-tap-highlight-color: transparent;
}

.bottom-nav__item--active {
  color: #3587dc;
}

.bottom-nav__icon-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 26px;
}

.bottom-nav__label {
  font-size: 10px;
  font-weight: 500;
  line-height: 1;
  letter-spacing: 0;
}

.bottom-nav__item--active .bottom-nav__label {
  font-weight: 700;
}
</style>
