/* eslint-disable react-refresh/only-export-components */
import type { ReactNode } from 'react';
import { Input, InputNumber, Select } from 'antd';
import type { IRoom } from '../types';
import { ROOM_FIELD_CONFIG, type RoomInlineDraft, type SelectOption } from './roomConfig';

export type { SelectOption } from './roomConfig';

export interface InlineCellProps {
    editing: boolean;
    display: ReactNode;
    type?: 'text' | 'number' | 'select' | 'multi-select';
    value?: string | number | number[] | null;
    options?: SelectOption[];
    onChange: (v: unknown) => void;
}

const InlineCell = ({ editing, display, type = 'text', value, options, onChange }: InlineCellProps) => {
    if (!editing) return <>{display}</>;
    if (type === 'text')
        return <Input value={(value as string) ?? ''} onChange={(e) => onChange(e.target.value)} />;
    if (type === 'number')
        return (
            <InputNumber
                value={typeof value === 'number' ? value : null}
                onChange={(v) => onChange(typeof v === 'number' ? v : null)}
                style={{ width: '100%' }}
            />
        );
    if (type === 'multi-select')
        return (
            <Select mode="multiple" allowClear showSearch style={{ width: '100%' }}
                value={(value as number[]) ?? []} options={options} optionFilterProp="label"
                onChange={(v) => onChange(v)} />
        );
    return (
        <Select allowClear showSearch style={{ width: '100%' }}
            value={(value as number | null) ?? undefined} options={options}
            onChange={(v) => onChange(typeof v === 'number' ? v : null)} />
    );
};

export default InlineCell;

// ─── Column render factory ────────────────────────────────────────────────────
/** Returns a column render function for any inEdit field key. */
export const makeRenderInlineField = (
    isEditing: (record: IRoom) => boolean,
    editingDraft: RoomInlineDraft | null,
    updateDraftField: <K extends keyof RoomInlineDraft>(key: K, value: RoomInlineDraft[K]) => void,
    optionsMap: Record<string, SelectOption[]>,
) => (key: keyof RoomInlineDraft) => (_: unknown, record: IRoom) => {
    const cfg = ROOM_FIELD_CONFIG.find((c) => c.key === key)!;
    const cellType =
        cfg.type === 'select' || cfg.type === 'multi-select' || cfg.type === 'number'
            ? cfg.type
            : 'text';
    return (
        <InlineCell
            editing={isEditing(record)}
            display={cfg.reader?.(record) ?? ''}
            type={cellType}
            value={editingDraft?.[key] as string | number | number[] | null}
            options={cellType !== 'text' ? optionsMap[key] : undefined}
            onChange={(v) => updateDraftField(key, v as RoomInlineDraft[typeof key])}
        />
    );
};
