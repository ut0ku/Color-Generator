import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

// Handle GitHub Pages SPA routing
if (window.location.search.startsWith('?/')) {
  const path = window.location.search.slice(2);
  window.history.replaceState(null, '', path);
}

createApp(App).use(router).mount('#app')