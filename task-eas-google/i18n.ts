// i18n.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';
import { I18n } from 'i18n-js';

import de from './translations/de.json';
import en from './translations/en.json';
import fr from './translations/fr.json';
import hu from './translations/hu.json';

// Set up the translations object
const translations = { en, hu, fr, de };
const i18n = new I18n(translations);

// Define a key for storage and default fallback
const LOCALE_KEY = 'app_language';
i18n.defaultLocale = 'en';
i18n.enableFallback = true;

// Function to load the saved locale (or use device default)
export const loadSavedLocale = async () => {
  try {
    const savedLocale = await AsyncStorage.getItem(LOCALE_KEY);
    if (savedLocale !== null && translations[savedLocale as keyof typeof translations]) {
      i18n.locale = savedLocale;
    } else {
      // If no saved preference, use the device's primary locale
      const deviceLocale = Localization.getLocales()[0]?.languageCode || 'en';
      i18n.locale = translations[deviceLocale as keyof typeof translations] ? deviceLocale : 'en';
    }
  } catch (error) {
    console.error('Failed to load locale:', error);
    i18n.locale = 'en';
  }
};

// Function to change and save the locale
export const changeAppLanguage = async (languageCode: string) => {
  if (translations[languageCode as keyof typeof translations]) {
    i18n.locale = languageCode;
    try {
      await AsyncStorage.setItem(LOCALE_KEY, languageCode);
    } catch (error) {
      console.error('Failed to save locale:', error);
    }
  }
};

// Get available languages
export const getAvailableLanguages = () => {
  return Object.keys(translations);
};

// Initialize with device locale for first run
loadSavedLocale();

export default i18n;
