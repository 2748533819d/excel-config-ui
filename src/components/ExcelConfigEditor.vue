<template>
  <div class="excel-config-editor">
    <!-- 顶部工具栏 -->
    <div class="toolbar" v-if="showToolbar">
      <div class="toolbar-left">
        <div class="logo">
          <span class="logo-icon">📊</span>
          <span class="logo-text">Excel Config</span>
        </div>
        <div class="toolbar-divider"></div>
        <el-input
          v-model="localTemplateName"
          placeholder="模板名称"
          class="template-input"
          @change="emitConfigChange"
        />
      </div>
      <div class="toolbar-right">
        <el-button @click="handleGenerate">
          <el-icon><Document /></el-icon>
          生成配置
        </el-button>
        <el-button type="primary" plain @click="handleDownload">
          <el-icon><Download /></el-icon>
          下载
        </el-button>
        <el-button type="primary" plain @click="handleCopy">
          <el-icon><CopyDocument /></el-icon>
          复制
        </el-button>
      </div>
    </div>

    <!-- 状态栏 -->
    <div class="status-bar">
      <div class="status-left">
        <span class="status-item" v-if="excelFile">
          <el-icon><FolderChecked /></el-icon>
          {{ excelFile.name }}
        </span>
        <span class="status-item" v-else>
          请上传 Excel 文件
        </span>
      </div>
      <div class="status-right">
        <span class="status-item">
          {{ fields.length }} 个字段配置
        </span>
      </div>
    </div>

    <div class="main-content">
      <!-- 表格区域 -->
      <div class="sheet-area">
        <!-- 上传区域 -->
        <div class="upload-overlay" v-if="!excelFile">
          <div class="upload-card">
            <el-upload
              drag
              :auto-upload="false"
              accept=".xlsx,.xls"
              :on-change="handleFileChange"
              :show-file-list="false"
            >
              <div class="upload-content">
                <el-icon class="upload-icon"><UploadFilled /></el-icon>
                <div class="upload-text">
                  <div class="upload-title">拖拽 Excel 文件到此处</div>
                  <div class="upload-subtitle">或点击上传</div>
                </div>
                <div class="upload-hint">支持 .xlsx, .xls 格式</div>
              </div>
            </el-upload>
          </div>
        </div>

        <!-- Excel 表格预览 -->
        <div class="spreadsheet" v-else>
          <!-- 公式栏 -->
          <div class="formula-bar">
            <div class="formula-label">fx</div>
            <div class="formula-input">{{ selectedCell || '' }}</div>
          </div>

          <!-- 表格容器 -->
          <div class="table-wrapper">
            <table class="spreadsheet-table">
              <thead>
                <tr>
                  <th class="corner-cell"></th>
                  <th v-for="(header, index) in tableHeaders" :key="index" class="col-header" :class="{ 'selected': selectedCol === index }">
                    <span class="col-letter">{{ String.fromCharCode(65 + index) }}</span>
                    <span class="col-content">{{ header || '(空)' }}</span>
                  </th>
                  <!-- 填充空白列 -->
                  <th v-for="i in 5" :key="'empty-' + i" class="col-header empty">
                    <span class="col-letter">{{ String.fromCharCode(65 + tableHeaders.length + i) }}</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(row, rowIndex) in tableData" :key="rowIndex" :class="{ 'selected-row': selectedRow === rowIndex }">
                  <td class="row-header" :class="{ 'selected': selectedRow === rowIndex }">
                    {{ rowIndex + 1 }}
                  </td>
                  <!-- 渲染表头数量的单元格，确保空白单元格也能点击 -->
                  <td
                    v-for="colIndex in maxColumns"
                    :key="colIndex - 1"
                    class="cell"
                    :class="{
                      'selected': selectedRow === rowIndex && selectedCol === colIndex - 1,
                      'header-row': rowIndex === 0,
                      'empty': !row[colIndex - 1]
                    }"
                    @click="handleCellClick(rowIndex, colIndex - 1, row[colIndex - 1])"
                  >
                    <span class="cell-content">{{ row[colIndex - 1] ?? '' }}</span>
                  </td>
                </tr>
                <!-- 添加额外的空行，方便用户配置空白区域 -->
                <tr v-for="i in 5" :key="'empty-row-' + i" :class="{ 'selected-row': selectedRow >= tableData.length }">
                  <td class="row-header">{{ tableData.length + i }}</td>
                  <td
                    v-for="colIndex in maxColumns"
                    :key="'empty-' + colIndex"
                    class="cell empty"
                    :class="{
                      'selected': selectedRow === tableData.length + i - 1 && selectedCol === colIndex - 1
                    }"
                    @click="handleCellClick(tableData.length + i - 1, colIndex - 1, null)"
                  >
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- 重新上传按钮 -->
          <div class="upload-actions">
            <el-button size="small" @click="resetFile">
              <el-icon><Refresh /></el-icon>
              重新上传
            </el-button>
          </div>
        </div>
      </div>

      <!-- 右侧配置面板 -->
      <div class="config-panel">
        <div class="config-header">
          <div class="header-title">
            <el-icon><Setting /></el-icon>
            <span>字段配置</span>
          </div>
          <el-button type="primary" size="small" @click="showAddField = true">
            <el-icon><Plus /></el-icon>
            添加字段
          </el-button>
        </div>

        <div class="config-list">
          <el-empty v-if="fields.length === 0" :image-size="80" description="点击表格中的单元格添加字段" />

          <div v-for="(field, index) in fields" :key="field.id" class="config-item">
            <div class="config-item-main">
              <div class="config-item-header">
                <div class="field-info">
                  <span class="field-index">{{ index + 1 }}</span>
                  <span class="field-key">{{ field.key }}</span>
                </div>
                <div class="field-actions">
                  <el-tag size="small" type="info">{{ field.extractMode }}</el-tag>
                  <el-button link type="danger" size="small" @click="deleteField(field.id)">
                    <el-icon><Close /></el-icon>
                  </el-button>
                </div>
              </div>

              <div class="config-item-details">
                <div class="detail-row">
                  <span class="detail-label">位置</span>
                  <span class="detail-value">{{ field.position.cellRef || field.position.areaRef || '-' }}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">类型</span>
                  <span class="detail-value">{{ field.type }}</span>
                </div>
                <div class="detail-row" v-if="field.range">
                  <span class="detail-label">范围</span>
                  <span class="detail-value">
                    <span v-if="field.range.rows">{{ field.range.rows }}行</span>
                    <span v-if="field.range.skipEmpty" class="hint">跳过空行</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 添加字段对话框 -->
    <el-dialog
      v-model="showAddField"
      title="添加字段配置"
      width="480px"
      :close-on-click-modal="false"
      @close="resetForm"
    >
      <el-form :model="newField" label-width="76px" label-position="left">
        <el-form-item label="字段名" required>
          <el-input
            v-model="newField.key"
            placeholder="如：orderNo"
          />
        </el-form-item>
        <el-form-item label="提取模式" required>
          <el-select v-model="newField.extractMode" style="width: 100%" placeholder="请选择提取模式">
            <el-option label="📍 单一单元格 (SINGLE)" value="SINGLE" />
            <el-option label="⬇️ 向下列表 (DOWN)" value="DOWN" />
            <el-option label="➡️ 向右列表 (RIGHT)" value="RIGHT" />
            <el-option label="📦 区域块 (BLOCK)" value="BLOCK" />
            <el-option label="🔚 直到空值 (UNTIL_EMPTY)" value="UNTIL_EMPTY" />
          </el-select>
        </el-form-item>
        <el-form-item label="数据类型" required>
          <el-select v-model="newField.type" style="width: 100%" placeholder="请选择数据类型">
            <el-option label="🔤 字符串 (STRING)" value="STRING" />
            <el-option label="🔢 数字 (NUMBER)" value="NUMBER" />
            <el-option label="📅 日期 (DATE)" value="DATE" />
            <el-option label="✅ 布尔值 (BOOLEAN)" value="BOOLEAN" />
          </el-select>
        </el-form-item>
        <el-form-item label="是否必填">
          <el-switch v-model="newField.required" />
        </el-form-item>

        <!-- 范围配置 -->
        <template v-if="['DOWN', 'RIGHT', 'BLOCK'].includes(newField.extractMode)">
          <el-divider content-position="left">范围设置</el-divider>
          <el-form-item label="行数">
            <el-input-number
              v-model.number="newField.range!.rows"
              :min="1"
              style="width: 100%"
              placeholder="提取的行数"
            />
          </el-form-item>
          <el-form-item label="列数" v-if="newField.extractMode === 'BLOCK'">
            <el-input-number
              v-model.number="newField.range!.cols"
              :min="1"
              style="width: 100%"
              placeholder="提取的列数"
            />
          </el-form-item>
          <el-form-item label="跳过空行">
            <el-switch v-model="newField.range!.skipEmpty" />
          </el-form-item>
        </template>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="showAddField = false">取消</el-button>
          <el-button type="primary" @click="confirmAddField">确定</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- JSON 预览对话框 -->
    <el-dialog v-model="showJsonPreview" title="配置预览" width="640px">
      <div class="json-container">
        <pre class="json-preview">{{ jsonPreview }}</pre>
      </div>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="showJsonPreview = false">关闭</el-button>
          <el-button type="primary" @click="handleDownloadFromPreview">下载 JSON</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import {
  UploadFilled,
  Document,
  Download,
  CopyDocument,
  FolderChecked,
  Refresh,
  Setting,
  Plus,
  Close,
} from '@element-plus/icons-vue';
import {
  ElMessage,
  ElUpload,
  ElButton,
  ElInput,
  ElSelect,
  ElOption,
  ElForm,
  ElFormItem,
  ElInputNumber,
  ElSwitch,
  ElDialog,
  ElEmpty,
  ElTag,
  ElDivider,
} from 'element-plus';

import type {
  ExcelConfigEditorProps,
  ExcelConfigEditorEmits,
  FieldConfig,
} from '../types';

import { toExcelConfig, downloadJson, copyToClipboard } from '../utils/configGenerator';
import { useUniver } from '../composables/useUniver';

// Props & Emits
const props = withDefaults(defineProps<ExcelConfigEditorProps>(), {
  showToolbar: true,
  templateName: '订单模板',
});

const emit = defineEmits<ExcelConfigEditorEmits>();

// 状态
const excelFile = ref<File | null>(null);
const fields = ref<FieldConfig[]>([]);
const showAddField = ref(false);
const showJsonPreview = ref(false);
const jsonPreview = ref('');
const localTemplateName = ref(props.templateName);

// 选中的单元格
const selectedRow = ref<number>(-1);
const selectedCol = ref<number>(-1);
const selectedCell = ref<string>('');

// Univer hooks
const { loadExcelFile, getExcelData, getHeaders } = useUniver();

// 表格数据
const tableData = computed(() => {
  const data = getExcelData();
  return data.slice(1);
});

const tableHeaders = computed(() => {
  return getHeaders();
});

// 最大列数（表头和数据的最大值）
const maxColumns = computed(() => {
  const headerCount = tableHeaders.value.length;
  const maxDataCols = Math.max(...tableData.value.map(row => row?.length || 0), 0);
  return Math.max(headerCount, maxDataCols, 10); // 至少 10 列
});

// 新字段表单
const newField = ref<FieldConfig>({
  id: '',
  key: '',
  position: {},
  extractMode: 'SINGLE',
  type: 'STRING',
  required: false,
  range: {
    rows: 1,
    cols: 1,
    skipEmpty: false,
  },
});

// 处理文件上传
const handleFileChange = async (file: any) => {
  const rawFile = file.raw as File;
  if (!rawFile) return;

  excelFile.value = rawFile;

  try {
    await loadExcelFile(rawFile);
    ElMessage.success(`已加载：${rawFile.name}`);
  } catch (error) {
    console.error('加载失败:', error);
    ElMessage.error('加载 Excel 失败');
    excelFile.value = null;
  }
};

// 重新上传
const resetFile = () => {
  excelFile.value = null;
  fields.value = [];
  selectedRow.value = -1;
  selectedCol.value = -1;
  selectedCell.value = '';
};

// 单元格点击
const handleCellClick = (rowIndex: number, colIndex: number, cellValue: any) => {
  selectedRow.value = rowIndex;
  selectedCol.value = colIndex;

  const colLetter = String.fromCharCode(65 + colIndex);
  const rowNum = rowIndex + 2; // +2: 表头占一行，行号从 1 开始
  selectedCell.value = `${colLetter}${rowNum}`;

  const header = tableHeaders.value[colIndex] || '';

  newField.value = {
    id: '',
    key: header || `field_${rowIndex}_${colIndex}`,
    position: {
      cellRef: `${colLetter}${rowNum}`,
      headerName: header,
    },
    extractMode: 'DOWN',
    type: typeof cellValue === 'number' ? 'NUMBER' : 'STRING',
    required: false,
    range: {
      rows: Math.max(1, tableData.value.length - rowIndex),
      skipEmpty: true,
    },
  };

  showAddField.value = true;
};

// 重置表单
const resetForm = () => {
  newField.value = {
    id: '',
    key: '',
    position: {},
    extractMode: 'SINGLE',
    type: 'STRING',
    required: false,
    range: { rows: 1, cols: 1, skipEmpty: false },
  };
};

// 确认添加字段
const confirmAddField = () => {
  if (!newField.value.key) {
    ElMessage.warning('请输入字段名');
    return;
  }

  const field: FieldConfig = {
    id: `field_${Date.now()}`,
    key: newField.value.key!,
    position: newField.value.position || {},
    extractMode: newField.value.extractMode as any,
    type: newField.value.type as any,
    required: newField.value.required || false,
    range: ['DOWN', 'RIGHT', 'BLOCK'].includes(newField.value.extractMode!)
      ? newField.value.range
      : undefined,
  };

  fields.value.push(field);
  showAddField.value = false;
  emitConfigChange();
  ElMessage.success('字段添加成功');
};

// 删除字段
const deleteField = (id: string) => {
  fields.value = fields.value.filter((f) => f.id !== id);
  emitConfigChange();
  ElMessage.info('已删除');
};

// 发出配置变化事件
const emitConfigChange = () => {
  const config = toExcelConfig(fields.value, localTemplateName.value);
  emit('change', config);
};

// 生成配置
const handleGenerate = () => {
  const config = toExcelConfig(fields.value, localTemplateName.value);
  jsonPreview.value = JSON.stringify(config, null, 2);
  showJsonPreview.value = true;
  emit('generate', config, jsonPreview.value);
};

// 下载 JSON
const handleDownload = () => {
  const config = toExcelConfig(fields.value, localTemplateName.value);
  downloadJson(config);
  ElMessage.success('JSON 已下载');
};

const handleDownloadFromPreview = () => {
  const config = toExcelConfig(fields.value, localTemplateName.value);
  downloadJson(config);
  showJsonPreview.value = false;
  ElMessage.success('JSON 已下载');
};

// 复制 JSON
const handleCopy = async () => {
  const config = toExcelConfig(fields.value, localTemplateName.value);
  const json = JSON.stringify(config, null, 2);
  const success = await copyToClipboard(json);
  if (success) {
    ElMessage.success('已复制到剪贴板');
  }
};

// 暴露方法
defineExpose({
  getFields: () => fields.value,
  getConfig: () => toExcelConfig(fields.value, localTemplateName.value),
});
</script>

<style lang="css">
/* ===== 整体布局 ===== */
.excel-config-editor {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #f8f9fa;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

/* ===== 顶部工具栏 ===== */
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 56px;
  padding: 0 20px;
  background: #fff;
  border-bottom: 1px solid #e0e0e0;
  box-shadow: 0 1px 4px rgba(0,0,0,0.05);
}

.toolbar-left,
.toolbar-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo {
  display: flex;
  align-items: center;
  gap: 8px;
}

.logo-icon {
  font-size: 24px;
}

.logo-text {
  font-size: 18px;
  font-weight: 600;
  color: #1a1a1a;
}

.toolbar-divider {
  width: 1px;
  height: 24px;
  background: #e0e0e0;
  margin: 0 8px;
}

.template-input {
  width: 200px;
}

/* ===== 状态栏 ===== */
.status-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 32px;
  padding: 0 16px;
  background: #fff;
  border-bottom: 1px solid #e8eaed;
  font-size: 12px;
  color: #5f6368;
}

.status-left,
.status-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

/* ===== 主内容区 ===== */
.main-content {
  display: flex;
  flex: 1;
  overflow: hidden;
}

/* ===== 表格区域 ===== */
.sheet-area {
  flex: 1;
  position: relative;
  overflow: hidden;
  background: #f8f9fa;
}

/* 上传遮罩 */
.upload-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255,255,255,0.8);
  backdrop-filter: blur(4px);
}

.upload-card {
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.1);
  padding: 8px;
}

.upload-content {
  padding: 60px 80px;
  text-align: center;
}

.upload-icon {
  font-size: 64px;
  color: #4285f4;
  margin-bottom: 16px;
}

.upload-title {
  font-size: 18px;
  font-weight: 500;
  color: #1a1a1a;
  margin-bottom: 8px;
}

.upload-subtitle {
  font-size: 14px;
  color: #5f6368;
  margin-bottom: 16px;
}

.upload-hint {
  font-size: 12px;
  color: #9aa0a6;
}

.upload-actions {
  position: absolute;
  bottom: 16px;
  right: 16px;
}

/* 电子表格容器 */
.spreadsheet {
  display: flex;
  flex-direction: column;
  height: 100%;
}

/* 公式栏 */
.formula-bar {
  display: flex;
  align-items: center;
  height: 36px;
  padding: 0 12px;
  background: #fff;
  border-bottom: 1px solid #e0e0e0;
  gap: 8px;
}

.formula-label {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f1f3f4;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  color: #5f6368;
  font-style: italic;
}

.formula-input {
  flex: 1;
  height: 24px;
  padding: 0 8px;
  background: #f1f3f4;
  border-radius: 4px;
  font-size: 13px;
  color: #1a1a1a;
  display: flex;
  align-items: center;
}

/* 表格包装器 */
.table-wrapper {
  flex: 1;
  overflow: auto;
  background: #fff;
}

/* 电子表格 */
.spreadsheet-table {
  border-collapse: collapse;
  min-width: 100%;
}

/* 角落单元格 */
.corner-cell {
  width: 50px;
  height: 28px;
  background: #f8f9fa;
  border: 1px solid #e0e0e0;
  position: sticky;
  left: 0;
  top: 0;
  z-index: 100;
}

/* 列表头 */
.col-header {
  min-width: 100px;
  height: 42px;
  background: #f8f9fa;
  border: 1px solid #e0e0e0;
  padding: 0;
  text-align: left;
  position: sticky;
  top: 0;
  z-index: 50;
  display: table-cell;
}

.col-header.empty {
  background: #f8f9fa;
}

.col-header.selected {
  background: #e3f2fd;
}

.col-letter {
  display: block;
  font-size: 11px;
  color: #5f6368;
  font-weight: 500;
  padding: 4px 8px 0;
}

.col-content {
  display: block;
  font-size: 12px;
  color: #1a1a1a;
  font-weight: 500;
  padding: 0 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 行头 */
.row-header {
  width: 50px;
  height: 32px;
  background: #f8f9fa;
  border: 1px solid #e0e0e0;
  text-align: center;
  font-size: 12px;
  color: #5f6368;
  font-weight: 500;
  position: sticky;
  left: 0;
  z-index: 40;
}

.row-header.selected {
  background: #e3f2fd;
  color: #1967d2;
}

/* 单元格 */
.cell {
  min-width: 100px;
  height: 32px;
  border: 1px solid #e0e0e0;
  padding: 0 8px;
  font-size: 13px;
  color: #1a1a1a;
  cursor: pointer;
  transition: all 0.15s ease;
}

.cell:hover {
  border-color: #1967d2;
  background: rgba(25, 103, 210, 0.04);
}

.cell.selected {
  border: 2px solid #1967d2;
  background: rgba(25, 103, 210, 0.08);
  position: relative;
  z-index: 10;
}

.cell.header-row {
  font-weight: 500;
  background: rgba(0,0,0,0.02);
}

.cell.empty {
  color: #9aa0a6;
  background: #fafbfc;
}

.cell.empty:hover {
  background: rgba(25, 103, 210, 0.08);
}

.cell-content {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.selected-row {
  background: rgba(25, 103, 210, 0.02);
}

/* ===== 配置面板 ===== */
.config-panel {
  width: 360px;
  background: #fff;
  border-left: 1px solid #e0e0e0;
  display: flex;
  flex-direction: column;
  box-shadow: -2px 0 8px rgba(0,0,0,0.04);
}

.config-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #e8eaed;
  background: #fafbfc;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: #1a1a1a;
}

.config-list {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
  background: #f8f9fa;
}

.config-item {
  margin-bottom: 8px;
}

.config-item-main {
  background: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.2s;
}

.config-item-main:hover {
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  border-color: #1967d2;
}

.config-item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 14px;
  background: linear-gradient(to bottom, #fafbfc, #fff);
  border-bottom: 1px solid #f1f3f4;
}

.field-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.field-index {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #e8f0fe;
  color: #1967d2;
  font-size: 11px;
  font-weight: 600;
  border-radius: 50%;
}

.field-key {
  font-weight: 500;
  color: #1a1a1a;
  font-size: 14px;
}

.field-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.config-item-details {
  padding: 10px 14px;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 0;
  font-size: 12px;
}

.detail-label {
  color: #5f6368;
}

.detail-value {
  color: #1a1a1a;
  display: flex;
  align-items: center;
  gap: 8px;
}

.detail-value .hint {
  color: #1967d2;
  font-size: 11px;
  background: rgba(25, 103, 210, 0.1);
  padding: 2px 6px;
  border-radius: 3px;
}

/* ===== 对话框 ===== */
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.json-container {
  background: #1a1a1a;
  border-radius: 8px;
  overflow: hidden;
}

.json-preview {
  background: #0d1117;
  color: #e6edf3;
  padding: 20px;
  margin: 0;
  max-height: 400px;
  overflow-y: auto;
  font-family: 'SF Mono', Monaco, Consolas, monospace;
  font-size: 12px;
  line-height: 1.6;
}

/* ===== 滚动条 ===== */
.table-wrapper::-webkit-scrollbar {
  width: 10px;
  height: 10px;
}

.table-wrapper::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.table-wrapper::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 5px;
}

.table-wrapper::-webkit-scrollbar-thumb:hover {
  background: #a1a1a1;
}

.config-list::-webkit-scrollbar {
  width: 6px;
}

.config-list::-webkit-scrollbar-thumb {
  background: #dadce0;
  border-radius: 3px;
}
</style>
