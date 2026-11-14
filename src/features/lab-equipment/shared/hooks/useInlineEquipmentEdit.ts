import { useCallback, useState, type Dispatch, type SetStateAction } from 'react';

interface HasNumericId {
  id: number;
}

export interface InlineEquipmentEditResult<TRecord extends HasNumericId, TDraft> {
  editingId: number | null;
  draft: TDraft | null;
  isEditing: (record: TRecord) => boolean;
  startEdit: (record: TRecord, createDraft: (record: TRecord) => TDraft) => void;
  setDraft: Dispatch<SetStateAction<TDraft | null>>;
  clearEdit: () => void;
  cancelEdit: () => void;
}

export function useInlineEquipmentEdit<TRecord extends HasNumericId, TDraft>(): InlineEquipmentEditResult<TRecord, TDraft> {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [draft, setDraft] = useState<TDraft | null>(null);
  const [initialDraft, setInitialDraft] = useState<TDraft | null>(null);

  const startEdit = useCallback((record: TRecord, createDraft: (item: TRecord) => TDraft) => {
    const nextDraft = createDraft(record);
    setEditingId(record.id);
    setDraft(nextDraft);
    setInitialDraft(nextDraft);
  }, []);

  const clearEdit = useCallback(() => {
    setDraft(initialDraft);
  }, [initialDraft]);

  const cancelEdit = useCallback(() => {
    setEditingId(null);
    setDraft(null);
    setInitialDraft(null);
  }, []);

  const isEditing = useCallback((record: TRecord) => record.id === editingId, [editingId]);

  return {
    editingId,
    draft,
    isEditing,
    startEdit,
    setDraft,
    clearEdit,
    cancelEdit,
  };
}
