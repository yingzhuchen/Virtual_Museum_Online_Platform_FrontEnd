import { defineConfig } from 'unocss'

export default defineConfig({
  theme: {
    colors: {
      primary: '#111827',
      managerPrimary: '#0EB1F4',
      'gray-1': '#757575',
      'gray-2': '#BBB',
      'black-1': '#101010',
    },
  },
  content: {
    filesystem: ['./components/*.vue', 'app.vue', 'pages/**/*.vue', 'layouts/**/*.vue'],
  },
})
