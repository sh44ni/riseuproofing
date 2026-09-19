import { z } from 'zod';

export const estimateFormSchema = z.object({
  serviceType: z.enum(['installation', 'repair', 'commercial', 'construction', 'solar', 'other']),
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().min(10, 'Please enter a valid phone number'),
  email: z.string().email('Please enter a valid email address').optional().or(z.literal('')),
  address: z.string().min(5, 'Please enter your address'),
  zip: z.string().length(5, 'ZIP code must be 5 digits'),
  preferredContactTime: z.enum(['morning', 'afternoon', 'evening']).optional(),
  notes: z.string().optional(),
  honeypot: z.string().max(0, 'Bot detected').optional(),
});

export type EstimateFormData = z.infer<typeof estimateFormSchema>;

export const contactFormSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().min(10, 'Please enter a valid phone number').optional().or(z.literal('')),
  subject: z.string().min(2, 'Please enter a subject'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
  honeypot: z.string().max(0, 'Bot detected').optional(),
});

export type ContactFormData = z.infer<typeof contactFormSchema>;
