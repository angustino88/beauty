import { useState, useMemo } from 'react';
import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';
import type { LeaderboardFilter, LeaderboardRangePreset, RankedPersonaItem, RankedLabItem } from '../types';

dayjs.extend(isoWeek);

export function filterByPreset(preset: LeaderboardRangePreset): LeaderboardFilter {
  if (preset === 'all-time') return {};
  const end_date = dayjs().format('YYYY-MM-DD');
  const start_date = preset === 'weekly'
    ? dayjs().startOf('isoWeek').format('YYYY-MM-DD')
    : dayjs().startOf('month').format('YYYY-MM-DD');
  return { start_date, end_date };
}

export interface LeaderboardState {
  activeTab: 'persona' | 'lab';
  setActiveTab: (tab: 'persona' | 'lab') => void;
  rangePreset: LeaderboardRangePreset;
  setRangePreset: (preset: LeaderboardRangePreset) => void;
  filter: LeaderboardFilter;
  // Detail modal
  detailOpen: boolean;
  detailType: 'persona' | 'lab';
  selectedPersona: RankedPersonaItem | null;
  selectedLab: RankedLabItem | null;
  openPersonaDetail: (item: RankedPersonaItem) => void;
  openLabDetail: (item: RankedLabItem) => void;
  closeDetail: () => void;
}

export function useLeaderboardState(): LeaderboardState {
  const [activeTab, setActiveTab] = useState<'persona' | 'lab'>('persona');
  const [rangePreset, setRangePreset] = useState<LeaderboardRangePreset>('monthly');
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailType, setDetailType] = useState<'persona' | 'lab'>('persona');
  const [selectedPersona, setSelectedPersona] = useState<RankedPersonaItem | null>(null);
  const [selectedLab, setSelectedLab] = useState<RankedLabItem | null>(null);

  const filter = useMemo(() => filterByPreset(rangePreset), [rangePreset]);

  const openPersonaDetail = (item: RankedPersonaItem) => {
    setDetailType('persona');
    setSelectedPersona(item);
    setSelectedLab(null);
    setDetailOpen(true);
  };

  const openLabDetail = (item: RankedLabItem) => {
    setDetailType('lab');
    setSelectedLab(item);
    setSelectedPersona(null);
    setDetailOpen(true);
  };

  return {
    activeTab, setActiveTab,
    rangePreset, setRangePreset,
    filter,
    detailOpen, detailType,
    selectedPersona, selectedLab,
    openPersonaDetail, openLabDetail,
    closeDetail: () => setDetailOpen(false),
  };
}
