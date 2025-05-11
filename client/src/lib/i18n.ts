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
          navigation: {
            home: "Home",
            dashboard: "Baby & Me",
            tracker: "Tracker",
            journal: "Journal",
            diet: "Diet & Exercise",
            resources: "Resources",
            support: "Support",
            login: "Login",
            register: "Register",
            logout: "Logout",
            profile: "Profile"
          },
          language: {
            select: "Language",
            en: "English",
            hi: "हिन्दी"
          },
          voice: {
            english: "English Voice",
            hindi: "Hindi Voice"
          },
          footer: {
            rights: "All Rights Reserved",
            terms: "Terms of Service",
            privacy: "Privacy Policy",
            disclaimer: "Medical Disclaimer"
          }
        }
      },
      hi: {
        translation: {
          app: {
            title: "नौमा",
            slogan: "गर्भावस्था के हर चरण के लिए आपका बुद्धिमान साथी"
          },
          navigation: {
            home: "होम",
            dashboard: "शिशु और मैं",
            tracker: "ट्रैकर",
            journal: "डायरी",
            diet: "आहार और व्यायाम",
            resources: "संसाधन",
            support: "सहायता",
            login: "लॉगिन",
            register: "रजिस्टर",
            logout: "लॉगआउट",
            profile: "प्रोफाइल"
          },
          language: {
            select: "भाषा",
            en: "English",
            hi: "हिन्दी"
          },
          voice: {
            english: "अंग्रेजी आवाज़",
            hindi: "हिंदी आवाज़"
          },
          footer: {
            rights: "सर्वाधिकार सुरक्षित",
            terms: "सेवा की शर्तें",
            privacy: "गोपनीयता नीति",
            disclaimer: "चिकित्सा अस्वीकरण"
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