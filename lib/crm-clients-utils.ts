/**
 * Client-safe pure utilities for phone formatting and normalizations.
 * No server dependencies or database imports.
 */

/**
 * Normalizes a phone string down to 10 digits (US standard)
 * Handles (747) 245-0035, +1-747-245-0035, 7472450035 -> 7472450035
 */
export function normalizePhone(raw?: string | null): string | null {
  if (!raw) return null;
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 11 && digits.startsWith('1')) {
    return digits.slice(1);
  }
  if (digits.length >= 10) {
    return digits.slice(-10);
  }
  return digits.length > 0 ? digits : null;
}

/**
 * Formats a 10-digit phone number as (XXX) XXX-XXXX for clean display
 */
export function formatPhone(phone?: string | null): string {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  return phone;
}

/**
 * Formats a date or timestamp into a readable date: "MMM D, YYYY"
 */
export function formatClientSince(rawDate?: string | Date | null): string {
  if (!rawDate) return 'Recent';
  try {
    const d = new Date(rawDate);
    if (isNaN(d.getTime())) return 'Recent';
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return 'Recent';
  }
}

/**
 * Calculates human-readable client relationship tenure:
 * e.g. "New Client (This week)", "Client for 8 mos", "Client for 2 yrs 3 mos"
 */
export function formatClientTenure(rawDate?: string | Date | null): string {
  if (!rawDate) return 'New Client';
  try {
    const d = new Date(rawDate);
    if (isNaN(d.getTime())) return 'New Client';
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    if (diffMs < 0) return 'New Client';

    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays < 7) return 'New Client (This week)';
    if (diffDays < 30) {
      const weeks = Math.max(1, Math.floor(diffDays / 7));
      return `Client for ${weeks} ${weeks === 1 ? 'wk' : 'wks'}`;
    }

    const diffMonths = Math.floor(diffDays / 30.4375);
    if (diffMonths < 12) {
      return `Client for ${diffMonths} ${diffMonths === 1 ? 'mo' : 'mos'}`;
    }

    const years = Math.floor(diffMonths / 12);
    const remainingMonths = diffMonths % 12;
    if (remainingMonths === 0) {
      return `Client for ${years} ${years === 1 ? 'yr' : 'yrs'}`;
    }
    return `Client for ${years} ${years === 1 ? 'yr' : 'yrs'} ${remainingMonths} mo`;
  } catch {
    return 'New Client';
  }
}

/**
 * Returns role display badge properties and color styling
 */
export function getRoleBadgeInfo(role?: string | null): {
  label: string;
  bg: string;
  text: string;
  border: string;
} {
  switch (role?.toLowerCase()) {
    case 'owner':
      return {
        label: 'Owner / Principal',
        bg: 'bg-amber-50 text-amber-700',
        text: 'text-amber-700',
        border: 'border-amber-200/80',
      };
    case 'project_manager':
      return {
        label: 'Project Manager',
        bg: 'bg-blue-50 text-blue-700',
        text: 'text-blue-700',
        border: 'border-blue-200/80',
      };
    case 'sales_rep':
      return {
        label: 'Sales Representative',
        bg: 'bg-emerald-50 text-emerald-700',
        text: 'text-emerald-700',
        border: 'border-emerald-200/80',
      };
    case 'field_foreman':
      return {
        label: 'Field Foreman',
        bg: 'bg-purple-50 text-purple-700',
        text: 'text-purple-700',
        border: 'border-purple-200/80',
      };
    case 'office_admin':
      return {
        label: 'Office Coordinator',
        bg: 'bg-slate-100 text-slate-700',
        text: 'text-slate-700',
        border: 'border-slate-200/80',
      };
    case 'door_knocker':
    case 'canvasser':
      return {
        label: 'Field Canvasser',
        bg: 'bg-orange-50 text-orange-700',
        text: 'text-orange-700',
        border: 'border-orange-200/80',
      };
    default:
      return {
        label: role ? role.replace(/_/g, ' ') : 'Team Member',
        bg: 'bg-slate-50 text-slate-600',
        text: 'text-slate-600',
        border: 'border-slate-200',
      };
  }
}

