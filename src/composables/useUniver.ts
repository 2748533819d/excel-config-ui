import { ref } from 'vue';
import * as XLSX from 'xlsx';

import type { CellRange } from '../types';

export function useUniver() {
  const currentSelection = ref<CellRange | null>(null);
  const excelData = ref<any[][]>([]);
  const headers = ref<string[]>([]);

  /**
   * 初始化 Univer
   */
  const initUniver = () => {
    console.log('初始化 Univer');
    return null;
  };

  /**
   * 加载 Excel 文件并返回数据
   */
  const loadExcelFile = async (file: File) => {
    return new Promise<any[][]>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          if (!data) {
            reject(new Error('文件读取失败'));
            return;
          }

          // 使用 SheetJS 解析 Excel
          const workbook = XLSX.read(data, { type: 'array' });

          // 获取第一个工作表
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];

          // 转换为 JSON 数据
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

          excelData.value = jsonData;

          // 提取表头（第一行）
          if (jsonData.length > 0) {
            headers.value = jsonData[0].map((h: any) => String(h || ''));
          }

          resolve(jsonData);
        } catch (error) {
          console.error('Excel 解析失败:', error);
          reject(error);
        }
      };

      reader.onerror = () => {
        reject(new Error('文件读取失败'));
      };

      reader.readAsArrayBuffer(file);
    });
  };

  /**
   * 获取当前选区
   */
  const getSelection = (): CellRange | null => {
    return currentSelection.value;
  };

  /**
   * 获取表头
   */
  const getHeaders = (): string[] => {
    return headers.value;
  };

  /**
   * 获取 Excel 数据
   */
  const getExcelData = (): any[][] => {
    return excelData.value;
  };

  /**
   * 销毁
   */
  const disposeUniver = () => {
    excelData.value = [];
    headers.value = [];
    currentSelection.value = null;
  };

  /**
   * 设置选区
   */
  const setSelection = (range: CellRange) => {
    currentSelection.value = range;
  };

  return {
    initUniver,
    disposeUniver,
    getSelection,
    setSelection,
    loadExcelFile,
    getHeaders,
    getExcelData,
  };
}
