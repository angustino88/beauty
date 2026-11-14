import React, { useMemo } from "react";
import { theme } from "../../theme";
import { RACK_THRESHOLDS } from "../../config/rackThresholds";
import type { SidebarProps } from "../../types";
import { sectionRow, iconBtn } from "../../styles";
import { StatCard } from "./StatCard";
import { RackCard } from "./RackCard";
import { TimeSeriesChart } from "./TimeSeriesChart";

const TEMP_MAX = RACK_THRESHOLDS.temperature.critical;
const HUMID_MAX = RACK_THRESHOLDS.humidity.critical;
const POWER_MAX = RACK_THRESHOLDS.power.critical;

function HR() {
  return (
    <div
      style={{ height: "1px", background: theme.divider, margin: "6px 0" }}
    />
  );
}

const sx: Record<string, React.CSSProperties> = {
  container: {
    width: "280px",
    height: "100%",
    background: theme.bg,
    borderLeft: `2px solid ${theme.border}`,
    fontFamily: theme.font,
    color: theme.text,
    display: "flex",
    flexDirection: "column",
    overflowY: "auto",
    flexShrink: 0,
  },
  summaryHeader: {
    background: theme.bgSection,
    borderLeft: `3px solid ${theme.accent}`,
    padding: "0 6px 0 10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: "28px",
    flexShrink: 0,
  },
  sectionTitle: {
    fontFamily: theme.font,
    fontSize: "11px",
    fontWeight: 700,
    letterSpacing: "0.15em",
    textTransform: "uppercase",
    color: theme.text,
  },
  closeBtn: {
    background: "transparent",
    border: `1px solid ${theme.divider}`,
    borderRadius: "3px",
    cursor: "pointer",
    width: "20px",
    height: "20px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: theme.font,
    fontSize: "13px",
    color: theme.label,
    padding: 0,
    lineHeight: 1,
  },
  statRow: { display: "flex", gap: "5px", padding: "8px 10px 4px" },
  rackList: { padding: "8px 10px", flex: 1 },
  emptyLabel: {
    fontFamily: theme.font,
    fontSize: "10px",
    color: theme.label,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    textAlign: "center",
    marginTop: "12px",
  },
};

export function Sidebar({
  racks,
  onClose,
  isEditMode,
  isDeleteMode,
  unplacedCount,
  onAdd,
  onToggleEdit,
  onToggleDelete,
  onSave,
  canEdit = false,
}: SidebarProps) {
  const peakTemp = racks.length
    ? Math.max(...racks.map((r) => r.temperature))
    : 0;
  const avgHumidity = racks.length
    ? racks.reduce((s, r) => s + r.humidity, 0) / racks.length
    : 0;
  const totalPower = racks.reduce((s, r) => s + r.powerUsage, 0);
  const critCount = racks.filter((r) => r.status === "critical").length;

  const { tempSeries, powerSeries, humidSeries } = useMemo(() => {
    const avgTemp = racks.length
      ? racks.reduce((s, r) => s + r.temperature, 0) / racks.length
      : 0;
    const avgPower = racks.length
      ? racks.reduce((s, r) => s + r.powerUsage, 0) / racks.length
      : 0;
    const avgHumid = racks.length
      ? racks.reduce((s, r) => s + r.humidity, 0) / racks.length
      : 0;
    const seed = racks.reduce((s, r) => s + r.id, 0) || 1;
    const jitter = (i: number, spread: number) =>
      (((seed * (i + 3) * 2654435761) % 1000) / 1000) * spread - spread / 2;
    const buildSeries = (now: number, spread: number) =>
      Array.from({ length: 8 }, (_, i) =>
        i === 7
          ? now
          : Math.max(
              0,
              +(now * (0.72 + (i / 7) * 0.24) + jitter(i, spread)).toFixed(1),
            ),
      );
    return {
      tempSeries: buildSeries(avgTemp, 4),
      powerSeries: buildSeries(avgPower, 1),
      humidSeries: buildSeries(avgHumid, 6),
    };
  }, [racks]);

  return (
    <div style={sx.container}>
      <div style={sectionRow}>
        <span style={sx.sectionTitle}>Operations Monitor</span>
        <button onClick={onClose} title="Hide sidebar" style={sx.closeBtn}>
          ✕
        </button>
      </div>

      <div style={sx.statRow}>
        <StatCard
          label="Peak Temp"
          value={peakTemp.toFixed(0)}
          unit="C"
          subLabel={`${critCount} critical units`}
        />
        <StatCard
          label="Humidity"
          value={avgHumidity.toFixed(0)}
          unit="%"
          subLabel="fleet average"
        />
        <StatCard
          label="Power"
          value={totalPower.toFixed(1)}
          unit="KW"
          subLabel="total draw"
          valueColor={theme.power}
        />
      </div>

      <HR />

      <TimeSeriesChart
        values={tempSeries}
        max={TEMP_MAX}
        barColor={theme.accent}
        label="Temperature C"
        maxLabel={`CRIT ${TEMP_MAX}C`}
        warnThreshold={RACK_THRESHOLDS.temperature.warning}
      />
      <TimeSeriesChart
        values={humidSeries}
        max={HUMID_MAX}
        barColor={theme.humid}
        label="Humidity %"
        maxLabel={`CRIT ${HUMID_MAX}%`}
        warnThreshold={RACK_THRESHOLDS.humidity.warning}
      />
      <TimeSeriesChart
        values={powerSeries}
        max={POWER_MAX}
        barColor={theme.power}
        label="Power KW"
        maxLabel={`CRIT ${POWER_MAX}KW`}
        warnThreshold={RACK_THRESHOLDS.power.warning}
      />

      <HR />

      <div style={sx.summaryHeader}>
        <span style={sx.sectionTitle}>Station Summary</span>
        <div style={{ display: "flex", alignItems: "center", gap: "2px" }}>
          {/* ── Edit controls — chỉ hiện với lab-coordinator & admin ── */}
          {canEdit &&
            (isEditMode ? (
              <>
                <button
                  title={unplacedCount === 0 ? "No stations to place" : "Add station"}
                  onClick={onAdd}
                  disabled={unplacedCount === 0}
                  style={iconBtn(unplacedCount === 0)}
                >
                  <svg
                    width="13"
                    height="13"
                    viewBox="0 0 13 13"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  >
                    <line x1="6.5" y1="1.5" x2="6.5" y2="11.5" />
                    <line x1="1.5" y1="6.5" x2="11.5" y2="6.5" />
                  </svg>
                  {unplacedCount > 0 && (
                    <span
                      style={{
                        position: "absolute",
                        top: "-4px",
                        right: "-4px",
                        width: "12px",
                        height: "12px",
                        borderRadius: "50%",
                        background: theme.crit,
                        color: "#fff",
                        fontSize: "7px",
                        fontWeight: 700,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        pointerEvents: "none",
                        lineHeight: 1,
                      }}
                    >
                      {unplacedCount}
                    </span>
                  )}
                </button>

                <button
                  title={isDeleteMode ? "Cancel delete" : "Delete a station"}
                  onClick={onToggleDelete}
                  style={iconBtn(false, isDeleteMode)}
                >
                  <svg
                    width="13"
                    height="13"
                    viewBox="0 0 13 13"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="2,3.5 11,3.5" />
                    <line x1="5" y1="3.5" x2="5" y2="2" />
                    <line x1="8" y1="3.5" x2="8" y2="2" />
                    <line x1="4" y1="2" x2="9" y2="2" />
                    <path d="M3 3.5 L3.6 11 Q3.65 11.5 4.15 11.5 H8.85 Q9.35 11.5 9.4 11 L10 3.5" />
                  </svg>
                </button>

                <button title="Save & exit" onClick={onSave} style={iconBtn()}>
                  <svg
                    width="13"
                    height="13"
                    viewBox="0 0 13 13"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="1.5,7 5,10.5 11.5,2.5" />
                  </svg>
                </button>

                <button
                  title="Exit edit mode"
                  onClick={onToggleEdit}
                  style={iconBtn()}
                >
                  <svg
                    width="11"
                    height="11"
                    viewBox="0 0 11 11"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  >
                    <line x1="1" y1="1" x2="10" y2="10" />
                    <line x1="10" y1="1" x2="1" y2="10" />
                  </svg>
                </button>
              </>
            ) : (
              <button
                title="Edit layout"
                onClick={onToggleEdit}
                style={iconBtn()}
              >
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 13 13"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M9 2 L11 4 L4.5 10.5 L2 11 L2.5 8.5 Z" />
                  <line x1="7.5" y1="3.5" x2="9.5" y2="5.5" />
                </svg>
              </button>
            ))}
        </div>
      </div>

      <div style={sx.rackList}>
        {racks.length === 0 ? (
          <div style={sx.emptyLabel}>No stations placed</div>
        ) : (
          racks.map((rack) => <RackCard key={rack.id} rack={rack} />)
        )}
      </div>
    </div>
  );
}
