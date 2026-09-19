import React from 'react';
import {
  DollarSign,
  Award,
  PieChart,
  Zap,
} from 'lucide-react';
import { UniversalStatCard } from '@/components/common/UniversalStatCard';

export function ReportsKpis() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
      {/* 1. Total Booked Revenue */}
      <UniversalStatCard
        label="Total Booked Revenue"
        value="$1,428,500"
        delta={18.4}
        deltaLabel="+18.4% YoY"
        icon={DollarSign}
        iconGradient="from-[#1878B8] to-[#38BDF8]"
        color="#0284c7"
        hoverBorderColor="hover:border-sky-400"
        blurColor="bg-sky-400/15 group-hover:bg-sky-400/25"
        footnoteLeft="YTD: $1.62M Booked"
        footnoteRight={<span className="text-[#1878B8] font-bold">Avg Ticket: $24,850</span>}
        sharePct={88}
        shareLabel="Annual target"
        stageLabel="Booked Business"
        miniSvgPath="M 2 24 Q 18 18, 36 14 T 54 8 T 73 2"
      />

      {/* 2. Sales Pipeline Win Rate */}
      <UniversalStatCard
        label="Pipeline Win Rate"
        value="68.4%"
        delta={5.2}
        deltaLabel="+5.2% vs BM"
        icon={Award}
        iconGradient="from-amber-500 to-amber-400"
        color="#f59e0b"
        hoverBorderColor="hover:border-amber-400"
        blurColor="bg-amber-400/15 group-hover:bg-amber-400/25"
        footnoteLeft="81 Won / 118 Quoted"
        footnoteRight={<span className="text-amber-800 font-bold">Benchmark: 42%</span>}
        sharePct={68}
        shareLabel="Close rate"
        stageLabel="Sales Efficiency"
        miniSvgPath="M 2 20 Q 20 18, 38 12 T 58 6 T 73 3"
      />

      {/* 3. Estimator Gross Margin */}
      <UniversalStatCard
        label="Blended Gross Margin"
        value="39.4%"
        delta={1.4}
        deltaLabel="Target: >38%"
        icon={PieChart}
        iconGradient="from-emerald-600 to-teal-400"
        color="#10b981"
        hoverBorderColor="hover:border-emerald-400"
        blurColor="bg-emerald-400/15 group-hover:bg-emerald-400/25"
        footnoteLeft="Materials: 38% • Labor: 22.6%"
        footnoteRight={<span className="text-emerald-700 font-bold">$562.8K Net Profit</span>}
        sharePct={39}
        shareLabel="Margin share"
        stageLabel="Profitability"
        miniSvgPath="M 2 22 Q 18 16, 36 12 T 56 6 T 73 2"
      />

      {/* 4. Speed to Lead */}
      <UniversalStatCard
        label="Avg Speed to Lead"
        value="4.2 min"
        delta={-18}
        deltaLabel="-1.8m"
        icon={Zap}
        iconGradient="from-purple-600 to-indigo-400"
        color="#8b5cf6"
        hoverBorderColor="hover:border-purple-400"
        blurColor="bg-purple-400/15 group-hover:bg-purple-400/25"
        footnoteLeft="94% < 15 min SLA"
        footnoteRight={<span className="text-purple-700 font-bold">82.4% Connected</span>}
        sharePct={94}
        shareLabel="SLA response"
        stageLabel="Inbound Velocity"
        miniSvgPath="M 2 8 Q 18 12, 34 16 T 56 22 T 73 24"
      />
    </div>
  );
}
