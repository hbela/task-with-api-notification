import { PaginationParams } from '@/types/api';
import { Contact, ContactResponse, ContactsResponse, CreateContactInput, UpdateContactInput } from '@/types/contact';
import { api } from './index';

/**
 * Contact API methods
 */
export const contactsApi = {
  /**
   * Get all contacts with optional pagination and filtering
   */
  getAll: async (params?: PaginationParams & { search?: string; syncStatus?: 'pending' | 'synced' | 'error' }): Promise<ContactsResponse> => {
    const query = new URLSearchParams();
    
    if (params?.page) query.append('page', params.page.toString());
    if (params?.limit) query.append('limit', params.limit.toString());
    if (params?.search) query.append('search', params.search);
    if (params?.syncStatus) query.append('syncStatus', params.syncStatus);
    
    const queryString = query.toString();
    const endpoint = `/contacts${queryString ? `?${queryString}` : ''}`;
    
    return api.get<ContactsResponse>(endpoint);
  },

  /**
   * Get single contact by ID
   */
  getById: async (id: number): Promise<Contact> => {
    const response = await api.get<ContactResponse>(`/contacts/${id}`);
    return response.contact;
  },

  /**
   * Create a new contact
   */
  create: async (data: CreateContactInput): Promise<Contact> => {
    const response = await api.post<ContactResponse>('/contacts', data);
    return response.contact;
  },

  /**
   * Update an existing contact
   */
  update: async (id: number, data: UpdateContactInput): Promise<Contact> => {
    const response = await api.patch<ContactResponse>(`/contacts/${id}`, data);
    return response.contact;
  },

  /**
   * Delete a contact
   */
  delete: async (id: number): Promise<void> => {
    await api.delete(`/contacts/${id}`);
  },

  /**
   * Update contact sync status
   */
  updateSyncStatus: async (
    id: number,
    data: {
      deviceContactId?: string;
      syncStatus: 'pending' | 'synced' | 'error';
      errorMessage?: string;
    }
  ): Promise<Contact> => {
    const response = await api.patch<ContactResponse>(`/contacts/${id}/sync`, data);
    return response.contact;
  },

  /**
   * Search for a contact by phone number
   */
  searchByPhone: async (phone: string): Promise<Contact | null> => {
    const response = await api.get<{ contact: Contact | null }>(`/contacts/search/phone?phone=${encodeURIComponent(phone)}`);
    return response.contact;
  },
};
