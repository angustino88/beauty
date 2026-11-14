import { EditOutlined } from '@ant-design/icons';
import { Button, Select, Space, Tag, Tooltip } from 'antd';
import { renderOwnerCell } from '@/features/lab-equipment/shared';
import { SpecDetailsPopover } from '@/features/lab-equipment/shared/components/status/SpecDetailsPopover';
import type { IRoom, IRoomRackItem } from '../types';
import type { RoomInlineDraft } from './roomConfig';
import { ROOM_SPECS_FIELDS } from './roomConfig';
import type { SelectOption } from './InlineCell';

interface RoomColumnSharedContext {
    isEditing:        (record: IRoom) => boolean;
    editingDraft:     RoomInlineDraft | null;
    optionsMap:       Record<string, SelectOption[]>;
    updateDraftField: <K extends keyof RoomInlineDraft>(key: K, value: RoomInlineDraft[K]) => void;
}

interface RoomSpecsRendererContext {
    isEditing:    (record: IRoom) => boolean;
    onSpecsEdit?: (record: IRoom) => void;
}

export const readRoomRacks = (room: IRoom): IRoomRackItem[] => {
    if (!Array.isArray(room.rack_list)) return [];
    return room.rack_list.filter(
        (item): item is IRoomRackItem =>
            typeof item === 'object' && item !== null && 'id' in item,
    );
};

// Bug 6: show locationText as display, use url as hyperlink
export const renderRoomLocationCell = (room: IRoom) => {
    const url          = room.location;
    const locationText = room.location_info?.location_string;
    if (!url && !locationText) return '';
    if (!url) return <span>{locationText}</span>;
    return (
        <a
            href={url}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
            style={{ color: 'var(--lm-primary-fg)', textDecoration: 'underline' }}
        >
            {locationText || url}
        </a>
    );
};

export const renderRoomRacksCell = (room: IRoom, context: RoomColumnSharedContext) => {
    if (context.isEditing(room)) {
        return (
            <Select
                mode="multiple" allowClear showSearch
                style={{ width: '100%' }}
                value={context.editingDraft?.rack_list ?? []}
                options={context.optionsMap.rack_list}
                optionFilterProp="label"
                onChange={(value: number[]) => context.updateDraftField('rack_list', value)}
            />
        );
    }
    const racks = readRoomRacks(room);
    if (!racks.length) return '';
    return (
        <Space wrap size={[4, 4]}>
            {racks.map((rack) => (
                <Tooltip key={rack.id} title={rack.name}>
                    <Tag>{rack.sku}</Tag>
                </Tooltip>
            ))}
        </Space>
    );
};

export const renderRoomSpecsCell = (room: IRoom, context: RoomSpecsRendererContext) => {
    if (context.isEditing(room)) {
        return (
            <Tooltip title="Edit Specs">
                <Button type="text" icon={<EditOutlined />} onClick={() => context.onSpecsEdit?.(room)} />
            </Tooltip>
        );
    }

    const specs = ROOM_SPECS_FIELDS
        .map((f) => ({ key: f.label, value: f.reader(room) }))
        .filter((s) => s.value);

    return <SpecDetailsPopover items={specs.map((spec) => ({ label: spec.key, value: spec.value }))} />;
};

export const renderRoomPrimaryOwnerCell = (room: IRoom, context: RoomColumnSharedContext) => {
    if (!context.isEditing(room)) return renderOwnerCell(room.primary_owner);
    return (
        <Select
            allowClear showSearch
            style={{ width: '100%' }}
            value={context.editingDraft?.primary_owner ?? undefined}
            options={context.optionsMap.primary_owner}
            onChange={(value) =>
                context.updateDraftField('primary_owner', typeof value === 'number' ? value : null)
            }
        />
    );
};