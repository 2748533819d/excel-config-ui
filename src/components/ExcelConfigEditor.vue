<template>
  <div class="excel-config-editor">
    <!-- 工具栏 -->
    <div v-if="showToolbar" class="toolbar">
      <div class="toolbar-left">
        <el-input
          v-model="localTemplateName"
          placeholder="模板名称"
          style="width: 200px"
          @change="emitConfigChange"
        />
      </div>
      <div class="toolbar-right">
        <el-button @click="handleGenerate">生成配置</el-button>
        <el-button type="primary" @click="handleDownload">下载 JSON</el-button>
        <el-button type="success" @click="handleCopy">复制 JSON</el-button>
      </div>
    </div>

    <div class="main-content">
      <!-- 表格预览区 -->
      <div class="sheet-area">
        <div class="upload-area" v-if="!excelFile">
          <el-upload
            drag
            :auto-upload="false"
            accept=".xlsx,.xls"
            :on-change="handleFileChange"
            :show-file-list="false"
          >
            <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
            <div class="el-upload__text">
              拖拽 Excel 文件到此处 或 <em>点击上传</em>
            </div>
            <template #tip>
              <div class="el-upload__tip">
                仅支持 .xlsx 文件
              </div>
            </template>
          </el-upload>
        </div>
        <div ref="univerContainer" class="univer-container" v-else></div>
      </div>

      <!-- 配置面板 -->
      <div class="config-panel">
        <div class="config-header">
          <h3>字段配置</h3>
          <el-button type="primary" size="small" @click="showAddField = true">
            + 添加字段
          </el-button>
        </div>

        <div class="config-list">
          <div v-for="field in fields" :key="field.id" class="config-item">
            <div class="config-item-header">
              <span class="field-key">{{ field.key }}</span>
              <span class="field-mode">{{ field.extractMode }}</span>
              <el-button
                link
                type="danger"
                size="small"
                @click="deleteField(field.id)"
              >
                删除
              </el-button>
            </div>
            <div class="config-item-body">
              <div class="config-row">
                <span class="label">位置:</span>
                <span class="value">{{ field.position.cellRef || field.position.areaRef || '-' }}</span>
              </div>
              <div class="config-row">
                <span class="label">类型:</span>
                <span class="value">{{ field.type }}</span>
              </div>
              <div v-if="field.range" class="config-row">
                <span class="label">范围:</span>
                <span class="value">
                  {{ field.range.rows ? `${field.range.rows}行` : '' }}
                  {{ field.range.cols ? `${field.range.cols}列` : '' }}
                  {{ field.range.skipEmpty ? '(跳过空行)' : '' }}
                </span>
              </div>
            </div>
          </div>

          <el-empty v-if="fields.length === 0" description="请选择单元格并添加字段配置" />
        </div>
      </div>
    </div>

    <!-- 添加字段对话框 -->
    <el-dialog
      v-model="showAddField"
      title="添加字段"
      width="500px"
      @close="resetForm"
    >
      <el-form :model="newField" label-width="80px">
        <el-form-item label="字段名" required>
          <el-input
            v-model="newField.key"
            placeholder="如：orderNo"
          />
        </el-form-item>
        <el-form-item label="提取模式" required>
          <el-select v-model="newField.extractMode" style="width: 100%">
            <el-option label="单一单元格 (SINGLE)" value="SINGLE" />
            <el-option label="向下列表 (DOWN)" value="DOWN" />
            <el-option label="向右列表 (RIGHT)" value="RIGHT" />
            <el-option label="区域块 (BLOCK)" value="BLOCK" />
            <el-option label="直到空值 (UNTIL_EMPTY)" value="UNTIL_EMPTY" />
          </el-select>
        </el-form-item>
        <el-form-item label="数据类型" required>
          <el-select v-model="newField.type" style="width: 100%">
            <el-option label="字符串" value="STRING" />
            <el-option label="数字" value="NUMBER" />
            <el-option label="日期" value="DATE" />
            <el-option label="布尔值" value="BOOLEAN" />
          </el-select>
        </el-form-item>
        <el-form-item label="是否必填">
          <el-switch v-model="newField.required" />
        </el-form-item>

        <!-- 范围配置 -->
        <template v-if="['DOWN', 'RIGHT', 'BLOCK'].includes(newField.extractMode)">
          <el-form-item label="行数">
            <el-input-number
              v-model="newField.range.rows"
              :min="1"
              style="width: 100%"
            />
          </el-form-item>
          <el-form-item label="列数" v-if="newField.extractMode === 'BLOCK'">
            <el-input-number
              v-model="newField.range.cols"
              :min="1"
              style="width: 100%"
            />
          </el-form-item>
          <el-form-item label="跳过空行">
            <el-switch v-model="newField.range.skipEmpty" />
          </el-form-item>
        </template>
      </el-form>

      <template #footer>
        <el-button @click="showAddField = false">取消</el-button>
        <el-button type="primary" @click="confirmAddField">确定</el-button>
      </template>
    </el-dialog>

    <!-- JSON 预览对话框 -->
    <el-dialog v-model="showJsonPreview" title="生成的配置" width="600px">
      <pre class="json-preview">{{ jsonPreview }}</pre>
      <template #footer>
        <el-button @click="showJsonPreview = false">关闭</el-button>
        <el-button type="primary" @click="handleDownloadFromPreview">下载</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { UploadFilled } from '@element-plus/icons-vue';
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
} from 'element-plus';

import type {
  ExcelConfigEditorProps,
  ExcelConfigEditorEmits,
  FieldConfig,
  ExcelConfig,
  CellRange,
} from '../types';

import { getCellRef, rangeToRef } from '../utils/cellRef';
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
const univerContainer = ref<HTMLElement | null>(null);
const fields = ref<FieldConfig[]>([]);
const showAddField = ref(false);
const showJsonPreview = ref(false);
const jsonPreview = ref('');
const localTemplateName = ref(props.templateName);

// 新字段表单
const newField = ref<Partial<FieldConfig>>({
  key: '',
  extractMode: 'SINGLE',
  type: 'STRING',
  required: false,
  range: {
    rows: 1,
    cols: 1,
    skipEmpty: false,
  },
});

// Univer 初始化
const { initUniver, disposeUniver, getSelection, loadExcelFile } = useUniver();

// 当前选区
const currentSelection = ref<CellRange | null>(null);

// 生命周期
onMounted(() => {
  if (univerContainer.value) {
    initUniver(univerContainer.value);
  }
});

onBeforeUnmount(() => {
  disposeUniver();
});

// 处理文件上传
const handleFileChange = async (file: any) => {
  const rawFile = file.raw as File;
  if (!rawFile) return;

  excelFile.value = rawFile;

  // 等待 DOM 更新后初始化 Univer
  setTimeout(() => {
    if (univerContainer.value) {
      loadExcelFile(univerContainer.value, rawFile);
    }
  }, 100);

  ElMessage.success(`已加载文件：${rawFile.name}`);
};

// 打开添加字段对话框
const openAddField = () => {
  const selection = getSelection();
  if (!selection) {
    ElMessage.warning('请先在表格中选择单元格');
    return;
  }

  currentSelection.value = selection;
  const cellRef = rangeToRef(selection);

  newField.value = {
    key: `field_${fields.value.length + 1}`,
    position: {
      cellRef: selection.startRow === selection.endRow &&
               selection.startColumn === selection.endColumn
        ? cellRef
        : undefined,
      areaRef: selection.startRow !== selection.endRow ||
               selection.startColumn !== selection.endColumn
        ? cellRef
        : undefined,
    },
    extractMode: 'SINGLE',
    type: 'STRING',
    required: false,
    range: {
      rows: selection.endRow - selection.startRow + 1,
      cols: selection.endColumn - selection.startColumn + 1,
      skipEmpty: false,
    },
  };

  showAddField.value = true;
};

// 重置表单
const resetForm = () => {
  newField.value = {
    key: '',
    extractMode: 'SINGLE',
    type: 'STRING',
    required: false,
    range: { rows: 1, cols: 1, skipEmpty: false },
  };
  currentSelection.value = null;
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
  ElMessage.info('已删除字段');
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
  ElMessage.success('JSON 文件已下载');
};

const handleDownloadFromPreview = () => {
  const config = toExcelConfig(fields.value, localTemplateName.value);
  downloadJson(config);
  showJsonPreview.value = false;
  ElMessage.success('JSON 文件已下载');
};

// 复制 JSON
const handleCopy = async () => {
  const config = toExcelConfig(fields.value, localTemplateName.value);
  const json = JSON.stringify(config, null, 2);
  const success = await copyToClipboard(json);
  if (success) {
    ElMessage.success('JSON 已复制到剪贴板');
  }
};

// 暴露方法给外部
defineExpose({
  getFields: () => fields.value,
  getConfig: () => toExcelConfig(fields.value, localTemplateName.value),
  loadConfig: (config: ExcelConfig) => {
    // TODO: 加载已有配置
    ElMessage.info('加载配置功能开发中...');
  },
});
</script>

<style lang="scss" scoped>
.excel-config-editor {
  display: flex;
  flex-direction: column;
  height: 100%;
  border: 1px solid #e0e0e0;
  background: #fff;

  .toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px;
    border-bottom: 1px solid #e0e0e0;
    background: #f5f7fa;

    .toolbar-left,
    .toolbar-right {
      display: flex;
      gap: 8px;
      align-items: center;
    }
  }

  .main-content {
    display: flex;
    flex: 1;
    overflow: hidden;

    .sheet-area {
      flex: 1;
      min-width: 600px;
      border-right: 1px solid #e0e0e0;
      position: relative;

      .upload-area {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 100%;
        padding: 40px;

        :deep(.el-upload) {
          width: 100%;
          max-width: 500px;
        }
      }

      .univer-container {
        width: 100%;
        height: 100%;
      }
    }

    .config-panel {
      width: 320px;
      display: flex;
      flex-direction: column;
      background: #fafafa;

      .config-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 16px;
        border-bottom: 1px solid #e0e0e0;

        h3 {
          margin: 0;
          font-size: 14px;
          font-weight: 600;
        }
      }

      .config-list {
        flex: 1;
        overflow-y: auto;
        padding: 8px;

        .config-item {
          margin-bottom: 8px;
          border: 1px solid #e0e0e0;
          border-radius: 4px;
          background: #fff;

          .config-item-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 8px 12px;
            border-bottom: 1px solid #f0f0f0;

            .field-key {
              font-weight: 600;
              color: #333;
            }

            .field-mode {
              font-size: 12px;
              color: #666;
              background: #f0f0f0;
              padding: 2px 6px;
              border-radius: 2px;
            }
          }

          .config-item-body {
            padding: 8px 12px;

            .config-row {
              display: flex;
              justify-content: space-between;
              font-size: 12px;
              margin-bottom: 4px;

              &:last-child {
                margin-bottom: 0;
              }

              .label {
                color: #666;
              }

              .value {
                color: #333;
              }
            }
          }
        }
      }
    }
  }

  .json-preview {
    background: #f5f5f5;
    padding: 16px;
    border-radius: 4px;
    max-height: 400px;
    overflow-y: auto;
    font-family: 'Monaco', 'Consolas', monospace;
    font-size: 12px;
  }
}
</style>
