import { useState, type ReactNode } from "react";
import { Select, Tabs } from "antd";
import { useSearchParams } from "react-router-dom";
import { Activity } from "lucide-react";
import { useGetBenchOptionsQuery } from "@/features/booking/api";
import { DevicesPanel } from "@/features/lab-equipment/devices";
import { MonitoringEventsPanel } from "../components/MonitoringEventsPanel";
import styles from "./LabMonitoring.module.css";
import tableStyles from "@/components/tables/AppTable.module.css";
import heading from "@/features/lab-equipment/shared/components/layout/InventoryPresentation.module.css";

type TabKey = "devices" | "events";

function positiveInt(value: string | null): number | undefined {
  const parsed = value ? Number(value) : NaN;
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
}

function Panel({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <section className={styles.panel}>
      <div className={styles.panelHeading}>
        <h2>{title}</h2>
        <span>{description}</span>
      </div>
      <div className={styles.panelBody}>{children}</div>
    </section>
  );
}

/**
 * Lab Monitoring: what computing agents report. "Devices" is the current state of every
 * observed device; "Events" is the event log. Both share the lab filter; a computing unit
 * scope (`?computing=`) carries over between tabs and from the equipment table.
 */
export default function LabMonitoring() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab: TabKey = searchParams.get("tab") === "events" ? "events" : "devices";
  const computingId = positiveInt(searchParams.get("computing"));
  const [benchId, setBenchId] = useState<number>();
  const [computingLabel, setComputingLabel] = useState<string>();
  const { data: benchOptions = [] } = useGetBenchOptionsQuery();

  const update = (changes: Record<string, string | undefined>) => {
    const next = new URLSearchParams(searchParams);
    for (const [key, value] of Object.entries(changes)) {
      if (value === undefined) next.delete(key);
      else next.set(key, value);
    }
    setSearchParams(next, { replace: true });
  };
  const clearComputing = () => {
    setComputingLabel(undefined);
    update({ computing: undefined });
  };

  return (
    <div className={`${tableStyles.registerPage} ${heading.page}`}>
      <header className={heading.pageHeading}>
        <div className={heading.headingCopy}>
          <div className={heading.breadcrumb}>Insights <span aria-hidden="true">/</span> Monitoring</div>
          <div className="tw:flex tw:items-center tw:gap-3">
            <span className="tw:flex tw:size-10 tw:items-center tw:justify-center tw:rounded-xl tw:bg-secondary tw:text-primary">
              <Activity aria-hidden="true" className="tw:size-5" />
            </span>
            <h1>Lab Monitoring</h1>
          </div>
          <p>Watch what the agent on each computing unit reports: devices plugged in, missing, or not yet matched to inventory.</p>
        </div>
      </header>
      <Tabs
          className={styles.tabs}
          destroyOnHidden
          activeKey={tab}
          onChange={(key) => update({ tab: key })}
          tabBarExtraContent={
            <Select
              showSearch
              allowClear
              placeholder="All labs"
              aria-label="Filter by lab"
              style={{ width: 240 }}
              options={benchOptions}
              optionFilterProp="label"
              value={benchId}
              onChange={(value?: number) => setBenchId(value)}
            />
          }
          items={[
            {
              key: "devices",
              label: "Devices",
              children: (
                <Panel title="Monitored devices" description="Current state of every device the agents observe">
                <DevicesPanel
                  benchId={benchId}
                  computingId={computingId}
                  onClearComputing={clearComputing}
                  onViewEvents={(computing) => {
                    setComputingLabel(computing.name);
                    update({ tab: "events", computing: String(computing.id) });
                  }}
                />
                </Panel>
              ),
            },
            {
              key: "events",
              label: "Events",
              children: (
                <Panel title="Monitoring events" description="Log of what the agents reported, newest first">
                <MonitoringEventsPanel
                  benchId={benchId}
                  computingId={computingId}
                  computingLabel={computingLabel}
                  onClearComputing={clearComputing}
                />
                </Panel>
              ),
            },
          ]}
      />
    </div>
  );
}
