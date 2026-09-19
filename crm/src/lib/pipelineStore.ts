// Rise Up CRM — Pipeline Kanban Store
import { useState, useEffect, useCallback } from 'react';
import { fetchPipelineForDashboard, type PipelineSummary } from '../api/pipelineApi';
import type { ColumnData } from '../components/pipeline/pipelineTypes';

export function usePipelineKanban() {
  const [columns, setColumns] = useState<ColumnData[]>([]);
  const [summary, setSummary] = useState<PipelineSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    setIsLoading(true);
    const { columns: cols, summary: sum } = await fetchPipelineForDashboard();
    if (cols.length > 0) setColumns(cols);
    setSummary(sum);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { columns, summary, isLoading, refresh: load };
}
