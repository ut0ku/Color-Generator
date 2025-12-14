import { ref } from 'vue'

const currentLanguage = ref(localStorage.getItem('language') || 'ru')

const translations = {
  ru: {
    // Navigation
    generator: 'Генератор',
    library: 'Библиотека',
    export: 'Экспорт',

    // Home page
    title: '🎨 Генератор цветов',
    subtitle: 'Генерируйте красивые цветовые палитры',
    generateRandomPalette: 'Генерировать случайную палитру',
    colors: 'Цвета',
    format: 'Формат',
    baseColor: 'Базовый цвет',
    paletteType: 'Тип палитры',
    random: 'Случайный',
    analogous: 'Аналогичный',
    monochromatic: 'Монохроматический',
    triadic: 'Триадный',
    complementary: 'Комплементарный',
    calm: 'Спокойный',
    energetic: 'Энергичный',
    professional: 'Профессиональный',
    accessibilityCheck: 'Проверка доступности',
    preview: 'Предварительный просмотр',
    dark: 'Темный',
    light: 'Светлый',
    button: 'Кнопка',
    sampleText: 'Пример текста',
    paletteName: 'Название палитры',
    savePalette: 'Сохранить палитру',
    copiedToClipboard: 'Скопировано в буфер обмена',
    paletteSaved: 'Палитра сохранена!',
    
    // Library page
    libraryTitle: '🎨 Библиотека цветов',
    librarySubtitle: 'Управляйте сохраненными цветовыми палитрами',
    searchPalettes: 'Поиск палитр...',
    newest: 'Сначала новые',
    oldest: 'Сначала старые',
    byName: 'По названию',
    noPalettesFound: 'Палитры не найдены',
    tryDifferentSearch: 'Попробуйте другой поисковый запрос',
    createFirstPalette: 'Создайте свою первую палитру в генераторе',
    createPalette: 'Создать палитру',
    load: 'Загрузить',
    edit: 'Редактировать',
    delete: 'Удалить',
    editPalette: 'Редактировать палитру',
    paletteNamePlaceholder: 'Название палитры',
    addTag: 'Добавить тег (нажмите Enter)',
    save: 'Сохранить',
    cancel: 'Отмена',
    confirmDelete: 'Вы уверены, что хотите удалить эту палитру?',
    
    // Export page
    exportTitle: '🎨 Экспорт палитры',
    exportSubtitle: 'Экспортируйте вашу цветовую палитру в различных форматах',
    noPaletteToExport: 'Нет палитры для экспорта',
    createPaletteFirst: 'Сначала создайте палитру в генераторе',
    currentPalette: 'Текущая палитра',
    cssVariables: 'CSS переменные',
    scssVariables: 'SCSS переменные',
    tailwindConfig: 'Tailwind конфиг',
    json: 'JSON',
    shareLink: 'Ссылка для поделиться',
    copyCssVariables: 'Копировать CSS переменные',
    copyScssVariables: 'Копировать SCSS переменные',
    copyTailwindConfig: 'Копировать Tailwind конфиг',
    copyJson: 'Копировать JSON',
    copyShareLink: 'Копировать ссылку для поделиться',
    copiedFormat: 'Скопировано {format} в буфер обмена!',
    copiedToClipboard: 'Скопировано в буфер обмена',
    apiOnline: 'API онлайн',
    offlineMode: 'Оффлайн режим'
  },
  en: {
    // Navigation
    generator: 'Generator',
    library: 'Library',
    export: 'Export',

    // Home page
    title: '🎨 Color Generator',
    subtitle: 'Generate beautiful color palettes',
    generateRandomPalette: 'Generate Random Palette',
    colors: 'Colors',
    format: 'Format',
    baseColor: 'Base Color',
    paletteType: 'Palette Type',
    random: 'Random',
    analogous: 'Analogous',
    monochromatic: 'Monochromatic',
    triadic: 'Triadic',
    complementary: 'Complementary',
    calm: 'Calm',
    energetic: 'Energetic',
    professional: 'Professional',
    accessibilityCheck: 'Accessibility Check',
    preview: 'Preview',
    dark: 'Dark',
    light: 'Light',
    button: 'Button',
    sampleText: 'Sample Text',
    paletteName: 'Palette name',
    savePalette: 'Save Palette',
    copiedToClipboard: 'Copied to clipboard',
    paletteSaved: 'Palette saved!',
    
    // Library page
    libraryTitle: '🎨 Color Library',
    librarySubtitle: 'Manage your saved color palettes',
    searchPalettes: 'Search palettes...',
    newest: 'Newest first',
    oldest: 'Oldest first',
    byName: 'By name',
    noPalettesFound: 'No palettes found',
    tryDifferentSearch: 'Try a different search term',
    createFirstPalette: 'Create your first palette in the generator',
    createPalette: 'Create Palette',
    load: 'Load',
    edit: 'Edit',
    delete: 'Delete',
    editPalette: 'Edit Palette',
    paletteNamePlaceholder: 'Palette name',
    addTag: 'Add tag (press Enter)',
    save: 'Save',
    cancel: 'Cancel',
    confirmDelete: 'Are you sure you want to delete this palette?',
    
    // Export page
    exportTitle: '🎨 Export Palette',
    exportSubtitle: 'Export your color palette in various formats',
    noPaletteToExport: 'No palette to export',
    createPaletteFirst: 'Create a palette first in the generator',
    currentPalette: 'Current Palette',
    cssVariables: 'CSS Variables',
    scssVariables: 'SCSS Variables',
    tailwindConfig: 'Tailwind Config',
    json: 'JSON',
    shareLink: 'Share Link',
    copyCssVariables: 'Copy CSS Variables',
    copyScssVariables: 'Copy SCSS Variables',
    copyTailwindConfig: 'Copy Tailwind Config',
    copyJson: 'Copy JSON',
    copyShareLink: 'Copy Share Link',
    copiedFormat: 'Copied {format} to clipboard!',
    copiedToClipboard: 'Copied to clipboard',
    apiOnline: 'API Online',
    offlineMode: 'Offline Mode'
  }
}

export function useTranslations() {
  const $t = (key) => {
    return translations[currentLanguage.value][key] || key
  }

  const toggleLanguage = () => {
    currentLanguage.value = currentLanguage.value === 'ru' ? 'en' : 'ru'
    localStorage.setItem('language', currentLanguage.value)
  }

  return {
    currentLanguage,
    $t,
    toggleLanguage
  }
}