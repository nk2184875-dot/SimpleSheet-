import React from 'react';
import { GridData, SelectionRange } from '../types';
import { coordsToCellId } from '../utils/formatters';
import { evaluateCell } from '../utils/formulaEngine';

interface StatusBarProps {
  gridData: GridData;
  selection: SelectionRange;
  sheetName: string;
}

export const StatusBar: React.FC<StatusBarProps> = ({
  gridData,
  selection,
  sheetName
}) => {
  const minCol = Math.min(selection.start.col, selection.end.col);
  const maxCol = Math.max(selection.start.col, selection.end.col);
  const minRow = Math.min(selection.start.row, selection.end.row);
  const maxRow = Math.max(selection.start.row, selection.end.row);

  const selectedCount = (maxCol - minCol + 1) * (maxRow - minRow + 1);

  // Compute stats for range
  let numericValues: number[] = [];
  let nonCount = 0;

  for (let r = minRow; r <= maxRow; r++) {
    for (let c = minCol; c <= maxCol; c++) {
      const cellId = coordsToCellId(c, r);
      if (gridData[cellId]?.value) {
        nonCount++;
        const evaluated = evaluateCell(cellId, gridData);
        const num = Number(evaluated);
        if (!isNaN(num) && evaluated !== '') {
          numericValues.push(num);
        }
      }
    }
  }

  const sum = numericValues.reduce((acc, curr) => acc + curr, 0);
  const avg = numericValues.length > 0 ? sum / numericValues.length : 0;
  const min = numericValues.length > 0 ? Math.min(...numericValues) : 0;
  const max = numericValues.length > 0 ? Math.max(...numericValues) : 0;

  return (
    <div className="bg-[#f8fafc] text-[#64748b] border-t border-slate-200 px-3 h-6 flex items-center justify-between text-[11px] font-sans select-none shrink-0">
      {/* Active Sheet Name & Status Dot */}
      <div className="flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e] inline-block shrink-0" />
        <span className="text-slate-800 font-semibold">{sheetName}</span>
        <span className="text-slate-300">|</span>
        <span>
          Selected: <strong className="text-slate-900 font-semibold">{selectedCount}</strong> {selectedCount === 1 ? 'cell' : 'cells'}
        </span>
      </div>

      {/* Quick Statistics Summary */}
      {selectedCount > 1 && (
        <div className="flex items-center gap-3 bg-white px-2 py-0.5 rounded border border-slate-200 text-[11px]">
          <div>
            Count: <strong className="text-slate-800">{nonCount}</strong>
          </div>
          {numericValues.length > 0 && (
            <>
              <div>
                Sum: <strong className="text-blue-600 font-semibold">{sum.toLocaleString('en-US', { maximumFractionDigits: 2 })}</strong>
              </div>
              <div>
                Average: <strong className="text-slate-800 font-semibold">{avg.toLocaleString('en-US', { maximumFractionDigits: 2 })}</strong>
              </div>
              <div>
                Min: <strong className="text-slate-800">{min.toLocaleString('en-US', { maximumFractionDigits: 2 })}</strong>
              </div>
              <div>
                Max: <strong className="text-slate-800">{max.toLocaleString('en-US', { maximumFractionDigits: 2 })}</strong>
              </div>
            </>
          )}
        </div>
      )}

      {/* Footer Info */}
      <div className="hidden md:flex items-center gap-2 text-slate-500 text-[11px]">
        <span>26 Columns × 100 Rows</span>
        <span>•</span>
        <span className="text-emerald-600 font-medium">Ready</span>
      </div>
    </div>
  );
};
