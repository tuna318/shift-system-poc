import { defineStore } from 'pinia'

interface SnackbarState {
  show: boolean
  message: string
  color: string
  timeout: number
}

export const useAppStore = defineStore('app', () => {
  const snackbar = ref<SnackbarState>({
    show: false,
    message: '',
    color: 'success',
    timeout: 3000,
  })

  const loading = ref(false)
  const unreadCount = ref(2)

  function showSnackbar(message: string, color = 'success', timeout = 3000) {
    snackbar.value = { show: true, message, color, timeout }
  }

  function decrementUnread() {
    if (unreadCount.value > 0) unreadCount.value--
  }

  return { snackbar, loading, unreadCount, showSnackbar, decrementUnread }
})
