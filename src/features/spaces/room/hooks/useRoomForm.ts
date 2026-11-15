import {
    useCreateRoomMutation,
    useDeleteRoomMutation,
    useUpdateRoomMutation,
    useUpdateRoomImageMutation,
    useDeleteRoomImageMutation,
} from '../api';
import { notifyEquipmentCreated, notifyEquipmentError, useEquipmentCrudActions } from '@/features/lab-equipment/shared';
import type { IRoomPayload } from '../types';

// ── helpers ───────────────────────────────────────────────────────────────────

const toNumber = (value: unknown): number | undefined => {
    if (value == null || value === '') return undefined;
    const n = Number(value);
    return Number.isNaN(n) ? undefined : n;
};

// ── hook ──────────────────────────────────────────────────────────────────────

export function useRoomForm() {
    const [createRoom,          { isLoading: creating }] = useCreateRoomMutation();
    const [updateRoom,          { isLoading: updating }] = useUpdateRoomMutation();
    const [deleteRoom,          { isLoading: deleting }] = useDeleteRoomMutation();
    const [updateRoomImageMutation]                       = useUpdateRoomImageMutation();
    const [deleteRoomImageMutation]                       = useDeleteRoomImageMutation();

    const actions = useEquipmentCrudActions<IRoomPayload>({
        updateMutation:      updateRoom,
        updateImageMutation: updateRoomImageMutation,
        deleteImageMutation: deleteRoomImageMutation,
        deleteMutation:      deleteRoom,
        mapStatusBody:       (values) => values as unknown as IRoomPayload,
        labels: { entityName: 'Room', entityNameLower: 'room', errorPrefix: 'room' },
    });

    const createFromValues = async (values: Record<string, unknown>, imageFile?: File | null) => {
        const rows = toNumber(values.rows);
        const cols = toNumber(values.cols);
        const payload: IRoomPayload = {
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
        ...actions,   // updateInline, updateImage, updateStatus, deleteById
        creating,
        updating,
        deleting,
    };
}