export type SyncStatus = 'pending' | 'synced' | 'error';

export interface Contact {
  id: number;
  firstName: string | null;
  lastName: string | null;
  fullName: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  company: string | null;
  notes: string | null;
  deviceContactId: string | null;
  lastSynced: string | null;
  syncStatus: SyncStatus;
  userId: number;
  createdAt: string;
  updatedAt: string;
  // Optional task relationship
  tasks?: Array<{
    id: number;
    title: string;
    completed: boolean;
    dueDate: string | null;
  }>;
}

export interface CreateContactInput {
  firstName?: string;
  lastName?: string;
  fullName: string;
  phone?: string;
  email?: string;
  address?: string;
  company?: string;
  notes?: string;
  deviceContactId?: string;
}

export interface UpdateContactInput extends Partial<CreateContactInput> {
  syncStatus?: SyncStatus;
}

export interface ContactsResponse {
  contacts: Contact[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ContactResponse {
  contact: Contact;
}
