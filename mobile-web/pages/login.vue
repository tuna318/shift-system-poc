<template>
  <NuxtLayout name="auth">
    <div class="login-wrapper pa-4" style="width: 100%; max-width: 400px;">
      <!-- Logo / Brand -->
      <div class="text-center mb-8">
        <v-icon size="56" color="white">mdi-clock-time-four-outline</v-icon>
        <div class="text-h5 font-weight-bold text-white mt-2">Sugeシフト</div>
        <div class="text-body-2 text-white" style="opacity: 0.8;">従業員アプリ</div>
      </div>

      <!-- Login card -->
      <v-card rounded="xl" elevation="8">
        <v-card-text class="pa-6">
          <div class="text-subtitle-1 font-weight-bold mb-4">ログイン</div>

          <!-- Employee selector -->
          <v-select
            v-model="selectedEmployeeId"
            :items="employeeItems"
            item-title="label"
            item-value="value"
            label="スタッフを選択"
            variant="outlined"
            density="comfortable"
            rounded="lg"
            class="mb-4"
            hide-details
          />

          <!-- PIN display -->
          <div class="pin-display mb-4" v-if="selectedEmployeeId">
            <div class="text-caption text-grey mb-2">PINコード (6桁)</div>
            <div class="d-flex gap-2 justify-center">
              <div
                v-for="i in 6"
                :key="i"
                class="pin-dot"
                :class="{ filled: pin.length >= i }"
              />
            </div>
          </div>

          <!-- Error -->
          <v-alert v-if="error" type="error" density="compact" rounded="lg" class="mb-3">
            {{ error }}
          </v-alert>

          <!-- PIN pad -->
          <div v-if="selectedEmployeeId" class="pin-pad">
            <div class="pin-grid">
              <v-btn
                v-for="key in ['1','2','3','4','5','6','7','8','9','','0','⌫']"
                :key="key"
                :disabled="!key"
                variant="tonal"
                rounded="lg"
                height="56"
                class="pin-key"
                @click="handlePinKey(key)"
              >
                <span style="font-size: 20px; font-weight: 600;">{{ key }}</span>
              </v-btn>
            </div>
          </div>

          <!-- Login button -->
          <v-btn
            v-if="selectedEmployeeId"
            block
            color="primary"
            size="large"
            rounded="lg"
            class="mt-4"
            :disabled="pin.length < 6"
            :loading="loading"
            @click="doLogin"
          >
            ログイン
          </v-btn>
        </v-card-text>
      </v-card>
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
definePageMeta({ layout: false })

const { employees } = useMockData()
const authStore = useAuthStore()

const selectedEmployeeId = ref<string | null>(null)
const pin = ref('')
const error = ref('')
const loading = ref(false)

const employeeItems = computed(() =>
  employees.map((e) => ({ label: `${e.name} (${e.department})`, value: e.id }))
)

watch(selectedEmployeeId, () => {
  pin.value = ''
  error.value = ''
})

function handlePinKey(key: string) {
  if (key === '⌫') {
    pin.value = pin.value.slice(0, -1)
  } else if (pin.value.length < 6 && key) {
    pin.value += key
  }

  if (pin.value.length === 6) {
    doLogin()
  }
}

async function doLogin() {
  error.value = ''
  const emp = employees.find((e) => e.id === selectedEmployeeId.value)
  if (!emp) return

  loading.value = true
  await new Promise((r) => setTimeout(r, 500))

  if (pin.value !== emp.pin) {
    error.value = 'PINコードが正しくありません'
    pin.value = ''
    loading.value = false
    return
  }

  authStore.login(emp)
  await navigateTo('/home')
  loading.value = false
}
</script>

<style scoped>
.login-wrapper {
  margin: 0 auto;
}

.pin-display {
  text-align: center;
}

.pin-dot {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 2px solid #bdbdbd;
  transition: all 0.15s;
}

.pin-dot.filled {
  background: #3587dc;
  border-color: #3587dc;
}

.pin-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.pin-key {
  font-size: 20px !important;
}

.gap-2 {
  gap: 8px;
}
</style>
