<template>
  <div id="app">
    <header class="app-header">
      <h1>{{ $t('title') }}</h1>
      <p>{{ $t('subtitle') }}</p>
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
      <div class="controls">
        <button @click="generatePalette" :disabled="paletteType !== 'random'" class="generate-btn">
          {{ $t('generateRandomPalette') }}
        </button>

        <div class="settings">
          <label>
            {{ $t('colors') }}:
            <select v-model="colorCount" @change="generatePalette">
              <option :value="3">3</option>
              <option :value="5">5</option>
              <option :value="7">7</option>
            </select>
          </label>

          <label>
            {{ $t('format') }}:
            <select v-model="format">
              <option value="hex">HEX</option>
              <option value="rgb">RGB</option>
            </select>
          </label>
        </div>
      </div>

      <div class="advanced-controls">
       <div class="control-group">
         <label>{{ $t('baseColor') }}:</label>
         <input type="color" v-model="baseColor" @change="generateFromBase" :disabled="paletteType === 'random'">
       </div>

       <div class="control-group">
         <label>{{ $t('paletteType') }}:</label>
         <select v-model="paletteType" @change="generateFromBase">
           <option value="random">{{ $t('random') }}</option>
           <option value="analogous">{{ $t('analogous') }}</option>
           <option value="monochromatic">{{ $t('monochromatic') }}</option>
           <option value="triadic">{{ $t('triadic') }}</option>
           <option value="complementary">{{ $t('complementary') }}</option>
           <option value="calm">{{ $t('calm') }}</option>
           <option value="energetic">{{ $t('energetic') }}</option>
           <option value="professional">{{ $t('professional') }}</option>
         </select>
       </div>
     </div>

      <div class="palette">
        <div
          v-for="(color, index) in colors"
          :key="index"
          class="color-card"
          :style="{ backgroundColor: color.hex }"
          @click="copyToClipboard(format === 'hex' ? color.hex : color.rgb)"
        >
          <div class="color-info">
            <div class="color-details">
              <div class="color-value">{{ format === 'hex' ? color.hex : color.rgb }}</div>
              <div class="color-name" v-if="colorInfo[color.hex] && (apiStatus === 'loaded' || apiStatus === 'loading')">
                {{ colorInfo[color.hex]?.name || 'Loading...' }}
              </div>
            </div>
            <button
              @click.stop="toggleLock(index)"
              class="lock-btn"
              :class="{ locked: color.locked }"
            >
              {{ color.locked ? '🔒' : '🔓' }}
            </button>
          </div>
        </div>
      </div>

      <!-- API Status Indicator -->
      <div class="api-status" v-if="apiStatus !== 'checking'">
        <span class="status-indicator" :class="{ online: isOnline, offline: !isOnline }">
          {{ isOnline ? '🌐 ' + $t('apiOnline') : '📱 ' + $t('offlineMode') }}
        </span>
      </div>

      <!-- Color Wheel Representation -->
      <div class="color-wheel-preview" v-if="colors.length > 1">
        <div class="color-wheel" :style="{ background: `conic-gradient(${getColorWheelGradient(colors)})` }">
          <div
            v-for="(color, index) in colors"
            :key="`indicator-${index}`"
            class="color-wheel-indicator"
            :style="{ transform: `rotate(${getHueAngle(color.hex)}deg) translateY(-30px)` }"
          ></div>
        </div>
      </div>

      <div class="accessibility-info" v-if="colors.length > 1">
        <h3>{{ $t('accessibilityCheck') }}</h3>
        <div class="contrast-pairs">
          <div
            v-for="(pair, index) in contrastPairs"
            :key="index"
            class="contrast-pair"
          >
            <div class="color-samples">
              <div class="color-sample" :style="{ backgroundColor: pair.color1 }"></div>
              <div class="color-sample" :style="{ backgroundColor: pair.color2 }"></div>
            </div>
            <div class="contrast-info">
              <span class="ratio">Ratio: {{ pair.ratio.toFixed(2) }}</span>
              <span class="level" :class="pair.level">{{ pair.level }}</span>
            </div>
          </div>
        </div>
      </div>

      <div v-if="notification" class="notification">
        {{ notification }}
      </div>

      <div class="preview-section">
        <h3>{{ $t('preview') }}</h3>
        <div class="theme-toggle">
          <button @click="theme = theme === 'light' ? 'dark' : 'light'">
            {{ theme === 'light' ? '🌙 ' + $t('dark') : '☀️ ' + $t('light') }}
          </button>
        </div>
        <div class="mockup" :class="theme">
          <div class="mockup-header" :style="{ backgroundColor: colors[0]?.hex }"></div>
          <div class="mockup-content">
            <div class="mockup-button" :style="{ backgroundColor: colors[1]?.hex }">{{ $t('button') }}</div>
            <div class="mockup-text" :style="{ color: colors[2]?.hex }">{{ $t('sampleText') }}</div>
          </div>
        </div>
      </div>

      <div class="save-palette">
        <input
          v-model="paletteName"
          :placeholder="$t('paletteName')"
          class="palette-name-input"
        >
        <button @click="savePalette" class="save-btn" :disabled="!paletteName.trim()">
          {{ $t('savePalette') }}
        </button>
      </div>
    </main>

   </div>
 </template>

<script>
import { ref, computed, watch, onMounted } from 'vue'
import { useTranslations } from '../composables/useTranslations'
import { useColorAPI } from '../composables/useColorAPI'

export default {
  name: 'Home',
  setup() {
    const { $t } = useTranslations()
    const { getColorInfo, generateColorScheme, init: initColorAPI, isOnline } = useColorAPI()

    const colors = ref([])
    const colorCount = ref(5)
    const format = ref('hex')
    const theme = ref('light')
    const notification = ref('')
    const baseColor = ref('#3b82f6')
    const paletteType = ref('random')
    const paletteName = ref('')
    const paletteTag = ref('') // Keep for compatibility but not used in UI

    // Новые переменные для API интеграции
    const colorInfo = ref({})
    const apiStatus = ref('checking')

    const colorWheelGradient = computed(() => {
      const colors = []
      for (let i = 0; i < 360; i += 10) {
        colors.push(`hsl(${i}, 100%, 50%)`)
      }
      return colors.join(', ')
    })

    const hueAngle = computed(() => {
      const rgb = hexToRgb(baseColor.value)
      if (!rgb) return 0
      const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b)
      return hsl.h
    })

    const generateRandomColor = () => {
      const r = Math.floor(Math.random() * 256)
      const g = Math.floor(Math.random() * 256)
      const b = Math.floor(Math.random() * 256)
      const hex = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
      const rgb = `rgb(${r}, ${g}, ${b})`
      return { hex, rgb, locked: false }
    }

    const hexToRgb = (hex) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
      return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      } : null
    }

    const rgbToHex = (r, g, b) => {
      return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)
    }

    const hslToRgb = (h, s, l) => {
      h /= 360
      s /= 100
      l /= 100
      const hue2rgb = (p, q, t) => {
        if (t < 0) t += 1
        if (t > 1) t -= 1
        if (t < 1/6) return p + (q - p) * 6 * t
        if (t < 1/2) return q
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6
        return p
      }
      let r, g, b
      if (s === 0) {
        r = g = b = l
      } else {
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s
        const p = 2 * l - q
        r = hue2rgb(p, q, h + 1/3)
        g = hue2rgb(p, q, h)
        b = hue2rgb(p, q, h - 1/3)
      }
      return {
        r: Math.round(r * 255),
        g: Math.round(g * 255),
        b: Math.round(b * 255)
      }
    }

    const rgbToHsl = (r, g, b) => {
      r /= 255
      g /= 255
      b /= 255
      const max = Math.max(r, g, b)
      const min = Math.min(r, g, b)
      let h, s, l = (max + min) / 2

      if (max === min) {
        h = s = 0
      } else {
        const d = max - min
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
        switch (max) {
          case r: h = (g - b) / d + (g < b ? 6 : 0); break
          case g: h = (b - r) / d + 2; break
          case b: h = (r - g) / d + 4; break
        }
        h /= 6
      }
      return { h: h * 360, s: s * 100, l: l * 100 }
    }

    const generateFromBase = () => {
      if (paletteType.value === 'random') {
        generatePaletteWithAPI()
        return
      }

      // Handle mood palettes
      if (['calm', 'energetic', 'professional'].includes(paletteType.value)) {
        generateMoodPalette(paletteType.value)
        return
      }

      const baseRgb = hexToRgb(baseColor.value)
      if (!baseRgb) return

      const baseHsl = rgbToHsl(baseRgb.r, baseRgb.g, baseRgb.b)
      const newColors = []

      switch (paletteType.value) {
        case 'analogous':
          for (let i = 0; i < colorCount.value; i++) {
            if (colors.value[i]?.locked) {
              newColors.push(colors.value[i])
            } else {
              const hue = (baseHsl.h + (i - 2) * 30 + 360) % 360
              const rgb = hslToRgb(hue, baseHsl.s, baseHsl.l)
              const hex = rgbToHex(rgb.r, rgb.g, rgb.b)
              newColors.push({ hex, rgb: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`, locked: false })
            }
          }
          break

        case 'monochromatic':
          for (let i = 0; i < colorCount.value; i++) {
            if (colors.value[i]?.locked) {
              newColors.push(colors.value[i])
            } else {
              const lightness = Math.max(10, Math.min(90, baseHsl.l + (i - 2) * 15))
              const rgb = hslToRgb(baseHsl.h, baseHsl.s, lightness)
              const hex = rgbToHex(rgb.r, rgb.g, rgb.b)
              newColors.push({ hex, rgb: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`, locked: false })
            }
          }
          break

        case 'triadic':
          const hues = [baseHsl.h, (baseHsl.h + 120) % 360, (baseHsl.h + 240) % 360]
          for (let i = 0; i < colorCount.value; i++) {
            if (colors.value[i]?.locked) {
              newColors.push(colors.value[i])
            } else {
              const hue = hues[i % hues.length]
              const rgb = hslToRgb(hue, baseHsl.s, baseHsl.l)
              const hex = rgbToHex(rgb.r, rgb.g, rgb.b)
              newColors.push({ hex, rgb: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`, locked: false })
            }
          }
          break

        case 'complementary':
          const compHue = (baseHsl.h + 180) % 360
          for (let i = 0; i < colorCount.value; i++) {
            if (colors.value[i]?.locked) {
              newColors.push(colors.value[i])
            } else {
              const hue = i % 2 === 0 ? baseHsl.h : compHue
              const rgb = hslToRgb(hue, baseHsl.s, baseHsl.l)
              const hex = rgbToHex(rgb.r, rgb.g, rgb.b)
              newColors.push({ hex, rgb: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`, locked: false })
            }
          }
          break
      }

      colors.value = newColors
      saveToLocalStorage()
    }

    const generateMoodPalette = (mood) => {
      const baseRgb = hexToRgb(baseColor.value)
      if (!baseRgb) return

      const baseHsl = rgbToHsl(baseRgb.r, baseRgb.g, baseRgb.b)
      const newColors = []

      switch (mood) {
        case 'calm':
          // Calm: based on base color, reduce saturation, adjust hue towards cool tones, vary lightness
          for (let i = 0; i < colorCount.value; i++) {
            if (colors.value[i]?.locked) {
              newColors.push(colors.value[i])
            } else {
              let hue = baseHsl.h
              // Shift towards cool tones if base is warm
              if (hue < 180) hue = (hue + 180) % 360 // Make it cooler
              hue = (hue + (i * 30) - 45) % 360 // Small variations
              const saturation = Math.max(15, baseHsl.s * 0.4) // Low saturation
              const lightness = Math.max(30, Math.min(70, baseHsl.l + (i - 1) * 15)) // Medium lightness
              const rgb = hslToRgb(hue, saturation, lightness)
              const hex = rgbToHex(rgb.r, rgb.g, rgb.b)
              newColors.push({ hex, rgb: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`, locked: false })
            }
          }
          break

        case 'energetic':
          // Energetic: based on base color, increase saturation, adjust hue towards warm tones, bright lightness
          for (let i = 0; i < colorCount.value; i++) {
            if (colors.value[i]?.locked) {
              newColors.push(colors.value[i])
            } else {
              let hue = baseHsl.h
              // Shift towards warm tones if base is cool
              if (hue > 180) hue = (hue - 180 + 360) % 360 // Make it warmer
              hue = (hue + (i * 40) - 60) % 360 // Variations
              const saturation = Math.min(100, baseHsl.s + 30) // High saturation
              const lightness = Math.max(50, Math.min(90, baseHsl.l + (i - 1) * 20)) // Bright lightness
              const rgb = hslToRgb(hue, saturation, lightness)
              const hex = rgbToHex(rgb.r, rgb.g, rgb.b)
              newColors.push({ hex, rgb: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`, locked: false })
            }
          }
          break

        case 'professional':
          // Professional: based on base color, desaturate, use neutral variations
          for (let i = 0; i < colorCount.value; i++) {
            if (colors.value[i]?.locked) {
              newColors.push(colors.value[i])
            } else {
              let hue = baseHsl.h
              // Shift towards blue/neutral
              if (hue > 240 || hue < 60) hue = 210 // Prefer blue for professional
              hue = (hue + (i * 10) - 20) % 360 // Small variations
              const saturation = Math.max(5, baseHsl.s * 0.2) // Very low saturation
              const lightness = 15 + (i * 25) // Gradual from dark to light
              const rgb = hslToRgb(hue, saturation, lightness)
              const hex = rgbToHex(rgb.r, rgb.g, rgb.b)
              newColors.push({ hex, rgb: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`, locked: false })
            }
          }
          break
      }

      colors.value = newColors
      saveToLocalStorage()
    }

    const generatePalette = () => {
      const newColors = []
      for (let i = 0; i < colorCount.value; i++) {
        if (colors.value[i]?.locked) {
          newColors.push(colors.value[i])
        } else {
          newColors.push(generateRandomColor())
        }
      }
      colors.value = newColors
      saveToLocalStorage()
    }

    const toggleLock = (index) => {
      colors.value[index].locked = !colors.value[index].locked
      saveToLocalStorage()
    }

    const copyToClipboard = async (color) => {
      try {
        await navigator.clipboard.writeText(color)
        notification.value = $t('copiedToClipboard').replace('!', '') + ` ${color}!`
        setTimeout(() => notification.value = '', 2000)
      } catch (err) {
        console.error('Failed to copy: ', err)
      }
    }

    // Загрузка информации о цветах из API
    const loadColorInfo = async () => {
      if (!isOnline.value) {
        apiStatus.value = 'offline'
        return
      }

      apiStatus.value = 'loading'
      const info = {}

      // Загружаем информацию для всех цветов параллельно
      const promises = colors.value.map(async (color) => {
        try {
          const colorData = await getColorInfo(color.hex)
          if (colorData) {
            info[color.hex] = colorData
          }
        } catch (error) {
          console.warn(`Failed to load info for ${color.hex}:`, error.message)
          // Добавляем fallback информацию
          info[color.hex] = {
            hex: color.hex,
            rgb: color.rgb,
            name: 'Loading...',
            hsl: '',
            cmyk: null
          }
        }
      })

      // Ждем завершения всех запросов
      await Promise.allSettled(promises)

      colorInfo.value = info
      apiStatus.value = 'loaded'
    }

    // Улучшенная генерация палитры с использованием API
    const generatePaletteWithAPI = async () => {
      if (isOnline.value && paletteType.value !== 'random') {
        try {
          const scheme = await generateColorScheme(baseColor.value, paletteType.value)
          if (scheme && scheme.length > 0) {
            const newColors = scheme.map(color => ({
              hex: color.hex,
              rgb: color.rgb,
              locked: false
            }))
            colors.value = newColors
            saveToLocalStorage()
            return // loadColorInfo будет вызван через watcher
          }
        } catch (error) {
          console.warn('API palette generation failed, using local method:', error.message)
        }
      }

      // Fallback к локальной генерации
      generatePalette()
    }

    const calculateContrastRatio = (color1, color2) => {
      const rgb1 = hexToRgb(color1)
      const rgb2 = hexToRgb(color2)

      const lum1 = getLuminance(rgb1.r, rgb1.g, rgb1.b)
      const lum2 = getLuminance(rgb2.r, rgb2.g, rgb2.b)

      const brightest = Math.max(lum1, lum2)
      const darkest = Math.min(lum1, lum2)

      return (brightest + 0.05) / (darkest + 0.05)
    }

    const getLuminance = (r, g, b) => {
      const [rs, gs, bs] = [r, g, b].map(c => {
        c = c / 255
        return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
      })
      return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs
    }

    const getWCAGLevel = (ratio) => {
      if (ratio >= 7) return 'AAA'
      if (ratio >= 4.5) return 'AA'
      if (ratio >= 3) return 'AA Large'
      return 'Fail'
    }

    const contrastPairs = computed(() => {
      if (colors.value.length < 2) return []

      const pairs = []
      for (let i = 0; i < colors.value.length - 1; i++) {
        for (let j = i + 1; j < colors.value.length; j++) {
          const ratio = calculateContrastRatio(colors.value[i].hex, colors.value[j].hex)
          pairs.push({
            color1: colors.value[i].hex,
            color2: colors.value[j].hex,
            ratio,
            level: getWCAGLevel(ratio)
          })
        }
      }
      return pairs.slice(0, 6) // Show only first 6 pairs
    })

    const savePalette = () => {
      if (!paletteName.value.trim()) return

      const savedPalettes = JSON.parse(localStorage.getItem('savedPalettes') || '[]')
      const palette = {
        id: Date.now(),
        name: paletteName.value.trim(),
        colors: colors.value.map(c => ({ hex: c.hex, rgb: c.rgb })),
        createdAt: new Date().toISOString(),
        tags: paletteTag.value.trim() ? [paletteTag.value.trim()] : []
      }

      savedPalettes.push(palette)
      localStorage.setItem('savedPalettes', JSON.stringify(savedPalettes))

      paletteName.value = ''
      paletteTag.value = ''
      notification.value = $t('paletteSaved')
      setTimeout(() => notification.value = '', 2000)
    }

    const saveToLocalStorage = () => {
      localStorage.setItem('colorPalette', JSON.stringify({
        colors: colors.value,
        colorCount: colorCount.value,
        format: format.value,
        baseColor: baseColor.value,
        paletteType: paletteType.value
      }))
    }

    const loadFromLocalStorage = () => {
      const saved = localStorage.getItem('colorPalette')
      if (saved) {
        const data = JSON.parse(saved)
        colors.value = data.colors || []
        colorCount.value = data.colorCount || 5
        format.value = data.format || 'hex'
        baseColor.value = data.baseColor || '#3b82f6'
        paletteType.value = data.paletteType || 'random'
      }
    }

    watch([baseColor, paletteType], () => {
      if (paletteType.value !== 'random') {
        generateFromBase()
      }
    })

    // Watcher для загрузки информации о цветах при изменении палитры
    watch(colors, async (newColors) => {
      if (newColors && newColors.length > 0) {
        await loadColorInfo()
      }
    }, { deep: true })

    const getHueAngle = (hex) => {
      const rgb = hexToRgb(hex)
      if (!rgb) return 0
      const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b)
      return hsl.h
    }

    const getColorWheelGradient = (colors) => {
      return colors.map(c => c.hex).join(', ')
    }

    onMounted(async () => {
      loadFromLocalStorage()
      if (colors.value.length === 0) {
        generatePaletteWithAPI()
      }

      // Инициализация API
      await initColorAPI()
      if (colors.value.length > 0) {
        loadColorInfo()
      }
    })

    return {
      colors,
      colorCount,
      format,
      theme,
      notification,
      baseColor,
      paletteType,
      paletteName,
      contrastPairs,
      colorWheelGradient,
      colorInfo,
      apiStatus,
      isOnline,
      generatePalette,
      generateFromBase,
      generatePaletteWithAPI,
      toggleLock,
      copyToClipboard,
      savePalette,
      loadColorInfo,
      getHueAngle,
      getColorWheelGradient,
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

.advanced-controls {
  display: flex;
  gap: 2rem;
  margin-bottom: 2rem;
  padding: 2rem;
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

.control-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.control-group label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
}

.control-group input[type="color"] {
  width: 60px;
  height: 40px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  cursor: pointer;
}

.control-group input[type="color"]:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  filter: grayscale(50%);
}

.control-group select {
  padding: 0.5rem 1rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  background: #ffffff;
  font-size: 0.875rem;
  color: #374151;
  cursor: pointer;
}

.accessibility-info {
  margin-bottom: 2rem;
  padding: 2rem;
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

.accessibility-info h3 {
  margin-bottom: 1rem;
  font-size: 1.25rem;
  font-weight: 600;
  color: #0f172a;
}

.contrast-pairs {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
}

.contrast-pair {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem;
  background: #f8fafc;
  border-radius: 8px;
}

.color-samples {
  display: flex;
  gap: 0.5rem;
}

.color-sample {
  width: 30px;
  height: 30px;
  border-radius: 4px;
  border: 1px solid #e2e8f0;
}

.contrast-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.ratio {
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
}

.level {
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  text-align: center;
}

.level.AAA {
  background: #10b981;
  color: white;
}

.level.AA {
  background: #3b82f6;
  color: white;
}

.level.AA-Large {
  background: #f59e0b;
  color: white;
}

.level.Fail {
  background: #ef4444;
  color: white;
}

.save-palette {
  display: flex;
  gap: 1rem;
  align-items: center;
  padding: 1.5rem;
  background: #ffffff;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
}

.palette-name-input {
  flex: 1;
  padding: 0.75rem 1rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 0.875rem;
}

.palette-name-input:focus {
  outline: none;
  border-color: #0f172a;
  box-shadow: 0 0 0 3px rgba(15, 23, 42, 0.1);
}

.save-btn {
  padding: 0.75rem 1.5rem;
  background: #10b981;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: background 0.2s ease;
}

.save-btn:hover:not(:disabled) {
  background: #059669;
}

.save-btn:disabled {
  background: #d1d5db;
  cursor: not-allowed;
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

.controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

.generate-btn {
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 600;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 6px -1px rgba(102, 126, 234, 0.25);
}

.generate-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px -5px rgba(102, 126, 234, 0.4);
}

.generate-btn:disabled {
  background: linear-gradient(135deg, #d1d5db 0%, #9ca3af 100%);
  color: #6b7280;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.settings {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.settings label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
}

.settings select {
  padding: 0.5rem 1rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  background: #ffffff;
  font-size: 0.875rem;
  color: #374151;
  cursor: pointer;
  transition: border-color 0.2s ease;
}

.settings select:focus {
  outline: none;
  border-color: #0f172a;
  box-shadow: 0 0 0 3px rgba(15, 23, 42, 0.1);
}

.palette {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 2rem;
  justify-content: center;
  max-width: 100%;
  padding: 0 1rem;
}

.color-wheel-preview {
  margin: 2rem auto;
  display: flex;
  justify-content: center;
}

.color-wheel {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  position: relative;
  border: 2px solid #e2e8f0;
}

.color-wheel-indicator {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 12px;
  height: 12px;
  background: #ffffff;
  border-radius: 50%;
  transform: translate(-50%, -50%) rotate(var(--angle)) translateY(-150px);
  box-shadow: 0 0 6px rgba(0, 0, 0, 0.3);
}

.color-card {
  flex: 1;
  min-width: 150px;
  max-width: 250px;
  min-height: 180px;
  border-radius: 16px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  border: 3px solid transparent;
  background: linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%);
}

.color-card:hover {
  transform: translateY(-8px) scale(1.02);
  box-shadow: 0 8px 25px -5px rgba(0, 0, 0, 0.15), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
}

.color-info {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.color-details {
  flex: 1;
  min-width: 0;
}

.color-value {
  font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
  font-size: 0.875rem;
  font-weight: 600;
  letter-spacing: 0.025em;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.lock-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.2rem;
  opacity: 0.8;
  transition: opacity 0.2s;
}

.lock-btn:hover {
  opacity: 1;
}

.preview-section {
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  padding: 2rem;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  margin-bottom: 2rem;
}

.preview-section h3 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #0f172a;
  margin-bottom: 1rem;
}

.theme-toggle {
  margin-bottom: 1rem;
}

.theme-toggle button {
  padding: 0.5rem 1rem;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.875rem;
  transition: background 0.2s ease;
}

.theme-toggle button:hover {
  background: #e2e8f0;
}

.mockup {
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  overflow: hidden;
  background: white;
  max-width: 300px;
  margin: 0 auto;
}

.mockup.dark {
  background: #1a1a1a;
  color: white;
}

.mockup-header {
  height: 50px;
  border-bottom: 1px solid #e2e8f0;
}

.mockup-content {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.mockup-button {
  display: inline-block;
  padding: 0.75rem 1.5rem;
  color: white;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  border: none;
  cursor: pointer;
  transition: transform 0.2s ease;
}

.mockup-button:hover {
  transform: translateY(-1px);
}

.mockup-text {
  font-size: 1.125rem;
  font-weight: 600;
  padding: 0.5rem 0;
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
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 700;
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.language-toggle-btn:hover {
  transform: translateY(-3px) scale(1.05);
  box-shadow: 0 12px 35px rgba(102, 126, 234, 0.4);
  background: linear-gradient(135deg, #764ba2 0%, #667eea 100%);
}

.language-toggle-btn:active {
  transform: translateY(-1px) scale(0.98);
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
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

  .controls {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }

  .settings {
    justify-content: center;
  }

  .palette {
    gap: 0.5rem;
  }

  .color-card {
    min-width: 120px;
    max-width: 200px;
    height: 140px;
  }

  .advanced-controls {
    flex-direction: column;
    gap: 1rem;
  }

  .contrast-pairs {
    grid-template-columns: 1fr;
  }

  .language-toggle-btn {
    bottom: 1rem;
    right: 1rem;
    width: 55px;
    height: 55px;
    font-size: 0.75rem;
  }
}

/* API Integration Styles */
.color-name {
  font-size: 0.65rem;
  font-weight: 500;
  opacity: 0.9;
  margin-top: 0.25rem;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
  max-width: 100%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.1;
}

.api-status {
  display: flex;
  justify-content: center;
  margin: 1rem 0;
}

.status-indicator {
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.status-indicator.online {
  background: rgba(16, 185, 129, 0.1);
  color: #10b981;
  border: 1px solid rgba(16, 185, 129, 0.2);
}

.status-indicator.offline {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
  border: 1px solid rgba(239, 68, 68, 0.2);
}

/* Enhanced color card for API info */
.color-card:hover .color-name {
  opacity: 1;
}
</style>