import React from 'react';
import { theme } from '../theme';
import type { FabProps } from '../types';

const fabBase: React.CSSProperties = {
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '20px',
    boxShadow: '0 4px 14px rgba(0,0,0,0.35)',
    transition: 'transform 0.18s, opacity 0.18s, background 0.18s',
    flexShrink: 0,
};

export const Fab = ({ isEditMode, isDeleteMode, unplacedCount, onAdd, onToggleEdit, onToggleDelete, onSave }: FabProps) => {
    return (
        <div style={{
            position: 'absolute',
            bottom: '28px',
            right: '28px',
            zIndex: 20,
            display: 'flex',
            flexDirection: 'column-reverse',
            alignItems: 'center',
            gap: '12px',
        }}>
            {/* Main FAB */}
            <button
                style={{ ...fabBase, background: isEditMode ? theme.fabEditActive : theme.fabEdit, color: 'white', fontSize: '22px' }}
                title={isEditMode ? 'Exit edit mode' : 'Edit layout'}
                onClick={onToggleEdit}
            >
                {isEditMode ? '✕' : '✏️'}
            </button>

            {/* Expanded actions — only visible in edit mode */}
            {isEditMode && (
                <>
                    {/* Save */}
                    <button
                        style={{ ...fabBase, background: theme.fabSave, color: 'white' }}
                        title="Save & exit"
                        onClick={onSave}
                    >
                        ✅
                    </button>

                    {/* Bin — click to enter/exit delete-select mode */}
                    <button
                        id="fab-bin"
                        style={{
                            ...fabBase,
                            background: isDeleteMode ? theme.fabDeleteActive : theme.fabDelete,
                            color: 'white',
                            outline: isDeleteMode ? `3px solid ${theme.fabDeleteOutline}` : 'none',
                            transform: isDeleteMode ? 'scale(1.1)' : 'scale(1)',
                        }}
                        title={isDeleteMode ? 'Click a station to delete it (click again to cancel)' : 'Delete a station'}
                        onClick={onToggleDelete}
                    >
                        🗑
                    </button>

                    {/* Add */}
                    <div style={{ position: 'relative' }}>
                        <button
                            style={{
                                ...fabBase,
                                background: unplacedCount === 0 ? theme.fabAddDisabled : theme.fabAdd,
                                color: 'white',
                                cursor: unplacedCount === 0 ? 'not-allowed' : 'pointer',
                                opacity: unplacedCount === 0 ? 0.6 : 1,
                            }}
                            title={unplacedCount === 0 ? 'No stations available to place' : 'Add station'}
                            onClick={onAdd}
                            disabled={unplacedCount === 0}
                        >
                            ➕
                        </button>
                        {unplacedCount > 0 && (
                            <div style={{
                                position: 'absolute',
                                top: '-6px',
                                right: '-6px',
                                width: '20px',
                                height: '20px',
                                borderRadius: '50%',
                                background: theme.fabBadge,
                                color: 'white',
                                fontSize: '11px',
                                fontWeight: 'bold',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxShadow: '0 1px 4px rgba(0,0,0,0.4)',
                                pointerEvents: 'none',
                            }}>
                                {unplacedCount}
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};
