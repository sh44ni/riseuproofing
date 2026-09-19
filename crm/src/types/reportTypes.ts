export type DateRangeFilter =
  | 'last_30_days'
  | 'this_quarter'
  | 'ytd'
  | 'last_year';

export type ReportTab =
  | 'revenue'
  | 'lead_sources'
  | 'sales_reps';

export interface RevenueDataPoint {
  month: string;
  shortMonth: string;
  revenue: number;
  target: number;
  bookedJobs: number;
  avgTicket: number;
}

export interface MaterialRevenueSplit {
  category: string;
  name: string;
  revenue: number;
  percentage: number;
  color: string;
  squaresCount: number;
}

export interface LeadSourceMetric {
  source: string;
  channelName: string;
  leadsCount: number;
  wonCount: number;
  winRate: number; // percentage
  cac: number; // customer acquisition cost in $
  totalRevenue: number;
  roiMultiple: number; // e.g. 11.2x
}

export interface SalesRepPerformance {
  repId: string;
  name: string;
  role: string;
  initials: string;
  quotedAmount: number;
  closedAmount: number;
  wonJobs: number;
  winRate: number;
  avgTicket: number;
  commissionEarned: number;
  avatarColor: string;
  badge?: string;
}

export interface ExecutiveInsight {
  id: string;
  type: 'opportunity' | 'warning' | 'achievement';
  title: string;
  impact: string;
  recommendation: string;
  category: string;
}
