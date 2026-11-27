import { ModelLibraryProvider } from "../models/ModelLibraryProvider";
import { Canvas } from "@react-three/fiber";
import { OrthographicCamera, PerformanceMonitor, PerspectiveCamera } from "@react-three/drei";
import {
  CameraRig,
  type CameraPreset,
  type CameraProjection,
} from "./scene/CameraRig";
import {
  Box,
  Camera,
  CircleOff,
  Compass,
  Droplets,
  Eye,
  Gauge,
  HelpCircle,
  Layers,
  Map as MapIcon,
  PanelRightOpen,
  Pause,
  Play,
  RotateCcw,
  Scan,
  Sparkles,
  Thermometer,
  Wind,
  Zap,
} from "lucide-react";
import { SceneEffects, SceneLighting, type RenderQuality } from "./scene/SceneEffects";
import { HeatmapLayer } from "./scene/HeatmapLayer";
import { AirflowLayer } from "./scene/AirflowLayer";
import { MiniMap } from "./hud/MiniMap";
import {
  HEAT_STOPS,
  OVERLAY_LABELS,
  formatMetric,
  normalise,
  overlayDomain,
  overlayValue,
  type Overlay,
} from "../utils/overlays";
import {
  computeRoomRollup,
  hasCapacityRequirement,
  matchCapacityPlan,
  type CapacityRequirement,
} from "../utils/dcimMetrics";
import { FloorRuler, FloorZones } from "./scene/FloorZones";
import {
  STATUS_COLORS,
  TYPE_COLORS,
  TYPE_LABELS,
} from "../utils/stationVisual";
import "../dcim.css";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { useNavigate } from "react-router-dom";
import { confirmAction, notify } from "@/shared/notifications";
import { RoomFloor } from "./scene/RoomFloor";
import { useDashboard } from "../hooks/useDashboard";
import { useEditMode } from "../hooks/useEditMode";
import { RackBox } from "./scene/RackBox";
import { SlotGridOverlay } from "./scene/SlotGridOverlay";
import { TopBar } from "./topbar/TopBar";
import { Sidebar } from "./sidebar/Sidebar";
import type { SidebarTab } from "../types";
import type { RackStatus } from "../config/rackThresholds";
import { theme } from "../theme";
import { ensureAnimations } from "../animations";
import { usePermission } from "@/features/auth/hooks/useCan";

const INITIAL_PLAN: CapacityRequirement = {
  requiredU: 0,
  requiredPowerW: 0,
  requiredWeightKg: 0,
  requiredBenches: 0,
  face: "front",
};

export function Screen() {
  return (
    <ModelLibraryProvider>
      <DashboardScreen />
    </ModelLibraryProvider>
  );
}

function DashboardScreen() {
  ensureAnimations();
  const navigate = useNavigate();
  const canEditLayout = usePermission("lab_operations.manage");
  const canvasHostRef = useRef<HTMLDivElement>(null);
  const {
    racks,
    loading,
    notifications,
    moveRack,
    addRack,
    cancelAdd,
    deleteRack,
    unplacedCount,
    rooms,
    currentRoom,
    selectRoom,
    goPrev,
    goNext,
    slotAnchors,
    floor,
    roomConditions,
    pinnedIds,
    togglePin,
  } = useDashboard();

  const {
    isEditMode,
    isDeleteMode,
    pendingDeleteIds,
    resetKey,
    handleAdd,
    handleDelete,
    handleMove,
    handleToggleEdit,
    handleSave,
    handleToggleDeleteMode,
    hasPendingMoves,
  } = useEditMode({ addRack, cancelAdd, moveRack, deleteRack });

  const visibleRacks = useMemo(
    () => racks.filter((r) => !pendingDeleteIds.includes(r.id)),
    [racks, pendingDeleteIds],
  );

  const [selection, setSelection] = useState<{
    roomId: number | undefined;
    stationId: number;
  } | null>(null);
  const selectedId =
    selection?.roomId === currentRoom?.id
      ? (selection?.stationId ?? null)
      : null;

  const [preset, setPreset] = useState<CameraPreset>("isometric");
  const [projection, setProjection] = useState<CameraProjection>("ortho");
  const [cameraReset, setCameraReset] = useState(0);
  const [showLabels, setShowLabels] = useState(true);
  const [colorMode, setColorMode] = useState<"status" | "type">("status");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>("inventory");
  const [statusFilter, setStatusFilter] = useState<RackStatus | null>(null);
  const [capacityPlan, setCapacityPlan] = useState<CapacityRequirement>(INITIAL_PLAN);
  const [draggingRackId, setDraggingRackId] = useState<number | null>(null);
  const [nearestSlotCode, setNearestSlotCode] = useState<string | null>(null);
  const [isWarningOpen, setIsWarningOpen] = useState(false);
  const [overlay, setOverlay] = useState<Overlay>("none");
  const [xrayMode, setXrayMode] = useState(false);
  const [showAirflow, setShowAirflow] = useState(false);
  const [showMiniMap, setShowMiniMap] = useState(true);
  const [showShortcuts, setShowShortcuts] = useState(false);
  // Camera follows the selected station until Fit or a view change shows the whole room again.
  const [focusSelected, setFocusSelected] = useState(false);
  const [touring, setTouring] = useState(false);
  const selectStation = useCallback(
    (stationId: number) => {
      setSelection({ roomId: currentRoom?.id, stationId });
      setFocusSelected(true);
      setSidebarOpen(true);
    },
    [currentRoom?.id],
  );
  // An explicit Effects choice is kept; without one, effects start on and switch off if frames drop.
  const [qualityChoice, setQualityChoice] = useState<RenderQuality | null>(() => {
    try {
      const stored = localStorage.getItem("dcim:quality");
      return stored === "high" || stored === "standard" ? stored : null;
    } catch {
      return null;
    }
  });
  const [slowDevice, setSlowDevice] = useState(false);
  const quality: RenderQuality = qualityChoice ?? (slowDevice ? "standard" : "high");
  const changeQuality = (next: RenderQuality) => {
    setQualityChoice(next);
    try {
      localStorage.setItem("dcim:quality", next);
    } catch {
      // Preference only; ignore storage failures.
    }
  };

  const selectedRack = visibleRacks.find((rack) => rack.id === selectedId) ?? null;
  const focus = focusSelected && selectedRack?.position ? selectedRack.position : null;
  const domain = overlayDomain(visibleRacks, overlay);
  const overlayReadings = visibleRacks.filter((rack) => overlayValue(rack, overlay) != null).length;
  const floorSize = Math.max(floor.floorWidth, floor.floorDepth) + 2;

  const rollup = useMemo(() => computeRoomRollup(visibleRacks), [visibleRacks]);
  const planActive = sidebarTab === "planner" && hasCapacityRequirement(capacityPlan) && !isEditMode;
  const matchedIds = useMemo(() => {
    if (!planActive) return null;
    const matches = matchCapacityPlan(visibleRacks, capacityPlan);
    return new Set(matches.filter((m) => m.fits).map((m) => m.rack.id));
  }, [planActive, visibleRacks, capacityPlan]);

  // Guided tour: visit each placed station in turn until stopped.
  useEffect(() => {
    if (!touring || isEditMode || !visibleRacks.length) return;
    let index = Math.max(0, visibleRacks.findIndex((rack) => rack.id === selectedId));
    const visit = () => {
      const rack = visibleRacks[index % visibleRacks.length];
      setSelection({ roomId: currentRoom?.id, stationId: rack.id });
      setFocusSelected(true);
      index += 1;
    };
    visit();
    const timer = window.setInterval(visit, 4500);
    return () => window.clearInterval(timer);
  }, [touring, isEditMode, visibleRacks.length, currentRoom?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Keyboard shortcuts for fast DCIM navigation (ignored while typing in form inputs).
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable)
      ) {
        return;
      }
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const key = event.key.toLowerCase();
      if (key === "1") {
        setPreset("isometric");
        setFocusSelected(false);
      } else if (key === "2") {
        setPreset("top");
        setFocusSelected(false);
      } else if (key === "3") {
        setPreset("front");
        setFocusSelected(false);
      } else if (key === "4") {
        setPreset("rear");
        setFocusSelected(false);
      } else if (key === "p") {
        setProjection((p) => (p === "ortho" ? "perspective" : "ortho"));
      } else if (key === "f") {
        setTouring(false);
        setFocusSelected(false);
        setCameraReset((k) => k + 1);
      } else if (key === "l") {
        setShowLabels((v) => !v);
      } else if (key === "x") {
        setXrayMode((v) => !v);
      } else if (key === "a") {
        setShowAirflow((v) => !v);
      } else if (key === "m") {
        setShowMiniMap((v) => !v);
      } else if (key === "?") {
        setShowShortcuts((v) => !v);
      } else if (key === "escape") {
        setShowShortcuts(false);
        setTouring(false);
        setFocusSelected(false);
        setSelection(null);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const handleSnapshot = () => {
    const canvas = canvasHostRef.current?.querySelector("canvas");
    if (!canvas) return;
    try {
      const url = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      const slug = (currentRoom?.name ?? "dcim-room").toLowerCase().replace(/[^a-z0-9]+/g, "-");
      link.download = `${slug}-3d-${new Date().toISOString().slice(0, 10)}.png`;
      link.href = url;
      link.click();
      notify.success("Floorplan snapshot saved");
    } catch {
      notify.error("Unable to export 3D snapshot");
    }
  };

  // Live room conditions from telemetry win over the room record's own values.
  const roomTemp = roomConditions?.temperature_c ?? currentRoom?.temperature ?? null;
  const roomHumidity = roomConditions?.humidity_percent ?? currentRoom?.humidity ?? null;
  const roomPower =
    roomConditions?.power_w != null ? roomConditions.power_w / 1000 : (currentRoom?.power_usage ?? null);
  const isLive = Boolean(roomConditions?.observed_at || rollup.liveStationCount > 0);

  const clearEditState = useCallback(() => {
    setNearestSlotCode(null);
    setDraggingRackId(null);
  }, []);

  const handleFilterStatus = (status: RackStatus) => {
    setSidebarOpen(true);
    setSelection(null);
    setFocusSelected(false);
    if (status === "critical" || status === "warning") {
      setSidebarTab("alerts");
    } else {
      setSidebarTab("inventory");
      setStatusFilter((cur) => (cur === status ? null : status));
    }
  };

  const handleToggleEditGuard = () => {
    if (!isEditMode) {
      const rows = Number(currentRoom?.rows ?? 0);
      const cols = Number(currentRoom?.cols ?? 0);
      if (
        !Number.isFinite(rows) ||
        !Number.isFinite(cols) ||
        rows <= 0 ||
        cols <= 0
      ) {
        notify.warning("Room grid dimensions required", {
          description:
            "Configure room rows and columns before editing the 3D layout.",
        });
        return;
      }
      handleToggleEdit();
      return;
    }

    if (hasPendingMoves) {
      setIsWarningOpen(true);
      confirmAction({
        title: "Discard unsaved layout changes?",
        description:
          "You have station moves that have not been saved. Exiting edit mode will discard them.",
        confirmText: "Discard and exit",
        cancelText: "Keep editing",
        variant: "danger",
        onConfirm: () => {
          setIsWarningOpen(false);
          clearEditState();
          handleToggleEdit();
        },
        onCancel: () => {
          setIsWarningOpen(false);
        },
      });
      return;
    }

    clearEditState();
    handleToggleEdit();
  };

  return (
    <div
      className="dcim-dashboard"
      style={{
        width: "100vw",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <TopBar
        rackCount={visibleRacks.length}
        temperature={roomTemp}
        humidity={roomHumidity}
        powerUsage={roomPower}
        rackUtilization={rollup.rackUtilization}
        isLive={isLive}
        roomName={currentRoom?.name}
        currentRoomId={currentRoom?.id}
        rooms={rooms.map((r) => ({ id: r.id, name: r.name }))}
        onSelectRoom={selectRoom}
        locationString={
          currentRoom?.location_info?.location_string ?? undefined
        }
        notifications={notifications}
        onFilterStatus={handleFilterStatus}
        onPrev={goPrev}
        onNext={goNext}
        onBack={() => navigate(-1)}
      />

      {isWarningOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 999,
            background: "transparent",
            pointerEvents: "all",
          }}
        />
      )}

      <div
        style={{
          flex: 1,
          display: "flex",
          overflow: "hidden",
          position: "relative",
        }}
      >
        {loading && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(0,0,0,0.4)",
              color: "white",
              fontSize: "1.2rem",
              zIndex: 30,
            }}
          >
            Loading stations…
          </div>
        )}

        <div className="dcim-map" ref={canvasHostRef}>
          <div className="dcim-map-header">
            <div>
              <span className="dcim-eyebrow">
                DCIM / 3D SPATIAL OPERATIONS
              </span>
              <h1>{currentRoom?.name ?? "Room overview"}</h1>
              <p>
                {visibleRacks.length} placed stations ·{" "}
                {Math.max(0, slotAnchors.length - visibleRacks.length)} empty
                slots
                {floor.measured
                  ? ` · ${floor.floorWidth.toFixed(1)} × ${floor.floorDepth.toFixed(1)} m`
                  : ""}
                {rollup.totalRackUnits > 0
                  ? ` · ${rollup.freeRackUnits}U free of ${rollup.totalRackUnits}U`
                  : ""}
              </p>
            </div>
            <div className="dcim-header-badges">
              {planActive && matchedIds && (
                <span className="dcim-schematic is-planner">
                  Planner: {matchedIds.size} fit
                </span>
              )}
              <span className="dcim-schematic">
                {projection === "perspective" ? "Perspective" : "Orthographic"} ·{" "}
                {quality === "high" ? "Enhanced" : "Standard"}
              </span>
            </div>
          </div>

          <div
            className="dcim-map-toolbar"
            role="toolbar"
            aria-label="Map controls"
          >
            <div>
              {(["isometric", "top", "front", "rear"] as const).map((view) => (
                <button
                  key={view}
                  onClick={() => {
                    setPreset(view);
                    setFocusSelected(false);
                  }}
                  aria-pressed={preset === view}
                >
                  {view === "isometric" ? <Box size={14} /> : <Scan size={14} />}
                  {view === "isometric"
                    ? "3D"
                    : view === "top"
                      ? "Top"
                      : view === "front"
                        ? "Front"
                        : "Rear"}
                </button>
              ))}
              <button
                onClick={() =>
                  setProjection((p) => (p === "ortho" ? "perspective" : "ortho"))
                }
                aria-pressed={projection === "perspective"}
                title="Switch Orthographic / Perspective camera (P)"
              >
                <Compass size={14} />
                {projection === "perspective" ? "Persp" : "Ortho"}
              </button>
              <button
                onClick={() => {
                  setTouring(false);
                  setFocusSelected(false);
                  setCameraReset((key) => key + 1);
                }}
                title="Fit room (F)"
              >
                <RotateCcw size={14} />
                Fit
              </button>
            </div>

            <div role="radiogroup" aria-label="Data overlay">
              {(["none", "temperature", "humidity", "power", "capacity"] as const).map((value) => (
                <button
                  key={value}
                  role="radio"
                  aria-checked={overlay === value}
                  aria-pressed={overlay === value}
                  onClick={() => setOverlay(value)}
                  title={OVERLAY_LABELS[value]}
                >
                  {value === "none" ? (
                    <CircleOff size={14} />
                  ) : value === "temperature" ? (
                    <Thermometer size={14} />
                  ) : value === "humidity" ? (
                    <Droplets size={14} />
                  ) : value === "power" ? (
                    <Zap size={14} />
                  ) : (
                    <Gauge size={14} />
                  )}
                  {value === "none"
                    ? "None"
                    : value === "temperature"
                      ? "Heat"
                      : value === "humidity"
                        ? "RH%"
                        : value === "power"
                          ? "Power"
                          : "Capacity"}
                </button>
              ))}
            </div>

            <div>
              <button
                onClick={() => setXrayMode((v) => !v)}
                aria-pressed={xrayMode}
                title="Analytical thermal/capacity X-Ray shells (X)"
              >
                <Layers size={14} />
                X-Ray
              </button>
              <button
                onClick={() => setShowAirflow((v) => !v)}
                aria-pressed={showAirflow}
                title="3D cold intake / hot exhaust airflow (A)"
              >
                <Wind size={14} />
                Airflow
              </button>
              <button
                onClick={() => setShowLabels((value) => !value)}
                aria-pressed={showLabels}
                title="Toggle station HUD labels (L)"
              >
                <Eye size={14} />
                Labels
              </button>
              <button
                onClick={() =>
                  setColorMode((mode) =>
                    mode === "status" ? "type" : "status",
                  )
                }
                title="Toggle color coding"
              >
                Color: {colorMode}
              </button>
            </div>

            <div>
              <button
                onClick={() => setShowMiniMap((v) => !v)}
                aria-pressed={showMiniMap}
                title="Toggle 2D floorplan mini-map (M)"
              >
                <MapIcon size={14} />
                Map
              </button>
              <button
                onClick={() => setTouring((value) => !value)}
                aria-pressed={touring}
                disabled={isEditMode || !visibleRacks.length}
                title="Guided station tour"
              >
                {touring ? <Pause size={14} /> : <Play size={14} />}
                {touring ? "Stop" : "Tour"}
              </button>
              <button
                onClick={() => changeQuality(quality === "high" ? "standard" : "high")}
                aria-pressed={quality === "high"}
                title="Ambient occlusion, glow and anti-aliasing"
              >
                <Sparkles size={14} />
                FX
              </button>
              <button
                onClick={handleSnapshot}
                title="Export 3D floorplan PNG snapshot"
              >
                <Camera size={14} />
                PNG
              </button>
              <button
                onClick={() => setShowShortcuts((v) => !v)}
                aria-pressed={showShortcuts}
                title="Keyboard shortcuts (?)"
                aria-label="Keyboard shortcuts"
              >
                <HelpCircle size={14} />
              </button>
            </div>
          </div>

          <Canvas
            shadows={{ type: THREE.PCFSoftShadowMap }}
            dpr={[1, 2]}
            gl={{
              preserveDrawingBuffer: true,
              toneMapping: THREE.ACESFilmicToneMapping,
              toneMappingExposure: 1.05,
            }}
            style={{ flex: 1, height: "100%" }}
            onPointerMissed={() => setTouring(false)}
          >
            {projection === "ortho" ? (
              <OrthographicCamera
                makeDefault
                near={0.1}
                far={2000}
                zoom={30}
                position={[20, 20, 20]}
              />
            ) : (
              <PerspectiveCamera
                makeDefault
                fov={42}
                near={0.1}
                far={500}
                position={[14, 12, 14]}
              />
            )}
            <color attach="background" args={["#0b1523"]} />
            <fog attach="fog" args={["#0b1523", 60, 160]} />
            {qualityChoice === null && <PerformanceMonitor onDecline={() => setSlowDevice(true)} />}
            <SceneLighting floorSize={floorSize} />
            <ambientLight intensity={0.35} />
            <hemisphereLight args={["#d9efff", "#253549", 0.6]} />
            <directionalLight
              position={[8, 15, 10]}
              intensity={1.8}
              castShadow
              shadow-mapSize={[2048, 2048]}
              shadow-camera-left={-30}
              shadow-camera-right={30}
              shadow-camera-top={30}
              shadow-camera-bottom={-30}
              shadow-bias={-0.0005}
              shadow-normalBias={0.02}
            />
            {overlay !== "none" && !isEditMode && (
              <HeatmapLayer
                racks={visibleRacks}
                overlay={overlay}
                floor={floor}
              />
            )}
            {showAirflow && !isEditMode && <AirflowLayer racks={visibleRacks} />}
            <RoomFloor floor={floor} />
            {/* Own boundary: labels still loading their font never hold back the rest of the scene. */}
            <Suspense fallback={null}>
              {!isEditMode && <FloorZones slots={slotAnchors} />}
              {showLabels && <FloorRuler floor={floor} slots={slotAnchors} />}
            </Suspense>
            <SlotGridOverlay
              slots={slotAnchors}
              isEditMode={isEditMode}
              isDragging={draggingRackId !== null}
              nearestSlotCode={nearestSlotCode}
              draggingRackId={draggingRackId}
              racks={visibleRacks}
            />
            <Suspense fallback={null}>
              {visibleRacks.map((rack) => (
                <RackBox
                  key={`${rack.id}-${resetKey}-${isEditMode ? "edit" : "view"}`}
                  rack={rack}
                  selected={selectedId === rack.id}
                  onSelect={selectStation}
                  showLabels={showLabels}
                  colorMode={colorMode}
                  slots={slotAnchors}
                  isEditMode={isEditMode}
                  isDeleteMode={isDeleteMode}
                  onMove={handleMove}
                  onDelete={handleDelete}
                  onDragStateChange={(id, dragging) => {
                    setDraggingRackId(dragging ? id : null);
                    if (!dragging) setNearestSlotCode(null);
                  }}
                  onNearestSlotChange={setNearestSlotCode}
                  pinned={pinnedIds.includes(rack.id)}
                  onTogglePin={togglePin}
                  overlayLevel={(() => {
                    const value = overlayValue(rack, overlay);
                    return value == null || isEditMode ? null : normalise(value, domain);
                  })()}
                  xrayMode={xrayMode}
                  planMatch={
                    matchedIds
                      ? matchedIds.has(rack.id)
                        ? "match"
                        : "excluded"
                      : null
                  }
                  dimmed={focus !== null && selectedId !== rack.id}
                />
              ))}
            </Suspense>
            <CameraRig
              floor={floor}
              preset={preset}
              projection={projection}
              resetKey={`${currentRoom?.id}-${cameraReset}`}
              enabled={draggingRackId === null}
              focus={isEditMode ? null : focus}
            />
            <SceneEffects quality={quality} />
          </Canvas>

          {showMiniMap && !isEditMode && visibleRacks.length > 0 && (
            <MiniMap
              floor={floor}
              slots={slotAnchors}
              racks={visibleRacks}
              selectedId={selectedId}
              colorMode={colorMode}
              overlay={overlay}
              matchedIds={matchedIds}
              onSelect={selectStation}
            />
          )}

          {showShortcuts && (
            <div className="dcim-shortcuts-popover" role="dialog" aria-label="Keyboard shortcuts">
              <div className="dcim-shortcuts-head">
                <strong>DCIM Shortcuts</strong>
                <button onClick={() => setShowShortcuts(false)}>✕</button>
              </div>
              <ul>
                <li><kbd>1</kbd>–<kbd>4</kbd> <span>3D / Top / Front / Rear view</span></li>
                <li><kbd>P</kbd> <span>Orthographic / Perspective</span></li>
                <li><kbd>F</kbd> <span>Fit full room</span></li>
                <li><kbd>X</kbd> <span>Toggle analytical X-Ray</span></li>
                <li><kbd>A</kbd> <span>Toggle 3D thermal airflow</span></li>
                <li><kbd>L</kbd> <span>Toggle station labels</span></li>
                <li><kbd>M</kbd> <span>Toggle 2D mini-map</span></li>
                <li><kbd>Esc</kbd> <span>Clear selection / exit focus</span></li>
              </ul>
            </div>
          )}

          {!loading && visibleRacks.length === 0 && (
            <div className="dcim-map-empty">
              No stations placed
              <span>
                {unplacedCount
                  ? "Use Edit layout to place stations in this room."
                  : "Assign stations to this room to build its 3D layout."}
              </span>
            </div>
          )}

          <div className="dcim-map-footer">
            {overlay !== "none" && (
              <div className="dcim-heat-legend" aria-label={`${OVERLAY_LABELS[overlay]} scale`}>
                <strong>{OVERLAY_LABELS[overlay]}</strong>
                {overlayReadings ? (
                  <>
                    <span>{formatMetric(domain[0], overlay)}</span>
                    <i style={{ background: `linear-gradient(90deg, ${HEAT_STOPS.join(", ")})` }} />
                    <span>{formatMetric(domain[1], overlay)}</span>
                    <small>
                      {overlayReadings} of {visibleRacks.length} stations{" "}
                      {overlay === "capacity" ? "with rated capacity" : "reporting"}
                    </small>
                  </>
                ) : (
                  <small>
                    {overlay === "capacity"
                      ? "No station in this room has a rated power, weight, rack or bench capacity yet."
                      : `No ${OVERLAY_LABELS[overlay].toLowerCase()} telemetry for this room yet.`}
                  </small>
                )}
              </div>
            )}
            <div className="dcim-legend">
              {Object.entries(
                colorMode === "status" ? STATUS_COLORS : TYPE_COLORS,
              ).map(([key, color]) => (
                <span key={key}>
                  <i style={{ background: color }} />
                  {colorMode === "type"
                    ? TYPE_LABELS[key as keyof typeof TYPE_LABELS]
                    : key === "unknown"
                      ? "No / partial data"
                      : key}
                </span>
              ))}
            </div>
            <span>
              {isEditMode
                ? "Drag to an available slot · Save to apply"
                : "Drag to orbit · Scroll to zoom · Click to inspect · Press ? for shortcuts"}
            </span>
          </div>
        </div>

        {!sidebarOpen && (
          <button
            onClick={() => setSidebarOpen(true)}
            title="Show sidebar"
            style={{
              position: "absolute",
              top: "10px",
              right: "10px",
              zIndex: 20,
              width: "28px",
              height: "28px",
              background: theme.bg,
              border: `1px solid ${theme.border}`,
              borderRadius: "3px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: theme.font,
              fontSize: "14px",
              color: theme.text,
            }}
          >
            <PanelRightOpen size={17} />
          </button>
        )}

        {sidebarOpen && (
          <Sidebar
            racks={visibleRacks}
            selectedId={selectedId}
            onSelect={selectStation}
            onClose={() => setSidebarOpen(false)}
            onClearSelection={() => {
              setTouring(false);
              setSelection(null);
              setFocusSelected(false);
            }}
            onFocus={(id) => {
              setSelection({ roomId: currentRoom?.id, stationId: id });
              setFocusSelected(true);
            }}
            pinnedIds={pinnedIds}
            onTogglePin={togglePin}
            activeTab={sidebarTab}
            onTabChange={setSidebarTab}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            capacityPlan={capacityPlan}
            onCapacityPlanChange={setCapacityPlan}
            isEditMode={isEditMode}
            canEdit={canEditLayout}
            isDeleteMode={isDeleteMode}
            unplacedCount={unplacedCount}
            onAdd={handleAdd}
            onToggleEdit={handleToggleEditGuard}
            onToggleDelete={handleToggleDeleteMode}
            onSave={() => {
              clearEditState();
              handleSave();
            }}
          />
        )}
      </div>
    </div>
  );
}
