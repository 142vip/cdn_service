import { createApp } from 'vue'
import logoUrl from '@/assets/logo.svg'
import App from './App.vue'
import 'element-plus/dist/index.css'
import '@/assets/styles/style.css'

const favicon = document.querySelector<HTMLLinkElement>('link[rel="icon"]')
if (favicon)
  favicon.href = logoUrl

createApp(App).mount('#app')
