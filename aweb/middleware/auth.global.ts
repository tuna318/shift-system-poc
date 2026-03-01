export default defineNuxtRouteMiddleware((to) => {
  if (to.path === '/login') return

  if (import.meta.client) {
    const cookies = document.cookie.split(';')
    const hasToken = cookies.some(c => c.trim().startsWith('auth_token='))
    if (!hasToken) {
      return navigateTo('/login')
    }
    // Initialize user in auth store if authenticated
    const authStore = useAuthStore()
    authStore.initUser()
  }
})
