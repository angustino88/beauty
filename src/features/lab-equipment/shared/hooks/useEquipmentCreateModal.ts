import { useCallback, useState } from 'react';

export type EquipmentModalMode = 'create' | 'edit';

export interface EquipmentCreateModalState<TRecord> {
  open: boolean;
  mode: EquipmentModalMode;
  editingRecord: TRecord | null;
}

export interface EquipmentCreateModalResult<TRecord> {
  state: EquipmentCreateModalState<TRecord>;
  openCreate: () => void;
  openEdit: (record: TRecord) => void;
  close: () => void;
}

export function useEquipmentCreateModal<TRecord>(): EquipmentCreateModalResult<TRecord> {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<EquipmentModalMode>('create');
  const [editingRecord, setEditingRecord] = useState<TRecord | null>(null);

  const openCreate = useCallback(() => {
    setMode('create');
    setEditingRecord(null);
    setOpen(true);
  }, []);

  const openEdit = useCallback((record: TRecord) => {
    setMode('edit');
    setEditingRecord(record);
    setOpen(true);
  }, []);

  const close = useCallback(() => {
    setOpen(false);
  }, []);

  return {
    state: {
      open,
      mode,
      editingRecord,
    },
    openCreate,
    openEdit,
    close,
  };
}
