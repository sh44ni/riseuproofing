// Rise Up CRM - Centralized FastAPI Client

export function getBackendBaseUrl(): string {
  if (import.meta.env.VITE_BACKEND_URL) return import.meta.env.VITE_BACKEND_URL.replace(/\/$/, '');
  if (import.meta.env.VITE_API_BASE_URL) return import.meta.env.VITE_API_BASE_URL.replace(/\/$/, '');
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '');
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host.includes('riseuprac.com') || host.includes('vercel.app')) {
      return 'https://backend.riseuprac.com';
    }
  }
  return 'http://localhost:8000';
}

export const API_ORIGIN = getBackendBaseUrl();
export const API_BASE = `${API_ORIGIN}/api`;

class ApiClient {
  private token: string | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('crm_auth_token');
    }
  }

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('crm_auth_token', token);
    } else {
      localStorage.removeItem('crm_auth_token');
    }
  }

  getToken(): string | null {
    return this.token;
  }

  getAuthHeaders(): Record<string, string> {
    const apiKey = (import.meta as any).env?.VITE_CRM_API_KEY || 'rup_live_vhu3GEw1RtOSVEKNG881wT_whHOOiadXbnBzqiichUw';
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'X-Client-Platform': 'crm-web',
    };
    if (apiKey) {
      headers['X-API-Key'] = apiKey;
    }
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    return headers;
  }

  async request<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`;
    const baseHeaders = this.getAuthHeaders();
    const headers: Record<string, string> = {
      ...baseHeaders,
      ...((options.headers as Record<string, string>) || {}),
    };

    let body = options.body;
    if (body && typeof body === 'object' && !(body instanceof FormData) && !(body instanceof Blob)) {
      body = JSON.stringify(body);
    }

    if (body instanceof FormData) {
      delete headers['Content-Type'];
    }

    const res = await fetch(url, {
      ...options,
      body,
      headers,
      credentials: 'include',
    });

    if (res.status === 401 && !endpoint.includes('/auth/login')) {
      this.setToken(null);
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
      throw new Error('Session expired. Please log in again.');
    }

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      let errorMsg = `Request failed with status ${res.status}`;
      if (typeof data.detail === 'string') {
        errorMsg = data.detail;
      } else if (Array.isArray(data.detail)) {
        errorMsg = data.detail.map((d: any) => (typeof d === 'string' ? d : d.msg || JSON.stringify(d))).join(', ');
      } else if (data.detail && typeof data.detail === 'object') {
        errorMsg = data.detail.message || JSON.stringify(data.detail);
      } else if (data.error) {
        errorMsg = typeof data.error === 'string' ? data.error : (data.error.message || JSON.stringify(data.error));
      } else if (data.message) {
        errorMsg = typeof data.message === 'string' ? data.message : JSON.stringify(data.message);
      }
      throw new Error(errorMsg);
    }

    return data as T;
  }

  // ── Authentication ──
  async login(password: string, email?: string) {
    const res = await this.request('/admin/auth/login', {
      method: 'POST',
      body: JSON.stringify({ password, email: email || 'admin@riseuprac.com' }),
    });
    if (res.token) {
      this.setToken(res.token);
    }
    return res;
  }

  async logout() {
    try {
      await this.request('/admin/auth/logout', { method: 'POST' });
    } catch {
      // ignore network errors when offline
    } finally {
      this.setToken(null);
    }
  }

  async getMe() {
    return await this.request('/admin/auth/me');
  }

  // ── Profile & Account Management ──
  async getProfile(): Promise<{ ok: boolean; user: any }> {
    return await this.request('/admin/profile');
  }

  async updateProfile(data: { name?: string; phone?: string; avatar_url?: string }): Promise<{ ok: boolean; message?: string; user: any }> {
    return await this.request('/admin/profile', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async changePassword(data: { current_password?: string; currentPassword?: string; new_password?: string; newPassword?: string }): Promise<{ ok: boolean; message: string }> {
    return await this.request('/admin/profile/password', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async uploadAvatar(file: File): Promise<{ ok: boolean; avatar_url: string; message?: string }> {
    const formData = new FormData();
    formData.append('file', file);
    return await this.request('/admin/profile/avatar', {
      method: 'POST',
      body: formData,
    });
  }

  async removeAvatar(): Promise<{ ok: boolean; avatar_url: null; message?: string }> {
    return await this.request('/admin/profile/avatar', {
      method: 'DELETE',
    });
  }

  // ── Dashboard & Vitals ──
  async getDashboard() {
    return this.request('/admin/dashboard');
  }

  // ── Pipeline & Kanban ──
  async getPipeline() {
    return this.request('/admin/pipeline');
  }

  async updateLeadStage(leadId: number | string, stage: string, notes?: string) {
    return this.request(`/admin/pipeline/leads/${leadId}/stage`, {
      method: 'PATCH',
      body: JSON.stringify({ stage, notes }),
    });
  }

  // ── Leads ──
  async getLeads(params?: Record<string, any>) {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.request(`/admin/leads${qs}`);
  }

  async getLead(id: number | string) {
    return this.request(`/admin/leads/${id}`);
  }

  async createLead(payload: any) {
    return this.request('/admin/leads', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async updateLead(id: number | string, payload: any) {
    return this.request(`/admin/leads/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }

  async deleteLead(id: number | string) {
    return this.request(`/admin/leads/${id}`, {
      method: 'DELETE',
    });
  }

  async claimLead(id: number | string) {
    return this.request(`/admin/pipeline/${id}/claim`, {
      method: 'POST',
    });
  }

  async getLeadActivities(id: number | string) {
    return this.request(`/admin/leads/${id}/activities`);
  }

  async addLeadActivity(
    id: number | string,
    activity: {
      title: string;
      description?: string;
      activityType?: string;
      authorName?: string;
      authorRole?: string;
    }
  ) {
    return this.request(`/admin/leads/${id}/activities`, {
      method: 'POST',
      body: JSON.stringify(activity),
    });
  }

  async getLeadSources() {
    return this.request('/admin/leads/sources');
  }

  // ── Clients 360 ──
  async getClients(params?: Record<string, any>) {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.request(`/admin/clients${qs}`);
  }

  async getClient(id: number | string) {
    return this.request(`/admin/clients/${id}`);
  }

  async createClient(payload: any) {
    return this.request('/admin/clients', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async updateClient(id: number | string, payload: any) {
    return this.request(`/admin/clients/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  }

  async archiveClient(id: number | string) {
    return this.request(`/admin/clients/${id}`, {
      method: 'DELETE',
    });
  }

  async addClientActivity(id: number | string, payload: any) {
    return this.request(`/admin/clients/${id}/activities`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  // ── Client Tasks ──
  async getClientTasks(clientId: number | string) {
    return this.request(`/admin/clients/${clientId}/tasks`);
  }

  async createClientTask(clientId: number | string, payload: any) {
    return this.request(`/admin/clients/${clientId}/tasks`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async updateClientTask(clientId: number | string, taskId: number | string, payload: any) {
    return this.request(`/admin/clients/${clientId}/tasks/${taskId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }

  // ── Client Documents ──
  async getClientDocuments(clientId: number | string) {
    return this.request(`/admin/clients/${clientId}/documents`);
  }

  async uploadClientDocument(clientId: number | string, file: File) {
    const formData = new FormData();
    formData.append('file', file);
    return this.request(`/admin/clients/${clientId}/documents`, {
      method: 'POST',
      body: formData,
    });
  }

  async deleteClientDocument(clientId: number | string, docId: number | string) {
    return this.request(`/admin/clients/${clientId}/documents/${docId}`, {
      method: 'DELETE',
    });
  }

  // ── Estimates ──
  async getEstimates() {
    return this.request('/admin/estimates');
  }

  async createEstimate(payload: any) {
    return this.request('/admin/estimates', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async generateEstimatePdf(payload: any) {
    return this.request('/admin/estimates/generate-pdf', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async calculateUniversalPricing(payload: any) {
    return this.request('/admin/estimates/calculate', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  getEstimatePdfUrl(id: number | string) {
    return `${API_BASE}/admin/estimates/${id}/pdf`;
  }

  async uploadClientEstimatePhoto(file: File): Promise<{ ok: boolean; url: string; filename: string }> {
    const formData = new FormData();
    formData.append('file', file);
    return this.request('/admin/estimates/upload-photo', {
      method: 'POST',
      body: formData,
    });
  }

  async sendEstimateEmail(payload: {
    customerEmail: string;
    customerName: string;
    estimateNumber: string;
    estimateId?: number | string;
    clientId?: number | string;
    leadId?: number | string;
    templateKey?: string;
    proposalData?: any;
    pdfUrl?: string;
    subject?: string;
    message?: string;
  }): Promise<{ ok: boolean; mock?: boolean; message: string; emailId: string; pdfUrl: string; sentAt: string; recipient: string }> {
    return this.request('/admin/estimates/send-email', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  // ── Estimate Templates ──
  async getEstimateTemplates() {
    return this.request('/admin/estimates/templates');
  }

  async createEstimateTemplate(payload: any) {
    return this.request('/admin/estimates/templates', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async updateEstimateTemplate(id: number | string, payload: any) {
    return this.request(`/admin/estimates/templates/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }

  async deleteEstimateTemplate(id: number | string) {
    return this.request(`/admin/estimates/templates/${id}`, {
      method: 'DELETE',
    });
  }

  // ── Jobs ──
  async getJobs() {
    return this.request('/admin/jobs');
  }

  async getJob(id: number | string) {
    return this.request(`/admin/jobs/${id}`);
  }

  // ── Calendar & Operations Tasks ──
  async getCalendarEvents(start?: string, end?: string) {
    const qs = start && end ? `?start=${start}&end=${end}` : '';
    return this.request(`/admin/calendar/events${qs}`);
  }

  async getTasks(params?: Record<string, any>) {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.request(`/admin/tasks${qs}`);
  }

  async createTask(payload: any) {
    return this.request('/admin/tasks', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async updateTask(payload: any) {
    return this.request('/admin/tasks', {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  }

  async deleteTask(id: string | number) {
    return this.request(`/admin/tasks?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  }

  // ── Personal Tasks & Sticky Notes (Dashboard Dock) ──
  async getPersonalTasks() {
    return this.request('/admin/users/me/tasks');
  }

  async createPersonalTask(task: any) {
    return this.request('/admin/users/me/tasks', {
      method: 'POST',
      body: JSON.stringify(task),
    });
  }

  async updatePersonalTask(id: string, updates: any) {
    return this.request(`/admin/users/me/tasks/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deletePersonalTask(id: string) {
    return this.request(`/admin/users/me/tasks/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  }

  async reorderPersonalTasks(items: Array<{ id: string; sort_order: number }>) {
    return this.request('/admin/users/me/tasks/reorder', {
      method: 'PUT',
      body: JSON.stringify({ items }),
    });
  }

  // ── Finances & Invoices ──
  async getFinances() {
    return this.request('/admin/finances');
  }

  // ── Reviews & Reputation ──
  async getReviews() {
    return this.request('/admin/reviews');
  }

  // ── Dynamic RBAC, Roles & Permissions ──
  async getRoles(): Promise<{ roles: any[] }> {
    return this.request('/admin/roles');
  }

  async createRole(data: {
    name: string;
    description?: string;
    permissions?: Array<{ permission_id: number; scope: string }>;
    modules?: Record<string, { view: string; manage: boolean }>;
  }) {
    return this.request('/admin/roles', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateRole(
    roleId: number,
    data: {
      name?: string;
      description?: string;
      permissions?: Array<{ permission_id: number; scope: string }>;
      modules?: Record<string, { view: string; manage: boolean }>;
    }
  ) {
    return this.request(`/admin/roles/${roleId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteRole(roleId: number) {
    return this.request(`/admin/roles/${roleId}`, {
      method: 'DELETE',
    });
  }

  async getPermissions(): Promise<{ permissions: any[] }> {
    return this.request('/admin/permissions');
  }

  // ── Users Management ──
  async getUsers(): Promise<{ users: any[] }> {
    return this.request('/admin/users');
  }

  async createUser(data: { name: string; email: string; phone?: string; role?: string; password?: string }) {
    return this.request('/admin/users', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateUser(userId: number, data: { name?: string; phone?: string; role?: string; role_id?: number; status?: string; avatar_url?: string }) {
    return this.request(`/admin/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // ── Team Invitations ──
  async getInvitations(): Promise<{ invitations: any[] }> {
    return this.request('/admin/invitations');
  }

  async createInvitation(data: { email: string; roleIds?: number[]; roleId?: number }) {
    return this.request('/admin/invitations', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async revokeInvitation(invitationId: number) {
    return this.request(`/admin/invitations/${invitationId}`, {
      method: 'DELETE',
    });
  }

  async resendInvitation(invitationId: number) {
    return this.request(`/admin/invitations/${invitationId}/resend`, {
      method: 'POST',
    });
  }

  // ── Settings & System ──
  async getSettings() {
    return this.request('/admin/settings');
  }

  async updateSettings(key: string, value: any) {
    return this.request('/admin/settings', {
      method: 'POST',
      body: JSON.stringify({ key, value }),
    });
  }

  async getAuditLogs(params?: Record<string, any>) {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.request(`/admin/audit/logs${qs}`);
  }

  async getEstimatorConfig() {
    return this.request('/admin/estimator');
  }

  async updateEstimatorConfig(payload: any) {
    return this.request('/admin/estimator', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async exportData(type?: string) {
    const qs = type ? `?type=${type}` : '';
    return this.request(`/admin/export${qs}`);
  }

  // ── Pipeline Analytics & Config ──
  async getPipelineAnalytics() {
    return this.request('/admin/pipeline/analytics');
  }

  async getPipelineStagesConfig() {
    return this.request('/admin/pipeline/stages/config');
  }

  // ── Public Invitations ──
  async getPublicInvitation(token: string) {
    return this.request(`/public/invitations/${token}`);
  }

  async acceptPublicInvitation(token: string, data: { name: string; password: string; phone?: string }) {
    return this.request(`/public/invitations/${token}/accept`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // ── Reports ──
  async getRevenueReport(from?: string, to?: string) {
    const params = new URLSearchParams();
    if (from) params.append('from', from);
    if (to) params.append('to', to);
    return this.request(`/admin/reports/revenue?${params.toString()}`);
  }

  async getLeadConversionReport(from?: string, to?: string) {
    const params = new URLSearchParams();
    if (from) params.append('from', from);
    if (to) params.append('to', to);
    return this.request(`/admin/reports/lead-conversion?${params.toString()}`);
  }

  async getSalesRepReport(from?: string, to?: string) {
    const params = new URLSearchParams();
    if (from) params.append('from', from);
    if (to) params.append('to', to);
    return this.request(`/admin/reports/sales-reps?${params.toString()}`);
  }

  async getPipelineVelocityReport(from?: string, to?: string) {
    const params = new URLSearchParams();
    if (from) params.append('from', from);
    if (to) params.append('to', to);
    return this.request(`/admin/reports/pipeline-velocity?${params.toString()}`);
  }

  async getLeadSourcesReport(from?: string, to?: string) {
    const params = new URLSearchParams();
    if (from) params.append('from', from);
    if (to) params.append('to', to);
    return this.request(`/admin/reports/lead-sources?${params.toString()}`);
  }

  async getReportKpis(from?: string, to?: string): Promise<any> {
    const params = new URLSearchParams();
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    return this.request(`/admin/reports/kpis?${params.toString()}`);
  }

  async getSpeedToLeadDistribution(from?: string, to?: string) {
    const params = new URLSearchParams();
    if (from) params.append('from', from);
    if (to) params.append('to', to);
    return this.request(`/admin/reports/speed-to-lead-distribution?${params.toString()}`);
  }

  async getExecutiveInsights(from?: string, to?: string) {
    const params = new URLSearchParams();
    if (from) params.append('from', from);
    if (to) params.append('to', to);
    return this.request(`/admin/reports/insights?${params.toString()}`);
  }

  async getTopPerformers(): Promise<{ ok: boolean; totalCompletedJobs: number; performers: any[] }> {
    return this.request('/admin/reports/top-performers');
  }
}

export const api = new ApiClient();
export default api;
