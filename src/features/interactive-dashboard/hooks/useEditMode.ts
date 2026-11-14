import { useState } from 'react';

interface UseEditModeOptions {
    addRack: () => { id: number; position: [number, number, number] } | null | undefined;
    cancelAdd: (id: number) => void;
    moveRack: (id: number, pos: [number, number, number]) => void;
    deleteRack: (id: number) => void;
}

export function useEditMode({ addRack, cancelAdd, moveRack, deleteRack }: UseEditModeOptions) {
    const [isEditMode, setIsEditMode] = useState(false);
    const [isDeleteMode, setIsDeleteMode] = useState(false);
    const [pendingPositions, setPendingPositions] = useState<Record<number, [number, number, number]>>({});
    const [pendingAddIds, setPendingAddIds] = useState<number[]>([]);
    const [pendingDeleteIds, setPendingDeleteIds] = useState<number[]>([]);
    const [resetKey, setResetKey] = useState(0);

    const handleAdd = () => {
        const added = addRack();
        if (added) {
            setPendingAddIds(prev => [...prev, added.id]);
            setPendingPositions(prev => ({ ...prev, [added.id]: added.position }));
        }
    };

    const handleDelete = (id: number) => {
        setPendingDeleteIds(prev => [...prev, id]);
        setPendingPositions(prev => { const n = { ...prev }; delete n[id]; return n; });
        setPendingAddIds(prev => prev.filter(x => x !== id));
        setIsDeleteMode(false);
    };

    const handleMove = (id: number, pos: [number, number, number]) => {
        setPendingPositions(prev => ({ ...prev, [id]: pos }));
    };

    const handleToggleEdit = () => {
        if (isEditMode) {
            pendingAddIds.forEach(id => cancelAdd(id));
            setPendingAddIds([]);
            setPendingDeleteIds([]);
            setPendingPositions({});
            setIsDeleteMode(false);
            setResetKey(k => k + 1);
            setIsEditMode(false);
        } else {
            setIsEditMode(true);
        }
    };

    const handleSave = () => {
        Object.entries(pendingPositions).forEach(([id, pos]) => moveRack(Number(id), pos));
        pendingDeleteIds.forEach(id => deleteRack(id));
        setPendingAddIds([]);
        setPendingDeleteIds([]);
        setPendingPositions({});
        setIsDeleteMode(false);
        setIsEditMode(false);
    };

    const handleToggleDeleteMode = () => setIsDeleteMode(m => !m);

    return {
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
        hasPendingMoves: Object.keys(pendingPositions).length > 0 || pendingDeleteIds.length > 0,
    };
}
