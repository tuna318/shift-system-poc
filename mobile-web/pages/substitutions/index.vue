<template>
  <div>
    <!-- Tabs -->
    <v-tabs v-model="tab" color="primary" align-tabs="center" class="border-b">
      <v-tab value="received">
        受けた依頼
        <v-badge v-if="substitutionStore.pendingReceived.length > 0" :content="substitutionStore.pendingReceived.length" color="error" inline class="ml-1" />
      </v-tab>
      <v-tab value="sent">送った依頼</v-tab>
    </v-tabs>

    <v-window v-model="tab">
      <!-- Received -->
      <v-window-item value="received">
        <div class="pa-4">
          <div v-if="substitutionStore.receivedRequests.length === 0" class="text-center pa-8 text-grey">
            <v-icon size="48" color="grey-lighten-2">mdi-inbox-outline</v-icon>
            <div class="text-body-2 mt-2">受けた依頼はありません</div>
          </div>
          <div v-else class="d-flex flex-column gap-3">
            <SubstitutionCard
              v-for="req in substitutionStore.receivedRequests"
              :key="req.id"
              :request="req"
              :is-received="true"
              @accept="substitutionStore.respondToRequest(req.id, true); appStore.showSnackbar('代打依頼を承諾しました', 'success')"
              @reject="substitutionStore.respondToRequest(req.id, false); appStore.showSnackbar('代打依頼をお断りしました', 'warning')"
            />
          </div>
        </div>
      </v-window-item>

      <!-- Sent -->
      <v-window-item value="sent">
        <div class="pa-4">
          <div v-if="substitutionStore.sentRequests.length === 0" class="text-center pa-8 text-grey">
            <v-icon size="48" color="grey-lighten-2">mdi-send-outline</v-icon>
            <div class="text-body-2 mt-2">送った依頼はありません</div>
          </div>
          <div v-else class="d-flex flex-column gap-3">
            <SubstitutionCard
              v-for="req in substitutionStore.sentRequests"
              :key="req.id"
              :request="req"
              :is-received="false"
              @cancel="substitutionStore.cancelRequest(req.id); appStore.showSnackbar('依頼をキャンセルしました', 'info')"
            />
          </div>
        </div>
      </v-window-item>
    </v-window>

    <!-- FAB to create new -->
    <v-fab
      icon="mdi-plus"
      color="primary"
      location="bottom end"
      style="position: fixed; bottom: 80px; right: 16px;"
      @click="navigateTo('/substitutions/new')"
    />
  </div>
</template>

<script setup lang="ts">
const substitutionStore = useSubstitutionStore()
const appStore = useAppStore()
const tab = ref('received')
</script>

<style scoped>
.gap-3 { gap: 12px; }
.border-b { border-bottom: 1px solid #e0e0e0; }
</style>
