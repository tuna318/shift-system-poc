<template>
  <!-- Outer shell centers the app frame on wide screens -->
  <div class="app-shell">
    <div class="app-frame">

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
const messageStore = useMessageStore()

const tabs = [
  { value: 'home',       label: 'ホーム',  route: '/home',        icon: 'mdi-home-outline',           iconActive: 'mdi-home' },
  { value: 'shifts',     label: 'シフト',  route: '/shifts',      icon: 'mdi-calendar-outline',        iconActive: 'mdi-calendar' },
  { value: 'attendance', label: '勤怠',    route: '/attendance',  icon: 'mdi-clipboard-text-outline',  iconActive: 'mdi-clipboard-text' },
  { value: 'chat',       label: 'チャット',route: '/chat',        icon: 'mdi-message-outline',          iconActive: 'mdi-message' },
  { value: 'account',    label: 'アカウント', route: '/profile',  icon: 'mdi-account-circle-outline',  iconActive: 'mdi-account-circle' },
]

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
