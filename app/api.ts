// API client for HotelCRM Backend — React Native version
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'https://hotel-management-rm4l.onrender.com';

export interface UserProfile {
  id: number;
  username: string;
  first_name?: string;
  last_name?: string;
  email: string;
  phone: string;
  role: 'admin' | 'manager' | 'support';
  gender?: 'male' | 'female' | string;
  profile_picture?: string | null;
  is_active: boolean;
  date_joined: string;
}

export interface Lead {
  id: number;
  guest_name: string;
  phone: string;
  email?: string;
  source: string;
  status: string;
  priority: string;
  inquiry_details?: string;
  assigned_to?: { id: number; username: string; full_name?: string } | null;
  assigned_to_name?: string;
  assigned_manager?: { id: number; username: string; full_name?: string } | null;
  assigned_manager_name?: string;
  followup_date_time?: string | null;
  last_contacted_at?: string | null;
  last_call_duration: number;
  last_disposition_note?: string;
  escalation_level: string;
  is_escalated: boolean;
  escalation_date?: string | null;
  support_breach_count: number;
  manager_breach_count: number;
  overdue_duration_display?: string | null;
  reassigned_notice?: string;
  created_at: string;
  updated_at: string;
}

export interface ActivityLog {
  id: number;
  lead_id: number;
  user?: { id: number; username: string } | null;
  activity_type: string;
  activity_type_display: string;
  disposition?: string | null;
  call_duration_seconds: number;
  notes: string;
  whatsapp_template_name?: string | null;
  whatsapp_message_body?: string | null;
  whatsapp_status?: string | null;
  created_at: string;
}

const getToken = async (): Promise<string | null> => {
  return await AsyncStorage.getItem('access_token');
};

const getAuthHeaders = async (): Promise<Record<string, string>> => {
  const token = await getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export const parseApiError = async (res: Response, fallback: string): Promise<string> => {
  try {
    const errData = await res.json();
    if (!errData) return fallback;
    if (typeof errData.detail === 'string') return errData.detail;
    if (typeof errData.message === 'string') return errData.message;

    if (typeof errData === 'object') {
      const messages: string[] = [];
      for (const key of Object.keys(errData)) {
        const val = errData[key];
        const fieldName = key.replace(/_/g, ' ').toUpperCase();
        if (Array.isArray(val)) {
          messages.push(`${fieldName}: ${val.join(', ')}`);
        } else if (typeof val === 'string') {
          messages.push(`${fieldName}: ${val}`);
        }
      }
      if (messages.length > 0) {
        return messages.join('\n');
      }
    }
  } catch {
    // Ignore JSON parse errors
  }
  return fallback;
};

const fetchWithAuth = async (url: string, options: RequestInit = {}): Promise<Response> => {
  let headers = await getAuthHeaders();
  let res = await fetch(url, { ...options, headers: { ...headers, ...(options.headers || {}) } });

  if (res.status === 401) {
    const refreshed = await api.refreshToken();
    if (refreshed) {
      headers = await getAuthHeaders();
      res = await fetch(url, { ...options, headers: { ...headers, ...(options.headers || {}) } });
    }
  }

  return res;
};

export const api = {
  async setAuth(tokens: { access: string; refresh: string }, user: Partial<UserProfile>) {
    await AsyncStorage.setItem('access_token', tokens.access);
    await AsyncStorage.setItem('refresh_token', tokens.refresh);
    await AsyncStorage.setItem('user_profile', JSON.stringify(user));
  },

  async getSavedUser(): Promise<Partial<UserProfile> | null> {
    const data = await AsyncStorage.getItem('user_profile');
    return data ? JSON.parse(data) : null;
  },

  async clearAuth() {
    await AsyncStorage.removeItem('access_token');
    await AsyncStorage.removeItem('refresh_token');
    await AsyncStorage.removeItem('user_profile');
  },

  async refreshToken(): Promise<boolean> {
    try {
      const refreshToken = await AsyncStorage.getItem('refresh_token');
      if (!refreshToken) return false;

      const res = await fetch(`${API_BASE_URL}/api/users/token/refresh/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh: refreshToken }),
      });

      if (res.ok) {
        const data = await res.json();
        await AsyncStorage.setItem('access_token', data.access);
        if (data.refresh) {
          await AsyncStorage.setItem('refresh_token', data.refresh);
        }
        return true;
      }
    } catch {
      // Refresh failed
    }
    return false;
  },

  async login(username: string, password: string) {
    const response = await fetch(`${API_BASE_URL}/api/users/login/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    if (!response.ok) {
      const errMsg = await parseApiError(response, 'Invalid username or password.');
      throw new Error(errMsg);
    }
    const tokens = await response.json();
    const profileRes = await fetch(`${API_BASE_URL}/api/users/me/`, {
      headers: { Authorization: `Bearer ${tokens.access}` },
    });
    let profile: UserProfile;
    if (profileRes.ok) {
      profile = await profileRes.json();
    } else {
      profile = {
        id: tokens.user_id,
        username,
        email: '',
        phone: '',
        role: tokens.role,
        is_active: true,
        date_joined: new Date().toISOString(),
      };
    }
    await this.setAuth({ access: tokens.access, refresh: tokens.refresh }, profile);
    return profile;
  },

  async getDashboardOverview(period = 'all') {
    const res = await fetchWithAuth(`${API_BASE_URL}/api/reports/dashboard-overview/?period=${period}`);
    if (!res.ok) {
      const errMsg = await parseApiError(res, 'Failed to load dashboard');
      throw new Error(errMsg);
    }
    return res.json();
  },

  async getLeads(params: Record<string, string> = {}) {
    const qs = new URLSearchParams(params).toString();
    const res = await fetchWithAuth(`${API_BASE_URL}/api/leads/${qs ? `?${qs}` : ''}`);
    if (!res.ok) {
      const errMsg = await parseApiError(res, 'Failed to fetch leads');
      throw new Error(errMsg);
    }
    return res.json();
  },

  async getLead(id: number): Promise<Lead> {
    const res = await fetchWithAuth(`${API_BASE_URL}/api/leads/${id}/`);
    if (!res.ok) {
      const errMsg = await parseApiError(res, 'Failed to fetch lead');
      throw new Error(errMsg);
    }
    return res.json();
  },

  async getActiveQueue() {
    const res = await fetchWithAuth(`${API_BASE_URL}/api/leads/queue/active/`);
    if (!res.ok) {
      const errMsg = await parseApiError(res, 'Failed to fetch queue');
      throw new Error(errMsg);
    }
    return res.json();
  },

  async getDueFollowups(): Promise<{ due_count: number; overdue_count: number; due_leads: Lead[] }> {
    const res = await fetchWithAuth(`${API_BASE_URL}/api/leads/followups/due/`);
    if (!res.ok) {
      return { due_count: 0, overdue_count: 0, due_leads: [] };
    }
    return res.json();
  },

  async submitDisposition(data: {
    lead_id: number;
    disposition: string;
    call_duration_seconds: number;
    notes: string;
    followup_date_time?: string | null;
  }) {
    const res = await fetchWithAuth(`${API_BASE_URL}/api/leads/queue/disposition/`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const errMsg = await parseApiError(res, 'Failed to submit disposition');
      throw new Error(errMsg);
    }
    return res.json();
  },

  async sendWhatsAppTemplate(data: { lead_id: number; trigger?: string; template_id?: number }) {
    const res = await fetchWithAuth(`${API_BASE_URL}/api/leads/whatsapp/send-template/`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const errMsg = await parseApiError(res, 'Failed to dispatch WhatsApp template');
      throw new Error(errMsg);
    }
    return res.json();
  },

  async getLeadTimeline(leadId: number) {
    const res = await fetchWithAuth(`${API_BASE_URL}/api/leads/${leadId}/timeline/`);
    if (!res.ok) {
      const errMsg = await parseApiError(res, 'Failed to fetch timeline');
      throw new Error(errMsg);
    }
    return res.json();
  },

  async getEscalations(level = 'all') {
    const qs = level !== 'all' ? `?level=${level}` : '';
    const res = await fetchWithAuth(`${API_BASE_URL}/api/leads/escalations/${qs}`);
    if (!res.ok) {
      const errMsg = await parseApiError(res, 'Failed to fetch escalations');
      throw new Error(errMsg);
    }
    return res.json();
  },

  async getTeamPerformance() {
    const res = await fetchWithAuth(`${API_BASE_URL}/api/reports/team-performance/`);
    if (!res.ok) {
      const errMsg = await parseApiError(res, 'Failed to fetch team performance');
      throw new Error(errMsg);
    }
    return res.json();
  },

  async getStaffUsers(): Promise<UserProfile[]> {
    const res = await fetchWithAuth(`${API_BASE_URL}/api/users/staff/`);
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : data.results || [];
  },

  async reassignLead(leadId: number, newUserId: number, notes = '') {
    const res = await fetchWithAuth(`${API_BASE_URL}/api/leads/${leadId}/reassign/`, {
      method: 'POST',
      body: JSON.stringify({ reassign_to_user_id: newUserId, notes }),
    });
    if (!res.ok) {
      const errMsg = await parseApiError(res, 'Failed to reassign');
      throw new Error(errMsg);
    }
    return res.json();
  },

  async createLead(data: any) {
    const res = await fetchWithAuth(`${API_BASE_URL}/api/leads/`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const errMsg = await parseApiError(res, 'Failed to create lead');
      throw new Error(errMsg);
    }
    return res.json();
  },

  async createStaff(data: {
    username: string;
    email?: string;
    phone?: string;
    password: string;
    role: string;
    gender?: string;
  }) {
    const res = await fetchWithAuth(`${API_BASE_URL}/api/users/staff/`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const errMsg = await parseApiError(res, 'Failed to create staff member');
      throw new Error(errMsg);
    }
    return res.json();
  },

  async deleteStaff(userId: number) {
    const res = await fetchWithAuth(`${API_BASE_URL}/api/users/staff/${userId}/`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      const errMsg = await parseApiError(res, 'Failed to remove staff member');
      throw new Error(errMsg);
    }
    return res.json();
  },

  async deleteLead(leadId: number) {
    const res = await fetchWithAuth(`${API_BASE_URL}/api/leads/${leadId}/`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      const errMsg = await parseApiError(res, 'Failed to delete lead');
      throw new Error(errMsg);
    }
    return true;
  },

  async uploadLeadExcel(file: { uri: string; name: string; type?: string }) {
    const formData = new FormData();
    formData.append('file', {
      uri: file.uri,
      name: file.name,
      type: file.type || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    } as any);

    const token = await AsyncStorage.getItem('access_token');
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`${API_BASE_URL}/api/leads/upload-excel/`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!res.ok) {
      const errMsg = await parseApiError(res, 'Failed to upload Excel file');
      throw new Error(errMsg);
    }
    return res.json();
  },
};

