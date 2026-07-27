/**
 * SimpleSheet — Lightweight Spreadsheet Application
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Header } from './components/Header';
import { Toolbar } from './components/Toolbar';
import { FormulaBar } from './components/FormulaBar';
import { SpreadsheetGrid } from './components/SpreadsheetGrid';
import { SheetTabs } from './components/SheetTabs';
import { StatusBar } from './components/StatusBar';
import { ConfirmModal } from './components/ConfirmModal';
import { FindReplaceModal } from './components/FindReplaceModal';
import { TemplatesModal } from './components/TemplatesModal';
import { GoogleDriveModal } from './components/GoogleDriveModal';

import {
  CellCoords,
  CellData,
  CellFormatting,
  GridData,
  SelectionRange,
  SheetTab,
  Template,
  WorkbookState
} from './types';
import { coordsToCellId } from './utils/formatters';
import { evaluateCell } from './utils/formulaEngine';
import { csvToGridData, exportToCSV, exportToJSON, parseCSV, parseJSONWorkbook } from './utils/csvUtils';
import { getStoredAccessToken, saveFileToDrive } from './utils/googleDrive';

const LOCAL_STORAGE_KEY = 'simplesheet_data_v1';
const MAX_ROW_COUNT = 100;
const MAX_COL_COUNT = 26;

const DEFAULT_SHEET: SheetTab = {
  id: 'sheet-1',
  name: 'Sheet1',
  data: {},
  rowCount: MAX_ROW_COUNT,
  colCount: MAX_COL_COUNT,
  colWidths: {},
  rowHeights: {}
};

export default function App() {
  // Title
  const [title, setTitle] = useState('Untitled Spreadsheet');

  // Sheets & Active Sheet
  const [sheets, setSheets] = useState<SheetTab[]>([DEFAULT_SHEET]);
  const [activeSheetId, setActiveSheetId] = useState<string>('sheet-1');

  // Selection state
  const [selection, setSelection] = useState<SelectionRange>({
    start: { col: 0, row: 0 },
    end: { col: 0, row: 0 },
    active: { col: 0, row: 0 },
    isEditing: false
  });

  // Copied formatting for Format Painter
  const [copiedFormat, setCopiedFormat] = useState<CellFormatting | null>(null);

  // Undo / Redo History
  const [history, setHistory] = useState<{ title: string; sheets: SheetTab[] }[]>([]);
  const [redoStack, setRedoStack] = useState<{ title: string; sheets: SheetTab[] }[]>([]);

  // Auto-save Status
  const [lastSavedText, setLastSavedText] = useState('Auto-saved to browser storage');

  // Modals
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [isTemplatesModalOpen, setIsTemplatesModalOpen] = useState(false);
  const [isFindReplaceOpen, setIsFindReplaceOpen] = useState(false);
  const [isGoogleDriveOpen, setIsGoogleDriveOpen] = useState(false);

  // Hidden File Input for Import
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get active sheet tab object
  const activeSheet = sheets.find((s) => s.id === activeSheetId) || sheets[0] || DEFAULT_SHEET;

  // Save state to Undo History before changes
  const saveToHistory = useCallback(() => {
    setHistory((prev) => [...prev.slice(-49), { title, sheets: JSON.parse(JSON.stringify(sheets)) }]);
    setRedoStack([]);
  }, [title, sheets]);

  // Load state from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.title) setTitle(parsed.title);
        if (parsed.sheets && Array.isArray(parsed.sheets) && parsed.sheets.length > 0) {
          setSheets(parsed.sheets);
          if (parsed.activeSheetId) setActiveSheetId(parsed.activeSheetId);
        }
      } catch (err) {
        console.error('Error restoring localStorage data:', err);
      }
    }
  }, []);

  // Auto-save to localStorage when state updates
  useEffect(() => {
    const dataToSave = { title, activeSheetId, sheets };
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(dataToSave));
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setLastSavedText(`Saved at ${timeStr}`);
  }, [title, sheets, activeSheetId]);

  // Undo Action
  const handleUndo = () => {
    if (history.length === 0) return;
    const previous = history[history.length - 1];
    setRedoStack((prev) => [...prev, { title, sheets: JSON.parse(JSON.stringify(sheets)) }]);
    setTitle(previous.title);
    setSheets(previous.sheets);
    setHistory((prev) => prev.slice(0, prev.length - 1));
  };

  // Redo Action
  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setHistory((prev) => [...prev, { title, sheets: JSON.parse(JSON.stringify(sheets)) }]);
    setTitle(next.title);
    setSheets(next.sheets);
    setRedoStack((prev) => prev.slice(0, prev.length - 1));
  };

  // Global Keyboard Shortcuts (Ctrl+Z, Ctrl+Y, Ctrl+F, formatting)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        if (e.shiftKey) {
          e.preventDefault();
          handleRedo();
        } else {
          e.preventDefault();
          handleUndo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        setIsFindReplaceOpen(true);
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        handleUpdateFormatting({ bold: !getActiveCellFormatting().bold });
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'i') {
        e.preventDefault();
        handleUpdateFormatting({ italic: !getActiveCellFormatting().italic });
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'u') {
        e.preventDefault();
        handleUpdateFormatting({ underline: !getActiveCellFormatting().underline });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [history, redoStack, selection, activeSheet]);

  // Cell Update handler
  const handleCellChange = (cellId: string, newValue: string) => {
    saveToHistory();
    setSheets((prevSheets) =>
      prevSheets.map((s) => {
        if (s.id !== activeSheetId) return s;
        const currentCell = s.data[cellId] || { value: '' };
        return {
          ...s,
          data: {
            ...s.data,
            [cellId]: {
              ...currentCell,
              value: newValue
            }
          }
        };
      })
    );
  };

  // Cell Formatting update handler
  const handleUpdateFormatting = (updates: Partial<CellFormatting>) => {
    saveToHistory();
    const minCol = Math.min(selection.start.col, selection.end.col);
    const maxCol = Math.max(selection.start.col, selection.end.col);
    const minRow = Math.min(selection.start.row, selection.end.row);
    const maxRow = Math.max(selection.start.row, selection.end.row);

    setSheets((prevSheets) =>
      prevSheets.map((s) => {
        if (s.id !== activeSheetId) return s;
        const newData = { ...s.data };

        for (let r = minRow; r <= maxRow; r++) {
          for (let c = minCol; c <= maxCol; c++) {
            const cellId = coordsToCellId(c, r);
            const currentCell = newData[cellId] || { value: '' };
            newData[cellId] = {
              ...currentCell,
              ...updates
            };
          }
        }

        return { ...s, data: newData };
      })
    );
  };

  // Get current active cell formatting for Toolbar display
  const getActiveCellFormatting = (): CellFormatting => {
    const activeCellId = coordsToCellId(selection.active.col, selection.active.row);
    const cell = activeSheet.data[activeCellId];
    return cell || {};
  };

  // Format Painter actions
  const handleCopyFormat = () => {
    setCopiedFormat(getActiveCellFormatting());
  };

  const handlePasteFormat = () => {
    if (!copiedFormat) return;
    const { value, ...formattingOnly } = copiedFormat;
    handleUpdateFormatting(formattingOnly);
  };

  const handleClearFormatting = () => {
    saveToHistory();
    const minCol = Math.min(selection.start.col, selection.end.col);
    const maxCol = Math.max(selection.start.col, selection.end.col);
    const minRow = Math.min(selection.start.row, selection.end.row);
    const maxRow = Math.max(selection.start.row, selection.end.row);

    setSheets((prevSheets) =>
      prevSheets.map((s) => {
        if (s.id !== activeSheetId) return s;
        const newData = { ...s.data };

        for (let r = minRow; r <= maxRow; r++) {
          for (let c = minCol; c <= maxCol; c++) {
            const cellId = coordsToCellId(c, r);
            if (newData[cellId]) {
              newData[cellId] = { value: newData[cellId].value };
            }
          }
        }

        return { ...s, data: newData };
      })
    );
  };

  // Paste Grid Data block (e.g. from TSV)
  const handlePasteGridData = (startCoords: CellCoords, pastedData: (CellData | null)[][]) => {
    saveToHistory();
    setSheets((prevSheets) =>
      prevSheets.map((s) => {
        if (s.id !== activeSheetId) return s;
        const newData = { ...s.data };

        pastedData.forEach((row, rIdx) => {
          row.forEach((cell, cIdx) => {
            if (cell !== null) {
              const targetCol = startCoords.col + cIdx;
              const targetRow = startCoords.row + rIdx;
              if (targetCol < MAX_COL_COUNT && targetRow < MAX_ROW_COUNT) {
                const targetCellId = coordsToCellId(targetCol, targetRow);
                newData[targetCellId] = {
                  ...(newData[targetCellId] || {}),
                  value: cell.value
                };
              }
            }
          });
        });

        return { ...s, data: newData };
      })
    );
  };

  // Row and Column Insert/Delete handlers
  const handleInsertRow = (rowIndex: number) => {
    saveToHistory();
    setSheets((prevSheets) =>
      prevSheets.map((s) => {
        if (s.id !== activeSheetId) return s;
        const newData: GridData = {};

        Object.keys(s.data).forEach((cellId) => {
          const match = cellId.match(/^([A-Z]+)(\d+)$/);
          if (match) {
            const colStr = match[1];
            const rNum = parseInt(match[2], 10) - 1;
            if (rNum >= rowIndex) {
              const newCellId = `${colStr}${rNum + 2}`;
              newData[newCellId] = s.data[cellId];
            } else {
              newData[cellId] = s.data[cellId];
            }
          }
        });

        return { ...s, data: newData };
      })
    );
  };

  const handleDeleteRow = (rowIndex: number) => {
    saveToHistory();
    setSheets((prevSheets) =>
      prevSheets.map((s) => {
        if (s.id !== activeSheetId) return s;
        const newData: GridData = {};

        Object.keys(s.data).forEach((cellId) => {
          const match = cellId.match(/^([A-Z]+)(\d+)$/);
          if (match) {
            const colStr = match[1];
            const rNum = parseInt(match[2], 10) - 1;
            if (rNum < rowIndex) {
              newData[cellId] = s.data[cellId];
            } else if (rNum > rowIndex) {
              const newCellId = `${colStr}${rNum}`;
              newData[newCellId] = s.data[cellId];
            }
          }
        });

        return { ...s, data: newData };
      })
    );
  };

  const handleInsertCol = (colIndex: number) => {
    // Column insert logic
  };

  const handleDeleteCol = (colIndex: number) => {
    // Column delete logic
  };

  // Clear Sheet handler
  const handleClearSheet = () => {
    saveToHistory();
    setSheets((prevSheets) =>
      prevSheets.map((s) => {
        if (s.id !== activeSheetId) return s;
        return { ...s, data: {} };
      })
    );
  };

  // Load Preset Template
  const handleSelectTemplate = (template: Template) => {
    saveToHistory();
    setTitle(template.name);
    setSheets(template.sheets);
    setActiveSheetId(template.sheets[0].id);
  };

  // Export CSV
  const handleExportCSV = () => {
    const evaluatedValues: { [cellId: string]: string } = {};
    Object.keys(activeSheet.data).forEach((cellId) => {
      evaluatedValues[cellId] = evaluateCell(cellId, activeSheet.data);
    });

    const csvContent = exportToCSV(activeSheet.data, activeSheet.colCount, activeSheet.rowCount, evaluatedValues);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${title.replace(/\s+/g, '_')}_${activeSheet.name}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Export JSON (Workbook)
  const handleExportJSON = () => {
    const jsonContent = exportToJSON(sheets);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${title.replace(/\s+/g, '_')}_workbook.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Import CSV / JSON file trigger
  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (!content) return;

      saveToHistory();
      if (file.name.endsWith('.json')) {
        const importedSheets = parseJSONWorkbook(content);
        if (importedSheets) {
          setSheets(importedSheets);
          setActiveSheetId(importedSheets[0].id);
          setTitle(file.name.replace(/\.json$/i, ''));
        }
      } else {
        const parsedRows = parseCSV(content);
        const importedGrid = csvToGridData(parsedRows);
        setSheets((prevSheets) =>
          prevSheets.map((s) => {
            if (s.id !== activeSheetId) return s;
            return { ...s, data: importedGrid };
          })
        );
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Google Drive File Save
  const handleSaveToDrive = async (fileName: string) => {
    const evaluatedValues: { [cellId: string]: string } = {};
    Object.keys(activeSheet.data).forEach((cellId) => {
      evaluatedValues[cellId] = evaluateCell(cellId, activeSheet.data);
    });

    const csvContent = exportToCSV(activeSheet.data, activeSheet.colCount, activeSheet.rowCount, evaluatedValues);
    await saveFileToDrive(fileName, csvContent, 'text/csv');
  };

  // Google Drive File Load
  const handleLoadFromDrive = (content: string, fileName: string) => {
    saveToHistory();
    const parsedRows = parseCSV(content);
    const importedGrid = csvToGridData(parsedRows);
    setSheets((prevSheets) =>
      prevSheets.map((s) => {
        if (s.id !== activeSheetId) return s;
        return { ...s, data: importedGrid };
      })
    );
    setTitle(fileName);
  };

  // Sheet Tabs Management
  const handleAddSheet = () => {
    saveToHistory();
    const newId = `sheet-${Date.now()}`;
    const newName = `Sheet${sheets.length + 1}`;
    const newSheet: SheetTab = {
      id: newId,
      name: newName,
      data: {},
      rowCount: MAX_ROW_COUNT,
      colCount: MAX_COL_COUNT
    };
    setSheets((prev) => [...prev, newSheet]);
    setActiveSheetId(newId);
  };

  const handleRenameSheet = (id: string, newName: string) => {
    setSheets((prev) =>
      prev.map((s) => (s.id === id ? { ...s, name: newName } : s))
    );
  };

  const handleDeleteSheet = (id: string) => {
    if (sheets.length <= 1) return;
    saveToHistory();
    const filtered = sheets.filter((s) => s.id !== id);
    setSheets(filtered);
    if (activeSheetId === id) {
      setActiveSheetId(filtered[0].id);
    }
  };

  const handleDuplicateSheet = (id: string) => {
    const target = sheets.find((s) => s.id === id);
    if (!target) return;
    saveToHistory();
    const newId = `sheet-${Date.now()}`;
    const duplicate: SheetTab = {
      ...JSON.parse(JSON.stringify(target)),
      id: newId,
      name: `${target.name} Copy`
    };
    setSheets((prev) => [...prev, duplicate]);
    setActiveSheetId(newId);
  };

  const activeCellId = coordsToCellId(selection.active.col, selection.active.row);
  const activeRawValue = activeSheet.data[activeCellId]?.value || '';

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-100 font-sans text-slate-900">
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,.json"
        onChange={handleImportFile}
        className="hidden"
      />

      {/* Header */}
      <Header
        title={title}
        onTitleChange={setTitle}
        lastSavedText={lastSavedText}
        canUndo={history.length > 0}
        canRedo={redoStack.length > 0}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onClearSheet={() => setIsClearModalOpen(true)}
        onOpenTemplates={() => setIsTemplatesModalOpen(true)}
        onOpenFindReplace={() => setIsFindReplaceOpen(true)}
        onExportCSV={handleExportCSV}
        onExportJSON={handleExportJSON}
        onImportCSV={() => fileInputRef.current?.click()}
        onOpenGoogleDriveModal={() => setIsGoogleDriveOpen(true)}
        isDriveConnected={!!getStoredAccessToken()}
      />

      {/* Formatting Toolbar */}
      <Toolbar
        formatting={getActiveCellFormatting()}
        onUpdateFormatting={handleUpdateFormatting}
        onClearFormatting={handleClearFormatting}
        onCopyFormat={handleCopyFormat}
        onPasteFormat={handlePasteFormat}
        hasCopiedFormat={!!copiedFormat}
      />

      {/* Formula Bar */}
      <FormulaBar
        selection={selection}
        rawValue={activeRawValue}
        onChangeRawValue={(val) => handleCellChange(activeCellId, val)}
        onCommit={() => setSelection({ ...selection, isEditing: false })}
        onCancel={() => setSelection({ ...selection, isEditing: false })}
      />

      {/* Interactive Grid Canvas */}
      <SpreadsheetGrid
        gridData={activeSheet.data}
        rowCount={activeSheet.rowCount}
        colCount={activeSheet.colCount}
        selection={selection}
        onSelectionChange={setSelection}
        onCellChange={handleCellChange}
        onPasteGridData={handlePasteGridData}
        onInsertRow={handleInsertRow}
        onDeleteRow={handleDeleteRow}
        onInsertCol={handleInsertCol}
        onDeleteCol={handleDeleteCol}
      />

      {/* Bottom Sheet Tabs */}
      <SheetTabs
        sheets={sheets}
        activeSheetId={activeSheetId}
        onSelectSheet={setActiveSheetId}
        onAddSheet={handleAddSheet}
        onRenameSheet={handleRenameSheet}
        onDeleteSheet={handleDeleteSheet}
        onDuplicateSheet={handleDuplicateSheet}
      />

      {/* Bottom Status Bar */}
      <StatusBar
        gridData={activeSheet.data}
        selection={selection}
        sheetName={activeSheet.name}
      />

      {/* Modals */}
      <ConfirmModal
        isOpen={isClearModalOpen}
        title="Clear Sheet Data?"
        message="Are you sure you want to clear all data and formulas in this sheet? This action can be undone with Ctrl+Z."
        confirmText="Yes, Clear Sheet"
        onConfirm={handleClearSheet}
        onClose={() => setIsClearModalOpen(false)}
      />

      <TemplatesModal
        isOpen={isTemplatesModalOpen}
        onClose={() => setIsTemplatesModalOpen(false)}
        onSelectTemplate={handleSelectTemplate}
      />

      <FindReplaceModal
        isOpen={isFindReplaceOpen}
        onClose={() => setIsFindReplaceOpen(false)}
        gridData={activeSheet.data}
        rowCount={activeSheet.rowCount}
        colCount={activeSheet.colCount}
        onSelectCell={(coords) =>
          setSelection({ start: coords, end: coords, active: coords, isEditing: false })
        }
        onCellChange={handleCellChange}
      />

      <GoogleDriveModal
        isOpen={isGoogleDriveOpen}
        onClose={() => setIsGoogleDriveOpen(false)}
        onSaveToDrive={handleSaveToDrive}
        onLoadFromDrive={handleLoadFromDrive}
        currentDocumentName={title}
      />
    </div>
  );
}
