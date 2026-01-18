// components/LanguageSwitcher.tsx
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useContext } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LanguageContext } from '../context/LanguageContext';
import i18n, { changeAppLanguage } from '../i18n';

interface LanguageOption {
  code: string;
  label: string;
  flag: string;
}

const LANGUAGE_OPTIONS: LanguageOption[] = [
  { code: 'en', label: 'English', flag: '🇺🇸' },
  { code: 'hu', label: 'Magyar', flag: '🇭🇺' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
];

export default function LanguageSwitcher() {
  // Use context to get the function that refreshes the app
  const { refreshApp, key } = useContext(LanguageContext);
  const router = useRouter();
  const currentLocale = i18n.locale;

  console.log('[LanguageSwitcher] Current locale:', currentLocale, 'Context key:', key);

  const handleLanguageChange = async (languageCode: string) => {
    console.log('[LanguageSwitcher] Changing language from', currentLocale, 'to', languageCode);
    
    if (languageCode === currentLocale) {
      console.log('[LanguageSwitcher] Language already selected, skipping');
      return;
    }

    await changeAppLanguage(languageCode);
    console.log('[LanguageSwitcher] Language changed in i18n, new locale:', i18n.locale);
    
    // Trigger a re-render in components using the LanguageContext
    refreshApp();
    console.log('[LanguageSwitcher] Triggered app refresh');
    
    // Show success message
    Alert.alert(i18n.t('success'), i18n.t('languageChanged'));
    
    // Navigate back to task list after a brief delay
    setTimeout(() => {
      console.log('[LanguageSwitcher] Navigating back to task list');
      router.push('/(app)');
    }, 500);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <MaterialIcons name="translate" size={20} color="#666" style={styles.icon} />
        <Text style={styles.title}>{i18n.t('settings.language')}</Text>
      </View>
      <View style={styles.languageList}>
        {LANGUAGE_OPTIONS.map((lang) => (
          <TouchableOpacity
            key={lang.code}
            style={[
              styles.languageButton,
              currentLocale === lang.code && styles.activeButton
            ]}
            onPress={() => handleLanguageChange(lang.code)}
            activeOpacity={0.7}
          >
            <Text style={styles.flag}>{lang.flag}</Text>
            <Text
              style={[
                styles.languageLabel,
                currentLocale === lang.code && styles.activeLabel
              ]}
            >
              {lang.label}
            </Text>
            {currentLocale === lang.code && (
              <MaterialIcons name="check-circle" size={20} color="#007AFF" />
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  icon: {
    marginRight: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  languageList: {
    gap: 8,
  },
  languageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
  },
  activeButton: {
    backgroundColor: '#e6f2ff',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  flag: {
    fontSize: 24,
    marginRight: 12,
  },
  languageLabel: {
    flex: 1,
    fontSize: 15,
    color: '#444',
  },
  activeLabel: {
    color: '#007AFF',
    fontWeight: '600',
  },
});
