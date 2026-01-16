import * as Localization from 'expo-localization';

/**
 * Get the primary device locale
 */
export const getDeviceLocale = () => {
  const locales = Localization.getLocales();
  return locales[0];
};

/**
 * Get the device's language code (e.g., 'en', 'fr', 'es')
 */
export const getLanguageCode = (): string => {
  return getDeviceLocale().languageCode || 'en';
};

/**
 * Get the device's region code (e.g., 'US', 'FR', 'ES')
 */
export const getRegionCode = (): string => {
  return getDeviceLocale().regionCode || 'US';
};

/**
 * Get the device's timezone (e.g., 'America/New_York')
 */
export const getTimezone = (): string => {
  const calendars = Localization.getCalendars();
  return calendars[0]?.timeZone || 'UTC';
};

/**
 * Get the device's locale tag (e.g., 'en-US', 'fr-FR')
 */
export const getLocaleTag = (): string => {
  return getDeviceLocale().languageTag || 'en-US';
};

/**
 * Check if the device uses 24-hour clock format
 */
export const uses24HourClock = (): boolean => {
  const calendars = Localization.getCalendars();
  return calendars[0]?.uses24hourClock ?? false;
};

/**
 * Format a date according to the device's locale
 */
export const formatDateForLocale = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const locale = getDeviceLocale();
  
  return new Intl.DateTimeFormat(locale.languageTag, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(dateObj);
};

/**
 * Format a task due date with locale awareness
 * Shows relative time for dates within the week
 */
export const formatTaskDueDate = (dueDate: string | Date): string => {
  const date = typeof dueDate === 'string' ? new Date(dueDate) : dueDate;
  const locale = getDeviceLocale();
  const now = new Date();
  const diffInMs = date.getTime() - now.getTime();
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  // If due today
  if (diffInDays === 0) {
    return `Today, ${new Intl.DateTimeFormat(locale.languageTag, {
      hour: '2-digit',
      minute: '2-digit',
    }).format(date)}`;
  }

  // If due tomorrow
  if (diffInDays === 1) {
    return `Tomorrow, ${new Intl.DateTimeFormat(locale.languageTag, {
      hour: '2-digit',
      minute: '2-digit',
    }).format(date)}`;
  }

  // If within the next week
  if (diffInDays > 1 && diffInDays <= 7) {
    return new Intl.DateTimeFormat(locale.languageTag, {
      weekday: 'long',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  }

  // Otherwise, show full date
  return new Intl.DateTimeFormat(locale.languageTag, {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

/**
 * Format a short date (without time)
 */
export const formatShortDate = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const locale = getDeviceLocale();
  
  return new Intl.DateTimeFormat(locale.languageTag, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(dateObj);
};

/**
 * Format time only
 */
export const formatTime = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const locale = getDeviceLocale();
  
  return new Intl.DateTimeFormat(locale.languageTag, {
    hour: '2-digit',
    minute: '2-digit',
  }).format(dateObj);
};

/**
 * Get currency code for the device's region
 */
export const getCurrencyForRegion = (): string => {
  const regionCode = getRegionCode();
  const currencyMap: Record<string, string> = {
    'US': 'USD',
    'GB': 'GBP',
    'FR': 'EUR',
    'DE': 'EUR',
    'ES': 'EUR',
    'IT': 'EUR',
    'NL': 'EUR',
    'BE': 'EUR',
    'AT': 'EUR',
    'PT': 'EUR',
    'IE': 'EUR',
    'JP': 'JPY',
    'CN': 'CNY',
    'KR': 'KRW',
    'IN': 'INR',
    'CA': 'CAD',
    'AU': 'AUD',
    'NZ': 'NZD',
    'CH': 'CHF',
    'SE': 'SEK',
    'NO': 'NOK',
    'DK': 'DKK',
    'PL': 'PLN',
    'CZ': 'CZK',
    'HU': 'HUF',
    'RO': 'RON',
    'BG': 'BGN',
    'HR': 'HRK',
    'RU': 'RUB',
    'TR': 'TRY',
    'BR': 'BRL',
    'MX': 'MXN',
    'AR': 'ARS',
    'CL': 'CLP',
    'CO': 'COP',
    'ZA': 'ZAR',
    'EG': 'EGP',
    'NG': 'NGN',
    'KE': 'KES',
    'SA': 'SAR',
    'AE': 'AED',
    'IL': 'ILS',
    'SG': 'SGD',
    'MY': 'MYR',
    'TH': 'THB',
    'ID': 'IDR',
    'PH': 'PHP',
    'VN': 'VND',
  };
  return currencyMap[regionCode] || 'USD';
};

/**
 * Get all locale information
 */
export const getLocaleInfo = () => {
  const locale = getDeviceLocale();
  const calendars = Localization.getCalendars();
  
  return {
    languageCode: locale.languageCode,
    regionCode: locale.regionCode,
    languageTag: locale.languageTag,
    textDirection: locale.textDirection,
    digitGroupingSeparator: locale.digitGroupingSeparator,
    decimalSeparator: locale.decimalSeparator,
    timezone: calendars[0]?.timeZone,
    uses24hourClock: calendars[0]?.uses24hourClock,
    firstWeekday: calendars[0]?.firstWeekday,
    currency: getCurrencyForRegion(),
  };
};
