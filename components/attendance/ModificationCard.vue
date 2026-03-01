<template>
  <v-card rounded="xl" elevation="0" border class="mb-3">
    <v-card-text class="pa-4">
      <div class="d-flex align-start justify-space-between mb-2">
        <div class="d-flex align-center ga-2">
          <v-avatar color="warning" size="32">
            <span class="text-white text-caption font-weight-bold">
              {{ modification.employeeName.charAt(0) }}
            </span>
          </v-avatar>
          <div>
            <div class="text-body-2 font-weight-medium">{{ modification.employeeName }}</div>
            <div class="text-caption text-medium-emphasis">{{ modification.workDate }}</div>
          </div>
        </div>
        <v-chip color="warning" size="small" variant="flat">修正申請中</v-chip>
      </div>

      <div class="d-flex ga-2 mt-2">
        <div class="flex-1-1 pa-2 rounded-lg" style="background: #F3F4F6">
          <div class="text-caption text-medium-emphasis mb-1">現在の記録</div>
          <div class="text-caption">
            出勤: {{ modification.originalCheckIn }}<br>
            退勤: {{ modification.originalCheckOut }}
          </div>
        </div>
        <v-icon size="16" color="medium-emphasis" class="align-self-center">mdi-arrow-right</v-icon>
        <div class="flex-1-1 pa-2 rounded-lg" style="background: #EBF3FC">
          <div class="text-caption text-primary mb-1">修正後</div>
          <div class="text-caption text-primary">
            出勤: {{ modification.requestedCheckIn }}<br>
            退勤: {{ modification.requestedCheckOut }}
          </div>
        </div>
      </div>

      <div class="mt-2 pa-2 rounded-lg" style="background: #FFFBEB">
        <span class="text-caption">理由: {{ modification.reason }}</span>
      </div>
    </v-card-text>
    <v-card-actions class="pa-4 pt-0">
      <v-btn size="small" color="success" variant="tonal" rounded="lg" @click="emit('approve', modification.id)">
        承認
      </v-btn>
      <v-btn size="small" color="error" variant="tonal" rounded="lg" @click="emit('reject', modification.id)">
        拒否
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script setup lang="ts">
interface Modification {
  id: string
  employeeName: string
  workDate: string
  originalCheckIn: string
  originalCheckOut: string
  requestedCheckIn: string
  requestedCheckOut: string
  reason: string
}

defineProps<{
  modification: Modification
}>()

const emit = defineEmits<{
  approve: [id: string]
  reject: [id: string]
}>()
</script>
