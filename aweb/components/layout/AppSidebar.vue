<template>
  <v-navigation-drawer
    v-model="drawerOpen"
    :rail="rail"
    permanent
    color="#43495C"
    width="270"
    elevation="0"
  >
    <!-- Logo/Brand -->
    <div class="px-4 py-5 d-flex align-center ga-3" :class="{ 'justify-center px-2': rail }">
      <v-icon color="white" size="28">mdi-calendar-clock</v-icon>
      <transition name="fade">
        <span v-if="!rail" class="text-white font-weight-bold text-subtitle-1">Suge Shift</span>
      </transition>
    </div>

    <v-divider :color="'rgba(255,255,255,0.15)'" />

    <!-- Navigation -->
    <v-list nav density="compact" class="py-2">
      <!-- Dashboard -->
      <v-list-item
        to="/dashboard"
        :prepend-icon="'mdi-view-dashboard-outline'"
        :title="rail ? '' : 'ダッシュボード'"
        active-color="white"
        color="rgba(255,255,255,0.6)"
        rounded="lg"
        class="sidebar-item"
      >
        <template v-if="rail" #prepend>
          <v-tooltip location="right" :text="'ダッシュボード'">
            <template #activator="{ props }">
              <v-icon v-bind="props">mdi-view-dashboard-outline</v-icon>
            </template>
          </v-tooltip>
        </template>
      </v-list-item>

      <!-- Shifts group -->
      <v-list-group v-if="!rail" color="white">
        <template #activator="{ props }">
          <v-list-item
            v-bind="props"
            prepend-icon="mdi-calendar-month-outline"
            title="シフト管理"
            color="rgba(255,255,255,0.6)"
            rounded="lg"
            class="sidebar-item"
          />
        </template>
        <v-list-item
          to="/shifts/board"
          prepend-icon="mdi-table-large"
          title="シフト管理"
          active-color="white"
          color="rgba(255,255,255,0.6)"
          rounded="lg"
          class="sidebar-item ml-3"
        />
        <v-list-item
          to="/shifts/substitutions"
          prepend-icon="mdi-account-switch-outline"
          title="代打・交代"
          active-color="white"
          color="rgba(255,255,255,0.6)"
          rounded="lg"
          class="sidebar-item ml-3"
        />
        <v-list-item
          to="/shifts/cross-shop"
          prepend-icon="mdi-store-plus-outline"
          title="他店舗応援"
          active-color="white"
          color="rgba(255,255,255,0.6)"
          rounded="lg"
          class="sidebar-item ml-3"
        />
      </v-list-group>

      <!-- Rail mode shift links -->
      <template v-if="rail">
        <v-list-item
          to="/shifts/board"
          color="rgba(255,255,255,0.6)"
          active-color="white"
          rounded="lg"
          class="sidebar-item"
        >
          <template #prepend>
            <v-tooltip location="right" text="シフト管理">
              <template #activator="{ props }">
                <v-icon v-bind="props">mdi-table-large</v-icon>
              </template>
            </v-tooltip>
          </template>
        </v-list-item>
      </template>

      <!-- Attendance group -->
      <v-list-group v-if="!rail" color="white">
        <template #activator="{ props }">
          <v-list-item
            v-bind="props"
            prepend-icon="mdi-clock-outline"
            title="勤怠管理"
            color="rgba(255,255,255,0.6)"
            rounded="lg"
            class="sidebar-item"
          />
        </template>
        <v-list-item
          to="/attendance"
          prepend-icon="mdi-format-list-bulleted"
          title="勤怠一覧"
          active-color="white"
          color="rgba(255,255,255,0.6)"
          rounded="lg"
          class="sidebar-item ml-3"
        />
        <v-list-item
          to="/attendance/modifications"
          prepend-icon="mdi-pencil-outline"
          title="修正申請"
          active-color="white"
          color="rgba(255,255,255,0.6)"
          rounded="lg"
          class="sidebar-item ml-3"
        />
      </v-list-group>

      <!-- Rail attendance -->
      <template v-if="rail">
        <v-list-item
          to="/attendance"
          color="rgba(255,255,255,0.6)"
          active-color="white"
          rounded="lg"
          class="sidebar-item"
        >
          <template #prepend>
            <v-tooltip location="right" text="勤怠管理">
              <template #activator="{ props }">
                <v-icon v-bind="props">mdi-clock-outline</v-icon>
              </template>
            </v-tooltip>
          </template>
        </v-list-item>
      </template>

      <!-- Employees -->
      <v-list-item
        to="/employees"
        :prepend-icon="'mdi-account-group-outline'"
        :title="rail ? '' : 'スタッフ管理'"
        active-color="white"
        color="rgba(255,255,255,0.6)"
        rounded="lg"
        class="sidebar-item"
      >
        <template v-if="rail" #prepend>
          <v-tooltip location="right" text="スタッフ管理">
            <template #activator="{ props }">
              <v-icon v-bind="props">mdi-account-group-outline</v-icon>
            </template>
          </v-tooltip>
        </template>
      </v-list-item>

      <!-- Reports -->
      <v-list-item
        to="/reports"
        :prepend-icon="'mdi-chart-bar'"
        :title="rail ? '' : 'レポート'"
        active-color="white"
        color="rgba(255,255,255,0.6)"
        rounded="lg"
        class="sidebar-item"
      >
        <template v-if="rail" #prepend>
          <v-tooltip location="right" text="レポート">
            <template #activator="{ props }">
              <v-icon v-bind="props">mdi-chart-bar</v-icon>
            </template>
          </v-tooltip>
        </template>
      </v-list-item>

      <!-- Settings -->
      <v-list-item
        to="/settings/labor-rules"
        :prepend-icon="'mdi-cog-outline'"
        :title="rail ? '' : '設定'"
        active-color="white"
        color="rgba(255,255,255,0.6)"
        rounded="lg"
        class="sidebar-item"
      >
        <template v-if="rail" #prepend>
          <v-tooltip location="right" text="設定">
            <template #activator="{ props }">
              <v-icon v-bind="props">mdi-cog-outline</v-icon>
            </template>
          </v-tooltip>
        </template>
      </v-list-item>
    </v-list>

    <!-- Bottom: store + user -->
    <template #append>
      <v-divider :color="'rgba(255,255,255,0.15)'" />
      <div class="pa-3">
        <div v-if="!rail" class="d-flex align-center ga-2 pa-2 rounded-lg" style="background: rgba(255,255,255,0.08)">
          <v-icon color="rgba(255,255,255,0.7)" size="18">mdi-store-outline</v-icon>
          <div>
            <div class="text-caption text-white font-weight-medium">渋谷本店</div>
            <div class="text-caption" style="color: rgba(255,255,255,0.5); font-size: 10px">山田 店長</div>
          </div>
        </div>
        <div v-else class="d-flex justify-center pa-2">
          <v-tooltip location="right" text="渋谷本店 / 山田 店長">
            <template #activator="{ props }">
              <v-icon v-bind="props" color="rgba(255,255,255,0.7)" size="20">mdi-store-outline</v-icon>
            </template>
          </v-tooltip>
        </div>
      </div>
    </template>
  </v-navigation-drawer>
</template>

<script setup lang="ts">
const props = defineProps<{
  rail: boolean
}>()

const emit = defineEmits<{
  'update:rail': [value: boolean]
}>()

const drawerOpen = ref(true)

const rail = computed({
  get: () => props.rail,
  set: (v) => emit('update:rail', v),
})
</script>

<style scoped>
.sidebar-item {
  margin-bottom: 2px;
}

.sidebar-item:deep(.v-list-item__prepend .v-icon) {
  color: rgba(255, 255, 255, 0.65) !important;
}

.sidebar-item:deep(.v-list-item-title) {
  color: rgba(255, 255, 255, 0.85);
  font-size: 0.875rem;
}

.sidebar-item.v-list-item--active:deep(.v-list-item__prepend .v-icon) {
  color: white !important;
}

.sidebar-item.v-list-item--active:deep(.v-list-item-title) {
  color: white;
  font-weight: 600;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
