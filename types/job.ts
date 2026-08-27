export interface Job {
  slug: string;
  title: string;
  department: string;
  employmentType: 'full-time' | 'part-time' | 'contract';
  description: string;
  responsibilities: string[];
  requirements: string[];
}
