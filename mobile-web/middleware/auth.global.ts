export default defineNuxtRouteMiddleware((to) => {
  const token = useCookie('auth_token')
  const isLoginPage = to.path === '/login'

  if (!token.value && !isLoginPage) {
    return navigateTo('/login')
  }

  if (token.value && isLoginPage) {
    return navigateTo('/home')
  }
})
