import {
    formatShortDate,
    formatTaskDueDate,
    formatTime,
    getLocaleInfo,
} from '@/utils/localization';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

/**
 * Example component demonstrating expo-localization usage
 * This can be used as a reference or added to your app for testing
 */
export default function LocalizationDemo() {
  const [localeInfo, setLocaleInfo] = useState<any>(null);

  useEffect(() => {
    setLocaleInfo(getLocaleInfo());
  }, []);

  if (!localeInfo) {
    return (
      <View style={styles.container}>
        <Text>Loading locale information...</Text>
      </View>
    );
  }

  // Example dates for demonstration
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Localization Information</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Device Locale</Text>
        <InfoRow label="Language" value={localeInfo.languageCode} />
        <InfoRow label="Region" value={localeInfo.regionCode} />
        <InfoRow label="Locale Tag" value={localeInfo.languageTag} />
        <InfoRow label="Text Direction" value={localeInfo.textDirection} />
        <InfoRow label="Currency" value={localeInfo.currency} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Number Formatting</Text>
        <InfoRow 
          label="Digit Separator" 
          value={localeInfo.digitGroupingSeparator || 'N/A'} 
        />
        <InfoRow 
          label="Decimal Separator" 
          value={localeInfo.decimalSeparator || 'N/A'} 
        />
        <InfoRow 
          label="Example Number" 
          value={(1234567.89).toLocaleString(localeInfo.languageTag)} 
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Time & Calendar</Text>
        <InfoRow label="Timezone" value={localeInfo.timezone} />
        <InfoRow 
          label="24-Hour Clock" 
          value={localeInfo.uses24hourClock ? 'Yes' : 'No'} 
        />
        <InfoRow 
          label="First Weekday" 
          value={getWeekdayName(localeInfo.firstWeekday)} 
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Date Formatting Examples</Text>
        <InfoRow 
          label="Current Time" 
          value={formatTime(now)} 
        />
        <InfoRow 
          label="Today (Short)" 
          value={formatShortDate(now)} 
        />
        <InfoRow 
          label="Task Due Today" 
          value={formatTaskDueDate(now)} 
        />
        <InfoRow 
          label="Task Due Tomorrow" 
          value={formatTaskDueDate(tomorrow)} 
        />
        <InfoRow 
          label="Task Due Next Week" 
          value={formatTaskDueDate(nextWeek)} 
        />
      </View>
    </ScrollView>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}:</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

function getWeekdayName(weekday: number): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[weekday - 1] || 'Unknown';
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#555',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  label: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  value: {
    fontSize: 14,
    color: '#333',
    fontWeight: '400',
  },
});
