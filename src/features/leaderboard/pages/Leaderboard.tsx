import { useMemo, useState } from 'react';
import { Card, Empty, Segmented, Tabs, Typography, message } from 'antd';
import { ExportOutlined, TrophyOutlined } from '@ant-design/icons';
import { Button } from 'antd';
import { useAppSelector } from '@/app/store';
import { useLeaderboardState } from '../hooks/useLeaderboardState';
import { useGetPersonaQuery, useGetLabQuery, exportLeaderboard } from '../api';
import { LeaderboardPodium } from '../components/charts/LeaderboardPodium';
import { PersonaTable } from '../components/tables/PersonaTable';
import { LabTable } from '../components/tables/LabTable';
import { LeaderboardDetailModal } from '../components/modals/LeaderboardDetailModal';
import type { RankedPersonaItem, RankedLabItem } from '../types';
import styles from './Leaderboard.module.css';

const { Title } = Typography;

function rankItems<T>(data: T[]): (T & { rank: number })[] {
  return data.map((item, i) => ({ ...item, rank: i + 1 }));
}

// Pins current user to top for visibility while preserving their original rank badge.
function pinCurrentUserToTop(data: RankedPersonaItem[], currentUserId: number | null): RankedPersonaItem[] {
  if (!currentUserId) return data;
  const idx = data.findIndex((x) => x.id === currentUserId);
  if (idx <= 0) return data;
  const selected = data[idx];
  return [selected, ...data.slice(0, idx), ...data.slice(idx + 1)];
}

export default function Leaderboard() {
  const {
    activeTab, setActiveTab,
    rangePreset, setRangePreset,
    filter,
    detailOpen, detailType,
    selectedPersona, selectedLab,
    openPersonaDetail, openLabDetail, closeDetail,
  } = useLeaderboardState();

  const currentUserId = useAppSelector((s) => s.me.id);
  const [exportLoading, setExportLoading] = useState(false);

  const { data: personaData = [], isLoading: personaLoading } = useGetPersonaQuery(filter);
  const { data: labData    = [], isLoading: labLoading    }   = useGetLabQuery(filter);

  const rankedPersona = useMemo(() => rankItems(personaData) as RankedPersonaItem[], [personaData]);
  const rankedLab     = useMemo(() => rankItems(labData)     as RankedLabItem[],     [labData]);
  const personaTableData = useMemo(
    () => pinCurrentUserToTop(rankedPersona, currentUserId),
    [rankedPersona, currentUserId],
  );

  async function handleExport() {
    setExportLoading(true);
    try {
      const blob = await exportLeaderboard(filter);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Leaderboard_${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        a.remove();
        URL.revokeObjectURL(url);
      }, 100);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      void message.error(`Export failed: ${msg}`);
    } finally {
      setExportLoading(false);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <Title level={3} className={styles.title}>
          <TrophyOutlined style={{ color: '#FFD700' }} />
          Leaderboard
        </Title>
        <Segmented
          value={rangePreset}
          onChange={(v) => setRangePreset(v as typeof rangePreset)}
          options={[
            { label: 'Weekly',   value: 'weekly'   },
            { label: 'Monthly',  value: 'monthly'  },
            { label: 'All time', value: 'all-time' },
          ]}
        />
      </div>

      <Tabs
        activeKey={activeTab}
        onChange={(k) => setActiveTab(k as 'persona' | 'lab')}
        type="card"
        tabBarExtraContent={{
          right: (
            <Button
              type="primary"
              icon={<ExportOutlined />}
              loading={exportLoading}
              onClick={() => void handleExport()}
              className={styles.exportButton}
            >
              Export
            </Button>
          ),
        }}
        items={[
          {
            key: 'persona',
            label: 'Persona',
            children: (
              <Card variant="borderless" className={styles.card} styles={{ body: { padding: 0 } }}>
                {!personaLoading && rankedPersona.length === 0 ? (
                  <Empty description="No data for the selected period" style={{ padding: 48 }} />
                ) : (
                  <>
                    <LeaderboardPodium items={rankedPersona.slice(0, 3)} type="persona" loading={personaLoading} />
                    <div className={styles.tableWrap}>
                      <PersonaTable
                        data={personaTableData}
                        loading={personaLoading}
                        currentUserId={currentUserId}
                        onRowClick={openPersonaDetail}
                      />
                    </div>
                  </>
                )}
              </Card>
            ),
          },
          {
            key: 'lab',
            label: 'Lab',
            children: (
              <Card variant="borderless" className={styles.card} styles={{ body: { padding: 0 } }}>
                {!labLoading && rankedLab.length === 0 ? (
                  <Empty description="No data for the selected period" style={{ padding: 48 }} />
                ) : (
                  <>
                    <LeaderboardPodium items={rankedLab.slice(0, 3)} type="lab" loading={labLoading} />
                    <div className={styles.tableWrap}>
                      <LabTable
                        data={rankedLab}
                        loading={labLoading}
                        onRowClick={openLabDetail}
                      />
                    </div>
                  </>
                )}
              </Card>
            ),
          },
        ]}
      />

      <LeaderboardDetailModal
        open={detailOpen}
        type={detailType}
        userRow={selectedPersona}
        labRow={selectedLab}
        filter={filter}
        onClose={closeDetail}
      />
    </div>
  );
}
