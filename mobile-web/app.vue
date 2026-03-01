<template>
  <v-app>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>

    <!-- Global snackbar -->
    <v-snackbar
      v-model="appStore.snackbar.show"
      :color="appStore.snackbar.color"
      :timeout="appStore.snackbar.timeout"
      location="top"
      rounded="pill"
    >
      {{ appStore.snackbar.message }}
      <template #actions>
        <v-btn variant="text" icon="mdi-close" size="small" @click="appStore.snackbar.show = false" />
      </template>
    </v-snackbar>
  </v-app>
</template>

<script setup lang="ts">
const appStore = useAppStore()
</script>
