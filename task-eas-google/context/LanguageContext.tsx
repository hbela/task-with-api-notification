// context/LanguageContext.tsx
import React, { createContext, useEffect, useState } from 'react';
import { loadSavedLocale } from '../i18n';

interface LanguageContextType {
  refreshApp: () => void;
  key: number;
  isLoading: boolean;
}

export const LanguageContext = createContext<LanguageContextType>({
  refreshApp: () => {},
  key: 0,
  isLoading: true,
});

export const LanguageProvider = ({ children }: { children: React.ReactNode }) => {
  const [key, setKey] = useState(0); // A key to force re-render
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load the saved locale when the app starts
    const initializeLocale = async () => {
      await loadSavedLocale();
      setIsLoading(false);
    };
    initializeLocale();
  }, []);

  const refreshApp = () => {
    setKey(prevKey => prevKey + 1); // Changing the key forces children to re-render
  };

  return (
    <LanguageContext.Provider value={{ refreshApp, key, isLoading }}>
      {children}
    </LanguageContext.Provider>
  );
};
