<template>
  <div id="app">
    <router-view />
    <button @click="toggleLanguage" class="language-toggle-btn">
      {{ currentLanguage === 'ru' ? 'EN' : 'RU' }}
    </button>
  </div>
</template>

<script>
import { useTranslations } from './composables/useTranslations'

export default {
  name: 'App',
  setup() {
    const { currentLanguage, toggleLanguage } = useTranslations()

    return {
      currentLanguage,
      toggleLanguage
    }
  }
}
</script>

<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  background-color: #ffffff;
  color: #1a1a1a;
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

#app {
  min-height: 100vh;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
}

.notification {
  position: fixed;
  top: 2rem;
  right: 2rem;
  background: #10b981;
  color: #ffffff;
  padding: 1rem 1.5rem;
  border-radius: 12px;
  font-size: 0.875rem;
  font-weight: 500;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.15);
  z-index: 1000;
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.language-toggle-btn {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  width: 50px;
  height: 50px;
  border-radius: 12px;
  background: white;
  color: #374151;
  border: 1px solid #e2e8f0;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 600;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.language-toggle-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  background: #f8fafc;
}

.language-toggle-btn:active {
  transform: scale(0.95);
}

/* Responsive design */
@media (max-width: 768px) {
  .app-header {
    padding: 3rem 1rem 2rem;
  }

  .app-header h1 {
    font-size: 2.25rem;
  }

  .main-content {
    padding: 2rem 1rem;
  }
}
</style>