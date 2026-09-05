import { NextRequest, NextResponse } from 'next/server';
import { requirePermission, hasPermission } from '@/lib/admin-auth';
import { query } from '@/lib/db';

export async function GET(req: NextRequest) {
  const auth = await requirePermission('finances:view_invoices');
  if (auth.response) return auth.response;

  const canViewProfit = hasPermission(auth.user, 'finances:view_profit_ledger');

  const [invoiceStats, expenseStats, contractStats, recentInvoices] = await Promise.all([
    query<{
      total_billed: string;
      collected_cash: string;
      pending_amount: string;
      overdue_amount: string;
      paid_count: string;
      pending_count: string;
      overdue_count: string;
    }>(
      `SELECT 
         COALESCE(SUM(amount), 0) as total_billed,
         COALESCE(SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END), 0) as collected_cash,
         COALESCE(SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END), 0) as pending_amount,
         COALESCE(SUM(CASE WHEN status = 'overdue' OR (status = 'pending' AND due_date < CURRENT_DATE) THEN amount ELSE 0 END), 0) as overdue_amount,
         COUNT(CASE WHEN status = 'paid' THEN 1 END) as paid_count,
         COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count,
         COUNT(CASE WHEN status = 'overdue' OR (status = 'pending' AND due_date < CURRENT_DATE) THEN 1 END) as overdue_count
       FROM invoices`
    ),
    query<{ total_expenses: string }>(
      `SELECT COALESCE(SUM(amount), 0) as total_expenses FROM job_expenses`
    ),
    query<{ total_contract_value: string }>(
      `SELECT COALESCE(SUM(contract_value), 0) as total_contract_value FROM jobs`
    ),
    query<any>(
      `SELECT i.*, j.job_number, j.customer_name, j.address, j.city 
       FROM invoices i
       LEFT JOIN jobs j ON i.job_id = j.id
       ORDER BY i.due_date ASC, i.created_at DESC LIMIT 15`
    ),
  ]);

  const inv = invoiceStats[0] || {
    total_billed: '0',
    collected_cash: '0',
    pending_amount: '0',
    overdue_amount: '0',
    paid_count: '0',
    pending_count: '0',
    overdue_count: '0',
  };

  const totalContract = parseFloat(contractStats[0]?.total_contract_value || '0');
  const totalExpenses = parseFloat(expenseStats[0]?.total_expenses || '0');
  const totalProfit = Math.max(0, totalContract - totalExpenses);
  const realizedMarginPct = totalContract > 0 ? ((totalProfit / totalContract) * 100).toFixed(1) : '35.0';

  return NextResponse.json({
    summary: {
      totalBilled: parseFloat(inv.total_billed),
      collectedCash: parseFloat(inv.collected_cash),
      pendingAmount: parseFloat(inv.pending_amount),
      overdueAmount: parseFloat(inv.overdue_amount),
      paidCount: parseInt(inv.paid_count, 10),
      pendingCount: parseInt(inv.pending_count, 10),
      overdueCount: parseInt(inv.overdue_count, 10),
      totalExpenses: canViewProfit ? totalExpenses : null,
      totalProfit: canViewProfit ? totalProfit : null,
      realizedMarginPct: canViewProfit ? parseFloat(realizedMarginPct) : null,
    },
    recentInvoices,
  });
}
