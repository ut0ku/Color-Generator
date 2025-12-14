<template>
  <div>
    <header class="app-header">
      <h1>{{ $t('libraryTitle') }}</h1>
      <p>{{ $t('librarySubtitle') }}</p>
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
      <div class="search-section">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search palettes..."
          class="search-input"
        >
        <select v-model="sortBy" class="sort-select">
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="name">By name</option>
        </select>
      </div>

      <div v-if="filteredPalettes.length === 0" class="empty-state">
        <h3>{{ $t('noPalettesFound') }}</h3>
        <p>{{ searchQuery ? $t('tryDifferentSearch') : $t('createFirstPalette') }}</p>
        <router-link to="/" class="create-link">{{ $t('createPalette') }}</router-link>
      </div>

      <div v-else class="palettes-grid">
        <div
          v-for="palette in filteredPalettes"
          :key="palette.id"
          class="palette-card"
        >
          <div class="palette-colors">
            <div
              v-for="(color, index) in palette.colors"
              :key="index"
              class="palette-color"
              :style="{ backgroundColor: color.hex }"
              @click="copyToClipboard(color.hex)"
            ></div>
          </div>

          <!-- Color Wheel Representation -->
          <div class="color-wheel-preview" v-if="palette.colors.length > 1">
            <div class="color-wheel" :style="{ background: `conic-gradient(${getColorWheelGradient(palette.colors)})` }">
              <div
                v-for="(color, index) in palette.colors"
                :key="`indicator-${index}`"
                class="color-wheel-indicator"
                :style="{ '--angle': `${getHueAngle(color.hex)}deg` }"
              ></div>
            </div>
          </div>

          <div class="palette-info">
            <h3>{{ palette.name }}</h3>
            <p class="palette-date">{{ formatDate(palette.createdAt) }}</p>
            <div class="palette-tags" v-if="palette.tags && palette.tags.length">
              <span v-for="tag in palette.tags" :key="tag" class="tag">{{ tag }}</span>
            </div>
          </div>

          <div class="palette-actions">
            <button @click="loadPalette(palette)" class="load-btn">{{ $t('load') }}</button>
            <button @click="editPalette(palette)" class="edit-btn">{{ $t('edit') }}</button>
            <button @click="deletePalette(palette.id)" class="delete-btn">{{ $t('delete') }}</button>
          </div>
        </div>
      </div>

      <div v-if="editingPalette" class="edit-modal">
        <div class="modal-content">
          <h3>{{ $t('editPalette') }}</h3>
          <input
            v-model="editingPalette.name"
            type="text"
            :placeholder="$t('paletteNamePlaceholder')"
            class="edit-input"
          >
          <input
            v-model="tagInput"
            type="text"
            :placeholder="$t('addTag')"
            class="edit-input"
            @keyup.enter="addTag"
          >
          <div class="tags-list" v-if="editingPalette.tags && editingPalette.tags.length">
            <span
              v-for="tag in editingPalette.tags"
              :key="tag"
              class="tag removable"
              @click="removeTag(tag)"
            >
              {{ tag }} ×
            </span>
          </div>
          <div class="modal-actions">
            <button @click="saveEditedPalette" class="save-btn">{{ $t('save') }}</button>
            <button @click="cancelEdit" class="cancel-btn">{{ $t('cancel') }}</button>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useTranslations } from '../composables/useTranslations'

export default {
  name: 'Library',
  setup() {
    const router = useRouter()
    const { $t } = useTranslations()
    const palettes = ref([])
    const searchQuery = ref('')
    const sortBy = ref('newest')
    const editingPalette = ref(null)
    const tagInput = ref('')
    const notification = ref('')

    const filteredPalettes = computed(() => {
      let filtered = palettes.value.filter(palette =>
        palette.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
        (palette.tags && palette.tags.some(tag =>
          tag.toLowerCase().includes(searchQuery.value.toLowerCase())
        ))
      )

      switch (sortBy.value) {
        case 'newest':
          filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          break
        case 'oldest':
          filtered.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
          break
        case 'name':
          filtered.sort((a, b) => a.name.localeCompare(b.name))
          break
      }

      return filtered
    })

    const loadPalettes = () => {
      const saved = localStorage.getItem('savedPalettes')
      palettes.value = saved ? JSON.parse(saved) : []
    }

    const savePalettes = () => {
      localStorage.setItem('savedPalettes', JSON.stringify(palettes.value))
    }

    const copyToClipboard = async (color) => {
      try {
        await navigator.clipboard.writeText(color)
        notification.value = `Copied ${color} to clipboard!`
        setTimeout(() => notification.value = '', 2000)
      } catch (err) {
        console.error('Failed to copy: ', err)
      }
    }

    const loadPalette = (palette) => {
      // Save current palette to localStorage for the generator to load
      localStorage.setItem('colorPalette', JSON.stringify({
        colors: palette.colors.map(c => ({ ...c, locked: false })),
        colorCount: palette.colors.length,
        format: 'hex',
        baseColor: '#3b82f6',
        paletteType: 'random'
      }))

      router.push('/')
    }

    const editPalette = (palette) => {
      editingPalette.value = { ...palette, tags: palette.tags || [] }
      tagInput.value = ''
    }

    const cancelEdit = () => {
      editingPalette.value = null
      tagInput.value = ''
    }

    const saveEditedPalette = () => {
      if (!editingPalette.value.name.trim()) return

      const index = palettes.value.findIndex(p => p.id === editingPalette.value.id)
      if (index !== -1) {
        // Ensure tags array exists even if empty
        if (!editingPalette.value.tags) {
          editingPalette.value.tags = []
        }
        palettes.value[index] = editingPalette.value
        savePalettes()
      }

      cancelEdit()
    }

    const deletePalette = (id) => {
      if (confirm($t('confirmDelete'))) {
        palettes.value = palettes.value.filter(p => p.id !== id)
        savePalettes()
      }
    }

    const addTag = () => {
      if (!tagInput.value.trim()) return

      if (!editingPalette.value.tags) {
        editingPalette.value.tags = []
      }

      const tag = tagInput.value.trim()
      if (!editingPalette.value.tags.includes(tag)) {
        editingPalette.value.tags = [...editingPalette.value.tags, tag]
      }

      tagInput.value = ''
    }

    const removeTag = (tag) => {
      if (editingPalette.value.tags) {
        editingPalette.value.tags = editingPalette.value.tags.filter(t => t !== tag)
      }
    }

    const formatDate = (dateString) => {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    }

    const getHueAngle = (hex) => {
      const rgb = hexToRgb(hex)
      if (!rgb) return 0
      const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b)
      return hsl.h
    }

    const getColorWheelGradient = (colors) => {
      return colors.map(c => c.hex).join(', ')
    }

    const hexToRgb = (hex) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
      return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      } : null
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

    onMounted(() => {
      loadPalettes()
    })

    return {
      palettes,
      searchQuery,
      sortBy,
      editingPalette,
      tagInput,
      notification,
      filteredPalettes,
      copyToClipboard,
      loadPalette,
      editPalette,
      cancelEdit,
      saveEditedPalette,
      deletePalette,
      addTag,
      removeTag,
      formatDate,
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

.search-section {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  align-items: center;
}

.search-input {
  flex: 1;
  padding: 0.75rem 1rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 0.875rem;
  background: #ffffff;
}

.search-input:focus {
  outline: none;
  border-color: #0f172a;
  box-shadow: 0 0 0 3px rgba(15, 23, 42, 0.1);
}

.sort-select {
  padding: 0.75rem 1rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  background: #ffffff;
  font-size: 0.875rem;
  cursor: pointer;
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

.palettes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

.palette-card {
  background: #ffffff;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  overflow: hidden;
  transition: all 0.3s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.palette-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.palette-colors {
  display: flex;
  height: 80px;
}

.color-wheel-preview {
  margin-top: 1rem;
  display: flex;
  justify-content: center;
}

.color-wheel {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  position: relative;
  border: 2px solid #e2e8f0;
}

.color-wheel-indicator {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 4px;
  height: 4px;
  background: #ffffff;
  border-radius: 50%;
  transform: translate(-50%, -50%) rotate(var(--angle)) translateY(-25px);
  box-shadow: 0 0 4px rgba(0, 0, 0, 0.3);
}

.palette-color {
  flex: 1;
  height: 80px; /* Fixed height to match palette-colors container */
  cursor: pointer;
  transition: transform 0.2s ease;
}

.palette-color:hover {
  transform: scale(1.05);
}

.palette-info {
  padding: 1rem;
}

.palette-info h3 {
  font-size: 1.125rem;
  font-weight: 600;
  color: #0f172a;
  margin-bottom: 0.25rem;
}

.palette-date {
  font-size: 0.875rem;
  color: #64748b;
  margin-bottom: 0.5rem;
}

.palette-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.tag {
  padding: 0.25rem 0.5rem;
  background: #f1f5f9;
  color: #475569;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
}

.tag.removable {
  cursor: pointer;
  transition: background 0.2s ease;
}

.tag.removable:hover {
  background: #e2e8f0;
}

.palette-actions {
  padding: 1rem;
  padding-top: 0;
  display: flex;
  gap: 0.5rem;
}

.palette-actions button {
  flex: 1;
  padding: 0.5rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.2s ease;
}

.load-btn {
  background: #10b981;
  color: white;
}

.load-btn:hover {
  background: #059669;
}

.edit-btn {
  background: #3b82f6;
  color: white;
}

.edit-btn:hover {
  background: #2563eb;
}

.delete-btn {
  background: #ef4444;
  color: white;
}

.delete-btn:hover {
  background: #dc2626;
}

.edit-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: #ffffff;
  padding: 2rem;
  border-radius: 12px;
  width: 90%;
  max-width: 400px;
}

.modal-content h3 {
  margin-bottom: 1rem;
  font-size: 1.25rem;
  font-weight: 600;
  color: #0f172a;
}

.edit-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  margin-bottom: 1rem;
  font-size: 0.875rem;
}

.edit-input:focus {
  outline: none;
  border-color: #0f172a;
  box-shadow: 0 0 0 3px rgba(15, 23, 42, 0.1);
}

.tags-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.modal-actions {
  display: flex;
  gap: 1rem;
}

.modal-actions button {
  flex: 1;
  padding: 0.75rem;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: background 0.2s ease;
}

.save-btn {
  background: #10b981;
  color: white;
}

.save-btn:hover {
  background: #059669;
}

.cancel-btn {
  background: #6b7280;
  color: white;
}

.cancel-btn:hover {
  background: #4b5563;
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
</style>
