import {
    useCreateRoomMutation,
    useDeleteRoomMutation,
    useForceDeleteRoomMutation,
    useUpdateRoomMutation,
    useUpdateRoomImageMutation,
    useDeleteRoomImageMutation,
} from '../api';
import { message } from 'antd';
import { useLabsRoomsActionsGenerateSlotsCreateByRoomIdMutation } from '@/shared/api/generated/api';
import { notifyEquipmentCreated, notifyEquipmentError, useEquipmentCrudActions, type GuardedForceDeleteResult } from '@/features/lab-equipment/shared';
import { parseFormApiError } from '@/features/lab-equipment/shared/utils/formApiError';
import type { IRoomPayload } from '../types';

// ── helpers ───────────────────────────────────────────────────────────────────

const toNumber = (value: unknown): number | undefined => {
    if (value == null || value === '') return undefined;
    const n = Number(value);
    return Number.isNaN(n) ? undefined : n;
};

const slotErrorText = (err: unknown): string => {
    const parsed = parseFormApiError(err);
    return parsed?.message || parsed?.nonFieldErrors[0] || Object.values(parsed?.fieldErrors ?? {})[0]?.[0] || 'the slot grid could not be generated';
};

// ── hook ──────────────────────────────────────────────────────────────────────

export function useRoomForm() {
    const [createRoom,          { isLoading: creating }] = useCreateRoomMutation();
    const [updateRoom,          { isLoading: updating }] = useUpdateRoomMutation();
    const [deleteRoom,          { isLoading: deleting }] = useDeleteRoomMutation();
    const [forceDeleteRoom,     { isLoading: forceDeleting }] = useForceDeleteRoomMutation();
    const [updateRoomImageMutation]                       = useUpdateRoomImageMutation();
    const [deleteRoomImageMutation]                       = useDeleteRoomImageMutation();
    const [generateSlotsMutation]                         = useLabsRoomsActionsGenerateSlotsCreateByRoomIdMutation();

    /**
     * Stations are placed on room slots, and the backend creates those slots only when asked
     * (generate-slots), one per cell of the layout grid (R1C1, R1C2, ...). Run it after every save
     * that has a layout so the "Room Slot" picker in the station form always has the grid.
     * Idempotent: existing slots are kept; cells removed from the grid are pruned unless a station
     * stands on them, in which case the backend refuses and we say why.
     */
    const syncSlots = async (roomId: number, values: Record<string, unknown>) => {
        if (toNumber(values.rows) == null || toNumber(values.cols) == null) return;
        try {
            await generateSlotsMutation({ roomId }).unwrap();
        } catch (err) {
            message.warning(`Room saved, but its slots were not updated: ${slotErrorText(err)}.`);
        }
    };

    const actions = useEquipmentCrudActions<IRoomPayload>({
        updateMutation:      updateRoom,
        updateImageMutation: updateRoomImageMutation,
        deleteImageMutation: deleteRoomImageMutation,
        deleteMutation:      deleteRoom,
        mapStatusBody:       (values) => values as unknown as IRoomPayload,
        labels: { entityName: 'Room', entityNameLower: 'room', errorPrefix: 'room' },
    });

    const forceDeleteById = async (
        id: number,
        reason: string,
        item?: { sku?: string | null; name?: string | null },
    ): Promise<GuardedForceDeleteResult> => {
        try {
            const result = await forceDeleteRoom({ id, reason, confirm: true }).unwrap();
            const label = item?.sku || item?.name || `Room #${id}`;
            const parts: string[] = [];
            if (result?.released?.stations) {
                parts.push(`detached ${result.released.stations} station${result.released.stations === 1 ? '' : 's'}`);
            }
            if (result?.released?.equipment) {
                parts.push(`cleared ${result.released.equipment} resting equipment placement${result.released.equipment === 1 ? '' : 's'}`);
            }
            message.success(
                parts.length > 0 ? `Force-deleted ${label} (${parts.join(', ')}).` : `Force-deleted ${label}.`,
            );
            return { ok: true };
        } catch (err) {
            return { ok: false, error: slotErrorText(err) || 'Failed to force-delete room.' };
        }
    };

    const createFromValues = async (values: Record<string, unknown>, imageFile?: File | null) => {
        const rows = toNumber(values.rows);
        const cols = toNumber(values.cols);
        // max_power and primary_owner are read by mapRoomWritePayload (power_capacity_w, owner_id).
        const payload: IRoomPayload & { max_power?: number | null; primary_owner?: number | null } = {
            max_power:     toNumber(values.max_power) ?? null,
            primary_owner: toNumber(values.primary_owner) ?? null,
            sku:      typeof values.sku === 'string' ? values.sku : undefined,
            name:     typeof values.name === 'string' ? values.name : undefined,
            location: typeof values.location === 'string' ? values.location : undefined,
            label:    typeof values.label === 'string' ? values.label : undefined,
            remark:   typeof values.remark === 'string' ? values.remark : '',
            floor:    typeof values.floor === 'string' ? values.floor : undefined,
            rows,
            cols,
            length:   toNumber(values.length) ?? null,
            width:    toNumber(values.width) ?? null,
            country:  toNumber(values.country) ?? null,
            city:     toNumber(values.city) ?? null,
            building: toNumber(values.building) ?? null,
        };

        try {
            const created = await createRoom(payload).unwrap();
            await syncSlots(created.id, values);
            if (imageFile) {
                await updateRoomImageMutation({ id: created.id, image: imageFile }).unwrap();
            }
            notifyEquipmentCreated('Room', created, { sku: payload.sku, name: payload.name });
        } catch (err) {
            notifyEquipmentError('create', 'Room', err);
            throw err;
        }
    };

    return {
        createFromValues,
        syncSlots,
        forceDeleteById,
        ...actions,   // updateInline, updateImage, updateStatus, deleteById
        creating,
        updating,
        deleting,
        forceDeleting,
    };
}