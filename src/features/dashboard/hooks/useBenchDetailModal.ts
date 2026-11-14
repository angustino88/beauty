// src/features/dashboard/hooks/useBenchDetailModal.ts
import { useCallback, useState } from 'react';
import { useGetBenchDetailQuery } from '../api';
import type { DashboardBenchDetail } from '../types';

export interface BenchDetailModalResult {
  modalBenchId: number | null;
  openModal: (id: number) => void;
  closeModal: () => void;
  benchDetail: DashboardBenchDetail | undefined;
  isDetailFetching: boolean;
  // Compatibility fields
  modalLabId: number | null;
  labDetail: DashboardBenchDetail | undefined;
}

export function useBenchDetailModal(): BenchDetailModalResult {
  const [modalBenchId, setModalBenchId] = useState<number | null>(null);

  const { data: benchDetail, isFetching: isDetailFetching } = useGetBenchDetailQuery(
    modalBenchId ?? 0,
    { skip: modalBenchId === null },
  );

  const openModal = useCallback((id: number) => setModalBenchId(id), []);
  const closeModal = useCallback(() => setModalBenchId(null), []);

  return {
    modalBenchId,
    openModal,
    closeModal,
    benchDetail,
    isDetailFetching,
    modalLabId: modalBenchId,
    labDetail: benchDetail,
  };
}

export const useLabDetailModal = useBenchDetailModal;
