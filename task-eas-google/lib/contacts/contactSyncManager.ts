// Lazy load expo-contacts to avoid import errors if module is not available
let Contacts: any = null;
let contactsAvailable = false;

try {
  Contacts = require('expo-contacts');
  contactsAvailable = true;
} catch (error) {
  console.warn('[ContactSync] expo-contacts module not available. Device sync will be disabled.');
  contactsAvailable = false;
}

export interface AppContact {
  id?: number;
  firstName?: string;
  lastName?: string;
  fullName: string;
  phone?: string;
  email?: string;
  address?: string;
  company?: string;
  notes?: string;
  deviceContactId?: string;
  lastSynced?: string;
  syncStatus?: 'pending' | 'synced' | 'error';
}

export interface TaskInfo {
  type?: string;
  description?: string;
  dueDate?: string;
}

export interface SyncResult {
  success: boolean;
  deviceContactId?: string;
  error?: string;
}

/**
 * ContactSyncManager
 * Manages synchronization between app contacts and device address book
 * Gracefully handles cases where expo-contacts is not available
 */
export class ContactSyncManager {
  private localContactsCache: Map<string, any>;
  private isAvailable: boolean;

  constructor() {
    this.localContactsCache = new Map();
    this.isAvailable = contactsAvailable;
  }

  /**
   * Check if contact sync is available
   */
  isContactSyncAvailable(): boolean {
    return this.isAvailable;
  }

  /**
   * Main sync function - Call this when saving/updating a contact
   */
  async syncContactWithDevice(
    appContact: AppContact,
    taskInfo?: TaskInfo | null
  ): Promise<SyncResult> {
    if (!this.isAvailable) {
      console.warn('[ContactSync] Sync skipped - expo-contacts not available');
      return {
        success: false,
        error: 'Contact sync not available. Please rebuild the app with expo-contacts.',
      };
    }

    try {
      // 1. Check/Request permissions
      const hasPermission = await this.checkContactsPermission();
      if (!hasPermission) {
        return { success: false, error: 'Permission denied' };
      }

      // 2. Find existing device contact
      const deviceContactId = await this.findDeviceContact(
        appContact.phone,
        appContact.email
      );

      // 3. Prepare contact data with task context
      const contactData: any = {
        name: appContact.fullName,
        firstName: appContact.firstName,
        lastName: appContact.lastName,
        phoneNumbers: appContact.phone
          ? [{ label: 'work', number: appContact.phone }]
          : undefined,
        emails: appContact.email
          ? [{ label: 'work', email: appContact.email }]
          : undefined,
        company: appContact.company || 'Client',
        jobTitle: taskInfo ? `Task: ${taskInfo.type || 'Service'}` : 'Client',
        note: taskInfo
          ? `Next task: ${taskInfo.description}\nDue: ${taskInfo.dueDate || 'Not set'}`
          : 'Managed by Task App',
        addresses: appContact.address
          ? [
              {
                label: 'work',
                street: appContact.address,
              },
            ]
          : undefined,
      };

      // 4. Create or Update
      let finalDeviceId: string;
      if (deviceContactId) {
        // Update existing contact
        await Contacts.updateContactAsync({
          ...contactData,
          id: deviceContactId,
        });
        finalDeviceId = deviceContactId;
        console.log('[ContactSync] Updated existing device contact');
      } else {
        // Create new contact
        finalDeviceId = await Contacts.addContactAsync(contactData);
        console.log('[ContactSync] Created new device contact');
      }

      return { success: true, deviceContactId: finalDeviceId };
    } catch (error) {
      console.error('[ContactSync] Sync failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Find a device contact by phone or email
   */
  async findDeviceContact(
    phone?: string,
    email?: string
  ): Promise<string | null> {
    if (!this.isAvailable) return null;

    try {
      const { data } = await Contacts.getContactsAsync({
        fields: [
          Contacts.Fields.PhoneNumbers,
          Contacts.Fields.Emails,
          Contacts.Fields.ID,
        ],
      });

      // Search by phone (most reliable)
      if (phone) {
        const byPhone = data.find((contact: any) =>
          contact.phoneNumbers?.some(
            (p: any) => this.normalizePhone(p.number || '') === this.normalizePhone(phone)
          )
        );
        if (byPhone) return byPhone.id || null;
      }

      // Fallback: search by email
      if (email) {
        const byEmail = data.find((contact: any) =>
          contact.emails?.some(
            (e: any) => e.email?.toLowerCase() === email.toLowerCase()
          )
        );
        if (byEmail) return byEmail.id || null;
      }

      return null;
    } catch (error) {
      console.error('[ContactSync] Error finding device contact:', error);
      return null;
    }
  }

  /**
   * Check and request contacts permission
   */
  async checkContactsPermission(): Promise<boolean> {
    if (!this.isAvailable) return false;

    try {
      const { status } = await Contacts.getPermissionsAsync();
      if (status === 'granted') return true;

      const { status: newStatus } = await Contacts.requestPermissionsAsync();
      return newStatus === 'granted';
    } catch (error) {
      console.error('[ContactSync] Error checking contacts permission:', error);
      return false;
    }
  }

  /**
   * Normalize phone numbers for reliable matching
   */
  normalizePhone(phone: string): string {
    return phone.replace(/[+\-\s()]/g, '');
  }

  /**
   * Search device contacts by name or phone
   */
  async searchDeviceContacts(query: string): Promise<any[]> {
    if (!this.isAvailable) return [];

    try {
      const hasPermission = await this.checkContactsPermission();
      if (!hasPermission) return [];

      const { data } = await Contacts.getContactsAsync({
        fields: [
          Contacts.Fields.Name,
          Contacts.Fields.PhoneNumbers,
          Contacts.Fields.Emails,
          Contacts.Fields.ID,
        ],
      });

      const lowerQuery = query.toLowerCase();
      return data.filter((contact: any) => {
        const nameMatch = contact.name?.toLowerCase().includes(lowerQuery);
        const phoneMatch = contact.phoneNumbers?.some((p: any) =>
          p.number?.includes(query)
        );
        const emailMatch = contact.emails?.some((e: any) =>
          e.email?.toLowerCase().includes(lowerQuery)
        );
        return nameMatch || phoneMatch || emailMatch;
      });
    } catch (error) {
      console.error('[ContactSync] Error searching device contacts:', error);
      return [];
    }
  }

  /**
   * Import a device contact into the app
   */
  async importDeviceContact(deviceContact: any): Promise<AppContact | null> {
    if (!this.isAvailable) return null;

    try {
      const phone = deviceContact.phoneNumbers?.[0]?.number;
      const email = deviceContact.emails?.[0]?.email;
      const address = deviceContact.addresses?.[0]?.street;

      const appContact: AppContact = {
        firstName: deviceContact.firstName,
        lastName: deviceContact.lastName,
        fullName: deviceContact.name || `${deviceContact.firstName || ''} ${deviceContact.lastName || ''}`.trim(),
        phone,
        email,
        address,
        company: deviceContact.company,
        notes: deviceContact.note,
        deviceContactId: deviceContact.id,
        syncStatus: 'synced',
        lastSynced: new Date().toISOString(),
      };

      return appContact;
    } catch (error) {
      console.error('[ContactSync] Error importing device contact:', error);
      return null;
    }
  }

  /**
   * Delete a contact from device address book
   */
  async deleteDeviceContact(deviceContactId: string): Promise<boolean> {
    if (!this.isAvailable) return false;

    try {
      const hasPermission = await this.checkContactsPermission();
      if (!hasPermission) return false;

      await Contacts.removeContactAsync(deviceContactId);
      return true;
    } catch (error) {
      console.error('[ContactSync] Error deleting device contact:', error);
      return false;
    }
  }
}

// Export singleton instance
export const contactSyncManager = new ContactSyncManager();
