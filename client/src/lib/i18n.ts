import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import Backend from 'i18next-http-backend';
import enTranslation from '../../public/locales/en/translation.json';
import hiTranslation from '../../public/locales/hi/translation.json';

// Initialize i18next with all the options
i18n
  // detect user language
  .use(LanguageDetector)
  // pass the i18n instance to react-i18next.
  .use(initReactI18next)
  // init i18next
  .init({
    fallbackLng: 'en',
    debug: false,
    
    interpolation: {
      escapeValue: false, // not needed for react as it escapes by default
    },
    
    resources: {
      en: {
        translation: enTranslation
      },
      hi: {
        translation: hiTranslation
      }
    },

    // Default namespace
    defaultNS: 'translation',

    // React settings
    react: {
      useSuspense: true,
    }
  });

export default i18n;