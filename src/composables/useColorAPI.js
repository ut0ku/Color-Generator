import { ref } from 'vue'

const API_BASE_URL = 'https://www.thecolorapi.com'
const isOnline = ref(true)

export function useColorAPI() {
  // Проверка доступности API
  const checkAPIStatus = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/id?hex=FF0000`, {
        method: 'GET',
        timeout: 5000
      })
      isOnline.value = response.ok
      return response.ok
    } catch (error) {
      isOnline.value = false
      console.warn('Color API unavailable, using local functions:', error.message)
      return false
    }
  }

  // Получение полной информации о цвете
  const getColorInfo = async (hexColor) => {
    if (!isOnline.value) return null

    try {
      const cleanHex = hexColor.replace('#', '')
      const response = await fetch(`${API_BASE_URL}/id?hex=${cleanHex}`, {
        timeout: 3000 // 3 second timeout
      })

      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`)
      }

      const data = await response.json()

      // Ensure we have valid data
      if (!data || !data.hex || !data.name) {
        throw new Error('Invalid API response data')
      }

      return {
        hex: data.hex.value,
        rgb: `rgb(${data.rgb.r}, ${data.rgb.g}, ${data.rgb.b})`,
        hsl: `hsl(${Math.round(data.hsl.h)}, ${Math.round(data.hsl.s)}%, ${Math.round(data.hsl.l)}%)`,
        name: data.name.value || 'Unknown Color',
        cmyk: data.cmyk ? `cmyk(${Math.round(data.cmyk.c)}, ${Math.round(data.cmyk.m)}, ${Math.round(data.cmyk.y)}, ${Math.round(data.cmyk.k)})` : null
      }
    } catch (error) {
      console.warn(`Failed to get color info for ${hexColor}:`, error.message)
      return null
    }
  }

  // Генерация цветовой схемы
  const generateColorScheme = async (baseColor, scheme = 'analogous') => {
    if (!isOnline.value) return null

    try {
      const cleanHex = baseColor.replace('#', '')
      const response = await fetch(`${API_BASE_URL}/scheme?hex=${cleanHex}&mode=${scheme}&count=5`)
      if (!response.ok) throw new Error('API request failed')

      const data = await response.json()
      return data.colors.map(color => ({
        hex: color.hex.value,
        rgb: `rgb(${color.rgb.r}, ${color.rgb.g}, ${color.rgb.b})`,
        name: color.name.value
      }))
    } catch (error) {
      console.warn('Failed to generate color scheme from API:', error.message)
      return null
    }
  }

  // Конвертация цвета с использованием API
  const convertColor = async (color, from = 'hex', to = 'rgb') => {
    if (!isOnline.value) return null

    try {
      let apiUrl = ''

      if (from === 'hex' && to === 'rgb') {
        const cleanHex = color.replace('#', '')
        apiUrl = `${API_BASE_URL}/id?hex=${cleanHex}`
      } else if (from === 'rgb' && to === 'hex') {
        // Парсим rgb(r, g, b)
        const rgbMatch = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/)
        if (rgbMatch) {
          apiUrl = `${API_BASE_URL}/id?rgb=${rgbMatch[1]},${rgbMatch[2]},${rgbMatch[3]}`
        }
      }

      if (!apiUrl) return null

      const response = await fetch(apiUrl)
      if (!response.ok) throw new Error('API request failed')

      const data = await response.json()

      if (to === 'rgb') {
        return `rgb(${data.rgb.r}, ${data.rgb.g}, ${data.rgb.b})`
      } else if (to === 'hex') {
        return data.hex.value
      }

      return null
    } catch (error) {
      console.warn('Failed to convert color via API:', error.message)
      return null
    }
  }

  // Инициализация - проверка доступности API
  const init = async () => {
    await checkAPIStatus()
  }

  return {
    isOnline,
    getColorInfo,
    generateColorScheme,
    convertColor,
    checkAPIStatus,
    init
  }
}