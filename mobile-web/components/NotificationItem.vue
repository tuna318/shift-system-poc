<template>
  <v-card
    rounded="lg"
    :elevation="notification.read ? 0 : 2"
    :variant="notification.read ? 'outlined' : 'elevated'"
    class="notification-card"
    @click="handleTap"
  >
    <v-card-text class="pa-3">
      <div class="d-flex align-start gap-3">
        <!-- Icon -->
        <v-avatar :color="iconColor" size="36" class="mt-1">
          <v-icon size="18" color="white">{{ icon }}</v-icon>
        </v-avatar>

        <!-- Content -->
        <div class="flex-1-1">
          <div class="d-flex align-center gap-2 mb-1">
            <span class="text-body-2 font-weight-bold">{{ notification.title }}</span>
            <v-badge v-if="!notification.read" color="error" inline dot />
          </div>
          <p class="text-body-2 text-grey-darken-1 mb-1">{{ notification.body }}</p>
          <span class="text-caption text-grey">{{ notification.date }}</span>

          <!-- Action buttons for substitution request -->
          <div v-if="notification.type === 'SUBSTITUTION_REQUEST' && notification.actionRequired && !responded" class="mt-3 d-flex gap-2">
            <v-btn
              color="primary"
              size="small"
              rounded="lg"
              variant="tonal"
              @click.stop="respond(true)"
            >
              <v-icon start size="16">mdi-check</v-icon>
              OK
            </v-btn>
            <v-btn
              color="error"
              size="small"
              rounded="lg"
              variant="tonal"
              @click.stop="respond(false)"
            >
              <v-icon start size="16">mdi-close</v-icon>
              NG
            </v-btn>
          </div>
          <div v-if="responded" class="mt-2">
            <v-chip :color="respondedYes ? 'success' : 'error'" size="x-small" variant="tonal">
              {{ respondedYes ? '出勤OK と回答しました' : '欠勤NG と回答しました' }}
            </v-chip>
          </div>
        </div>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import type { Notification } from '~/types'

const props = defineProps<{
  notification: Notification
}>()

const emit = defineEmits<{ tap: [id: string] }>()
const appStore = useAppStore()

const responded = ref(false)
const respondedYes = ref(false)

const typeConfig = {
  CORRECTION_REQUEST: { icon: 'mdi-pencil-circle-outline', color: '#e6273e' },
  SHIFT_CONFIRMED: { icon: 'mdi-calendar-check-outline', color: '#3587dc' },
  SHIFT_CHANGED: { icon: 'mdi-calendar-edit-outline', color: '#f8c076' },
  SUBSTITUTION_REQUEST: { icon: 'mdi-account-switch-outline', color: '#9c27b0' },
  SHIFT_REMINDER: { icon: 'mdi-alarm', color: '#9e9e9e' },
}

const icon = computed(() => typeConfig[props.notification.type]?.icon ?? 'mdi-bell')
const iconColor = computed(() => typeConfig[props.notification.type]?.color ?? '#9e9e9e')

function handleTap() {
  emit('tap', props.notification.id)
}

function respond(yes: boolean) {
  responded.value = true
  respondedYes.value = yes
  appStore.showSnackbar(
    yes ? '出勤OKと回答しました' : '欠勤NGと回答しました',
    yes ? 'success' : 'error'
  )
}
</script>

<style scoped>
.notification-card {
  cursor: pointer;
}
.gap-2 { gap: 8px; }
.gap-3 { gap: 12px; }
</style>
