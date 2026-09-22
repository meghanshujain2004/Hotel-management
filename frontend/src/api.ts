// API client for HotelCRM Backend

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

export interface UserProfile {
  id: number;
  username: string;
  email: string;
  phone: string;
  role: 'admin' | 'manager' | 'support';
  first_name?: string;
  last_name?: string;
  profile_picture?: string | null;
  is_active: boolean;
  date_joined: string;
}

export interface LoginResponse {
  access: string;
  refresh: string;
  role: 'admin' | 'manager' | 'support';
  user_id: number;
}

export interface DashboardMetrics {
  period: string;
  kpi_cards: {
    total_leads: number;
    today_converted: number;
    month_converted: number;
    total_registered: number;
    conversion_rate_percentage: number;
    active_escalations: number;
    level1_support_inaction: number;
    level2_admin_critical: number;
    total_sla_breaches: number;
    avg_call_duration_seconds: number;
  };
  sources_breakdown: Array<{
    source: string;
    source_display: string;
    count: number;
    percentage: number;
  }>;
  funnel: Array<{
    status: string;
    status_display: string;
    count: number;
  }>;
  recent_activities: Array<{
    id: number;
    lead_id: number;
    guest_name: string;
    user_name: string;
    activity_type: string;
    activity_type_display: string;
    notes: string;
    created_at: string;
  }>;
}

export const api = {
  // Store Tokens
  setAuth(tokens: { access: string; refresh: string }, user: Partial<UserProfile>) {
    localStorage.setItem('access_token', tokens.access);
    localStorage.setItem('refresh_token', tokens.refresh);
    localStorage.setItem('user_profile', JSON.stringify(user));
  },

  getAccessToken(): string | null {
    return localStorage.getItem('access_token');
  },

  getSavedUser(): Partial<UserProfile> | null {
    const data = localStorage.getItem('user_profile');
    return data ? JSON.parse(data) : null;
  },

  clearAuth() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_profile');
  },

  getAuthHeaders(): Record<string, string> {
    const token = this.getAccessToken();
    return {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    };
  },

  // Auth: Login
  async login(username: string, password: string): Promise<{ tokens: LoginResponse; profile: UserProfile }> {
    const response = await fetch(`${API_BASE_URL}/api/users/login/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      const errorMsg = errData.detail || 'Invalid email or password. Please try again.';
      throw new Error(errorMsg);
    }

    const tokens: LoginResponse = await response.json();

    // Fetch full profile
    const profileRes = await fetch(`${API_BASE_URL}/api/users/me/`, {
      headers: { 'Authorization': `Bearer ${tokens.access}` },
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

    this.setAuth({ access: tokens.access, refresh: tokens.refresh }, profile);
    return { tokens, profile };
  },

  // Reports: Dashboard Overview
  async getDashboardOverview(period: string = 'all'): Promise<DashboardMetrics> {
    const res = await fetch(`${API_BASE_URL}/api/reports/dashboard-overview/?period=${period}`, {
      headers: this.getAuthHeaders(),
    });
    if (!res.ok) {
      throw new Error('Failed to load dashboard metrics');
    }
    return res.json();
  },

  // Leads: Create New Lead
  async createLead(leadData: any): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/api/leads/`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(leadData),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to create lead');
    }
    return res.json();
  },

  // Leads: List Leads
  async getLeads(params: Record<string, string> = {}): Promise<any> {
    const queryString = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE_URL}/api/leads/${queryString ? `?${queryString}` : ''}`, {
      headers: this.getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch leads');
    return res.json();
  },

  // Staff: Get staff list
  async getStaffUsers(): Promise<any[]> {
    const res = await fetch(`${API_BASE_URL}/api/users/staff/`, {
      headers: this.getAuthHeaders(),
    });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : (data.results || []);
  },

  // Leads: Trigger SLA Escalation Evaluation
  async triggerSLACheck(): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/api/leads/check-escalations/`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to trigger SLA evaluation');
    return res.json();
  },

  // Leads: Get Lead Detail
  async getLead(id: number): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/api/leads/${id}/`, {
      headers: this.getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch lead details');
    return res.json();
  },

  // Leads: Calling Queue Active Lead
  async getActiveQueue(): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/api/leads/queue/active/`, {
      headers: this.getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch calling queue');
    return res.json();
  },

  async getNextQueueLead(): Promise<any> {
    return this.getActiveQueue();
  },

  // Leads: Due Followup Calls
  async getDueFollowups(): Promise<{ due_count: number; overdue_count: number; due_leads: any[] }> {
    const res = await fetch(`${API_BASE_URL}/api/leads/followups/due/`, {
      headers: this.getAuthHeaders(),
    });
    if (!res.ok) return { due_count: 0, overdue_count: 0, due_leads: [] };
    return res.json();
  },

  // Leads: Submit Post-Call Disposition
  async submitDisposition(data: {
    lead_id: number;
    disposition: string;
    call_duration_seconds: number;
    notes: string;
    followup_date_time?: string | null;
  }): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/api/leads/queue/disposition/`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to submit disposition');
    }
    return res.json();
  },

  async logDisposition(data: {
    lead_id: number;
    disposition: string;
    call_duration_seconds: number;
    notes: string;
    followup_date_time?: string | null;
  }): Promise<any> {
    return this.submitDisposition(data);
  },

  // Leads: Manual WhatsApp Template Dispatch
  async sendWhatsAppTemplate(data: { lead_id: number; trigger?: string; template_id?: number }): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/api/leads/whatsapp/send-template/`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to dispatch WhatsApp template');
    }
    return res.json();
  },

  // Leads: Activity Timeline
  async getLeadTimeline(leadId: number): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/api/leads/${leadId}/timeline/`, {
      headers: this.getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch activity timeline');
    return res.json();
  },

  // Leads: Add Timeline Activity/Note
  async addLeadActivity(leadId: number, data: { activity_type: string; notes: string }): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/api/leads/${leadId}/timeline/`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to add note');
    return res.json();
  },

  // Leads: Reassign Lead
  async reassignLead(leadId: number, newUserId: number, notes: string = ''): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/api/leads/${leadId}/reassign/`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ reassign_to_user_id: newUserId, notes }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to reassign lead');
    }
    return res.json();
  },

  // Escalations: Get Escalation Feed
  async getEscalations(level: string = 'all'): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/api/leads/escalations/${level !== 'all' ? `?level=${level}` : ''}`, {
      headers: this.getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch escalations');
    return res.json();
  },

  // Reports: Team Performance Leaderboard
  async getTeamPerformance(): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/api/reports/team-performance/`, {
      headers: this.getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch team performance');
    return res.json();
  },

  // Reports: Export CSV Report
  async exportCSV(reportType: string = 'all') {
    const res = await fetch(`${API_BASE_URL}/api/reports/export/?type=${reportType}`, {
      headers: this.getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to export report');
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hotelcrm_performance_report_${reportType}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },
};
