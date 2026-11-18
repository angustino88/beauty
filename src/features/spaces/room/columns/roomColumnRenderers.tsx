import { Tooltip } from 'antd';
import { SpaceLocationEmpty, SpaceLocationRow, SpaceLocationStack } from '@/features/spaces/shared/components/SpaceLocation';
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

const VISIBLE_STATIONS = 3;

/** The room's stations as linked rows (same look as the station and bench location cells). */
export const renderRoomRacksCell = (room: IRoom) => {
    const racks = readRoomRacks(room);
    if (!racks.length) return <SpaceLocationEmpty label="No stations" />;
    const shown = racks.slice(0, VISIBLE_STATIONS);
    const hidden = racks.slice(VISIBLE_STATIONS);
    return (
        <SpaceLocationStack>
            {shown.map((rack) => (
                <SpaceLocationRow key={rack.id} kind="station" label={rack.name || rack.sku} searchKey={rack.sku} refId={rack.id} />
            ))}
            {hidden.length > 0 && (
                <Tooltip title={hidden.map((rack) => rack.name || rack.sku).join(', ')}>
                    <span style={{ fontSize: 12, color: 'var(--lm-text-tertiary)' }}>+{hidden.length} more</span>
                </Tooltip>
            )}
        </SpaceLocationStack>
    );
};

export const renderRoomSpecsCell = (room: IRoom) => {
    const specs = ROOM_SPECS_FIELDS
        .map((field) => ({ label: field.label, value: field.reader(room) }))
        .filter((spec) => spec.value);
    return <SpecDetailsPopover items={specs} />;
};
