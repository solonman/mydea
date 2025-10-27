import { useContext, createContext } from 'react';
import { Language } from '../types';
import { translations, TranslationKey } from './translations';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey, replacements?: Record<string, string | number>) => string;
}

export const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
};

export const t = (language: Language, key: TranslationKey, replacements?: Record<string, string | number>): string => {
  let text = translations[language]?.[key] || translations.en[key] || key;
  
  if (replacements) {
    Object.entries(replacements).forEach(([placeholder, value]) => {
      text = text.replace(`{${placeholder}}`, String(value));
    });
  }
  
  return text;
};
