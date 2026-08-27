'use client';

import {
  AreaChart as ReAreaChart,
  Area,
  BarChart as ReBarChart,
  Bar,
  PieChart as RePieChart,
  Pie,
  Cell,
  LineChart as ReLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

const AMBER = '#F59E0B';
const SLATE = '#64748B';
const COLORS = ['#F59E0B', '#3B82F6', '#10B981', '#8B5CF6', '#EF4444', '#EC4899', '#06B6D4', '#84CC16'];

const tooltipStyle = {
  backgroundColor: '#0F172A',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '12px',
  color: '#F1F5F9',
  fontSize: '12px',
};

// Shared axis styles
const axisStyle = { fill: '#64748B', fontSize: 11 };
const gridStyle = { stroke: 'rgba(255,255,255,0.05)', strokeDasharray: '3 3' };

// ── Area Chart (visitors over time) ──────────────────────────────────────────
interface AreaPoint { day: string; visitors?: string | number; sessions?: string | number; pageviews?: string | number; count?: string | number; }

export function AdminAreaChart({ data, keys = ['visitors'] }: { data: AreaPoint[]; keys?: string[] }) {
  const formatted = data.map(d => ({
    ...d,
    day: new Date(d.day).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    visitors: d.visitors !== undefined ? Number(d.visitors) : undefined,
    sessions: d.sessions !== undefined ? Number(d.sessions) : undefined,
    pageviews: d.pageviews !== undefined ? Number(d.pageviews) : undefined,
    count: d.count !== undefined ? Number(d.count) : undefined,
  }));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <ReAreaChart data={formatted} margin={{ top: 4, right: 4, bottom: 0, left: -10 }}>
        <defs>
          {keys.map((k, i) => (
            <linearGradient key={k} id={`grad-${k}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={COLORS[i]} stopOpacity={0.3} />
              <stop offset="95%" stopColor={COLORS[i]} stopOpacity={0.02} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid {...gridStyle} />
        <XAxis dataKey="day" tick={axisStyle} tickLine={false} axisLine={false} />
        <YAxis tick={axisStyle} tickLine={false} axisLine={false} />
        <Tooltip contentStyle={tooltipStyle} cursor={{ stroke: 'rgba(255,255,255,0.1)' }} />
        {keys.map((k, i) => (
          <Area
            key={k}
            type="monotone"
            dataKey={k}
            stroke={COLORS[i]}
            strokeWidth={2}
            fill={`url(#grad-${k})`}
            dot={false}
            activeDot={{ r: 4, fill: COLORS[i] }}
          />
        ))}
      </ReAreaChart>
    </ResponsiveContainer>
  );
}

// ── Bar Chart ──────────────────────────────────────────────────────────────
interface BarPoint { [key: string]: string | number; }

export function AdminBarChart({
  data,
  dataKey = 'views',
  labelKey = 'page_path',
  color = AMBER,
  horizontal = false,
}: {
  data: BarPoint[];
  dataKey?: string;
  labelKey?: string;
  color?: string;
  horizontal?: boolean;
}) {
  const formatted = data.map(d => ({
    ...d,
    [dataKey]: Number(d[dataKey]),
    label: String(d[labelKey]).replace(/^\//, '').slice(0, 16) || 'Home',
  }));

  if (horizontal) {
    return (
      <ResponsiveContainer width="100%" height={Math.max(180, data.length * 36)}>
        <ReBarChart data={formatted} layout="vertical" margin={{ top: 0, right: 16, bottom: 0, left: 0 }}>
          <CartesianGrid horizontal={false} {...gridStyle} />
          <XAxis type="number" tick={axisStyle} tickLine={false} axisLine={false} />
          <YAxis type="category" dataKey="label" tick={axisStyle} tickLine={false} axisLine={false} width={70} />
          <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
          <Bar dataKey={dataKey} fill={color} radius={[0, 6, 6, 0]} maxBarSize={20} />
        </ReBarChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <ReBarChart data={formatted} margin={{ top: 4, right: 4, bottom: 0, left: -10 }}>
        <CartesianGrid {...gridStyle} />
        <XAxis dataKey="label" tick={axisStyle} tickLine={false} axisLine={false} />
        <YAxis tick={axisStyle} tickLine={false} axisLine={false} />
        <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
        <Bar dataKey={dataKey} fill={color} radius={[6, 6, 0, 0]} maxBarSize={40} />
      </ReBarChart>
    </ResponsiveContainer>
  );
}

// ── Pie / Donut Chart ──────────────────────────────────────────────────────
interface PiePoint { name: string; value: number; }

export function AdminPieChart({ data, label = 'Total' }: { data: PiePoint[]; label?: string }) {
  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        <ResponsiveContainer width={200} height={200}>
          <RePieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={3}
              dataKey="value"
              stroke="none"
            >
              {data.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip contentStyle={tooltipStyle} />
          </RePieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-2xl font-bold text-white">{total}</span>
          <span className="text-xs text-slate-400">{label}</span>
        </div>
      </div>
      <div className="flex flex-wrap gap-2 justify-center">
        {data.map((d, i) => (
          <div key={d.name} className="flex items-center gap-1.5 text-xs text-slate-300">
            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
            <span className="capitalize">{d.name}</span>
            <span className="text-slate-500">({d.value})</span>
          </div>
        ))}
      </div>
    </div>
  );
}
