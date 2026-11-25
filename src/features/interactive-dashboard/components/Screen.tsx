import { Canvas } from "@react-three/fiber";
import { CameraRig } from "./scene/CameraRig";
import {
  Box,
  Scan,
  RotateCcw,
  PanelRightOpen,
  Eye,
  Layers,
} from "lucide-react";
import {
  STATUS_COLORS,
  TYPE_COLORS,
  TYPE_LABELS,
} from "../utils/stationVisual";
import "../dcim.css";
import { Suspense, useCallback, useState } from "react";
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
import { theme } from "../theme";
import { ensureAnimations } from "../animations";
import { usePermission } from "@/features/auth/hooks/useCan";

export function Screen() {
  ensureAnimations();
  const navigate = useNavigate();
  const canEditLayout = usePermission("lab_operations.manage");
  const {
    racks,
    loading,
    notifications,
    moveRack,
    addRack,
    cancelAdd,
    deleteRack,
    unplacedCount,
    currentRoom,
    goPrev,
    goNext,
    slotAnchors,
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

  const visibleRacks = racks.filter((r) => !pendingDeleteIds.includes(r.id));

  const [selection, setSelection] = useState<{
    roomId: number | undefined;
    stationId: number;
  } | null>(null);
  const selectedId =
    selection?.roomId === currentRoom?.id
      ? (selection?.stationId ?? null)
      : null;
  const selectStation = (stationId: number) =>
    setSelection({ roomId: currentRoom?.id, stationId });
  const [preset, setPreset] = useState<"isometric" | "top" | "front">(
    "isometric",
  );
  const [cameraReset, setCameraReset] = useState(0);
  const [showLabels, setShowLabels] = useState(true);
  const [colorMode, setColorMode] = useState<"status" | "type">("status");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [draggingRackId, setDraggingRackId] = useState<number | null>(null);
  const [nearestSlotCode, setNearestSlotCode] = useState<string | null>(null);
  const [isWarningOpen, setIsWarningOpen] = useState(false);

  const roomTemp = currentRoom?.temperature ?? null;
  const roomHumidity = currentRoom?.humidity ?? null;
  const roomPower = currentRoom?.power_usage ?? null;

  const clearEditState = useCallback(() => {
    setNearestSlotCode(null);
    setDraggingRackId(null);
  }, []);

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

    // Warn if there are any unsaved moves (drop without saving)
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
        roomName={currentRoom?.name}
        locationString={
          currentRoom?.location_info?.location_string ?? undefined
        }
        notifications={notifications}
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

        <div className="dcim-map">
          <div className="dcim-map-header">
            <div>
              <span className="dcim-eyebrow">
                INFRASTRUCTURE / SPATIAL VIEW
              </span>
              <h1>Room overview</h1>
              <p>
                {visibleRacks.length} placed stations ·{" "}
                {Math.max(0, slotAnchors.length - visibleRacks.length)} empty
                slots
              </p>
            </div>
            <span className="dcim-schematic">Schematic view</span>
          </div>
          <div
            className="dcim-map-toolbar"
            role="toolbar"
            aria-label="Map controls"
          >
            <div>
              {(["isometric", "top", "front"] as const).map((view) => (
                <button
                  key={view}
                  onClick={() => setPreset(view)}
                  aria-pressed={preset === view}
                >
                  {view === "isometric" ? (
                    <Box size={14} />
                  ) : (
                    <Scan size={14} />
                  )}
                  {view === "isometric"
                    ? "3D view"
                    : view === "top"
                      ? "Top view"
                      : "Front view"}
                </button>
              ))}
            </div>
            <div>
              <button
                onClick={() => setCameraReset((key) => key + 1)}
                title="Fit room"
              >
                <RotateCcw size={14} />
                Fit
              </button>
              <button
                onClick={() => setShowLabels((value) => !value)}
                aria-pressed={showLabels}
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
              >
                <Layers size={14} />
                Color: {colorMode}
              </button>
            </div>
          </div>
          <Canvas
            orthographic
            camera={{ near: 0.1, far: 2000, zoom: 30, position: [20, 20, 20] }}
            shadows={{ type: THREE.PCFShadowMap }}
            dpr={[1, 2]}
            style={{ flex: 1, height: "100%" }}
          >
            <color attach="background" args={["#0b1523"]} />
            <ambientLight intensity={0.9} />
            <hemisphereLight args={["#d9efff", "#253549", 1.2]} />
            <directionalLight
              position={[8, 15, 10]}
              intensity={2.2}
              castShadow
              shadow-mapSize={[2048, 2048]}
              shadow-camera-left={-30}
              shadow-camera-right={30}
              shadow-camera-top={30}
              shadow-camera-bottom={-30}
              shadow-bias={-0.0005}
            />
            <RoomFloor
              rows={currentRoom?.rows ?? null}
              cols={currentRoom?.cols ?? null}
            />
            <SlotGridOverlay
              slots={slotAnchors}
              isEditMode={isEditMode}
              isDragging={draggingRackId !== null}
              nearestSlotCode={nearestSlotCode}
              draggingRackId={draggingRackId}
              racks={visibleRacks}
              rows={currentRoom?.rows ?? null}
              cols={currentRoom?.cols ?? null}
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
                />
              ))}
            </Suspense>
            <CameraRig
              rows={currentRoom?.rows}
              cols={currentRoom?.cols}
              preset={preset}
              resetKey={`${currentRoom?.id}-${cameraReset}`}
              enabled={draggingRackId === null}
            />
          </Canvas>
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
                : "Drag to orbit · Scroll to zoom · Click to inspect"}
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
