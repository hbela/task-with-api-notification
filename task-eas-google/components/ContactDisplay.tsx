import { useTranslation } from '@/hooks/useTranslation';
import { Ionicons } from '@expo/vector-icons';
import * as Contacts from 'expo-contacts';
import React, { useEffect, useState } from 'react';
import { Alert, Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import OpenMapButton from './OpenMapButton';

interface ContactDisplayProps {
  contactId: string;
  showActions?: boolean;
}

interface ContactInfo {
  id: string;
  name: string;
  phoneNumbers?: { number?: string; label?: string }[];
  emails?: { email?: string; label?: string }[];
  addresses?: { street?: string; city?: string; region?: string; postalCode?: string; country?: string; label?: string }[];
}

export default function ContactDisplay({ contactId, showActions = true }: ContactDisplayProps) {
  const { t } = useTranslation();
  const [contact, setContact] = useState<ContactInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    loadContact();
  }, [contactId]);

  const loadContact = async () => {
    setLoading(true);
    setNotFound(false);

    try {
      const { status } = await Contacts.requestPermissionsAsync();
      if (status !== 'granted') {
        setNotFound(true);
        setLoading(false);
        return;
      }

      const contactData = await Contacts.getContactByIdAsync(contactId, [
        Contacts.Fields.Name,
        Contacts.Fields.PhoneNumbers,
        Contacts.Fields.Emails,
        Contacts.Fields.Addresses,
      ]);

      if (contactData) {
        setContact(contactData);
      } else {
        setNotFound(true);
      }
    } catch (error) {
      console.error('Error loading contact:', error);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  const handleCall = (phoneNumber: string) => {
    const cleanNumber = phoneNumber.replace(/\D/g, '');
    Linking.openURL(`tel:${cleanNumber}`);
  };

  const handleEmail = (email: string) => {
    Linking.openURL(`mailto:${email}`);
  };

  const handleCreateContact = () => {
    Alert.alert(
      t('contacts.contactNotFound'),
      t('contacts.contactNotFoundAlert'),
      [{ text: t('common.done') }]
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Ionicons name="person-outline" size={20} color="#8E8E93" />
          <Text style={styles.loadingText}>{t('contacts.loadingContact')}</Text>
        </View>
      </View>
    );
  }

  if (notFound) {
    return (
      <View style={styles.container}>
        <View style={styles.notFoundContainer}>
          <Ionicons name="alert-circle-outline" size={20} color="#FF9500" />
          <View style={styles.notFoundTextContainer}>
            <Text style={styles.notFoundTitle}>{t('contacts.contactNotFound')}</Text>
            <Text style={styles.notFoundSubtitle}>
              {t('contacts.contactNotFoundHint')}
            </Text>
          </View>
          {showActions && (
            <TouchableOpacity onPress={handleCreateContact}>
              <Ionicons name="add-circle" size={24} color="#007AFF" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  if (!contact) {
    return null;
  }

  const primaryPhone = contact.phoneNumbers?.[0];
  const primaryEmail = contact.emails?.[0];

  return (
    <View style={styles.container}>
      <View style={styles.contactCard}>
        <View style={styles.contactHeader}>
          <View style={styles.contactAvatar}>
            <Text style={styles.contactAvatarText}>
              {contact.name
                ?.split(' ')
                .map((n) => n[0])
                .join('')
                .toUpperCase()
                .slice(0, 2) || '?'}
            </Text>
          </View>
          <View style={styles.contactHeaderInfo}>
            <Text style={styles.contactName}>{contact.name || t('contacts.unknown')}</Text>
            {primaryPhone && (
              <Text style={styles.contactLabel}>
                {primaryPhone.label || 'Phone'}
              </Text>
            )}
          </View>
        </View>

        {primaryPhone && primaryPhone.number && (
          <View style={styles.contactDetail}>
            <View style={styles.contactDetailInfo}>
              <Ionicons name="call" size={16} color="#007AFF" />
              <Text style={styles.contactDetailText}>{primaryPhone.number}</Text>
            </View>
            {showActions && (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleCall(primaryPhone.number!)}
              >
                <Ionicons name="call-outline" size={20} color="#007AFF" />
              </TouchableOpacity>
            )}
          </View>
        )}

        {primaryEmail && primaryEmail.email && (
          <View style={styles.contactDetail}>
            <View style={styles.contactDetailInfo}>
              <Ionicons name="mail" size={16} color="#007AFF" />
              <Text style={styles.contactDetailText}>{primaryEmail.email}</Text>
            </View>
            {showActions && (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleEmail(primaryEmail.email!)}
              >
                <Ionicons name="mail-outline" size={20} color="#007AFF" />
              </TouchableOpacity>
            )}
        </View>
        )}

        {/* Address Section with Map Button */}
        {contact.addresses && contact.addresses.length > 0 && contact.addresses[0] && (
          <View style={styles.addressSection}>
            <View style={styles.contactDetail}>
              <View style={styles.contactDetailInfo}>
                <Ionicons name="location" size={16} color="#007AFF" />
                <View style={styles.addressTextContainer}>
                  <Text style={styles.contactDetailText}>
                    {[
                      contact.addresses[0].street,
                      contact.addresses[0].city,
                      contact.addresses[0].region,
                      contact.addresses[0].postalCode,
                      contact.addresses[0].country
                    ].filter(Boolean).join(', ')}
                  </Text>
                  {contact.addresses[0].label && (
                    <Text style={styles.addressLabel}>{contact.addresses[0].label}</Text>
                  )}
                </View>
              </View>
            </View>
            {showActions && (
              <OpenMapButton 
                address={[
                  contact.addresses[0].street,
                  contact.addresses[0].city,
                  contact.addresses[0].region,
                  contact.addresses[0].postalCode,
                  contact.addresses[0].country
                ].filter(Boolean).join(', ')}
                style={styles.mapButton}
              />
            )}
          </View>
        )}

        {contact.phoneNumbers && contact.phoneNumbers.length > 1 && (
          <Text style={styles.moreInfo}>
            {contact.phoneNumbers.length - 1 > 1 
              ? t('contacts.morePhonesPlural').replace('%{count}', String(contact.phoneNumbers.length - 1))
              : t('contacts.morePhones').replace('%{count}', String(contact.phoneNumbers.length - 1))
            }
          </Text>
        )}

        {contact.emails && contact.emails.length > 1 && (
          <Text style={styles.moreInfo}>
            {contact.emails.length - 1 > 1
              ? t('contacts.moreEmailsPlural').replace('%{count}', String(contact.emails.length - 1))
              : t('contacts.moreEmails').replace('%{count}', String(contact.emails.length - 1))
            }
          </Text>
        )}

        {contact.addresses && contact.addresses.length > 1 && (
          <Text style={styles.moreInfo}>
            {contact.addresses.length - 1 > 1
              ? t('contacts.moreAddressesPlural').replace('%{count}', String(contact.addresses.length - 1))
              : t('contacts.moreAddresses').replace('%{count}', String(contact.addresses.length - 1))
            }
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 16,
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  loadingText: {
    fontSize: 14,
    color: '#8E8E93',
  },
  notFoundContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    backgroundColor: '#FFF9E6',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFE5B4',
  },
  notFoundTextContainer: {
    flex: 1,
  },
  notFoundTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 2,
  },
  notFoundSubtitle: {
    fontSize: 12,
    color: '#8E8E93',
  },
  contactCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  contactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  contactAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  contactAvatarText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  contactHeaderInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 2,
  },
  contactLabel: {
    fontSize: 12,
    color: '#8E8E93',
  },
  contactDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  contactDetailInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  contactDetailText: {
    fontSize: 14,
    color: '#1C1C1E',
    flex: 1,
  },
  actionButton: {
    padding: 8,
  },
  addressSection: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  addressTextContainer: {
    flex: 1,
  },
  addressLabel: {
    fontSize: 11,
    color: '#8E8E93',
    marginTop: 2,
  },
  mapButton: {
    marginTop: 8,
  },
  moreInfo: {
    fontSize: 12,
    color: '#8E8E93',
    fontStyle: 'italic',
    marginTop: 4,
  },
});
