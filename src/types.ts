/**
 * SimpleSheet Type Definitions
 */

export type Alignment = 'left' | 'center' | 'right';

export type NumberFormat = 'general' | 'number' | 'currency' | 'percent' | 'text';

export interface CellFormatting {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  color?: string; // Text color CSS
  bg?: string;    // Background color CSS
  align?: Alignment;
  format?: NumberFormat;
  fontSize?: number;
  fontFamily?: string;
}

export interface CellData extends CellFormatting {
  value: string;   // Raw user input or formula e.g. "=SUM(A1:A10)" or "123"
  display?: string; // Evaluated display value
}

export interface GridData {
  [cellId: string]: CellData; // Keyed by cell ID like "A1", "B12"
}

export interface SheetTab {
  id: string;
  name: string;
  data: GridData;
  rowCount: number;
  colCount: number;
  colWidths?: { [colIndex: number]: number };
  rowHeights?: { [rowIndex: number]: number };
}

export interface WorkbookState {
  activeSheetId: string;
  sheets: SheetTab[];
}

export interface CellCoords {
  col: number; // 0-indexed (0 = A, 25 = Z)
  row: number; // 0-indexed (0 = Row 1, 99 = Row 100)
}

export interface SelectionRange {
  start: CellCoords;
  end: CellCoords;
  active: CellCoords;
  isEditing?: boolean;
}

export interface DragFillState {
  isDragging: boolean;
  startRange: SelectionRange;
  currentCell: CellCoords;
}

export interface ClipboardData {
  data: (CellData | null)[][];
  rowCount: number;
  colCount: number;
}

export interface FindResult {
  cellId: string;
  coords: CellCoords;
  sheetId: string;
  matchText: string;
}

export interface Template {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  sheets: SheetTab[];
}
