import { ref } from 'vue';
import {
  Univer,
  UniverInstanceType,
  LocaleType,
} from '@univerjs/core';
import { defaultTheme } from '@univerjs/design';
import { UniverPresetSheetsCore } from '@univerjs/preset-sheets-core';

import type { CellRange } from '../types';

let univerInstance: Univer | null = null;

export function useUniver() {
  const currentSelection = ref<CellRange | null>(null);

  /**
   * 初始化 Univer
   */
  const initUniver = (container: HTMLElement) => {
    if (univerInstance) {
      return univerInstance;
    }

    // 创建 Univer 实例
    univerInstance = new Univer({
      theme: defaultTheme,
      locale: LocaleType.ZH_CN,
    });

    // 注册核心插件
    univerInstance.registerPlugin(new UniverPresetSheetsCore());

    // 创建空工作簿
    univerInstance.createUnit(UniverInstanceType.UNIVER_SHEET, {
      id: 'workbook1',
      name: '订单模板',
      sheetOrder: ['sheet1'],
      sheets: {
        sheet1: {
          id: 'sheet1',
          name: 'Sheet1',
          rowCount: 100,
          columnCount: 26,
        },
      },
    });

    return univerInstance;
  };

  /**
   * 加载 Excel 文件
   */
  const loadExcelFile = async (container: HTMLElement, file: File) => {
    // TODO: 实现 Excel 文件解析和加载
    // 目前 Univer 的 Excel 导入需要额外插件
    // 这里先创建一个空工作簿作为演示
    console.log('加载文件:', file.name);

    // 后续可以集成 @univerjs/sheets-import-xlsx 插件
    // 或者使用后端解析后返回数据结构
  };

  /**
   * 获取当前选区
   */
  const getSelection = (): CellRange | null => {
    // TODO: 通过 Univer API 获取实际选区
    // 目前返回模拟数据，后续需要集成 Univer 的选区 API
    return currentSelection.value;
  };

  /**
   * 销毁 Univer 实例
   */
  const disposeUniver = () => {
    if (univerInstance) {
      univerInstance.dispose();
      univerInstance = null;
    }
  };

  /**
   * 设置选区（用于测试）
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
  };
}
