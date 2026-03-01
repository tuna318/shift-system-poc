import '@mdi/font/css/materialdesignicons.css'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

export default defineNuxtPlugin((app) => {
  const vuetify = createVuetify({
    components,
    directives,
    theme: {
      defaultTheme: 'light',
      themes: {
        light: {
          dark: false,
          colors: {
            primary: '#3587dc',
            success: '#4bd08b',
            warning: '#f8c076',
            error: '#e6273e',
            surface: '#ffffff',
            background: '#f5f5f7',
            'on-primary': '#ffffff',
            'on-success': '#ffffff',
            'on-warning': '#ffffff',
            'on-error': '#ffffff',
          },
        },
      },
    },
    defaults: {
      VBtn: {
        style: 'min-height: 48px;',
      },
    },
  })
  app.vueApp.use(vuetify)
})
