import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

// Define the type for the language context
type LanguageContextType = {
  language: string;
  changeLanguage: (lang: string) => void;
  isHindi: boolean;
};

// Create the context with a default value
const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Create a provider component
export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { i18n } = useTranslation();
  const [language, setLanguage] = useState<string>(i18n.language || 'en');

  // Change language function
  const changeLanguage = (lang: string) => {
    i18n.changeLanguage(lang);
    setLanguage(lang);
    
    // Store language preference in localStorage
    localStorage.setItem('preferredLanguage', lang);
    
    // Trigger a custom event that other components can listen for
    window.dispatchEvent(new CustomEvent('languageChanged', { detail: lang }));
  };

  // Initialize with stored language preference
  useEffect(() => {
    const storedLang = localStorage.getItem('preferredLanguage');
    if (storedLang) {
      changeLanguage(storedLang);
    }
  }, []);

  // Calculate if the current language is Hindi
  const isHindi = language === 'hi';

  return (
    <LanguageContext.Provider value={{ language, changeLanguage, isHindi }}>
      {children}
    </LanguageContext.Provider>
  );
};

// Create a hook to use the language context
export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};