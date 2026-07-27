import React, { useState, useEffect } from 'react';
import { FunctionSquare, Check, X } from 'lucide-react';
import { CellCoords, SelectionRange } from '../types';
import { coordsToCellId } from '../utils/formatters';

interface FormulaBarProps {
  selection: SelectionRange;
  rawValue: string;
  onChangeRawValue: (val: string) => void;
  onCommit: () => void;
  onCancel: () => void;
}

const QUICK_FUNCTIONS = [
  { name: 'SUM', formula: '=SUM(' },
  { name: 'AVERAGE', formula: '=AVERAGE(' },
  { name: 'COUNT', formula: '=COUNT(' },
  { name: 'MIN', formula: '=MIN(' },
  { name: 'MAX', formula: '=MAX(' },
  { name: 'IF', formula: '=IF(' }
];

export const FormulaBar: React.FC<FormulaBarProps> = ({
  selection,
  rawValue,
  onChangeRawValue,
  onCommit,
  onCancel
}) => {
  const [localVal, setLocalVal] = useState(rawValue);

  useEffect(() => {
    setLocalVal(rawValue);
  }, [rawValue, selection.active]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalVal(e.target.value);
    onChangeRawValue(e.target.value);
  };

  // Determine active cell label or range string
  const activeCellId = coordsToCellId(selection.active.col, selection.active.row);
  const startCellId = coordsToCellId(
    Math.min(selection.start.col, selection.end.col),
    Math.min(selection.start.row, selection.end.row)
  );
  const endCellId = coordsToCellId(
    Math.max(selection.start.col, selection.end.col),
    Math.max(selection.start.row, selection.end.row)
  );

  const isRange = startCellId !== endCellId;
  const rangeDisplay = isRange ? `${startCellId}:${endCellId}` : activeCellId;

  const handleQuickFunc = (formulaSnippet: string) => {
    let newVal = formulaSnippet;
    if (isRange) {
      newVal = `${formulaSnippet}${rangeDisplay})`;
    }
    setLocalVal(newVal);
    onChangeRawValue(newVal);
  };

  return (
    <div className="bg-white border-b border-slate-200 px-3 h-[36px] flex items-center gap-2 text-xs shrink-0 select-none">
      {/* Cell Address Badge (48px width x 24px height) */}
      <div className="w-[48px] h-[24px] bg-[#f8fafc] text-[#64748b] border border-slate-200 rounded-[2px] font-mono text-[12px] flex items-center justify-center font-medium shrink-0">
        {rangeDisplay}
      </div>

      <div className="h-4 w-px bg-slate-200 shrink-0" />

      {/* FX Icon */}
      <div className="flex items-center gap-1 text-slate-400 shrink-0">
        <FunctionSquare className="w-3.5 h-3.5 text-slate-500" />
        <span className="font-mono text-slate-600 font-bold text-xs">=</span>
      </div>

      {/* Input Field */}
      <div className="flex-1 flex items-center gap-1 relative h-[24px]">
        <input
          type="text"
          value={localVal}
          onChange={handleChange}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              onCommit();
            } else if (e.key === 'Escape') {
              onCancel();
            }
          }}
          placeholder="Enter a value or formula (e.g. =SUM(A1:A10))"
          className="w-full h-[24px] bg-transparent text-slate-900 font-mono text-[13px] px-2 border-none outline-none focus:outline-none"
          style={{ fontFamily: "'Courier New', Courier, monospace" }}
        />

        {localVal !== rawValue && (
          <div className="absolute right-1 flex items-center gap-1 bg-white p-0.5 rounded border border-slate-200 shadow-xs">
            <button
              onClick={onCommit}
              className="p-0.5 text-emerald-600 hover:bg-slate-100 rounded transition cursor-pointer"
              title="Apply formula (Enter)"
            >
              <Check className="w-3 h-3" />
            </button>
            <button
              onClick={onCancel}
              className="p-0.5 text-rose-500 hover:bg-slate-100 rounded transition cursor-pointer"
              title="Cancel (Esc)"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>

      {/* Quick Functions */}
      <div className="hidden lg:flex items-center gap-1 shrink-0">
        <span className="text-[10px] text-slate-400 font-medium">Quick:</span>
        {QUICK_FUNCTIONS.map((f) => (
          <button
            key={f.name}
            onClick={() => handleQuickFunc(f.formula)}
            className="bg-slate-50 hover:bg-slate-100 text-slate-600 font-mono text-[10px] px-1.5 py-0.5 rounded border border-slate-200 transition cursor-pointer"
          >
            {f.name}
          </button>
        ))}
      </div>
    </div>
  );
};
