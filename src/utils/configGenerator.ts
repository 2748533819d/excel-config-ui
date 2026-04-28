import type { FieldConfig, ExcelConfig, BackendFieldConfig } from '../types';

/**
 * 将前端字段配置转换为后端格式
 */
export function fieldToBackend(field: FieldConfig): BackendFieldConfig {
  return {
    key: field.key,
    header: {
      match: field.position.headerName || field.position.cellRef || '',
      row: field.position.cellRef ? parseRowFromCellRef(field.position.cellRef) : undefined,
    },
    mode: field.extractMode,
    range: field.range ? {
      skipEmpty: field.range.skipEmpty,
    } : undefined,
    parser: {
      type: field.type.toLowerCase(),
    },
  };
}

/**
 * 从单元格引用中提取行号（用于 header 的 row 字段）
 */
function parseRowFromCellRef(cellRef: string): number {
  const match = cellRef.match(/^([A-Z]+)(\d+)$/);
  if (match) {
    return parseInt(match[2]) - 1;
  }
  return 0;
}

/**
 * 将前端配置转换为后端 JSON 格式
 */
export function toExcelConfig(
  fields: FieldConfig[],
  templateName: string = '模板'
): ExcelConfig {
  return {
    version: '1.0',
    templateName,
    extractions: fields.map(fieldToBackend),
    exports: [],
  };
}

/**
 * 生成 JSON 字符串
 */
export function toJson(config: ExcelConfig): string {
  return JSON.stringify(config, null, 2);
}

/**
 * 下载 JSON 文件
 */
export function downloadJson(config: ExcelConfig, filename?: string): void {
  const json = toJson(config);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || `${config.templateName}-config.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * 复制到剪贴板
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    return true;
  }
}
