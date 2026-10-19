import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import {
  DEFAULT_LANGUAGE,
  STORAGE_KEYS,
  SUPPORTED_LANGUAGES,
  type AppLanguage,
} from '@/lib/constants'
import en from '@/locales/en.json'
import es from '@/locales/es.json'
import uk from '@/locales/uk.json'

function readStoredLanguage(): AppLanguage {
  if (typeof window === 'undefined') {
    return DEFAULT_LANGUAGE
  }

  const stored = window.localStorage.getItem(STORAGE_KEYS.language)
  if (stored && (SUPPORTED_LANGUAGES as readonly string[]).includes(stored)) {
    return stored as AppLanguage
  }

  return DEFAULT_LANGUAGE
}

void i18n.use(initReactI18next).init({
  resources: {
    uk: { translation: uk },
    en: { translation: en },
    es: { translation: es },
  },
  lng: readStoredLanguage(),
  fallbackLng: DEFAULT_LANGUAGE,
  interpolation: {
    escapeValue: false,
  },
})

i18n.on('languageChanged', (lng) => {
  if ((SUPPORTED_LANGUAGES as readonly string[]).includes(lng)) {
    window.localStorage.setItem(STORAGE_KEYS.language, lng)
    document.documentElement.lang = lng
  }
})

document.documentElement.lang = i18n.language

export default i18n
