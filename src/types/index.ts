// 单元格引用类型
export interface CellRange {
  startRow: number;
  endRow: number;
  startColumn: number;
  endColumn: number;
}

// 提取模式
export type ExtractMode = 'SINGLE' | 'DOWN' | 'RIGHT' | 'BLOCK' | 'UNTIL_EMPTY';

// 导出模式
export type FillMode = 'FILL_CELL' | 'FILL_DOWN' | 'FILL_RIGHT' | 'FILL_BLOCK' | 'FILL_TABLE';

// 字段配置
export interface FieldConfig {
  id: string;
  key: string;
  position: {
    cellRef?: string;
    areaRef?: string;
    headerName?: string;
  };
  extractMode: ExtractMode;
  range?: {
    rows?: number;
    cols?: number;
    skipEmpty?: boolean;
  };
  type: 'STRING' | 'NUMBER' | 'DATE' | 'BOOLEAN';
  required: boolean;
}

// Excel 配置（与后端 JSON 匹配）
export interface ExcelConfig {
  version: string;
  templateName: string;
  extractions: BackendFieldConfig[];
  exports: BackendFieldConfig[];
}

// 后端字段配置格式
export interface BackendFieldConfig {
  key: string;
  header: {
    match: string;
    row?: number;
  };
  mode: string;
  range?: {
    skipEmpty?: boolean;
  };
  parser?: {
    type: string;
  };
}

// Excel 结构信息
export interface ExcelStructure {
  sheets: Array<{
    id: string;
    name: string;
    rowCount: number;
    columnCount: number;
  }>;
}

// 组件事件
export interface ExcelConfigEditorEmits {
  (e: 'change', config: ExcelConfig): void;
  (e: 'generate', config: ExcelConfig, json: string): void;
}

// 组件 Props
export interface ExcelConfigEditorProps {
  initialConfig?: ExcelConfig;
  showToolbar?: boolean;
  templateName?: string;
}
