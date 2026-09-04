import { NextRequest, NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/admin-auth';
import { query } from '@/lib/db';

export async function GET(req: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // 1. Pipeline Funnel Metrics
    const [leadsCounts, jobsCount, completedJobsCount] = await Promise.all([
      query<{
        total_leads: string;
        contacted: string;
        inspected: string;
        quoted: string;
        won: string;
      }>(`
        SELECT 
          COUNT(*) as total_leads,
          COUNT(CASE WHEN status IN ('contacted', 'inspected', 'quoted', 'won') THEN 1 END) as contacted,
          COUNT(CASE WHEN status IN ('inspected', 'quoted', 'won') THEN 1 END) as inspected,
          COUNT(CASE WHEN status IN ('quoted', 'won') THEN 1 END) as quoted,
          COUNT(CASE WHEN status = 'won' THEN 1 END) as won
        FROM leads
      `),
      query<{ count: string; total_contract: string }>(`
        SELECT COUNT(*) as count, COALESCE(SUM(contract_value), 0) as total_contract FROM jobs
      `),
      query<{ count: string }>(`
        SELECT COUNT(*) as count FROM jobs WHERE stage = 'complete'
      `),
    ]);

    const leadStats = leadsCounts[0] || {
      total_leads: '0',
      contacted: '0',
      inspected: '0',
      quoted: '0',
      won: '0',
    };

    const totalLeads = parseInt(leadStats.total_leads, 10);
    const contacted = parseInt(leadStats.contacted, 10);
    const inspected = parseInt(leadStats.inspected, 10);
    const quoted = parseInt(leadStats.quoted, 10);
    const won = Math.max(parseInt(leadStats.won, 10), parseInt(jobsCount[0]?.count || '0', 10));
    const completed = parseInt(completedJobsCount[0]?.count || '0', 10);

    const funnel = [
      {
        stage: 'Leads Captured',
        count: totalLeads,
        conversionPct: 100,
        dropoffPct: totalLeads > 0 ? (((totalLeads - contacted) / totalLeads) * 100).toFixed(1) : '0',
      },
      {
        stage: 'Contacted & Qualified',
        count: contacted,
        conversionPct: totalLeads > 0 ? ((contacted / totalLeads) * 100).toFixed(1) : '0',
        dropoffPct: contacted > 0 ? (((contacted - inspected) / contacted) * 100).toFixed(1) : '0',
      },
      {
        stage: 'Roof Inspected',
        count: inspected,
        conversionPct: totalLeads > 0 ? ((inspected / totalLeads) * 100).toFixed(1) : '0',
        dropoffPct: inspected > 0 ? (((inspected - quoted) / inspected) * 100).toFixed(1) : '0',
      },
      {
        stage: 'Proposal Quoted',
        count: quoted,
        conversionPct: totalLeads > 0 ? ((quoted / totalLeads) * 100).toFixed(1) : '0',
        dropoffPct: quoted > 0 ? (((quoted - won) / quoted) * 100).toFixed(1) : '0',
      },
      {
        stage: 'Won / Signed Contract',
        count: won,
        conversionPct: totalLeads > 0 ? ((won / totalLeads) * 100).toFixed(1) : '0',
        dropoffPct: won > 0 ? (((won - completed) / won) * 100).toFixed(1) : '0',
      },
      {
        stage: 'Roof Completed & Passed',
        count: completed,
        conversionPct: totalLeads > 0 ? ((completed / totalLeads) * 100).toFixed(1) : '0',
        dropoffPct: '0',
      },
    ];

    // 2. Territory / City Breakdown
    const territoryRows = await query<any>(`
      SELECT 
        COALESCE(NULLIF(TRIM(city), ''), 'San Diego County') as city,
        COUNT(*) as job_count,
        SUM(contract_value) as total_revenue,
        AVG(contract_value) as avg_ticket,
        COUNT(CASE WHEN stage = 'complete' THEN 1 END) as completed_count
      FROM jobs
      GROUP BY COALESCE(NULLIF(TRIM(city), ''), 'San Diego County')
      ORDER BY total_revenue DESC
      LIMIT 10
    `);

    // If jobs table has few cities, supplement with leads distribution
    const territoryLeads = await query<any>(`
      SELECT 
        COALESCE(NULLIF(TRIM(city), ''), 'Escondido') as city,
        COUNT(*) as lead_count
      FROM leads
      GROUP BY COALESCE(NULLIF(TRIM(city), ''), 'Escondido')
      ORDER BY lead_count DESC
      LIMIT 10
    `);

    // 3. Service / Material Breakdown
    const serviceRows = await query<any>(`
      SELECT 
        COALESCE(NULLIF(material_type, ''), 'Owens Corning Shingles') as material_type,
        COUNT(*) as job_count,
        SUM(contract_value) as total_revenue,
        AVG(contract_value) as avg_contract
      FROM jobs
      GROUP BY COALESCE(NULLIF(material_type, ''), 'Owens Corning Shingles')
      ORDER BY total_revenue DESC
    `);

    // 4. Cash Flow Forecast (30 / 60 / 90 Days)
    const invoiceForecast = await query<{
      next_30: string;
      days_31_60: string;
      days_61_90: string;
      overdue: string;
    }>(`
      SELECT 
        COALESCE(SUM(CASE WHEN status != 'paid' AND due_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days' THEN amount ELSE 0 END), 0) as next_30,
        COALESCE(SUM(CASE WHEN status != 'paid' AND due_date BETWEEN CURRENT_DATE + INTERVAL '31 days' AND CURRENT_DATE + INTERVAL '60 days' THEN amount ELSE 0 END), 0) as days_31_60,
        COALESCE(SUM(CASE WHEN status != 'paid' AND due_date BETWEEN CURRENT_DATE + INTERVAL '61 days' AND CURRENT_DATE + INTERVAL '90 days' THEN amount ELSE 0 END), 0) as days_61_90,
        COALESCE(SUM(CASE WHEN (status = 'overdue' OR (status = 'pending' AND due_date < CURRENT_DATE)) THEN amount ELSE 0 END), 0) as overdue
      FROM invoices
    `);

    // 5. Total Financial Summary
    const [invSums, expSums] = await Promise.all([
      query<{ total_billed: string; total_collected: string; total_pending: string }>(`
        SELECT 
          COALESCE(SUM(amount), 0) as total_billed,
          COALESCE(SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END), 0) as total_collected,
          COALESCE(SUM(CASE WHEN status != 'paid' THEN amount ELSE 0 END), 0) as total_pending
        FROM invoices
      `),
      query<{ total_expenses: string }>(`
        SELECT COALESCE(SUM(amount), 0) as total_expenses FROM job_expenses
      `),
    ]);

    const totalContractValue = parseFloat(jobsCount[0]?.total_contract || '0');
    const totalExpenses = parseFloat(expSums[0]?.total_expenses || '0');
    const totalCollected = parseFloat(invSums[0]?.total_collected || '0');
    const totalPending = parseFloat(invSums[0]?.total_pending || '0');
    const totalProfit = Math.max(0, totalContractValue - totalExpenses);
    const realizedMarginPct = totalContractValue > 0 ? ((totalProfit / totalContractValue) * 100).toFixed(1) : '38.5';

    const fc = invoiceForecast[0] || { next_30: '0', days_31_60: '0', days_61_90: '0', overdue: '0' };

    return NextResponse.json({
      funnel,
      territory: territoryRows.map((r: any) => ({
        city: r.city,
        jobCount: parseInt(r.job_count, 10),
        totalRevenue: parseFloat(r.total_revenue),
        avgTicket: Math.round(parseFloat(r.avg_ticket)),
        completedCount: parseInt(r.completed_count, 10),
      })),
      territoryLeads: territoryLeads.map((r: any) => ({
        city: r.city,
        leadCount: parseInt(r.lead_count, 10),
      })),
      services: serviceRows.map((r: any) => ({
        materialType: r.material_type,
        jobCount: parseInt(r.job_count, 10),
        totalRevenue: parseFloat(r.total_revenue),
        avgContract: Math.round(parseFloat(r.avg_contract)),
      })),
      cashFlowForecast: {
        overdue: parseFloat(fc.overdue),
        next30: parseFloat(fc.next_30),
        days31to60: parseFloat(fc.days_31_60),
        days61to90: parseFloat(fc.days_61_90),
        totalForecast: parseFloat(fc.overdue) + parseFloat(fc.next_30) + parseFloat(fc.days_31_60) + parseFloat(fc.days_61_90),
      },
      summary: {
        totalLeads,
        totalJobs: parseInt(jobsCount[0]?.count || '0', 10),
        totalContractValue,
        totalCollected,
        totalPending,
        totalExpenses,
        totalProfit,
        realizedMarginPct: parseFloat(realizedMarginPct),
        winRatePct: totalLeads > 0 ? ((won / totalLeads) * 100).toFixed(1) : '0',
      },
    });
  } catch (err) {
    console.error('[api/admin/reports GET]', err);
    return NextResponse.json({ error: 'Server error generating reports' }, { status: 500 });
  }
}
