/**
 * Formatting and coordinate conversion helpers for SimpleSheet
 */

import { CellCoords, NumberFormat } from '../types';

/**
 * Converts column index to column letter (0 -> 'A', 25 -> 'Z', 26 -> 'AA')
 */
export function colToLabel(colIndex: number): string {
  let temp: number;
  let letter = '';
  let col = colIndex + 1;

  while (col > 0) {
    temp = (col - 1) % 26;
    letter = String.fromCharCode(65 + temp) + letter;
    col = Math.floor((col - temp) / 26);
  }

  return letter;
}

/**
 * Converts column letter to 0-indexed column number ('A' -> 0, 'Z' -> 25)
 */
export function labelToCol(colLabel: string): number {
  const label = colLabel.toUpperCase().trim();
  let col = 0;
  for (let i = 0; i < label.length; i++) {
    col = col * 26 + (label.charCodeAt(i) - 64);
  }
  return col - 1;
}

/**
 * Converts cell ID string like 'B4' to CellCoords { col: 1, row: 3 }
 */
export function cellIdToCoords(cellId: string): CellCoords | null {
  const match = cellId.trim().toUpperCase().match(/^([A-Z]+)(\d+)$/);
  if (!match) return null;

  const colLabel = match[1];
  const rowNum = parseInt(match[2], 10);

  if (isNaN(rowNum) || rowNum <= 0) return null;

  return {
    col: labelToCol(colLabel),
    row: rowNum - 1
  };
}

/**
 * Converts CellCoords { col: 1, row: 3 } to cell ID string 'B4'
 */
export function coordsToCellId(col: number, row: number): string {
  return `${colToLabel(col)}${row + 1}`;
}

/**
 * Formats a raw evaluated value according to the specified format
 */
export function formatCellValue(value: string | number, format?: NumberFormat): string {
  if (value === undefined || value === null || value === '') return '';
  const strVal = String(value);

  // If value is a formula error or string non-numeric
  if (strVal.startsWith('#')) return strVal;

  const num = Number(strVal);
  if (isNaN(num)) {
    return strVal; // Return raw text
  }

  switch (format) {
    case 'number':
      return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(num);

    case 'currency':
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2
      }).format(num);

    case 'percent':
      return new Intl.NumberFormat('en-US', {
        style: 'percent',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(num > 1 ? num / 100 : num);

    case 'text':
      return strVal;

    case 'general':
    default:
      // If it's a integer, don't force trailing decimals unless user typed decimals
      if (Number.isInteger(num)) {
        return num.toLocaleString('en-US');
      }
      return new Intl.NumberFormat('en-US', {
        maximumFractionDigits: 4
      }).format(num);
  }
}

/**
 * Normalizes range string like 'A1:B5' into start and end coordinates
 */
export function parseRange(rangeStr: string): { start: CellCoords; end: CellCoords } | null {
  const parts = rangeStr.toUpperCase().trim().split(':');
  if (parts.length === 1) {
    const coords = cellIdToCoords(parts[0]);
    if (!coords) return null;
    return { start: coords, end: coords };
  } else if (parts.length === 2) {
    const start = cellIdToCoords(parts[0]);
    const end = cellIdToCoords(parts[1]);
    if (!start || !end) return null;

    return {
      start: {
        col: Math.min(start.col, end.col),
        row: Math.min(start.row, end.row)
      },
      end: {
        col: Math.max(start.col, end.col),
        row: Math.max(start.row, end.row)
      }
    };
  }
  return null;
}

/**
 * Returns array of cell ID strings contained in a range (e.g. 'A1:B2' -> ['A1', 'A2', 'B1', 'B2'])
 */
export function getCellsInRange(rangeStr: string): string[] {
  const range = parseRange(rangeStr);
  if (!range) return [];

  const cellIds: string[] = [];
  for (let c = range.start.col; c <= range.end.col; c++) {
    for (let r = range.start.row; r <= range.end.row; r++) {
      cellIds.push(coordsToCellId(c, r));
    }
  }
  return cellIds;
}
