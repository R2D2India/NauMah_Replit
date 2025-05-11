import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import Backend from 'i18next-http-backend';

// Initialize i18next with all the options
i18n
  // load translations using http (default public/locales)
  .use(Backend)
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
    
    // Backend configuration for loading translations
    backend: {
      loadPath: './locales/{{lng}}/{{ns}}.json',
    },
    resources: {
      en: {
        translation: {
          app: {
            title: "NauMah",
            slogan: "Your Intelligent Companion for Every Stage of Pregnancy"
          },
          language: {
            select: "Language",
            en: "English",
            hi: "हिन्दी"
          }
        }
      },
      hi: {
        translation: {
          app: {
            title: "नौमा",
            slogan: "गर्भावस्था के हर चरण के लिए आपका बुद्धिमान साथी"
          },
          language: {
            select: "भाषा",
            en: "English",
            hi: "हिन्दी"
          }
        }
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