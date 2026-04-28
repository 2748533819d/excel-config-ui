import { ref } from 'vue';
import type { CellRange } from '../types';

// 简化版本，后续根据实际 Univer API 调整
let univerInstance: any = null;

export function useUniver() {
  const currentSelection = ref<CellRange | null>(null);

  /**
   * 初始化 Univer
   */
  const initUniver = (_container: HTMLElement) => {
    console.log('初始化 Univer');
    // TODO: 后续集成完整的 Univer 初始化逻辑
    return null;
  };

  /**
   * 加载 Excel 文件
   */
  const loadExcelFile = async (_container: HTMLElement, file: File) => {
    console.log('加载文件:', file.name);
    // TODO: 后续实现 Excel 文件解析
  };

  /**
   * 获取当前选区
   */
  const getSelection = (): CellRange | null => {
    return currentSelection.value;
  };

  /**
   * 销毁 Univer 实例
   */
  const disposeUniver = () => {
    if (univerInstance) {
      // univerInstance.dispose();
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
