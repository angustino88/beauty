import { Space, Tag, Tooltip } from 'antd';
import { SpecDetailsPopover } from '@/features/lab-equipment/shared/components/status/SpecDetailsPopover';
import type { IRoom, IRoomRackItem } from '../types';
import { ROOM_SPECS_FIELDS } from './roomConfig';

export const readRoomRacks = (room: IRoom): IRoomRackItem[] => {
    if (!Array.isArray(room.rack_list)) return [];
    return room.rack_list.filter(
        (item): item is IRoomRackItem =>
            typeof item === 'object' && item !== null && 'id' in item,
    );
};

// Show the location text, linked to the map URL when there is one.
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

export const renderRoomRacksCell = (room: IRoom) => {
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

export const renderRoomSpecsCell = (room: IRoom) => {
    const specs = ROOM_SPECS_FIELDS
        .map((field) => ({ label: field.label, value: field.reader(room) }))
        .filter((spec) => spec.value);
    return <SpecDetailsPopover items={specs} />;
};
