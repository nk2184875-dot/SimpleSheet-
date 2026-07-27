import React, { useState } from 'react';
import { Plus, X, Copy, Edit2 } from 'lucide-react';
import { SheetTab } from '../types';

interface SheetTabsProps {
  sheets: SheetTab[];
  activeSheetId: string;
  onSelectSheet: (id: string) => void;
  onAddSheet: () => void;
  onRenameSheet: (id: string, newName: string) => void;
  onDeleteSheet: (id: string) => void;
  onDuplicateSheet: (id: string) => void;
}

export const SheetTabs: React.FC<SheetTabsProps> = ({
  sheets,
  activeSheetId,
  onSelectSheet,
  onAddSheet,
  onRenameSheet,
  onDeleteSheet,
  onDuplicateSheet
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  const handleStartRename = (sheet: SheetTab) => {
    setEditingId(sheet.id);
    setEditingName(sheet.name);
  };

  const handleFinishRename = (id: string) => {
    if (editingName.trim()) {
      onRenameSheet(id, editingName.trim());
    }
    setEditingId(null);
  };

  return (
    <div className="bg-[#f8fafc] border-t border-slate-200 px-3 py-0.5 flex items-center justify-between text-xs overflow-x-auto scrollbar-none shrink-0 select-none">
      <div className="flex items-center gap-1">
        {/* Add Sheet Button */}
        <button
          onClick={onAddSheet}
          className="p-1 rounded hover:bg-slate-200 text-slate-600 transition cursor-pointer"
          title="Add new sheet tab"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>

        <div className="h-4 w-px bg-slate-300 mx-1" />

        {/* Sheet Tabs List */}
        <div className="flex items-center gap-1">
          {sheets.map((sheet) => {
            const isActive = sheet.id === activeSheetId;

            return (
              <div
                key={sheet.id}
                className={`group relative flex items-center gap-1.5 px-3 py-1 rounded-t border-x transition cursor-pointer ${
                  isActive
                    ? 'bg-white text-blue-600 font-semibold border-t-2 border-t-blue-500 border-slate-200 border-b-transparent shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900 border-slate-200'
                }`}
                onClick={() => onSelectSheet(sheet.id)}
                onDoubleClick={() => handleStartRename(sheet)}
              >
                {editingId === sheet.id ? (
                  <input
                    type="text"
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    onBlur={() => handleFinishRename(sheet.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleFinishRename(sheet.id);
                      if (e.key === 'Escape') setEditingId(null);
                    }}
                    autoFocus
                    className="bg-white text-slate-900 font-medium px-1 py-0.5 rounded outline-none border border-blue-500 text-xs w-20"
                  />
                ) : (
                  <span>{sheet.name}</span>
                )}

                {/* Tab Actions */}
                <div className="hidden group-hover:flex items-center gap-0.5 ml-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDuplicateSheet(sheet.id);
                    }}
                    className="p-0.5 text-slate-400 hover:text-blue-600 rounded"
                    title="Duplicate sheet"
                  >
                    <Copy className="w-3 h-3" />
                  </button>

                  {sheets.length > 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteSheet(sheet.id);
                      }}
                      className="p-0.5 text-slate-400 hover:text-rose-600 rounded"
                      title="Delete sheet"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
