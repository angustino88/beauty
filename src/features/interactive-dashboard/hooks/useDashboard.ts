/* eslint-disable react-hooks/set-state-in-effect */
import { getApiErrorMessage, notify } from "@/shared/notifications";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { skipToken } from "@reduxjs/toolkit/query";
import {
  useGetRoomDashboardLayoutQuery,
  useGetRoomsQuery,
} from "@/features/spaces/room/api";
import {
  useGetDashboardStationsQuery,
  usePlaceRackMutation,
} from "@/features/spaces/station/api";
import type { IRack } from "@/features/spaces/station/types";
import type { IRoom } from "@/features/spaces/room/types";
import {
  deriveNotifications,
  toRackData,
  toRoomSlug,
} from "../utils/rackMapper";
import { nearestAvailableSlot, toSlotAnchors } from "../utils/slotGrid";
import type { RackData, SlotAnchor } from "../types";

const ROOM_QUERY = { page: 1, page_size: 100, ordering: "id" } as const;
const PINNED_KEY = "rackPinnedIds";

function loadPinned(): number[] {
  try {
    return JSON.parse(localStorage.getItem(PINNED_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function savePinned(ids: number[]) {
  try {
    localStorage.setItem(PINNED_KEY, JSON.stringify(ids));
  } catch {
    // ignore localStorage failures
  }
}

function makeFallbackRack(
  id: number,
  sku: string | null,
  name: string | null,
  room: IRoom | null,
): IRack {
  return {
    id,
    sku: sku ?? `RACK-${id}`,
    name: name ?? sku ?? `Rack ${id}`,
    rack_manufacturer: null,
    rack_model: null,
    room: room ? { id: room.id, sku: room.sku, name: room.name } : null,
    label: "",
    remark: "",
    primary_owner: null,
    current_status: null,
    lab_audit: null,
    lifecycle_status: { value: 'in_service', label: 'In service' },
    access_policy: { value: 'open', label: 'Open' },
    condition: { value: 'operational', label: 'Operational' },
    availability: { value: 'available', blocked_by: null, condition: null, reason: null },
    activity_status: { value: 'idle', label: 'Idle' },
    status: null,
  };
}

function updateRackState(
  racks: RackData[],
  id: number,
  position: RackData["position"],
  slotCode: string | null,
): RackData[] {
  return racks.map((rack) =>
    rack.id === id ? { ...rack, position, slotCode } : rack,
  );
}

export function useDashboard() {
  const navigate = useNavigate();
  const { roomSlug } = useParams<{ roomSlug?: string }>();
  const { data: roomsData, isLoading: roomsLoading } =
    useGetRoomsQuery(ROOM_QUERY);
  const [placeRack] = usePlaceRackMutation();

  const rooms = useMemo(() => roomsData?.data ?? [], [roomsData?.data]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [pinnedIds, setPinnedIds] = useState<number[]>(loadPinned);
  const [rackState, setRackState] = useState<RackData[]>([]);

  useEffect(() => {
    if (!rooms.length) return;

    if (!roomSlug) {
      navigate(`/dashboard/3d/${toRoomSlug(rooms[0].name)}`, { replace: true });
      return;
    }

    const idx = rooms.findIndex((room) => toRoomSlug(room.name) === roomSlug);
    if (idx === -1) {
      navigate(`/dashboard/3d/${toRoomSlug(rooms[0].name)}`, { replace: true });
      return;
    }

    if (idx !== currentIndex) {
      setCurrentIndex(idx);
    }
  }, [currentIndex, navigate, roomSlug, rooms]);

  const currentRoom = rooms[currentIndex] ?? null;
  const { currentData: racksData, isFetching: racksLoading } = useGetDashboardStationsQuery(currentRoom?.id ?? skipToken);
  const allRacks = useMemo(() => racksData?.data ?? [], [racksData?.data]);
  const {
    currentData: layoutData,
    isLoading: layoutLoading,
    refetch: refetchLayout,
  } = useGetRoomDashboardLayoutQuery(currentRoom?.id ?? skipToken);

  const slotAnchors: SlotAnchor[] = useMemo(
    () =>
      toSlotAnchors(
        layoutData?.slots ?? [],
        layoutData?.room.rows ?? currentRoom?.rows,
        layoutData?.room.cols ?? currentRoom?.cols,
      ),
    [
      layoutData?.room.cols,
      layoutData?.room.rows,
      layoutData?.slots,
      currentRoom?.cols,
      currentRoom?.rows,
    ],
  );

  useEffect(() => {
    if (!currentRoom || !layoutData) {
      setRackState([]);
      return;
    }

    const rackById = new Map<number, IRack>(
      allRacks.map((rack) => [rack.id, rack]),
    );
    const slotByCode = new Map(
      slotAnchors.map((slot) => [slot.slotCode, slot]),
    );
    const next: RackData[] = [];

    for (const slot of layoutData.slots) {
      if (!slot.rack) continue;
      const detail =
        rackById.get(slot.rack.id) ??
        makeFallbackRack(
          slot.rack.id,
          slot.rack.sku,
          slot.rack.name,
          currentRoom,
        );
      const anchor = slotByCode.get(slot.slot_code);
      next.push({ ...toRackData(detail, anchor?.position ?? null, slot.slot_code), slots: layoutData.contents && (layoutData.contents[detail.id] ?? []) });
    }

    for (const rack of layoutData.unplaced_racks) {
      const detail =
        rackById.get(rack.id) ??
        makeFallbackRack(rack.id, rack.sku, rack.name, currentRoom);
      next.push(toRackData(detail, null, null));
    }

    setRackState(next);
  }, [allRacks, currentRoom, layoutData, slotAnchors]);

  const moveRack = useCallback(
    (id: number, position: [number, number, number]) => {
      if (!currentRoom) return;
      const targetSlot = nearestAvailableSlot(position, slotAnchors, id);
      if (!targetSlot) {
        notify.warning("No available slot", {
          description: "Free a slot in this room before placing the station.",
        });
        return;
      }

      setRackState((prev) =>
        updateRackState(prev, id, targetSlot.position, targetSlot.slotCode),
      );
      void placeRack({ stationId: id, body: { room_id: currentRoom.id, slot_id: targetSlot.id } })
        .unwrap()
        .then(() => {
          void refetchLayout();
        })
        .catch((err: unknown) => {
          const status = (err as { status?: number }).status;
          if (status === 409) {
            notify.warning("Slot already occupied", {
              description: "Choose an empty slot and try again.",
            });
          } else {
            notify.error("Unable to place station", {
              description: getApiErrorMessage(err, "Please try again."),
            });
          }
          void refetchLayout();
        });
    },
    [currentRoom, placeRack, refetchLayout, slotAnchors],
  );

  const addRack = useCallback(() => {
    const occupiedSlotCodes = new Set(
      rackState
        .filter((rack) => rack.position != null && rack.slotCode)
        .map((rack) => rack.slotCode as string),
    );
    const firstEmptySlot = slotAnchors.find(
      (slot) => !occupiedSlotCodes.has(slot.slotCode),
    );
    if (!firstEmptySlot) return null;

    let addedId: number | null = null;
    setRackState((prev) =>
      prev.map((rack) => {
        if (addedId === null && rack.position == null) {
          addedId = rack.id;
          return {
            ...rack,
            position: firstEmptySlot.position,
            slotCode: firstEmptySlot.slotCode,
          };
        }
        return rack;
      }),
    );
    if (!addedId) return null;
    return { id: addedId, position: firstEmptySlot.position };
  }, [rackState, slotAnchors]);

  const cancelAdd = useCallback((id: number) => {
    setRackState((prev) => updateRackState(prev, id, null, null));
  }, []);

  const deleteRack = useCallback(
    (id: number) => {
      setRackState((prev) => updateRackState(prev, id, null, null));
      void placeRack({ stationId: id, body: { room_id: null, slot_id: null } })
        .unwrap()
        .then(() => {
          void refetchLayout();
        })
        .catch((err: unknown) => {
          notify.error("Unable to remove station from layout", {
            description: getApiErrorMessage(err, "Please try again."),
          });
          void refetchLayout();
        });
    },
    [placeRack, refetchLayout],
  );

  const visibleRacks = useMemo(
    () => rackState.filter((rack) => rack.position != null),
    [rackState],
  );

  const racks: RackData[] = useMemo(() => visibleRacks, [visibleRacks]);

  const unplacedCount = useMemo(
    () => rackState.filter((rack) => rack.position == null).length,
    [rackState],
  );

  const notifications = useMemo(() => deriveNotifications(racks), [racks]);

  const goPrev = useCallback(() => {
    if (!rooms.length) return;
    const nextIndex = (currentIndex - 1 + rooms.length) % rooms.length;
    navigate(`/dashboard/3d/${toRoomSlug(rooms[nextIndex].name)}`);
  }, [currentIndex, navigate, rooms]);

  const goNext = useCallback(() => {
    if (!rooms.length) return;
    const nextIndex = (currentIndex + 1) % rooms.length;
    navigate(`/dashboard/3d/${toRoomSlug(rooms[nextIndex].name)}`);
  }, [currentIndex, navigate, rooms]);

  const togglePin = useCallback((id: number) => {
    setPinnedIds((prev) => {
      const next = prev.includes(id)
        ? prev.filter((value) => value !== id)
        : [...prev, id];
      savePinned(next);
      return next;
    });
  }, []);

  return {
    racks,
    loading: roomsLoading || racksLoading || layoutLoading,
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
  };
}
