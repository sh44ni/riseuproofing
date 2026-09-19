import React, { useState, useMemo } from 'react';
import {
  Search,
  Phone,
  Mail,
  MapPin,
  Clock,
  ArrowUpDown,
  ChevronDown,
  ChevronUp,
  Eye,
  ExternalLink,
  DollarSign,
  Filter,
  CheckCircle2,
  Users,
} from 'lucide-react';
import { ColumnData, EnrichedDeal, enrichDeals } from './pipelineTypes';

interface PipelineListViewProps {
  columns: ColumnData[];
  pipelineSearch: string;
  onSelectDeal: (deal: EnrichedDeal) => void;
  getServiceBadgeClass: (color: string) => string;
}

type SortField = 'name' | 'stage' | 'service' | 'value' | 'time' | 'location';

export function PipelineListView({
  columns,
  pipelineSearch,
  onSelectDeal,
  getServiceBadgeClass,
}: PipelineListViewProps) {
  const [selectedStage, setSelectedStage] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('value');
  const [sortAsc, setSortAsc] = useState<boolean>(false);

  // Flatten and enrich all deals
  const allDeals = useMemo(() => enrichDeals(columns), [columns]);

  // Stage options with counts
  const stageTabs = useMemo(() => {
    return [
      { id: 'all', title: 'All Stages', count: allDeals.length, accentColor: '#1878B8' },
      ...columns.map((c) => ({
        id: c.id,
        title: c.title,
        count: c.cards.length,
        accentColor: c.accentColor,
      })),
    ];
  }, [allDeals, columns]);

  // Filter & sort
  const filteredDeals = useMemo(() => {
    let list = allDeals;

    // Stage filter
    if (selectedStage !== 'all') {
      list = list.filter((d) => d.stageId === selectedStage);
    }

    // Search query
    if (pipelineSearch.trim()) {
      const q = pipelineSearch.toLowerCase();
      list = list.filter(
        (d) =>
          d.name.toLowerCase().includes(q) ||
          d.location.toLowerCase().includes(q) ||
          d.service.toLowerCase().includes(q) ||
          d.stageTitle.toLowerCase().includes(q) ||
          d.phone.includes(q) ||
          d.email.toLowerCase().includes(q)
      );
    }

    // Sort
    return [...list].sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'stage':
          comparison = a.stageTitle.localeCompare(b.stageTitle);
          break;
        case 'service':
          comparison = a.service.localeCompare(b.service);
          break;
        case 'location':
          comparison = a.location.localeCompare(b.location);
          break;
        case 'value':
          comparison = a.value - b.value;
          break;
        case 'time':
          comparison = a.time.localeCompare(b.time);
          break;
      }
      return sortAsc ? comparison : -comparison;
    });
  }, [allDeals, selectedStage, pipelineSearch, sortField, sortAsc]);

  // Total calculated value
  const totalValue = useMemo(() => {
    return filteredDeals.reduce((sum, d) => sum + d.value, 0);
  }, [filteredDeals]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const renderSortIndicator = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown size={10} className="opacity-40" />;
    }
    return sortAsc ? <ChevronUp size={11} className="text-[#1878B8]" /> : <ChevronDown size={11} className="text-[#1878B8]" />;
  };

  return (
    <div className="space-y-3 animate-in fade-in duration-200">
      {/* Stage Filter Pills Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
        {stageTabs.map((tab) => {
          const isActive = selectedStage === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setSelectedStage(tab.id)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold shrink-0 transition-all cursor-pointer ${
                isActive
                  ? 'bg-gradient-to-r from-[#1878B8] to-[#55C4F5] text-white shadow-xs scale-[1.02]'
                  : 'bg-white/60 hover:bg-white/90 text-slate-600 border border-white/80 shadow-2xs'
              }`}
            >
              <span>{tab.title}</span>
              <span
                className={`text-[9px] font-black px-1.5 py-0.2 rounded-full ${
                  isActive ? 'bg-black/25 text-white' : 'bg-slate-200/80 text-slate-700'
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Main Liquid Glass Table Panel */}
      <div className="rounded-2xl light-glass-panel border border-white/85 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/60 backdrop-blur-md border-b border-slate-200/70 text-[10.5px] font-bold text-slate-500 uppercase tracking-wider select-none">
                <th
                  onClick={() => handleSort('name')}
                  className="px-4 py-2.5 cursor-pointer hover:text-slate-800 transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>Customer / Deal</span>
                    {renderSortIndicator('name')}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('stage')}
                  className="px-3 py-2.5 cursor-pointer hover:text-slate-800 transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>Pipeline Stage</span>
                    {renderSortIndicator('stage')}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('service')}
                  className="px-3 py-2.5 cursor-pointer hover:text-slate-800 transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>Service</span>
                    {renderSortIndicator('service')}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('location')}
                  className="px-3 py-2.5 cursor-pointer hover:text-slate-800 transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>Location</span>
                    {renderSortIndicator('location')}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('value')}
                  className="px-3 py-2.5 cursor-pointer hover:text-slate-800 transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>Est. Value</span>
                    {renderSortIndicator('value')}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('time')}
                  className="px-3 py-2.5 cursor-pointer hover:text-slate-800 transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>Activity</span>
                    {renderSortIndicator('time')}
                  </div>
                </th>
                <th className="px-3 py-2.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/70 text-xs">
              {filteredDeals.length > 0 ? (
                filteredDeals.map((deal) => (
                  <tr
                    key={deal.id}
                    onClick={() => onSelectDeal(deal)}
                    style={{
                      borderLeftColor: deal.stageAccent,
                      borderLeftWidth: '3.5px',
                    }}
                    className="hover:bg-white/80 transition-all cursor-pointer group"
                  >
                    {/* Customer / Homeowner */}
                    <td className="px-4 py-2.5">
                      <div className="font-bold text-[11.5px] text-[#1F1F1F] group-hover:text-[#1878B8] transition-colors leading-snug">
                        {deal.name}
                      </div>
                      <div className="text-[10px] text-slate-400 font-medium">
                        {deal.phone}
                      </div>
                    </td>

                    {/* Pipeline Stage */}
                    <td className="px-3 py-2.5">
                      <span
                        className={`inline-flex items-center gap-1 text-[9.5px] font-black px-2 py-0.5 rounded-lg shadow-2xs ${deal.stagePillClass}`}
                      >
                        <span>{deal.stageTitle}</span>
                      </span>
                    </td>

                    {/* Service */}
                    <td className="px-3 py-2.5">
                      <span
                        className={`text-[9.5px] px-2 py-0.5 rounded-md inline-block ${getServiceBadgeClass(
                          deal.serviceColor
                        )}`}
                      >
                        {deal.service}
                      </span>
                    </td>

                    {/* Location */}
                    <td className="px-3 py-2.5 text-slate-600">
                      <div className="flex items-center gap-1 text-[11px] font-medium">
                        <MapPin size={10} className="text-[#1878B8] shrink-0" />
                        <span>{deal.location}</span>
                      </div>
                    </td>

                    {/* Estimated Value */}
                    <td className="px-3 py-2.5 font-bold text-slate-800 text-[11.5px]">
                      ${deal.value.toLocaleString()}
                    </td>

                    {/* Activity Recency */}
                    <td className="px-3 py-2.5 text-slate-500">
                      <div className="flex items-center gap-1 text-[10.5px]">
                        <Clock size={10} className="text-slate-400" />
                        <span>{deal.time}</span>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-3 py-2.5 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <a
                          href={`tel:${deal.phone}`}
                          title={`Call ${deal.phone}`}
                          className="p-1 rounded-md text-slate-400 hover:text-[#0284c7] hover:bg-sky-50 transition-colors"
                        >
                          <Phone size={12} />
                        </a>
                        <a
                          href={`mailto:${deal.email}`}
                          title={`Email ${deal.email}`}
                          className="p-1 rounded-md text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                        >
                          <Mail size={12} />
                        </a>
                        <button
                          onClick={() => onSelectDeal(deal)}
                          title="View Details"
                          className="p-1 rounded-md text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
                        >
                          <Eye size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center space-y-1">
                      <Search size={20} className="text-slate-300 mb-1" />
                      <div className="text-xs font-bold text-slate-600">No matching deals found</div>
                      <div className="text-[11px] text-slate-400">
                        Try adjusting your search query or stage filter
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Summary Bar */}
        <div className="px-4 py-2 bg-white/40 border-t border-slate-200/70 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-500 font-medium">
          <div className="flex items-center gap-2">
            <span>
              Showing <strong className="text-slate-800 font-bold">{filteredDeals.length}</strong> of{' '}
              <strong className="text-slate-800 font-bold">{allDeals.length}</strong> deals
            </span>
            {selectedStage !== 'all' && (
              <button
                onClick={() => setSelectedStage('all')}
                className="text-[10px] font-bold text-[#1878B8] hover:underline cursor-pointer"
              >
                Reset Stage Filter
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div className="text-slate-600">
              Total Active Value:{' '}
              <strong className="font-extrabold text-[#0284c7] text-xs">
                ${totalValue.toLocaleString()}
              </strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
