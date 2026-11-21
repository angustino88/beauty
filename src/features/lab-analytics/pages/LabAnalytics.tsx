import { useMemo, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Statistics } from "../components/Statistics";
import { LabSessionLogTable } from "../components/LabSessionLogTable";
import { OperationalAnalyticsCards } from "../components/cards/OperationalAnalyticsCards";
import {
  LabGroupCard,
  LabEquipmentStatusCard,
  LabEfficiencyCard,
  ProjectUsageCard,
  UserLabUsageCard,
  UserBookingEfficiencyCard,
  LabUsageTimeFrameCard,
  UserStorageQuotaCard,
} from "../components";
import styles from "./LabAnalytics.module.css";
import { usePermission } from '@/features/auth/hooks/useCan';

export function LabAnalytics() {
  const [modalOpen, setModalOpen] = useState<number | null>(null);
  // The session list is for lab operators only; the API refuses everyone else.
  const canSeeSessions = usePermission("lab_operations.manage");

  const makeHandlers = useMemo(
    () => (id: number) => ({
      isOpen: modalOpen === id,
      onOpen: () => setModalOpen(id),
      onClose: () => setModalOpen(null),
    }),
    [modalOpen],
  );

  return (
    <div className={styles.analyticsPage}>
      <PageHeader title="Lab Analytics" />

      <section className={`${styles.section} ${styles.kpiSection}`} aria-labelledby="analytics-kpis">
        <div className={styles.sectionHeader}>
          <h2 id="analytics-kpis" className={styles.sectionTitle}>Metrics</h2>
        </div>
        <div className={styles.kpiGrid}><Statistics /></div>
      </section>

      <section className={styles.section} aria-labelledby="analytics-insights">
        <div className={styles.sectionHeader}>
          <h2 id="analytics-insights" className={styles.sectionTitle}>Usage</h2>
        </div>
        <div className={styles.chartGrid}>
          <LabGroupCard {...makeHandlers(0)} />
          <LabEquipmentStatusCard {...makeHandlers(1)} />
          <LabEfficiencyCard {...makeHandlers(2)} />
          <ProjectUsageCard {...makeHandlers(3)} />
          <UserLabUsageCard {...makeHandlers(4)} />
          <UserBookingEfficiencyCard {...makeHandlers(5)} />
          <LabUsageTimeFrameCard {...makeHandlers(6)} />
          <UserStorageQuotaCard {...makeHandlers(7)} />
        </div>
      </section>

      <section className={styles.section} aria-labelledby="analytics-operations">
        <div className={styles.sectionHeader}>
          <h2 id="analytics-operations" className={styles.sectionTitle}>Operations</h2>
        </div>
        <OperationalAnalyticsCards />
      </section>

      {canSeeSessions && (
        <section className={styles.section} aria-labelledby="analytics-sessions">
          <div className={styles.sectionHeader}>
            <h2 id="analytics-sessions" className={styles.sectionTitle}>Lab sessions</h2>
            <span className={styles.sectionHint}>Remote logins reported by the computer agents</span>
          </div>
          <LabSessionLogTable />
        </section>
      )}
    </div>
  );
}

export default LabAnalytics;
