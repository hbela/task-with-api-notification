import { useTranslation } from '@/hooks/useTranslation';
import { Ionicons } from '@expo/vector-icons';
import * as Contacts from 'expo-contacts';
import React, { useState } from 'react';
import {
    Alert,
    FlatList,
    Linking,
    Modal,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

interface Contact {
  id: string;
  name: string;
  phoneNumbers?: { number: string }[];
  emails?: { email: string }[];
}

interface ContactSearchButtonProps {
  onContactSelect: (contactId: string) => void;
  selectedContactId?: string | null;
  disabled?: boolean;
}

export default function ContactSearchButton({
  onContactSelect,
  selectedContactId,
  disabled = false,
}: ContactSearchButtonProps) {
  const { t } = useTranslation();
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Contact[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);

  const requestPermission = async () => {
    const { status } = await Contacts.requestPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        t('contacts.permissionRequired'),
        t('contacts.permissionMessage'),
        [
          { text: t('common.cancel'), style: 'cancel' },
          { text: t('contacts.openSettings'), onPress: () => Linking.openSettings() },
        ]
      );
      return false;
    }
    return true;
  };

  const searchContacts = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const hasPermission = await requestPermission();
      if (!hasPermission) {
        setSearching(false);
        return;
      }

      // Get all contacts
      const { data } = await Contacts.getContactsAsync({
        fields: [
          Contacts.Fields.Name,
          Contacts.Fields.PhoneNumbers,
          Contacts.Fields.Emails,
        ],
      });

      // Filter contacts by phone or email
      const filtered = data.filter((contact) => {
        const nameMatch = contact.name?.toLowerCase().includes(query.toLowerCase());
        const phoneMatch = contact.phoneNumbers?.some((phone) =>
          phone.number?.replace(/\D/g, '').includes(query.replace(/\D/g, ''))
        );
        const emailMatch = contact.emails?.some((email) =>
          email.email?.toLowerCase().includes(query.toLowerCase())
        );
        return nameMatch || phoneMatch || emailMatch;
      });

      setSearchResults(filtered);
    } catch (error) {
      console.error('Error searching contacts:', error);
      Alert.alert(t('common.error'), t('contacts.searchError'));
    } finally {
      setSearching(false);
    }
  };

  const handleSelectContact = (contact: Contact) => {
    setSelectedContact(contact);
    onContactSelect(contact.id);
    setModalVisible(false);
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleOpenModal = async () => {
    const hasPermission = await requestPermission();
    if (hasPermission) {
      setModalVisible(true);
    }
  };

  const handleCreateContact = () => {
    setModalVisible(false);
    Alert.alert(
      t('contacts.createContact'),
      t('contacts.createContactHint'),
      [
        { text: t('common.done') },
        {
          text: t('contacts.openContacts'),
          onPress: () => {
            // On Android, we can try to open the contacts app
            if (Platform.OS === 'android') {
              Linking.openURL('content://contacts/people/');
            }
          },
        },
      ]
    );
  };

  const renderContactItem = ({ item }: { item: Contact }) => {
    const phone = item.phoneNumbers?.[0]?.number;
    const email = item.emails?.[0]?.email;

    return (
      <TouchableOpacity
        style={styles.contactItem}
        onPress={() => handleSelectContact(item)}
      >
        <View style={styles.contactAvatar}>
          <Text style={styles.contactAvatarText}>
            {item.name
              ?.split(' ')
              .map((n) => n[0])
              .join('')
              .toUpperCase()
              .slice(0, 2) || '?'}
          </Text>
        </View>
        <View style={styles.contactInfo}>
          <Text style={styles.contactName}>{item.name || t('contacts.unknown')}</Text>
          {phone && (
            <Text style={styles.contactDetail}>
              <Ionicons name="call-outline" size={12} color="#666" /> {phone}
            </Text>
          )}
          {email && (
            <Text style={styles.contactDetail}>
              <Ionicons name="mail-outline" size={12} color="#666" /> {email}
            </Text>
          )}
        </View>
        <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
      </TouchableOpacity>
    );
  };

  return (
    <>
      <TouchableOpacity
        style={[styles.searchButton, disabled && styles.searchButtonDisabled]}
        onPress={handleOpenModal}
        disabled={disabled}
      >
        <Ionicons name="search" size={20} color="#007AFF" />
        <Text style={styles.searchButtonText}>
          {selectedContactId ? t('contacts.change') : t('contacts.search')}
        </Text>
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Ionicons name="close" size={28} color="#007AFF" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>{t('contacts.searchTitle')}</Text>
            <View style={{ width: 28 }} />
          </View>

          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#8E8E93" />
            <TextInput
              style={styles.searchInput}
              placeholder={t('contacts.searchPlaceholder')}
              value={searchQuery}
              onChangeText={(text) => {
                setSearchQuery(text);
                searchContacts(text);
              }}
              autoFocus
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => {
                setSearchQuery('');
                setSearchResults([]);
              }}>
                <Ionicons name="close-circle" size={20} color="#8E8E93" />
              </TouchableOpacity>
            )}
          </View>

          {searching && (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>{t('contacts.searching')}</Text>
            </View>
          )}

          {!searching && searchQuery && searchResults.length === 0 && (
            <View style={styles.emptyContainer}>
              <Ionicons name="person-outline" size={64} color="#C7C7CC" />
              <Text style={styles.emptyTitle}>{t('contacts.noContacts')}</Text>
              <Text style={styles.emptySubtitle}>
                {t('contacts.noContactsHint')}
              </Text>
              <TouchableOpacity
                style={styles.createButton}
                onPress={handleCreateContact}
              >
                <Ionicons name="add-circle" size={20} color="#007AFF" />
                <Text style={styles.createButtonText}>{t('contacts.createContact')}</Text>
              </TouchableOpacity>
            </View>
          )}

          {!searching && searchResults.length > 0 && (
            <FlatList
              data={searchResults}
              keyExtractor={(item) => item.id}
              renderItem={renderContactItem}
              contentContainerStyle={styles.listContainer}
            />
          )}

          {!searching && !searchQuery && (
            <View style={styles.instructionsContainer}>
              <Ionicons name="search-outline" size={64} color="#C7C7CC" />
              <Text style={styles.instructionsTitle}>{t('contacts.searchInstructions')}</Text>
              <Text style={styles.instructionsSubtitle}>
                {t('contacts.searchInstructionsHint')}
              </Text>
            </View>
          )}
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  searchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    backgroundColor: 'white',
  },
  searchButtonDisabled: {
    opacity: 0.5,
  },
  searchButtonText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#F5F5F7',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1C1C1E',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#8E8E93',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1C1C1E',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    marginTop: 8,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#E8F4FF',
    borderRadius: 8,
    marginTop: 24,
  },
  createButtonText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  instructionsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  instructionsTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1C1C1E',
    marginTop: 16,
  },
  instructionsSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    marginTop: 8,
  },
  listContainer: {
    padding: 16,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: 'white',
    borderRadius: 8,
    marginBottom: 8,
  },
  contactAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  contactAvatarText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 2,
  },
  contactDetail: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
});
