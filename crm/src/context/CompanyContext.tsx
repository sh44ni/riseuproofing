import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { CompanyProfile } from '@/types/settingsTypes';
import { INITIAL_COMPANY_PROFILE } from '@/data/settingsData';

export interface CompanyContextType {
  company: CompanyProfile;
  updateCompany: (updated: Partial<CompanyProfile> | CompanyProfile) => void;
  resetCompany: () => void;
  // Computed helpers for quick consumption across all CRM modules
  companyName: string;
  legalName: string;
  dba: string;
  licenseNumber: string;
  licenseType: string;
  hqAddress: string;
  yardAddress: string;
  publicPhone: string;
  dispatchHotline: string;
  primaryEmail: string;
  dispatchEmail: string;
  websiteUrl: string;
  city: string;
  taxRateDefault: number;
  taxRateOceanside: number;
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

const STORAGE_KEY = 'rise_up_company_profile';

export function CompanyProvider({ children }: { children: React.ReactNode }) {
  const [company, setCompanyState] = useState<CompanyProfile>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...INITIAL_COMPANY_PROFILE, ...parsed };
      }
    } catch (e) {
      console.warn('Failed to parse saved company profile', e);
    }
    return INITIAL_COMPANY_PROFILE;
  });

  // Keep state synchronized across tabs, windows, and modules
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          setCompanyState({ ...INITIAL_COMPANY_PROFILE, ...parsed });
        } catch {
          // ignore
        }
      }
    };

    const handleCustomEvent = (e: Event) => {
      const custom = e as CustomEvent<CompanyProfile>;
      if (custom.detail) {
        setCompanyState(custom.detail);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('company_profile_updated', handleCustomEvent);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('company_profile_updated', handleCustomEvent);
    };
  }, []);

  const updateCompany = useCallback((updated: Partial<CompanyProfile> | CompanyProfile) => {
    setCompanyState((prev) => {
      const next = { ...prev, ...updated };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        window.dispatchEvent(new CustomEvent('company_profile_updated', { detail: next }));
      } catch (err) {
        console.error('Failed to save company profile to localStorage', err);
      }
      return next;
    });
  }, []);

  const resetCompany = useCallback(() => {
    setCompanyState(INITIAL_COMPANY_PROFILE);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_COMPANY_PROFILE));
      window.dispatchEvent(new CustomEvent('company_profile_updated', { detail: INITIAL_COMPANY_PROFILE }));
    } catch (err) {
      console.error('Failed to reset company profile', err);
    }
  }, []);

  // Derive city from HQ address if available
  const city = React.useMemo(() => {
    if (!company.hqAddress) return 'Oceanside';
    const parts = company.hqAddress.split(',').map((s) => s.trim());
    if (parts.length >= 3) {
      return parts[parts.length - 2].replace(/\bCA\b.*$/i, '').trim() || parts[parts.length - 2];
    }
    return parts[0] || 'Oceanside';
  }, [company.hqAddress]);

  const value = React.useMemo(
    () => ({
      company,
      updateCompany,
      resetCompany,
      companyName: company.dba || company.legalName || 'Rise Up Roofing',
      legalName: company.legalName || 'Rise Up Roofing & Solar LLC',
      dba: company.dba || 'Rise Up Roofing',
      licenseNumber: company.licenseNumber || 'CSLB #1115874',
      licenseType: company.licenseType || 'Class C-39 Roofing Contractor',
      hqAddress: company.hqAddress || '',
      yardAddress: company.yardAddress || '',
      publicPhone: company.publicPhone || '(760) 842-7890',
      dispatchHotline: company.dispatchHotline || '(760) 842-7899',
      primaryEmail: company.primaryEmail || 'info@riseuproofing.com',
      dispatchEmail: company.dispatchEmail || 'dispatch@riseuproofing.com',
      websiteUrl: company.websiteUrl || 'https://riseuproofing.com',
      city,
      taxRateDefault: company.taxRateDefault ?? 7.75,
      taxRateOceanside: company.taxRateOceanside ?? 8.25,
    }),
    [company, updateCompany, resetCompany, city]
  );

  return <CompanyContext.Provider value={value}>{children}</CompanyContext.Provider>;
}

export function useCompany() {
  const context = useContext(CompanyContext);
  if (!context) {
    throw new Error('useCompany must be used within a CompanyProvider');
  }
  return context;
}
