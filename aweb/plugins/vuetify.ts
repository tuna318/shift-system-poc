import { createVuetify } from 'vuetify'
import { VBtn } from 'vuetify/components'

export default defineNuxtPlugin((app) => {
  const vuetify = createVuetify({
    theme: {
      defaultTheme: 'light',
      themes: {
        light: {
          colors: {
            primary: '#3587dc',
            'primary-50': '#EBF3FC',
            warning: '#f8c076',
            success: '#4bd08b',
            error: '#e6273e',
            sidebar: '#43495C',
            'dark-20': '#f6f6f7',
            'dark-40': '#e0e1e4',
            'dark-100': '#80848e',
            surface: '#ffffff',
            background: '#f6f6f7',
          },
        },
      },
    },
    defaults: {
      VSelect: {
        density: 'compact',
        variant: 'outlined',
        hideDetails: 'auto',
      },
      VTextField: {
        density: 'compact',
        variant: 'outlined',
        hideDetails: 'auto',
      },
      VAutocomplete: {
        density: 'compact',
        variant: 'outlined',
        hideDetails: 'auto',
      },
      VTextarea: {
        density: 'compact',
        variant: 'outlined',
        hideDetails: 'auto',
      },
    },
  })
  app.vueApp.use(vuetify)
})
