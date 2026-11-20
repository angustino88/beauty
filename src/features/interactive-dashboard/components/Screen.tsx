import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { Suspense, useCallback, useState } from "react";
import * as THREE from "three";
import { useNavigate } from "react-router-dom";
import { message, Modal } from "antd";
import { RoomFloor } from "./scene/RoomFloor";
import { useDashboard } from "../hooks/useDashboard";
import { useEditMode } from "../hooks/useEditMode";
import { RackBox } from "./scene/RackBox";
import { SlotGridOverlay } from "./scene/SlotGridOverlay";
import { TopBar } from "./topbar/TopBar";
import { Sidebar } from "./sidebar/Sidebar";
import { theme } from "../theme";
import { ensureAnimations } from "../animations";
import { usePermission } from '@/features/auth/hooks/useCan';

export function Screen() {
  ensureAnimations();
  const navigate = useNavigate();
  const canEditLayout = usePermission('lab_operations.manage');
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
        void message.warning(
          "Please set Room rows/cols before editing 3D layout",
        );
        return;
      }
      handleToggleEdit();
      return;
    }

    // Warn if there are any unsaved moves (drop without saving)
    if (hasPendingMoves) {
      setIsWarningOpen(true);
      Modal.confirm({
        title: "Unsaved changes",
        content:
          "You have station moves that have not been saved. Exit anyway? All changes will be discarded.",
        okText: "Exit anyway",
        cancelText: "Stay in edit",
        okButtonProps: { danger: true },
        onOk: () => {
          setIsWarningOpen(false);
          clearEditState();
          handleToggleEdit();
        },
        onCancel: () => {
          setIsWarningOpen(false);
        },
        afterClose: () => {
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

        <Canvas
          orthographic
          camera={{ near: -1000, far: 1000, zoom: 100, position: [0, 5, 10] }}
          shadows={{ type: THREE.PCFShadowMap }}
          dpr={[1, 2]}
          style={{ flex: 1, height: "100%" }}
        >
          <ambientLight intensity={0.5} />
          <directionalLight position={[5, 10, 5]} castShadow />
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
          <OrbitControls makeDefault enabled={draggingRackId === null} />
        </Canvas>

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
            ‹
          </button>
        )}

        {sidebarOpen && (
          <Sidebar
            racks={visibleRacks}
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
