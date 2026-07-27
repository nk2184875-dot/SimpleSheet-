import React, { useState } from 'react';
import { Search, X, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react';
import { CellCoords, GridData, SelectionRange } from '../types';
import { cellIdToCoords, coordsToCellId } from '../utils/formatters';

interface FindReplaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  gridData: GridData;
  rowCount: number;
  colCount: number;
  onSelectCell: (coords: CellCoords) => void;
  onCellChange: (cellId: string, newValue: string) => void;
}

export const FindReplaceModal: React.FC<FindReplaceModalProps> = ({
  isOpen,
  onClose,
  gridData,
  rowCount,
  colCount,
  onSelectCell,
  onCellChange
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [replaceTerm, setReplaceTerm] = useState('');
  const [matchCase, setMatchCase] = useState(false);
  const [matchIndex, setMatchIndex] = useState(0);

  if (!isOpen) return null;

  // Find all matching cells
  const matches: { cellId: string; coords: CellCoords; val: string }[] = [];

  if (searchTerm.trim()) {
    for (let r = 0; r < rowCount; r++) {
      for (let c = 0; c < colCount; c++) {
        const cellId = coordsToCellId(c, r);
        const cell = gridData[cellId];
        if (cell && cell.value) {
          const val = cell.value;
          const target = matchCase ? val : val.toLowerCase();
          const query = matchCase ? searchTerm : searchTerm.toLowerCase();

          if (target.includes(query)) {
            matches.push({ cellId, coords: { col: c, row: r }, val });
          }
        }
      }
    }
  }

  const handleNext = () => {
    if (matches.length === 0) return;
    const nextIdx = (matchIndex + 1) % matches.length;
    setMatchIndex(nextIdx);
    onSelectCell(matches[nextIdx].coords);
  };

  const handlePrev = () => {
    if (matches.length === 0) return;
    const prevIdx = (matchIndex - 1 + matches.length) % matches.length;
    setMatchIndex(prevIdx);
    onSelectCell(matches[prevIdx].coords);
  };

  const handleReplaceCurrent = () => {
    if (matches.length === 0) return;
    const currentMatch = matches[matchIndex];
    if (!currentMatch) return;

    let newVal = '';
    if (matchCase) {
      newVal = currentMatch.val.replace(searchTerm, replaceTerm);
    } else {
      const regex = new RegExp(searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
      newVal = currentMatch.val.replace(regex, replaceTerm);
    }

    onCellChange(currentMatch.cellId, newVal);
  };

  const handleReplaceAll = () => {
    if (matches.length === 0) return;

    matches.forEach((m) => {
      let newVal = '';
      if (matchCase) {
        newVal = m.val.replace(searchTerm, replaceTerm);
      } else {
        const regex = new RegExp(searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
        newVal = m.val.replace(regex, replaceTerm);
      }
      onCellChange(m.cellId, newVal);
    });
  };

  return (
    <div className="fixed top-16 right-6 z-50 bg-slate-900 border border-slate-700 rounded-xl p-4 shadow-2xl w-80 text-xs space-y-3">
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <div className="flex items-center gap-2 font-semibold text-slate-100">
          <Search className="w-4 h-4 text-emerald-400" />
          <span>Find and Replace</span>
        </div>
        <button onClick={onClose} className="text-slate-500 hover:text-slate-300">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Inputs */}
      <div className="space-y-2">
        <div>
          <label className="text-[10px] text-slate-400 font-medium">FIND</label>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setMatchIndex(0);
            }}
            placeholder="Search cells..."
            className="w-full bg-slate-950 text-slate-100 px-2.5 py-1.5 rounded border border-slate-700 focus:outline-none focus:border-emerald-500 text-xs"
            autoFocus
          />
        </div>

        <div>
          <label className="text-[10px] text-slate-400 font-medium">REPLACE WITH</label>
          <input
            type="text"
            value={replaceTerm}
            onChange={(e) => setReplaceTerm(e.target.value)}
            placeholder="Replace text..."
            className="w-full bg-slate-950 text-slate-100 px-2.5 py-1.5 rounded border border-slate-700 focus:outline-none focus:border-emerald-500 text-xs"
          />
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-400">
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={matchCase}
              onChange={(e) => setMatchCase(e.target.checked)}
              className="accent-emerald-500 rounded"
            />
            <span>Match Case</span>
          </label>

          {matches.length > 0 && (
            <span className="text-emerald-400 font-mono">
              {matchIndex + 1} of {matches.length} matches
            </span>
          )}
        </div>
      </div>

      {/* Buttons */}
      <div className="flex items-center gap-2 pt-1">
        <button
          onClick={handlePrev}
          disabled={matches.length === 0}
          className="flex-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 py-1.5 rounded border border-slate-700 transition flex items-center justify-center cursor-pointer"
        >
          <ChevronUp className="w-4 h-4" />
        </button>
        <button
          onClick={handleNext}
          disabled={matches.length === 0}
          className="flex-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 py-1.5 rounded border border-slate-700 transition flex items-center justify-center cursor-pointer"
        >
          <ChevronDown className="w-4 h-4" />
        </button>
        <button
          onClick={handleReplaceCurrent}
          disabled={matches.length === 0}
          className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white px-2.5 py-1.5 rounded font-medium transition cursor-pointer"
        >
          Replace
        </button>
        <button
          onClick={handleReplaceAll}
          disabled={matches.length === 0}
          className="bg-teal-600 hover:bg-teal-500 disabled:opacity-40 text-white px-2.5 py-1.5 rounded font-medium transition cursor-pointer"
        >
          All
        </button>
      </div>
    </div>
  );
};
