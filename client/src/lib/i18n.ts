import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import Backend from 'i18next-http-backend';
import enTranslation from '../locales/en/translation.json';
import hiTranslation from '../locales/hi/translation.json';

// Add missing footer translations directly to the translation objects
if (!enTranslation.footer) {
  (enTranslation as any).footer = {};
}
(enTranslation as any).footer.privacy = "Privacy Policy";
(enTranslation as any).footer.terms = "Terms of Service";
(enTranslation as any).footer.disclaimer = "Medical Disclaimer";
(enTranslation as any).footer.medical = "NauMah does not provide medical advice. Always consult with healthcare professionals for medical decisions.";
(enTranslation as any).footer.rights = "All Rights Reserved";

if (!hiTranslation.footer) {
  (hiTranslation as any).footer = {};
}
(hiTranslation as any).footer.privacy = "गोपनीयता नीति";
(hiTranslation as any).footer.terms = "सेवा की शर्तें";
(hiTranslation as any).footer.disclaimer = "चिकित्सा अस्वीकरण";
(hiTranslation as any).footer.medical = "नौमा चिकित्सा सलाह प्रदान नहीं करता है। चिकित्सा निर्णयों के लिए हमेशा स्वास्थ्य देखभाल पेशेवरों से परामर्श करें।";
(hiTranslation as any).footer.rights = "सर्वाधिकार सुरक्षित";

// Initialize i18next with all the options
i18n
  // detect user language
  .use(LanguageDetector)
  // pass the i18n instance to react-i18next.
  .use(initReactI18next)
  // init i18next
  .init({
    fallbackLng: 'en',
    debug: true, // Enable debug to see what's happening
    
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