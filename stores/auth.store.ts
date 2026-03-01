import { defineStore } from 'pinia'

interface AuthUser {
  name: string
  role: string
  store: string
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null as AuthUser | null,
  }),

  getters: {
    isAuthenticated(): boolean {
      if (import.meta.client) {
        const cookies = document.cookie.split(';')
        return cookies.some(c => c.trim().startsWith('auth_token='))
      }
      return false
    },
  },

  actions: {
    login(email: string, password: string) {
      // Mock: accept any credentials
      const expires = new Date()
      expires.setDate(expires.getDate() + 1)
      document.cookie = `auth_token=mock-token; expires=${expires.toUTCString()}; path=/`
      this.user = {
        name: '山田 店長',
        role: 'STORE_MANAGER',
        store: '渋谷本店',
      }
    },

    logout() {
      document.cookie = 'auth_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/'
      this.user = null
      navigateTo('/login')
    },

    initUser() {
      if (this.isAuthenticated && !this.user) {
        this.user = {
          name: '山田 店長',
          role: 'STORE_MANAGER',
          store: '渋谷本店',
        }
      }
    },
  },
})
