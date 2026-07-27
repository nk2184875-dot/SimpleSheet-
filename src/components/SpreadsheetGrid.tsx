import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  CellCoords,
  CellData,
  GridData,
  SelectionRange
} from '../types';
import {
  colToLabel,
  coordsToCellId,
  formatCellValue
} from '../utils/formatters';
import { adjustFormulaReferences, evaluateCell } from '../utils/formulaEngine';

interface SpreadsheetGridProps {
  gridData: GridData;
  rowCount: number;
  colCount: number;
  selection: SelectionRange;
  onSelectionChange: (range: SelectionRange) => void;
  onCellChange: (cellId: string, value: string) => void;
  onPasteGridData: (startCoords: CellCoords, data: (CellData | null)[][]) => void;
  onInsertRow: (rowIndex: number) => void;
  onDeleteRow: (rowIndex: number) => void;
  onInsertCol: (colIndex: number) => void;
  onDeleteCol: (colIndex: number) => void;
  colWidths?: { [colIndex: number]: number };
  rowHeights?: { [rowIndex: number]: number };
  onUpdateColWidth?: (colIndex: number, width: number) => void;
  onUpdateRowHeight?: (rowIndex: number, height: number) => void;
}

interface ContextMenuState {
  visible: boolean;
  x: number;
  y: number;
  coords: CellCoords;
}

export const SpreadsheetGrid: React.FC<SpreadsheetGridProps> = ({
  gridData,
  rowCount,
  colCount,
  selection,
  onSelectionChange,
  onCellChange,
  onPasteGridData,
  onInsertRow,
  onDeleteRow,
  onInsertCol,
  onDeleteCol,
  colWidths = {},
  rowHeights = {},
  onUpdateColWidth,
  onUpdateRowHeight
}) => {
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [editingValue, setEditingValue] = useState('');
  const [isFillDragging, setIsFillDragging] = useState(false);
  const [fillEndCoords, setFillEndCoords] = useState<CellCoords | null>(null);

  // Column / Row Resize state
  const [resizingCol, setResizingCol] = useState<{ index: number; startX: number; startWidth: number } | null>(null);
  const [resizingRow, setResizingRow] = useState<{ index: number; startY: number; startHeight: number } | null>(null);

  // Context Menu state
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    visible: false,
    x: 0,
    y: 0,
    coords: { col: 0, row: 0 }
  });

  const gridContainerRef = useRef<HTMLDivElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);

  // Range boundaries
  const minCol = Math.min(selection.start.col, selection.end.col);
  const maxCol = Math.max(selection.start.col, selection.end.col);
  const minRow = Math.min(selection.start.row, selection.end.row);
  const maxRow = Math.max(selection.start.row, selection.end.row);

  // Cache evaluated values for performance
  const evaluatedMap = useCallback(() => {
    const map: { [cellId: string]: string } = {};
    for (let r = 0; r < rowCount; r++) {
      for (let c = 0; c < colCount; c++) {
        const cellId = coordsToCellId(c, r);
        if (gridData[cellId]?.value) {
          map[cellId] = evaluateCell(cellId, gridData);
        }
      }
    }
    return map;
  }, [gridData, rowCount, colCount])();

  // Focus inline edit input when editing starts
  useEffect(() => {
    if (selection.isEditing) {
      const activeCellId = coordsToCellId(selection.active.col, selection.active.row);
      setEditingValue(gridData[activeCellId]?.value || '');
      setTimeout(() => editInputRef.current?.focus(), 10);
    }
  }, [selection.isEditing, selection.active, gridData]);

  // Handle cell click
  const handleCellMouseDown = (c: number, r: number, e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only primary click
    setContextMenu({ ...contextMenu, visible: false });

    if (e.shiftKey) {
      // Extend selection range
      onSelectionChange({
        ...selection,
        end: { col: c, row: r },
        isEditing: false
      });
    } else {
      // New single selection
      onSelectionChange({
        start: { col: c, row: r },
        end: { col: c, row: r },
        active: { col: c, row: r },
        isEditing: false
      });
    }
    setIsMouseDown(true);
  };

  const handleCellMouseEnter = (c: number, r: number) => {
    if (isMouseDown && !selection.isEditing) {
      onSelectionChange({
        ...selection,
        end: { col: c, row: r }
      });
    } else if (isFillDragging) {
      setFillEndCoords({ col: c, row: r });
    }
  };

  const handleMouseUp = () => {
    setIsMouseDown(false);

    // Apply auto-fill if fill dragging was active
    if (isFillDragging && fillEndCoords) {
      handleApplyFillHandle(fillEndCoords);
    }
    setIsFillDragging(false);
    setFillEndCoords(null);
  };

  useEffect(() => {
    window.addEventListener('mouseup', handleMouseUp);
    return () => window.removeEventListener('mouseup', handleMouseUp);
  }, [isMouseDown, isFillDragging, fillEndCoords]);

  // Fill handle logic
  const handleApplyFillHandle = (targetCoords: CellCoords) => {
    // Fill down or fill right
    const fillMinRow = Math.min(minRow, targetCoords.row);
    const fillMaxRow = Math.max(maxRow, targetCoords.row);
    const fillMinCol = Math.min(minCol, targetCoords.col);
    const fillMaxCol = Math.max(maxCol, targetCoords.col);

    for (let r = fillMinRow; r <= fillMaxRow; r++) {
      for (let c = fillMinCol; c <= fillMaxCol; c++) {
        // Skip source selection area
        if (c >= minCol && c <= maxCol && r >= minRow && r <= maxRow) continue;

        // Determine relative source cell
        const srcCol = minCol + ((c - minCol) % (maxCol - minCol + 1));
        const srcRow = minRow + ((r - minRow) % (maxRow - minRow + 1));

        const srcCellId = coordsToCellId(srcCol, srcRow);
        const targetCellId = coordsToCellId(c, r);
        const srcData = gridData[srcCellId];

        if (srcData && srcData.value) {
          const deltaRow = r - srcRow;
          const deltaCol = c - srcCol;
          const adjustedVal = adjustFormulaReferences(srcData.value, deltaRow, deltaCol);
          onCellChange(targetCellId, adjustedVal);
        }
      }
    }

    // Expand selection to include filled range
    onSelectionChange({
      start: { col: minCol, row: minRow },
      end: { col: fillMaxCol, row: fillMaxRow },
      active: selection.active,
      isEditing: false
    });
  };

  // Keyboard navigation & Shortcuts
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (selection.isEditing) {
      if (e.key === 'Enter') {
        e.preventDefault();
        onCellChange(coordsToCellId(selection.active.col, selection.active.row), editingValue);
        // Move down
        const nextRow = Math.min(rowCount - 1, selection.active.row + 1);
        onSelectionChange({
          start: { col: selection.active.col, row: nextRow },
          end: { col: selection.active.col, row: nextRow },
          active: { col: selection.active.col, row: nextRow },
          isEditing: false
        });
      } else if (e.key === 'Escape') {
        onSelectionChange({ ...selection, isEditing: false });
      } else if (e.key === 'Tab') {
        e.preventDefault();
        onCellChange(coordsToCellId(selection.active.col, selection.active.row), editingValue);
        // Move right
        const nextCol = Math.min(colCount - 1, selection.active.col + 1);
        onSelectionChange({
          start: { col: nextCol, row: selection.active.row },
          end: { col: nextCol, row: selection.active.row },
          active: { col: nextCol, row: selection.active.row },
          isEditing: false
        });
      }
      return;
    }

    const { col, row } = selection.active;

    // Direct Typing to edit
    if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      onSelectionChange({ ...selection, isEditing: true });
      setEditingValue(e.key);
      return;
    }

    // F2 or Enter to start editing
    if (e.key === 'F2' || e.key === 'Enter') {
      e.preventDefault();
      onSelectionChange({ ...selection, isEditing: true });
      return;
    }

    // Delete or Backspace clears cell
    if (e.key === 'Delete' || e.key === 'Backspace') {
      e.preventDefault();
      for (let r = minRow; r <= maxRow; r++) {
        for (let c = minCol; c <= maxCol; c++) {
          onCellChange(coordsToCellId(c, r), '');
        }
      }
      return;
    }

    // Arrow keys navigation
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.key)) {
      e.preventDefault();
      let nextCol = col;
      let nextRow = row;

      if (e.key === 'ArrowUp') nextRow = Math.max(0, row - 1);
      if (e.key === 'ArrowDown') nextRow = Math.min(rowCount - 1, row + 1);
      if (e.key === 'ArrowLeft') nextCol = Math.max(0, col - 1);
      if (e.key === 'ArrowRight' || e.key === 'Tab') nextCol = Math.min(colCount - 1, col + 1);

      if (e.shiftKey) {
        onSelectionChange({ ...selection, end: { col: nextCol, row: nextRow } });
      } else {
        onSelectionChange({
          start: { col: nextCol, row: nextRow },
          end: { col: nextCol, row: nextRow },
          active: { col: nextCol, row: nextRow },
          isEditing: false
        });
      }
    }

    // Copy (Ctrl+C)
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c') {
      const rowsData: string[][] = [];
      for (let r = minRow; r <= maxRow; r++) {
        const rowVals: string[] = [];
        for (let c = minCol; c <= maxCol; c++) {
          const cellId = coordsToCellId(c, r);
          rowVals.push(gridData[cellId]?.value || '');
        }
        rowsData.push(rowVals);
      }
      const tsv = rowsData.map(r => r.join('\t')).join('\n');
      navigator.clipboard.writeText(tsv);
    }
  };

  // System Clipboard Paste (Ctrl+V) listener
  const handlePaste = useCallback((e: ClipboardEvent) => {
    if (selection.isEditing) return;
    const text = e.clipboardData?.getData('text');
    if (!text) return;

    const rows = text.split(/\r?\n/).map(row => row.split('\t'));
    const parsedData: (CellData | null)[][] = rows.map(r =>
      r.map(val => ({ value: val }))
    );

    onPasteGridData(selection.active, parsedData);
  }, [selection, onPasteGridData]);

  useEffect(() => {
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [handlePaste]);

  // Context Menu
  const handleContextMenu = (e: React.MouseEvent, c: number, r: number) => {
    e.preventDefault();
    onSelectionChange({
      start: { col: c, row: r },
      end: { col: c, row: r },
      active: { col: c, row: r },
      isEditing: false
    });
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      coords: { col: c, row: r }
    });
  };

  // Select All Corner Button
  const handleSelectAll = () => {
    onSelectionChange({
      start: { col: 0, row: 0 },
      end: { col: colCount - 1, row: rowCount - 1 },
      active: { col: 0, row: 0 },
      isEditing: false
    });
  };

  // Column Resize logic
  const handleColResizeStart = (c: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const currentWidth = colWidths[c] || 100;
    setResizingCol({ index: c, startX: e.clientX, startWidth: currentWidth });
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (resizingCol && onUpdateColWidth) {
        const delta = e.clientX - resizingCol.startX;
        const newWidth = Math.max(40, resizingCol.startWidth + delta);
        onUpdateColWidth(resizingCol.index, newWidth);
      }
    };
    const handleMouseUp = () => {
      setResizingCol(null);
    };

    if (resizingCol) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [resizingCol, onUpdateColWidth]);

  return (
    <div
      ref={gridContainerRef}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      className="flex-1 overflow-auto bg-white relative outline-none select-none scrollbar-thin scrollbar-thumb-slate-300"
      onClick={() => contextMenu.visible && setContextMenu({ ...contextMenu, visible: false })}
    >
      <table className="border-collapse text-xs table-fixed font-sans bg-white">
        <thead>
          <tr className="sticky top-0 z-20 bg-[#f8fafc] text-[#64748b] font-medium shadow-2xs h-6">
            {/* Top-Left Select All Corner Header (40px width, 24px height) */}
            <th
              onClick={handleSelectAll}
              className="sticky left-0 z-30 w-[40px] min-w-[40px] h-6 bg-[#f8fafc] border-r border-b border-[#cbd5e1] hover:bg-slate-200 cursor-pointer text-[10px] text-center align-middle text-[#64748b]"
              title="Select All Cells"
            >
              ◢
            </th>

            {/* Column Headers A-Z */}
            {Array.from({ length: colCount }).map((_, c) => {
              const colLabel = colToLabel(c);
              const isColActive = c >= minCol && c <= maxCol;
              const width = colWidths[c] || 100;

              return (
                <th
                  key={c}
                  style={{ width: `${width}px`, minWidth: `${width}px` }}
                  className={`h-6 border-r border-b border-slate-200 text-center font-mono text-[11px] uppercase relative group transition-colors ${
                    isColActive
                      ? 'bg-blue-50 text-blue-600 font-semibold border-b-2 border-b-blue-500'
                      : 'bg-[#f8fafc] text-[#64748b] hover:bg-slate-200/60'
                  }`}
                >
                  <div className="px-1 truncate leading-6">{colLabel}</div>

                  {/* Column Resize Handle */}
                  <div
                    onMouseDown={(e) => handleColResizeStart(c, e)}
                    className="absolute top-0 right-0 w-1.5 h-full cursor-col-resize hover:bg-blue-500 z-10"
                  />
                </th>
              );
            })}
          </tr>
        </thead>

        <tbody>
          {Array.from({ length: rowCount }).map((_, r) => {
            const isRowActive = r >= minRow && r <= maxRow;
            const height = rowHeights[r] || 24;

            return (
              <tr key={r} style={{ height: `${height}px` }} className="h-6">
                {/* Row Header 1-100 (40px width, #cbd5e1 right border) */}
                <td
                  className={`sticky left-0 z-10 w-[40px] min-w-[40px] border-r border-b border-slate-200 border-r-[#cbd5e1] text-center font-mono text-[11px] select-none transition-colors ${
                    isRowActive
                      ? 'bg-blue-50 text-blue-600 font-semibold border-r-2 border-r-blue-500'
                      : 'bg-[#f8fafc] text-[#64748b] hover:bg-slate-200/60'
                  }`}
                >
                  {r + 1}
                </td>

                {/* Data Cells */}
                {Array.from({ length: colCount }).map((_, c) => {
                  const cellId = coordsToCellId(c, r);
                  const cell = gridData[cellId] || { value: '' };

                  const isSelected = c >= minCol && c <= maxCol && r >= minRow && r <= maxRow;
                  const isActiveCell = c === selection.active.col && r === selection.active.row;
                  const isEditingThisCell = isActiveCell && selection.isEditing;

                  const rawVal = cell.value || '';
                  const evaluatedVal = evaluatedMap[cellId] !== undefined ? evaluatedMap[cellId] : rawVal;
                  const displayVal = formatCellValue(evaluatedVal, cell.format);
                  const isError = displayVal.startsWith('#');

                  // Cell Styling
                  const cellStyle: React.CSSProperties = {
                    fontWeight: cell.bold ? 'bold' : 'normal',
                    fontStyle: cell.italic ? 'italic' : 'normal',
                    textDecoration: [
                      cell.underline ? 'underline' : '',
                      cell.strikethrough ? 'line-through' : ''
                    ].filter(Boolean).join(' ') || 'none',
                    color: isError ? '#ef4444' : cell.color || '#1e293b',
                    backgroundColor: isActiveCell ? '#eff6ff' : (cell.bg || (isSelected ? '#eff6ff' : 'transparent')),
                    textAlign: cell.align || 'left',
                    fontSize: cell.fontSize ? `${cell.fontSize}px` : '12px',
                    fontFamily: cell.fontFamily === 'mono' ? 'monospace' : cell.fontFamily === 'serif' ? 'serif' : 'sans-serif'
                  };

                  return (
                    <td
                      key={c}
                      onMouseDown={(e) => handleCellMouseDown(c, r, e)}
                      onMouseEnter={() => handleCellMouseEnter(c, r)}
                      onDoubleClick={() => onSelectionChange({ ...selection, isEditing: true })}
                      onContextMenu={(e) => handleContextMenu(e, c, r)}
                      style={cellStyle}
                      className={`border-r border-b border-slate-200 px-2 relative truncate h-6 leading-6 transition-none ${
                        isSelected && !isActiveCell ? 'bg-blue-50/70' : ''
                      } ${isActiveCell ? 'outline-2 outline-[#3b82f6] outline-offset-[-2px] z-10 !bg-[#eff6ff]' : ''}`}
                    >
                      {isEditingThisCell ? (
                        <input
                          ref={editInputRef}
                          type="text"
                          value={editingValue}
                          onChange={(e) => setEditingValue(e.target.value)}
                          onBlur={() => {
                            onCellChange(cellId, editingValue);
                            onSelectionChange({ ...selection, isEditing: false });
                          }}
                          className="w-full h-full bg-white text-slate-900 font-mono px-1 py-0 outline-none border-none text-xs"
                        />
                      ) : (
                        <span className="truncate block">{displayVal}</span>
                      )}

                      {/* Auto-Fill Handle (+ square at bottom right of active selection) */}
                      {isActiveCell && !selection.isEditing && (
                        <div
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            setIsFillDragging(true);
                          }}
                          className="absolute -bottom-1 -right-1 w-2.5 h-2.5 bg-[#3b82f6] border border-white rounded-2xs cursor-crosshair z-20 hover:scale-125 transition-transform"
                          title="Drag to auto-fill"
                        />
                      )}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Context Menu */}
      {contextMenu.visible && (
        <div
          style={{ top: contextMenu.y, left: contextMenu.x }}
          className="fixed z-50 bg-white text-slate-800 border border-slate-200 rounded-md shadow-xl py-1 text-xs min-w-[160px]"
        >
          <button
            onClick={() => {
              onInsertRow(contextMenu.coords.row);
              setContextMenu({ ...contextMenu, visible: false });
            }}
            className="w-full text-left px-3 py-1.5 hover:bg-slate-100 transition"
          >
            Insert Row Above
          </button>
          <button
            onClick={() => {
              onInsertRow(contextMenu.coords.row + 1);
              setContextMenu({ ...contextMenu, visible: false });
            }}
            className="w-full text-left px-3 py-1.5 hover:bg-slate-100 transition"
          >
            Insert Row Below
          </button>
          <button
            onClick={() => {
              onDeleteRow(contextMenu.coords.row);
              setContextMenu({ ...contextMenu, visible: false });
            }}
            className="w-full text-left px-3 py-1.5 hover:bg-red-50 text-rose-600 transition"
          >
            Delete Row {contextMenu.coords.row + 1}
          </button>

          <div className="my-1 border-t border-slate-100" />

          <button
            onClick={() => {
              onInsertCol(contextMenu.coords.col);
              setContextMenu({ ...contextMenu, visible: false });
            }}
            className="w-full text-left px-3 py-1.5 hover:bg-slate-100 transition"
          >
            Insert Column Left
          </button>
          <button
            onClick={() => {
              onInsertCol(contextMenu.coords.col + 1);
              setContextMenu({ ...contextMenu, visible: false });
            }}
            className="w-full text-left px-3 py-1.5 hover:bg-slate-100 transition"
          >
            Insert Column Right
          </button>
          <button
            onClick={() => {
              onDeleteCol(contextMenu.coords.col);
              setContextMenu({ ...contextMenu, visible: false });
            }}
            className="w-full text-left px-3 py-1.5 hover:bg-red-50 text-rose-600 transition"
          >
            Delete Column {colToLabel(contextMenu.coords.col)}
          </button>

          <div className="my-1 border-t border-slate-100" />

          <button
            onClick={() => {
              for (let r = minRow; r <= maxRow; r++) {
                for (let c = minCol; c <= maxCol; c++) {
                  onCellChange(coordsToCellId(c, r), '');
                }
              }
              setContextMenu({ ...contextMenu, visible: false });
            }}
            className="w-full text-left px-3 py-1.5 hover:bg-amber-50 text-amber-700 transition"
          >
            Clear Selected Cells
          </button>
        </div>
      )}
    </div>
  );
};
