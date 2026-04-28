import type { CellRange } from '../types';

/**
 * 行列号转 Excel 引用 (0, 0) => "A1"
 */
export function getCellRef(row: number, col: number): string {
  const colName = getColumnName(col);
  return `${colName}${row + 1}`;
}

/**
 * 列号转列名 0 => "A", 26 => "AA"
 */
export function getColumnName(col: number): string {
  let name = '';
  let n = col;

  while (n >= 0) {
    name = String.fromCharCode(65 + (n % 26)) + name;
    n = Math.floor(n / 26) - 1;
  }

  return name;
}

/**
 * Excel 引用转行列号 "A1" => { row: 0, col: 0 }
 */
export function parseCellRef(ref: string): { row: number; col: number } {
  const match = ref.match(/^([A-Z]+)(\d+)$/);
  if (!match) {
    throw new Error(`Invalid cell ref: ${ref}`);
  }

  const colName = match[1];
  const rowNum = parseInt(match[2]);

  let col = 0;
  for (let i = 0; i < colName.length; i++) {
    col = col * 26 + (colName.charCodeAt(i) - 64);
  }

  return {
    row: rowNum - 1,
    col: col - 1,
  };
}

/**
 * 解析区域引用 "A1:C10" => { startRow, endRow, startCol, endCol }
 */
export function parseAreaRef(areaRef: string): {
  startRow: number;
  endRow: number;
  startCol: number;
  endCol: number;
} {
  const [startRef, endRef] = areaRef.split(':');
  const start = parseCellRef(startRef);
  const end = parseCellRef(endRef);

  return {
    startRow: start.row,
    endRow: end.row,
    startCol: start.col,
    endCol: end.col,
  };
}

/**
 * 将 CellRange 转换为 Excel 引用格式
 */
export function rangeToRef(range: CellRange): string {
  const start = getCellRef(range.startRow, range.startColumn);
  const end = getCellRef(range.endRow, range.endColumn);
  if (start === end) {
    return start;
  }
  return `${start}:${end}`;
}
