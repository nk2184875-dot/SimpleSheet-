import React, { useState } from 'react';
import {
  FileSpreadsheet,
  RotateCcw,
  RotateCw,
  FolderOpen,
  Download,
  Trash2,
  Sparkles,
  Search,
  HardDrive,
  Check
} from 'lucide-react';

interface HeaderProps {
  title: string;
  onTitleChange: (newTitle: string) => void;
  lastSavedText: string;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onClearSheet: () => void;
  onOpenTemplates: () => void;
  onOpenFindReplace: () => void;
  onExportCSV: () => void;
  onExportJSON: () => void;
  onImportCSV: () => void;
  onOpenGoogleDriveModal: () => void;
  isDriveConnected: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  onTitleChange,
  lastSavedText,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onClearSheet,
  onOpenTemplates,
  onOpenFindReplace,
  onExportCSV,
  onExportJSON,
  onImportCSV,
  onOpenGoogleDriveModal,
  isDriveConnected
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState(title);

  const handleTitleSubmit = () => {
    setIsEditingTitle(false);
    if (tempTitle.trim()) {
      onTitleChange(tempTitle.trim());
    } else {
      setTempTitle(title);
    }
  };

  return (
    <header className="bg-white text-slate-800 border-b border-slate-200 px-3 h-10 flex items-center justify-between gap-2 select-none z-20">
      {/* App Logo & Document Name */}
      <div className="flex items-center gap-2 overflow-hidden">
        <div className="bg-[#3b82f6] text-white w-6 h-6 rounded flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
          S
        </div>
        <div className="font-bold text-slate-900 text-sm tracking-tight shrink-0 flex items-center gap-1.5">
          SimpleSheet
          <span className="text-slate-400 font-normal text-xs hidden sm:inline">/</span>
        </div>

        {/* Inline Editable Title */}
        {isEditingTitle ? (
          <input
            type="text"
            value={tempTitle}
            onChange={(e) => setTempTitle(e.target.value)}
            onBlur={handleTitleSubmit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleTitleSubmit();
              if (e.key === 'Escape') {
                setTempTitle(title);
                setIsEditingTitle(false);
              }
            }}
            autoFocus
            className="bg-slate-50 text-slate-800 px-2 py-0.5 text-xs font-medium rounded border border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 max-w-[180px]"
          />
        ) : (
          <button
            onClick={() => {
              setTempTitle(title);
              setIsEditingTitle(true);
            }}
            className="text-slate-600 hover:text-slate-900 hover:bg-slate-100 px-1.5 py-0.5 rounded text-xs font-medium transition flex items-center gap-1 truncate max-w-[200px] cursor-pointer"
            title="Click to rename spreadsheet"
          >
            <span className="truncate">{title}</span>
            <span className="text-[10px] text-slate-400">✎</span>
          </button>
        )}

        {/* Auto-save Status */}
        <div className="hidden xl:flex items-center gap-1 text-[11px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200 shrink-0">
          <Check className="w-3 h-3 text-emerald-600" />
          <span className="truncate">{lastSavedText}</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-1 shrink-0">
        {/* Undo / Redo */}
        <div className="flex items-center border-r border-slate-200 pr-1 mr-1 gap-0.5">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className={`p-1 rounded text-xs transition ${
              canUndo
                ? 'text-slate-700 hover:bg-slate-100 cursor-pointer'
                : 'text-slate-300 cursor-not-allowed'
            }`}
            title="Undo (Ctrl+Z)"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className={`p-1 rounded text-xs transition ${
              canRedo
                ? 'text-slate-700 hover:bg-slate-100 cursor-pointer'
                : 'text-slate-300 cursor-not-allowed'
            }`}
            title="Redo (Ctrl+Y)"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Templates Gallery */}
        <button
          onClick={onOpenTemplates}
          className="flex items-center gap-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium px-2 py-1 rounded border border-slate-200 transition cursor-pointer"
          title="Browse preset templates"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span className="hidden sm:inline">Templates</span>
        </button>

        {/* Find & Replace */}
        <button
          onClick={onOpenFindReplace}
          className="flex items-center gap-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium px-2 py-1 rounded border border-slate-200 transition cursor-pointer"
          title="Find & Replace (Ctrl+F)"
        >
          <Search className="w-3.5 h-3.5 text-slate-500" />
          <span className="hidden sm:inline">Find</span>
        </button>

        {/* Import CSV */}
        <button
          onClick={onImportCSV}
          className="flex items-center gap-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium px-2 py-1 rounded border border-slate-200 transition cursor-pointer"
          title="Import CSV file"
        >
          <FolderOpen className="w-3.5 h-3.5 text-blue-500" />
          <span className="hidden md:inline">Import</span>
        </button>

        {/* Google Drive */}
        <button
          onClick={onOpenGoogleDriveModal}
          className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded border transition cursor-pointer ${
            isDriveConnected
              ? 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
              : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
          }`}
          title="Google Drive integration"
        >
          <HardDrive className={`w-3.5 h-3.5 ${isDriveConnected ? 'text-blue-600' : 'text-slate-500'}`} />
          <span className="hidden lg:inline">Drive</span>
        </button>

        {/* Clear Sheet */}
        <button
          onClick={onClearSheet}
          className="text-red-500 hover:text-red-600 hover:bg-red-50 text-xs font-medium px-2 py-1 rounded transition cursor-pointer"
          title="Clear all data from current sheet"
        >
          Clear Sheet
        </button>

        {/* Export CSV / JSON */}
        <div className="flex items-center bg-[#1e293b] text-white rounded overflow-hidden shadow-xs">
          <button
            onClick={onExportCSV}
            className="flex items-center gap-1 hover:bg-slate-800 text-xs font-medium px-3 py-1 transition cursor-pointer border-r border-slate-700"
            title="Export CSV"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={onExportJSON}
            className="hover:bg-slate-800 text-xs font-medium px-2 py-1 transition cursor-pointer text-slate-300"
            title="Export JSON Workbook"
          >
            JSON
          </button>
        </div>
      </div>
    </header>
  );
};
