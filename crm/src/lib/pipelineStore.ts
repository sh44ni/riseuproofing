// Rise Up CRM — Pipeline Kanban Store
import { useState, useEffect, useCallback } from 'react';
import { fetchPipelineForDashboard, type PipelineSummary } from '../api/pipelineApi';
import type { ColumnData } from '../components/pipeline/pipelineTypes';

export function usePipelineKanban() {
  const [columns, setColumns] = useState<ColumnData[]>([]);
  const [summary, setSummary] = useState<PipelineSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    const { columns: cols, summary: sum } = await fetchPipelineForDashboard();
    if (cols.length > 0) setColumns(cols);
    setSummary(sum);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    load(false);
  }, [load]);

  const moveCardOptimistically = useCallback((cardId: string, fromColId: string, toColId: string) => {
    if (fromColId === toColId) return;
    setColumns((prevCols) => {
      let movedCard: any = null;
      // Extract the card from fromCol
      const nextCols = prevCols.map((col) => {
        if (col.id === fromColId) {
          const card = col.cards.find((c) => c.id === cardId);
          if (card) movedCard = card;
          const filteredCards = col.cards.filter((c) => c.id !== cardId);
          return {
            ...col,
            cards: filteredCards,
            count: filteredCards.length,
          };
        }
        return col;
      });

      if (!movedCard) return prevCols;

      // Place card into toCol
      return nextCols.map((col) => {
        if (col.id === toColId) {
          const newCards = [movedCard, ...col.cards];
          return {
            ...col,
            cards: newCards,
            count: newCards.length,
          };
        }
        return col;
      });
    });
  }, []);

  const refresh = useCallback((silent = true) => {
    return load(silent);
  }, [load]);

  return { columns, setColumns, summary, isLoading, refresh, moveCardOptimistically };
}
