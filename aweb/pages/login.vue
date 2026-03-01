<template>
  <v-app theme="light">
    <v-main style="background: #f6f6f7">
      <div class="d-flex align-center justify-center" style="min-height: 100vh">
        <v-card width="400" class="pa-8 rounded-xl" elevation="2">
          <!-- Logo -->
          <div class="text-center mb-8">
            <div class="d-flex align-center justify-center ga-3 mb-2">
              <v-icon size="36" color="primary">mdi-calendar-clock</v-icon>
              <span class="text-h5 font-weight-bold text-primary">Suge Shift</span>
            </div>
            <p class="text-body-2 text-medium-emphasis">シフト管理システム</p>
          </div>

          <v-form @submit.prevent="handleLogin">
            <div class="mb-4">
              <label class="text-body-2 font-weight-medium mb-1 d-block">メールアドレス</label>
              <v-text-field
                v-model="email"
                type="email"
                placeholder="manager@example.com"
                prepend-inner-icon="mdi-email-outline"
                :error-messages="errors.email"
              />
            </div>

            <div class="mb-6">
              <label class="text-body-2 font-weight-medium mb-1 d-block">パスワード</label>
              <v-text-field
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                placeholder="••••••••"
                prepend-inner-icon="mdi-lock-outline"
                :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
                @click:append-inner="showPassword = !showPassword"
                :error-messages="errors.password"
              />
            </div>

            <v-btn
              type="submit"
              color="primary"
              size="large"
              block
              :loading="loading"
              class="rounded-lg"
            >
              ログイン
            </v-btn>
          </v-form>

          <div class="text-center mt-4">
            <p class="text-caption text-medium-emphasis">
              デモ用：任意のメールアドレスとパスワードでログインできます
            </p>
          </div>
        </v-card>
      </div>
    </v-main>
  </v-app>
</template>

<script setup lang="ts">
definePageMeta({ layout: false })

const authStore = useAuthStore()
const router = useRouter()

const email = ref('')
const password = ref('')
const showPassword = ref(false)
const loading = ref(false)
const errors = ref({ email: '', password: '' })

async function handleLogin() {
  errors.value = { email: '', password: '' }

  if (!email.value) {
    errors.value.email = 'メールアドレスを入力してください'
    return
  }
  if (!password.value) {
    errors.value.password = 'パスワードを入力してください'
    return
  }

  loading.value = true
  await new Promise(r => setTimeout(r, 500))
  authStore.login(email.value, password.value)
  loading.value = false
  router.push('/dashboard')
}
</script>
