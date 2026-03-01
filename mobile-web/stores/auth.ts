import { defineStore } from 'pinia'
import type { Employee } from '~/types'

export const useAuthStore = defineStore('auth', () => {
  const token = useCookie('auth_token')
  const currentEmployee = ref<Employee | null>(null)

  function login(employee: Employee) {
    token.value = `mock-token-${employee.id}`
    currentEmployee.value = employee
  }

  function logout() {
    token.value = null
    currentEmployee.value = null
  }

  return { token, currentEmployee, login, logout }
})
