import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  if (cleaned.length === 11 && cleaned[0] === '1') {
    return `(${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  }
  return phone;
}

export const PHONE_NUMBER = '(760) 622-1230';
export const PHONE_HREF = 'tel:+17606221230';
export const COMPANY_NAME = 'Rise Up Roofing & Construction';
export const LICENSE_NUMBER = '1096492';
export const GOOGLE_REVIEWS_URL = 'https://www.google.com/maps/place/Rise+Up+Roofing+%26+Construction';
export const YELP_REVIEWS_URL = 'https://www.yelp.com/biz/rise-up-roofing-and-construction';
