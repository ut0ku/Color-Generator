<template>
  <div>
    <header class="app-header">
      <h1>{{ $t('exportTitle') }}</h1>
      <p>{{ $t('exportSubtitle') }}</p>
    </header>

    <nav class="nav">
      <router-link to="/" class="nav-link" :class="{ active: $route.name === 'Home' }">
        {{ $t('generator') }}
      </router-link>
      <router-link to="/library" class="nav-link" :class="{ active: $route.name === 'Library' }">
        {{ $t('library') }}
      </router-link>
      <router-link to="/export" class="nav-link" :class="{ active: $route.name === 'Export' }">
        {{ $t('export') }}
      </router-link>
    </nav>

    <main class="main-content">
      <div v-if="!currentPalette.colors || currentPalette.colors.length === 0" class="empty-state">
        <h3>{{ $t('noPaletteToExport') }}</h3>
        <p>{{ $t('createPaletteFirst') }}</p>
        <router-link to="/" class="create-link">{{ $t('createPalette') }}</router-link>
      </div>

      <div v-else class="export-content">
        <div class="current-palette">
          <h3>{{ $t('currentPalette') }}</h3>
          <div class="palette-preview">
            <div
              v-for="(color, index) in currentPalette.colors"
              :key="index"
              class="color-preview"
              :style="{ backgroundColor: color.hex }"
            >
              <span class="color-code">{{ color.hex }}</span>
            </div>
          </div>
        </div>

        <div class="export-formats">
          <div class="format-group">
            <h3>{{ $t('cssVariables') }}</h3>
            <textarea
              readonly
              :value="cssVariables"
              class="code-block"
              @click="copyToClipboard(cssVariables, $t('cssVariables'))"
            ></textarea>
            <button @click="copyToClipboard(cssVariables, $t('cssVariables'))" class="copy-btn">
              {{ $t('copyCssVariables') }}
            </button>
          </div>

          <div class="format-group">
            <h3>{{ $t('scssVariables') }}</h3>
            <textarea
              readonly
              :value="scssVariables"
              class="code-block"
              @click="copyToClipboard(scssVariables, $t('scssVariables'))"
            ></textarea>
            <button @click="copyToClipboard(scssVariables, $t('scssVariables'))" class="copy-btn">
              {{ $t('copyScssVariables') }}
            </button>
          </div>

          <div class="format-group">
            <h3>{{ $t('tailwindConfig') }}</h3>
            <textarea
              readonly
              :value="tailwindConfig"
              class="code-block"
              @click="copyToClipboard(tailwindConfig, $t('tailwindConfig'))"
            ></textarea>
            <button @click="copyToClipboard(tailwindConfig, $t('tailwindConfig'))" class="copy-btn">
              {{ $t('copyTailwindConfig') }}
            </button>
          </div>

          <div class="format-group">
            <h3>{{ $t('json') }}</h3>
            <textarea
              readonly
              :value="jsonExport"
              class="code-block"
              @click="copyToClipboard(jsonExport, $t('json'))"
            ></textarea>
            <button @click="copyToClipboard(jsonExport, $t('json'))" class="copy-btn">
              {{ $t('copyJson') }}
            </button>
          </div>

          <div class="format-group">
            <h3>{{ $t('shareLink') }}</h3>
            <input
              readonly
              :value="shareLink"
              class="share-input"
              @click="copyToClipboard(shareLink, $t('shareLink'))"
            >
            <button @click="copyToClipboard(shareLink, $t('shareLink'))" class="copy-btn">
              {{ $t('copyShareLink') }}
            </button>
          </div>
        </div>
      </div>

      <div v-if="notification" class="notification">
        {{ notification }}
      </div>
    </main>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useTranslations } from '../composables/useTranslations'

export default {
  name: 'Export',
  setup() {
    const { $t } = useTranslations()
    const currentPalette = ref({ colors: [] })
    const notification = ref('')

    const cssVariables = computed(() => {
      if (!currentPalette.value.colors) return ''
      return `:root {\n${currentPalette.value.colors
        .map((color, index) => `  --color-${index + 1}: ${color.hex};`)
        .join('\n')}\n}`
    })

    const scssVariables = computed(() => {
      if (!currentPalette.value.colors) return ''
      return currentPalette.value.colors
        .map((color, index) => `$color-${index + 1}: ${color.hex};`)
        .join('\n')
    })

    const tailwindConfig = computed(() => {
      if (!currentPalette.value.colors) return ''
      const colors = currentPalette.value.colors
        .map((color, index) => `      '${index + 1}': '${color.hex}'`)
        .join(',\n')

      return `module.exports = {
  theme: {
    extend: {
      colors: {
${colors}
      }
    }
  }
}`
    })

    const jsonExport = computed(() => {
      return JSON.stringify({
        palette: currentPalette.value.colors.map(c => ({ hex: c.hex, rgb: c.rgb })),
        exportedAt: new Date().toISOString(),
        format: 'color-palette'
      }, null, 2)
    })

    const shareLink = computed(() => {
      if (!currentPalette.value.colors) return ''
      const colorsParam = currentPalette.value.colors
        .map(c => c.hex.replace('#', ''))
        .join(',')
      return `${window.location.origin}/?colors=${colorsParam}`
    })

    const copyToClipboard = async (text, format) => {
      try {
        await navigator.clipboard.writeText(text)
        notification.value = $t('copiedFormat').replace('{format}', format)
        setTimeout(() => notification.value = '', 2000)
      } catch (err) {
        console.error('Failed to copy: ', err)
      }
    }

    const loadCurrentPalette = () => {
      try {
        const saved = localStorage.getItem('colorPalette')
        if (saved) {
          currentPalette.value = JSON.parse(saved)
        }
      } catch (error) {
        console.error('Error loading palette from localStorage:', error)
        currentPalette.value = { colors: [] }
      }
    }

    onMounted(() => {
      loadCurrentPalette()
    })

    return {
      currentPalette,
      notification,
      cssVariables,
      scssVariables,
      tailwindConfig,
      jsonExport,
      shareLink,
      copyToClipboard,
      $t
    }
  }
}
</script>

<style scoped>
.nav {
  display: flex;
  justify-content: center;
  gap: 2rem;
  padding: 1rem;
  background: #ffffff;
  border-bottom: 1px solid #e2e8f0;
}

.nav-link {
  padding: 0.5rem 1rem;
  text-decoration: none;
  color: #64748b;
  font-weight: 500;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.nav-link:hover {
  background: #f8fafc;
  color: #0f172a;
}

.nav-link.active {
  background: #0f172a;
  color: #ffffff;
}

.app-header {
  padding: 4rem 2rem 3rem;
  text-align: center;
  background: #ffffff;
  border-bottom: 1px solid #e2e8f0;
}

.app-header h1 {
  font-size: 3rem;
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 0.5rem;
  letter-spacing: -0.025em;
}

.app-header p {
  font-size: 1.125rem;
  color: #64748b;
  font-weight: 400;
}

.main-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 3rem 2rem;
}

.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  color: #64748b;
}

.empty-state h3 {
  font-size: 1.5rem;
  margin-bottom: 0.5rem;
  color: #374151;
}

.create-link {
  display: inline-block;
  margin-top: 1rem;
  padding: 0.75rem 1.5rem;
  background: #0f172a;
  color: #ffffff;
  text-decoration: none;
  border-radius: 8px;
  font-weight: 500;
  transition: background 0.2s ease;
}

.create-link:hover {
  background: #1e293b;
}

.export-content {
  display: grid;
  gap: 2rem;
}

.current-palette {
  background: #ffffff;
  padding: 2rem;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.current-palette h3 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #0f172a;
  margin-bottom: 1rem;
}

.palette-preview {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.color-preview {
  flex: 1;
  min-width: 80px;
  height: 60px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  cursor: pointer;
  transition: transform 0.2s ease;
}

.color-preview:hover {
  transform: scale(1.05);
}

.color-code {
  font-size: 0.75rem;
  font-weight: 500;
  color: #ffffff;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
  font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
}

.export-formats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 2rem;
}

.format-group {
  background: #ffffff;
  padding: 1.5rem;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.format-group h3 {
  font-size: 1.125rem;
  font-weight: 600;
  color: #0f172a;
  margin-bottom: 1rem;
}

.code-block {
  width: 100%;
  min-height: 120px;
  padding: 1rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  background: #f8fafc;
  font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
  font-size: 0.875rem;
  line-height: 1.5;
  resize: vertical;
  cursor: pointer;
  transition: border-color 0.2s ease;
}

.code-block:focus {
  outline: none;
  border-color: #0f172a;
}

.share-input {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  background: #f8fafc;
  font-size: 0.875rem;
  cursor: pointer;
  transition: border-color 0.2s ease;
}

.share-input:focus {
  outline: none;
  border-color: #0f172a;
}

.copy-btn {
  width: 100%;
  margin-top: 1rem;
  padding: 0.75rem 1rem;
  background: #10b981;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: background 0.2s ease;
}

.copy-btn:hover {
  background: #059669;
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

  .export-formats {
    grid-template-columns: 1fr;
  }

  .nav {
    flex-wrap: wrap;
    gap: 1rem;
  }
}
</style>
