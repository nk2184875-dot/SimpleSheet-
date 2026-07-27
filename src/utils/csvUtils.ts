/**
 * CSV and JSON Import/Export utilities for SimpleSheet
 */

import { GridData, SheetTab } from '../types';
import { colToLabel, coordsToCellId, labelToCol } from './formatters';

/**
 * Converts a grid data object into RFC-4180 compliant CSV string
 */
export function exportToCSV(
  gridData: GridData,
  colCount: number = 26,
  rowCount: number = 100,
  evaluatedValues: { [cellId: string]: string } = {}
): string {
  // Find the actual maximum filled row and column to avoid exporting empty trailing cells
  let maxRow = 0;
  let maxCol = 0;

  Object.keys(gridData).forEach(cellId => {
    const match = cellId.toUpperCase().match(/^([A-Z]+)(\d+)$/);
    if (match) {
      const colIdx = labelToCol(match[1]);
      const rowIdx = parseInt(match[2], 10) - 1;
      const val = gridData[cellId]?.value || '';
      if (val.trim() !== '') {
        if (rowIdx > maxRow) maxRow = rowIdx;
        if (colIdx > maxCol) maxCol = colIdx;
      }
    }
  });

  const colsToExport = Math.max(maxCol + 1, 1);
  const rowsToExport = Math.max(maxRow + 1, 1);

  const csvRows: string[] = [];

  for (let r = 0; r < rowsToExport; r++) {
    const rowValues: string[] = [];
    for (let c = 0; c < colsToExport; c++) {
      const cellId = coordsToCellId(c, r);
      // Prefer evaluated display value or raw value
      const displayVal = evaluatedValues[cellId] !== undefined
        ? evaluatedValues[cellId]
        : (gridData[cellId]?.value || '');

      // Escape quotes and wrap in quotes if contains comma, quote, or newline
      let escaped = displayVal.replace(/"/g, '""');
      if (escaped.includes(',') || escaped.includes('\n') || escaped.includes('\r') || escaped.includes('"')) {
        escaped = `"${escaped}"`;
      }
      rowValues.push(escaped);
    }
    csvRows.push(rowValues.join(','));
  }

  return csvRows.join('\r\n');
}

/**
 * Parses a CSV string into a 2D array of string values
 */
export function parseCSV(csvText: string): string[][] {
  const result: string[][] = [];
  let row: string[] = [];
  let inQuotes = false;
  let currentVal = '';

  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    const nextChar = csvText[i + 1];

    if (inQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          // Escaped double quote
          currentVal += '"';
          i++;
        } else {
          // End of quoted string
          inQuotes = false;
        }
      } else {
        currentVal += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        row.push(currentVal);
        currentVal = '';
      } else if (char === '\n' || (char === '\r' && nextChar === '\n')) {
        row.push(currentVal);
        result.push(row);
        row = [];
        currentVal = '';
        if (char === '\r') i++; // Skip \n
      } else if (char === '\r') {
        row.push(currentVal);
        result.push(row);
        row = [];
        currentVal = '';
      } else {
        currentVal += char;
      }
    }
  }

  if (currentVal || row.length > 0) {
    row.push(currentVal);
    result.push(row);
  }

  return result;
}

/**
 * Converts parsed CSV rows into GridData starting at target row and col
 */
export function csvToGridData(csvRows: string[][], startRow: number = 0, startCol: number = 0): GridData {
  const newGrid: GridData = {};

  csvRows.forEach((row, rIdx) => {
    row.forEach((val, cIdx) => {
      if (val.trim() !== '') {
        const cellId = coordsToCellId(startCol + cIdx, startRow + rIdx);
        newGrid[cellId] = { value: val };
      }
    });
  });

  return newGrid;
}

/**
 * Exports full workbook sheets array to JSON string (preserves formulas & formatting)
 */
export function exportToJSON(sheets: SheetTab[]): string {
  return JSON.stringify({ version: '1.0', sheets }, null, 2);
}

/**
 * Imports full workbook sheets from JSON string
 */
export function parseJSONWorkbook(jsonText: string): SheetTab[] | null {
  try {
    const parsed = JSON.parse(jsonText);
    if (parsed && Array.isArray(parsed.sheets)) {
      return parsed.sheets;
    } else if (parsed && typeof parsed === 'object' && parsed.data) {
      // Single sheet fallback
      return [{
        id: 'sheet-1',
        name: 'Sheet1',
        data: parsed.data,
        rowCount: parsed.rowCount || 100,
        colCount: parsed.colCount || 26
      }];
    }
  } catch (err) {
    console.error('Failed to parse JSON workbook:', err);
  }
  return null;
}
