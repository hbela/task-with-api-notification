// utils/dateFormatter.ts
import i18n from '../i18n';

/**
 * Format a date according to the current app locale
 * @param date - Date object, string, or timestamp
 * @param options - Intl.DateTimeFormat options
 * @returns Formatted date string
 */
export const formatDate = (date: Date | string | number, options: Intl.DateTimeFormatOptions = {}) => {
  // Use your app's current locale from i18n
  const locale = i18n.locale;

  // Default formatting: e.g., "January 15, 2024"
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  };

  // Merge user-provided options with defaults
  const formatOptions = { ...defaultOptions, ...options };

  // Create and use the formatter
  const formatter = new Intl.DateTimeFormat(locale, formatOptions);
  return formatter.format(new Date(date));
};

/**
 * Format a date with time
 * @param date - Date object, string, or timestamp
 * @returns Formatted date and time string
 */
export const formatDateTime = (date: Date | string | number) => {
  return formatDate(date, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Format a task due date with relative terms (Today, Tomorrow, etc.)
 * @param date - Date object, string, or timestamp
 * @returns Formatted date string with relative terms when applicable
 */
export const formatTaskDueDate = (date: Date | string | number) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const taskDate = new Date(date);
  taskDate.setHours(0, 0, 0, 0);
  
  const diffTime = taskDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return i18n.t('date.today');
  if (diffDays === 1) return i18n.t('date.tomorrow');
  if (diffDays === -1) return i18n.t('date.yesterday');
  
  // For other dates, format normally
  return formatDate(date, { weekday: 'short', month: 'short', day: 'numeric' });
};

/**
 * Format time only
 * @param date - Date object, string, or timestamp
 * @returns Formatted time string
 */
export const formatTime = (date: Date | string | number) => {
  const locale = i18n.locale;
  const formatter = new Intl.DateTimeFormat(locale, {
    hour: '2-digit',
    minute: '2-digit',
  });
  return formatter.format(new Date(date));
};

/**
 * Format a compact date (numeric)
 * @param date - Date object, string, or timestamp
 * @returns Formatted compact date string
 */
export const formatCompactDate = (date: Date | string | number) => {
  return formatDate(date, {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  });
};

/**
 * Format month and year
 * @param date - Date object, string, or timestamp
 * @returns Formatted month and year string
 */
export const formatMonthYear = (date: Date | string | number) => {
  return formatDate(date, {
    year: 'numeric',
    month: 'long',
  });
};
