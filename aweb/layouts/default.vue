<template>
  <v-app theme="light">
    <AppSidebar v-model:rail="sidebarRail" />
    <AppHeader @toggle-sidebar="sidebarRail = !sidebarRail" />
    <v-main style="background: #f6f6f7">
      <div class="pa-6">
        <slot />
      </div>
    </v-main>
    <ChatOverlay />
  </v-app>
</template>

<script setup lang="ts">
const sidebarRail = ref(false)
</script>
