import type { 
  User, 
  Complaint, 
  Notice, 
  SystemSettings, 
  EmailLog, 
  DashboardStats,
  ComplaintStatus,
  ComplaintPriority,
  ComplaintCategory
} from '../types';

export const api = {
  // Auth

  /** Restore the current session from the JWT httpOnly cookie. */
  async me(): Promise<User> {
    const res = await fetch('/api/auth/me');
    if (!res.ok) throw new Error('Not authenticated');
    return res.json();
  },

  /** Admin only — fetch full user list (used by dev persona switcher). */
  async getUsers(): Promise<User[]> {
    const res = await fetch('/api/auth/users');
    if (!res.ok) throw new Error('Failed to load users');
    return res.json();
  },

  async logout(): Promise<void> {
    await fetch('/api/auth/logout', { method: 'POST' });
  },

  async login(email: string, password?: string): Promise<User> {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || 'Failed to login');
    }
    return res.json();
  },

  async register(data: { name: string; email: string; unitNumber: string; contactNumber?: string; role?: string; password?: string }): Promise<User> {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Registration failed');
    }
    return res.json();
  },

  // Stats
  async getStats(): Promise<DashboardStats> {
    const res = await fetch('/api/stats');
    if (!res.ok) throw new Error('Failed to fetch stats');
    return res.json();
  },

  // Complaints
  async getComplaints(params?: {
    status?: string;
    category?: string;
    priority?: string;
    overdueOnly?: boolean;
    residentId?: string;
    search?: string;
  }): Promise<Complaint[]> {
    const query = new URLSearchParams();
    if (params?.status && params.status !== 'ALL') query.set('status', params.status);
    if (params?.category && params.category !== 'ALL') query.set('category', params.category);
    if (params?.priority && params.priority !== 'ALL') query.set('priority', params.priority);
    if (params?.overdueOnly) query.set('overdueOnly', 'true');
    if (params?.residentId) query.set('residentId', params.residentId);
    if (params?.search) query.set('search', params.search);

    const res = await fetch(`/api/complaints?${query.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch complaints');
    return res.json();
  },

  async getComplaint(id: string): Promise<Complaint> {
    const res = await fetch(`/api/complaints/${id}`);
    if (!res.ok) throw new Error('Complaint not found');
    return res.json();
  },

  async createComplaint(data: {
    residentId: string;
    residentName: string;
    residentUnit: string;
    residentContact: string;
    category: ComplaintCategory;
    title: string;
    description: string;
    photoUrl?: string;
    priority: ComplaintPriority;
  }): Promise<Complaint> {
    const res = await fetch('/api/complaints', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to submit complaint');
    }
    return res.json();
  },

  async updateComplaintStatus(
    id: string,
    payload: {
      newStatus: ComplaintStatus;
      actorId: string;
      actorName: string;
      actorRole: string;
      note?: string;
      assignedTo?: string;
      priority?: ComplaintPriority;
    }
  ): Promise<Complaint> {
    const res = await fetch(`/api/complaints/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Failed to update complaint status');
    return res.json();
  },

  async updateComplaintPriority(id: string, priority: ComplaintPriority): Promise<Complaint> {
    const res = await fetch(`/api/complaints/${id}/priority`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ priority })
    });
    if (!res.ok) throw new Error('Failed to update priority');
    return res.json();
  },

  // Notices
  async getNotices(): Promise<Notice[]> {
    const res = await fetch('/api/notices');
    if (!res.ok) throw new Error('Failed to fetch notices');
    return res.json();
  },

  async createNotice(data: {
    title: string;
    content: string;
    category: string;
    important: boolean;
    authorId: string;
    authorName: string;
    authorRole: string;
  }): Promise<Notice> {
    const res = await fetch('/api/notices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to create notice');
    return res.json();
  },

  async deleteNotice(id: string): Promise<void> {
    const res = await fetch(`/api/notices/${id}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Failed to delete notice');
  },

  // Settings
  async getSettings(): Promise<SystemSettings> {
    const res = await fetch('/api/settings');
    if (!res.ok) throw new Error('Failed to fetch settings');
    return res.json();
  },

  async updateSettings(data: Partial<SystemSettings>): Promise<SystemSettings> {
    const res = await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to update settings');
    return res.json();
  },

  // Email Logs
  async getEmails(): Promise<EmailLog[]> {
    const res = await fetch('/api/emails');
    if (!res.ok) throw new Error('Failed to fetch email logs');
    return res.json();
  },

  // Reset Demo
  async resetDemo(): Promise<void> {
    await fetch('/api/admin/reset-demo', { method: 'POST' });
  }
};
