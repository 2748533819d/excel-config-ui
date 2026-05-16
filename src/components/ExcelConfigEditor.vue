<template>
  <div class="eced">
    <header class="eced-toolbar" v-if="showToolbar">
      <div class="eced-toolbar-left">
        <div class="eced-brand">
          <svg class="eced-brand-symbol" width="22" height="22" viewBox="0 0 22 22" fill="none">
            <rect x="1.5" y="1.5" width="19" height="19" rx="4.5" stroke="currentColor" stroke-width="1.5"/>
            <path d="M5.5 8h11M5.5 11h11M5.5 14h8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
          <span class="eced-brand-name">Excel Config</span>
          <span class="eced-brand-tag">0.1</span>
        </div>
        <span class="eced-brand-sep"></span>
        <el-input
          v-model="localTemplateName"
          placeholder="模板名称"
          class="eced-tpl-input"
          @change="emitConfigChange"
        />
      </div>
      <div class="eced-toolbar-right">
        <el-button class="eced-btn" @click="handleGenerate">
          <el-icon><Document /></el-icon>
          生成配置
        </el-button>
        <el-button class="eced-btn eced-btn--primary" @click="handleDownload">
          <el-icon><Download /></el-icon>
          下载
        </el-button>
        <el-button class="eced-btn eced-btn--primary" @click="handleCopy">
          <el-icon><CopyDocument /></el-icon>
          复制
        </el-button>
      </div>
    </header>

    <div class="eced-status">
      <div class="eced-status-left">
        <span class="eced-status-bullet" :class="{ 'is-live': !!excelFile }"></span>
        <span class="eced-status-text" v-if="excelFile">
          <span class="eced-status-file">{{ excelFile.name }}</span>
          <span class="eced-status-divider">·</span>
          已加载
        </span>
        <span class="eced-status-text" v-else>
          等待上传 Excel 文件
        </span>
      </div>
      <div class="eced-status-right">
        <span class="eced-status-count">
          <span class="eced-count-num">{{ fields.length }}</span>
          个字段
        </span>
      </div>
    </div>

    <div class="eced-body">
      <section class="eced-sheet">
        <div class="eced-upload" v-if="!excelFile">
          <div class="eced-upload-inner">
            <el-upload
              drag
              :auto-upload="false"
              accept=".xlsx,.xls"
              :on-change="handleFileChange"
              :show-file-list="false"
            >
              <div class="eced-upload-drop">
                <div class="eced-upload-glyph">
                  <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                    <rect x="6" y="6" width="36" height="36" rx="8" stroke="currentColor" stroke-width="1.5" stroke-dasharray="3 3"/>
                    <path d="M24 14v20M14 24h20" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
                  </svg>
                </div>
                <p class="eced-upload-title">上传 Excel 文件</p>
                <p class="eced-upload-hint">拖拽到此处或点击浏览</p>
                <span class="eced-upload-types">.xlsx · .xls</span>
              </div>
            </el-upload>
          </div>
        </div>

        <div class="eced-grid" v-else>
          <div class="eced-fx">
            <span class="eced-fx-label">fx</span>
            <span class="eced-fx-value" :class="{ 'is-idle': !selectedCell }">
              {{ selectedCell || '单元格未选中' }}
            </span>
          </div>

          <div class="eced-table-wrap">
            <table class="eced-table">
              <thead>
                <tr>
                  <th class="eced-th eced-th--corner"></th>
                  <th v-for="(h, i) in tableHeaders" :key="i"
                    class="eced-th eced-th--col"
                    :class="{ 'is-lit': selectedCol === i }"
                  >
                    <span class="eced-col-char">{{ String.fromCharCode(65 + i) }}</span>
                    <span class="eced-col-label">{{ h || '(空)' }}</span>
                  </th>
                  <th v-for="j in 5" :key="'fc-' + j"
                    class="eced-th eced-th--col eced-th--ghost"
                  >
                    <span class="eced-col-char">{{ String.fromCharCode(65 + tableHeaders.length + j) }}</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(row, ri) in tableData" :key="ri"
                  :class="{ 'is-row-lit': selectedRow === ri }"
                >
                  <td class="eced-td eced-td--row"
                    :class="{ 'is-lit': selectedRow === ri }"
                  >{{ ri + 1 }}</td>
                  <td
                    v-for="ci in maxColumns" :key="ci - 1"
                    class="eced-td eced-td--cell"
                    :class="{
                      'is-hit': selectedRow === ri && selectedCol === ci - 1,
                      'is-head': ri === 0,
                      'is-void': !row[ci - 1]
                    }"
                    @click="handleCellClick(ri, ci - 1, row[ci - 1])"
                  >
                    <span class="eced-cell-val">{{ row[ci - 1] ?? '' }}</span>
                  </td>
                </tr>
                <tr v-for="k in 5" :key="'fr-' + k"
                  :class="{ 'is-row-lit': selectedRow >= tableData.length }"
                >
                  <td class="eced-td eced-td--row">{{ tableData.length + k }}</td>
                  <td
                    v-for="ci in maxColumns" :key="'vb-' + ci"
                    class="eced-td eced-td--cell eced-td--void"
                    :class="{
                      'is-hit': selectedRow === tableData.length + k - 1 && selectedCol === ci - 1
                    }"
                    @click="handleCellClick(tableData.length + k - 1, ci - 1, null)"
                  ></td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="eced-grid-foot">
            <button class="eced-reload" @click="resetFile">
              <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                <path d="M11 7A4 4 0 1 1 7 3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                <path d="M11 3v2.5H8.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              重新上传
            </button>
          </div>
        </div>
      </section>

      <aside class="eced-panel">
        <div class="eced-panel-head">
          <div class="eced-panel-title">
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="2.5" stroke="currentColor" stroke-width="1.5"/>
              <circle cx="8" cy="8" r="6.5" stroke="currentColor" stroke-width="1.5" stroke-dasharray="2 2"/>
            </svg>
            字段配置
          </div>
          <el-button type="primary" size="small" @click="showAddField = true">
            <el-icon><Plus /></el-icon>
            添加
          </el-button>
        </div>

        <div class="eced-panel-list">
          <div v-if="fields.length === 0" class="eced-panel-none">
            <div class="eced-none-icon">
              <svg width="36" height="36" viewBox="0 0 40 40" fill="none">
                <rect x="9" y="9" width="22" height="22" rx="4" stroke="currentColor" stroke-width="1.5"/>
                <path d="M17 20h6M20 17v6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
              </svg>
            </div>
            <p class="eced-none-text">点击表格中的单元格<br/>添加字段</p>
          </div>

          <div v-for="(f, i) in fields" :key="f.id" class="eced-card">
            <div class="eced-card-head">
              <div class="eced-card-meta">
                <span class="eced-card-num">{{ i + 1 }}</span>
                <span class="eced-card-key">{{ f.key }}</span>
              </div>
              <div class="eced-card-ops">
                <span class="eced-card-mode">{{ f.extractMode }}</span>
                <button class="eced-card-del" @click="deleteField(f.id)">
                  <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                    <path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                  </svg>
                </button>
              </div>
            </div>
            <div class="eced-card-body">
              <div class="eced-card-row">
                <span class="eced-card-lbl">位置</span>
                <span class="eced-card-val eced-card-val--mono">{{ f.position.cellRef || f.position.areaRef || '-' }}</span>
              </div>
              <div class="eced-card-row">
                <span class="eced-card-lbl">类型</span>
                <span class="eced-card-val">{{ f.type }}</span>
              </div>
              <div class="eced-card-row" v-if="f.range">
                <span class="eced-card-lbl">范围</span>
                <span class="eced-card-val">
                  <span v-if="f.range.rows">{{ f.range.rows }} 行</span>
                  <span v-if="f.range.skipEmpty" class="eced-card-skip">跳过空行</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </div>

    <el-dialog
      v-model="showAddField"
      title="添加字段"
      width="460px"
      :close-on-click-modal="false"
      class="eced-dlg"
      @close="resetForm"
    >
      <el-form :model="newField" label-width="80px" label-position="left">
        <el-form-item label="字段名" required>
          <el-input v-model="newField.key" placeholder="如 orderNo" />
        </el-form-item>
        <el-form-item label="提取模式" required>
          <el-select v-model="newField.extractMode" style="width:100%" placeholder="选择模式">
            <el-option label="单一单元格 SINGLE" value="SINGLE" />
            <el-option label="向下列表 DOWN" value="DOWN" />
            <el-option label="向右列表 RIGHT" value="RIGHT" />
            <el-option label="区域块 BLOCK" value="BLOCK" />
            <el-option label="直到空值 UNTIL_EMPTY" value="UNTIL_EMPTY" />
          </el-select>
        </el-form-item>
        <el-form-item label="数据类型" required>
          <el-select v-model="newField.type" style="width:100%" placeholder="选择类型">
            <el-option label="字符串 STRING" value="STRING" />
            <el-option label="数字 NUMBER" value="NUMBER" />
            <el-option label="日期 DATE" value="DATE" />
            <el-option label="布尔 BOOLEAN" value="BOOLEAN" />
          </el-select>
        </el-form-item>
        <el-form-item label="必填">
          <el-switch v-model="newField.required" />
        </el-form-item>

        <template v-if="['DOWN', 'RIGHT', 'BLOCK'].includes(newField.extractMode)">
          <el-divider content-position="left">范围</el-divider>
          <el-form-item label="行数">
            <el-input-number v-model.number="newField.range!.rows" :min="1" style="width:100%" />
          </el-form-item>
          <el-form-item label="列数" v-if="newField.extractMode === 'BLOCK'">
            <el-input-number v-model.number="newField.range!.cols" :min="1" style="width:100%" />
          </el-form-item>
          <el-form-item label="跳过空行">
            <el-switch v-model="newField.range!.skipEmpty" />
          </el-form-item>
        </template>
      </el-form>
      <template #footer>
        <div class="eced-dlg-foot">
          <el-button @click="showAddField = false">取消</el-button>
          <el-button type="primary" @click="confirmAddField">确定</el-button>
        </div>
      </template>
    </el-dialog>

    <el-dialog v-model="showJsonPreview" title="配置预览" width="620px" class="eced-dlg-json">
      <div class="eced-json-box">
        <pre class="eced-json-pre">{{ jsonPreview }}</pre>
      </div>
      <template #footer>
        <div class="eced-dlg-foot">
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
  Document,
  Download,
  CopyDocument,
  Plus,
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
  ElDivider,
} from 'element-plus';

import type {
  ExcelConfigEditorProps,
  ExcelConfigEditorEmits,
  FieldConfig,
} from '../types';

import { toExcelConfig, downloadJson, copyToClipboard } from '../utils/configGenerator';
import { useUniver } from '../composables/useUniver';

const props = withDefaults(defineProps<ExcelConfigEditorProps>(), {
  showToolbar: true,
  templateName: '订单模板',
});

const emit = defineEmits<ExcelConfigEditorEmits>();

const excelFile = ref<File | null>(null);
const fields = ref<FieldConfig[]>([]);
const showAddField = ref(false);
const showJsonPreview = ref(false);
const jsonPreview = ref('');
const localTemplateName = ref(props.templateName);

const selectedRow = ref<number>(-1);
const selectedCol = ref<number>(-1);
const selectedCell = ref<string>('');

const { loadExcelFile, getExcelData, getHeaders } = useUniver();

const tableData = computed(() => {
  const data = getExcelData();
  return data.slice(1);
});

const tableHeaders = computed(() => {
  return getHeaders();
});

const maxColumns = computed(() => {
  const headerCount = tableHeaders.value.length;
  const maxDataCols = Math.max(...tableData.value.map(row => row?.length || 0), 0);
  return Math.max(headerCount, maxDataCols, 10);
});

const newField = ref<FieldConfig>({
  id: '',
  key: '',
  position: {},
  extractMode: 'SINGLE',
  type: 'STRING',
  required: false,
  range: { rows: 1, cols: 1, skipEmpty: false },
});

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

const resetFile = () => {
  excelFile.value = null;
  fields.value = [];
  selectedRow.value = -1;
  selectedCol.value = -1;
  selectedCell.value = '';
};

const handleCellClick = (rowIndex: number, colIndex: number, cellValue: any) => {
  selectedRow.value = rowIndex;
  selectedCol.value = colIndex;
  const colLetter = String.fromCharCode(65 + colIndex);
  const rowNum = rowIndex + 2;
  selectedCell.value = `${colLetter}${rowNum}`;
  const header = tableHeaders.value[colIndex] || '';
  newField.value = {
    id: '',
    key: header || `field_${rowIndex}_${colIndex}`,
    position: { cellRef: `${colLetter}${rowNum}`, headerName: header },
    extractMode: 'DOWN',
    type: typeof cellValue === 'number' ? 'NUMBER' : 'STRING',
    required: false,
    range: { rows: Math.max(1, tableData.value.length - rowIndex), skipEmpty: true },
  };
  showAddField.value = true;
};

const resetForm = () => {
  newField.value = {
    id: '', key: '', position: {},
    extractMode: 'SINGLE', type: 'STRING', required: false,
    range: { rows: 1, cols: 1, skipEmpty: false },
  };
};

const confirmAddField = () => {
  if (!newField.value.key) { ElMessage.warning('请输入字段名'); return; }
  const field: FieldConfig = {
    id: `field_${Date.now()}`,
    key: newField.value.key!,
    position: newField.value.position || {},
    extractMode: newField.value.extractMode as any,
    type: newField.value.type as any,
    required: newField.value.required || false,
    range: ['DOWN', 'RIGHT', 'BLOCK'].includes(newField.value.extractMode!)
      ? newField.value.range : undefined,
  };
  fields.value.push(field);
  showAddField.value = false;
  emitConfigChange();
  ElMessage.success('字段添加成功');
};

const deleteField = (id: string) => {
  fields.value = fields.value.filter(f => f.id !== id);
  emitConfigChange();
  ElMessage.info('已删除');
};

const emitConfigChange = () => emit('change', toExcelConfig(fields.value, localTemplateName.value));

const handleGenerate = () => {
  const config = toExcelConfig(fields.value, localTemplateName.value);
  jsonPreview.value = JSON.stringify(config, null, 2);
  showJsonPreview.value = true;
  emit('generate', config, jsonPreview.value);
};

const handleDownload = () => {
  downloadJson(toExcelConfig(fields.value, localTemplateName.value));
  ElMessage.success('JSON 已下载');
};

const handleDownloadFromPreview = () => {
  downloadJson(toExcelConfig(fields.value, localTemplateName.value));
  showJsonPreview.value = false;
  ElMessage.success('JSON 已下载');
};

const handleCopy = async () => {
  const json = JSON.stringify(toExcelConfig(fields.value, localTemplateName.value), null, 2);
  if (await copyToClipboard(json)) ElMessage.success('已复制到剪贴板');
};

defineExpose({
  getFields: () => fields.value,
  getConfig: () => toExcelConfig(fields.value, localTemplateName.value),
});
</script>

<style scoped>
/* ==========================================================
   eced = Excel Config Editor — Studio Precision
   Typography: DM Sans + JetBrains Mono
   Palette:    Deep charcoal, warm paper, teal accent
   ========================================================== */

.eced {
  --c-bg: #f4f4f2;
  --c-surface: #ffffff;
  --c-surface-dim: #fafaf9;
  --c-border: #e6e4dd;
  --c-border-strong: #c8c5bc;
  --c-text: #1a1a18;
  --c-text-soft: #6b6a66;
  --c-text-faint: #9e9c97;
  --c-teal: #0d9488;
  --c-teal-bg: rgba(13, 148, 136, 0.08);
  --c-teal-glow: rgba(13, 148, 136, 0.18);
  --c-red: #e53e3e;

  --ff-sans: 'DM Sans', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
  --ff-mono: 'JetBrains Mono', 'SF Mono', 'Fira Code', monospace;

  --r-sm: 5px;
  --r-md: 8px;
  --r-lg: 12px;

  --s1: 0 1px 2px rgba(0,0,0,0.04);
  --s2: 0 4px 12px rgba(0,0,0,0.05);
  --s3: 0 8px 24px rgba(0,0,0,0.07);

  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--c-bg);
  font-family: var(--ff-sans);
  color: var(--c-text);
  -webkit-font-smoothing: antialiased;
}

/* ─── Toolbar ─── */

.eced-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 48px;
  padding: 0 14px;
  background: var(--c-surface);
  border-bottom: 1px solid var(--c-border);
  flex-shrink: 0;
}

.eced-toolbar-left,
.eced-toolbar-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.eced-brand {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--c-text);
}

.eced-brand-symbol {
  color: var(--c-teal);
}

.eced-brand-name {
  font-size: 15px;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.eced-brand-tag {
  font-size: 9px;
  font-weight: 600;
  color: var(--c-text-faint);
  background: var(--c-bg);
  padding: 2px 5px;
  border-radius: 3px;
  letter-spacing: 0.04em;
}

.eced-brand-sep {
  width: 1px;
  height: 18px;
  background: var(--c-border);
}

.eced-tpl-input {
  width: 160px;
}

.eced-tpl-input :deep(.el-input__wrapper) {
  background: var(--c-bg);
  box-shadow: none;
  border-radius: var(--r-sm);
  transition: background 0.2s, box-shadow 0.2s;
}

.eced-tpl-input :deep(.el-input__wrapper:hover) {
  background: #eae9e6;
}

.eced-tpl-input :deep(.el-input__wrapper.is-focus) {
  background: var(--c-surface);
  box-shadow: 0 0 0 2px var(--c-teal-bg);
}

.eced-tpl-input :deep(.el-input__inner) {
  font-size: 13px;
  font-weight: 500;
  font-family: var(--ff-sans);
  color: var(--c-text);
}

.eced-btn {
  font-family: var(--ff-sans) !important;
  font-size: 13px !important;
  font-weight: 500 !important;
  border-radius: var(--r-sm) !important;
  transition: all 0.15s ease !important;
  border: 1px solid var(--c-border-strong) !important;
  background: var(--c-surface) !important;
  color: var(--c-text) !important;
  height: 32px !important;
}

.eced-btn:hover {
  border-color: var(--c-teal) !important;
  color: var(--c-teal) !important;
  background: var(--c-teal-bg) !important;
}

.eced-btn--primary {
  background: var(--c-teal) !important;
  border-color: var(--c-teal) !important;
  color: #fff !important;
}

.eced-btn--primary:hover {
  background: #0f766e !important;
  border-color: #0f766e !important;
  color: #fff !important;
}

/* ─── Status ─── */

.eced-status {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 26px;
  padding: 0 14px;
  background: var(--c-surface);
  border-bottom: 1px solid var(--c-border);
  flex-shrink: 0;
}

.eced-status-left,
.eced-status-right {
  display: flex;
  align-items: center;
  gap: 6px;
}

.eced-status-bullet {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--c-text-faint);
  transition: background 0.3s, box-shadow 0.3s;
}

.eced-status-bullet.is-live {
  background: var(--c-teal);
  box-shadow: 0 0 5px var(--c-teal-glow);
}

.eced-status-text {
  font-size: 11px;
  color: var(--c-text-soft);
  display: flex;
  align-items: center;
  gap: 4px;
}

.eced-status-file {
  font-weight: 500;
  color: var(--c-text);
}

.eced-status-divider {
  color: var(--c-text-faint);
}

.eced-status-count {
  font-size: 11px;
  color: var(--c-text-soft);
}

.eced-count-num {
  font-weight: 600;
  color: var(--c-teal);
  margin-right: 2px;
  font-variant-numeric: tabular-nums;
}

/* ─── Body ─── */

.eced-body {
  display: flex;
  flex: 1;
  overflow: hidden;
}

/* ─── Sheet ─── */

.eced-sheet {
  flex: 1;
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* ─── Upload ─── */

.eced-upload {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background:
    radial-gradient(circle at 30% 40%, rgba(13,148,136,0.03) 0%, transparent 60%),
    radial-gradient(circle at 70% 60%, rgba(13,148,136,0.02) 0%, transparent 50%),
    var(--c-bg);
}

.eced-upload-inner {
  width: 380px;
  border-radius: var(--r-lg);
  overflow: hidden;
}

.eced-upload-inner :deep(.el-upload),
.eced-upload-inner :deep(.el-upload-dragger) {
  width: 100%;
}

.eced-upload-inner :deep(.el-upload-dragger) {
  padding: 52px 28px;
  border: 2px dashed var(--c-border-strong);
  border-radius: var(--r-lg);
  background: var(--c-surface);
  transition: border-color 0.25s, background 0.25s, box-shadow 0.25s;
}

.eced-upload-inner :deep(.el-upload-dragger:hover),
.eced-upload-inner :deep(.el-upload-dragger.is-dragover) {
  border-color: var(--c-teal);
  background: var(--c-teal-bg);
  box-shadow: 0 0 0 4px var(--c-teal-bg);
}

.eced-upload-drop {
  text-align: center;
}

.eced-upload-glyph {
  color: var(--c-text-faint);
  margin-bottom: 18px;
  transition: color 0.25s;
}

.eced-upload:hover .eced-upload-glyph,
.eced-upload-inner :deep(.el-upload-dragger:hover) .eced-upload-glyph {
  color: var(--c-teal);
}

.eced-upload-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--c-text);
  margin-bottom: 6px;
}

.eced-upload-hint {
  font-size: 13px;
  color: var(--c-text-soft);
  margin-bottom: 14px;
}

.eced-upload-types {
  display: inline-block;
  font-size: 10px;
  font-weight: 600;
  color: var(--c-text-faint);
  letter-spacing: 0.06em;
  text-transform: uppercase;
  background: var(--c-bg);
  padding: 3px 10px;
  border-radius: 4px;
}

/* ─── Grid ─── */

.eced-grid {
  display: flex;
  flex-direction: column;
  height: 100%;
}

/* fx bar */

.eced-fx {
  display: flex;
  align-items: center;
  height: 30px;
  padding: 0 10px;
  background: var(--c-surface);
  border-bottom: 1px solid var(--c-border);
  gap: 6px;
  flex-shrink: 0;
}

.eced-fx-label {
  width: 22px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--c-bg);
  border-radius: 3px;
  font-size: 10px;
  font-weight: 700;
  color: var(--c-text-faint);
  font-style: italic;
  font-family: var(--ff-mono);
}

.eced-fx-value {
  flex: 1;
  height: 20px;
  padding: 0 6px;
  font-size: 12px;
  font-family: var(--ff-mono);
  color: var(--c-text);
  display: flex;
  align-items: center;
  font-weight: 500;
}

.eced-fx-value.is-idle {
  color: var(--c-text-faint);
  font-style: italic;
  font-family: var(--ff-sans);
  font-weight: 400;
  font-size: 11px;
}

/* table wrapper */

.eced-table-wrap {
  flex: 1;
  overflow: auto;
  background: var(--c-surface);
}

.eced-table-wrap::-webkit-scrollbar {
  width: 7px;
  height: 7px;
}

.eced-table-wrap::-webkit-scrollbar-track {
  background: transparent;
}

.eced-table-wrap::-webkit-scrollbar-thumb {
  background: #d4d2cb;
  border-radius: 4px;
}

.eced-table-wrap::-webkit-scrollbar-thumb:hover {
  background: #b8b5ac;
}

/* table */

.eced-table {
  border-collapse: collapse;
  min-width: 100%;
  table-layout: fixed;
}

.eced-table td,
.eced-table th {
  border: 1px solid var(--c-border);
}

/* ─── th ─── */

.eced-th--corner {
  width: 44px;
  height: 26px;
  background: var(--c-bg);
  position: sticky;
  left: 0;
  top: 0;
  z-index: 110;
}

.eced-th--col {
  min-width: 88px;
  height: 40px;
  background: var(--c-bg);
  padding: 0;
  text-align: left;
  position: sticky;
  top: 0;
  z-index: 50;
  cursor: default;
  transition: background 0.15s;
}

.eced-th--col.is-lit {
  background: #e1f0ee;
}

.eced-th--ghost {
  opacity: 0.4;
}

.eced-col-char {
  display: block;
  padding: 2px 7px 0;
  font-size: 9px;
  font-weight: 600;
  color: var(--c-text-faint);
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.eced-col-label {
  display: block;
  padding: 0 7px 2px;
  font-size: 11px;
  font-weight: 600;
  color: var(--c-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ─── td ─── */

.eced-td--row {
  width: 44px;
  height: 28px;
  background: var(--c-bg);
  text-align: center;
  font-size: 10px;
  font-weight: 500;
  color: var(--c-text-faint);
  position: sticky;
  left: 0;
  z-index: 40;
  transition: all 0.12s;
}

.eced-td--row.is-lit {
  color: var(--c-teal);
  font-weight: 600;
  background: #e1f0ee;
}

.eced-td--cell {
  min-width: 88px;
  height: 28px;
  padding: 0 7px;
  font-size: 12px;
  font-family: var(--ff-sans);
  color: var(--c-text);
  cursor: pointer;
  transition: background 0.1s, border-color 0.1s;
}

.eced-td--cell:hover {
  background: var(--c-teal-bg);
}

.eced-td--cell.is-hit {
  border: 2px solid var(--c-teal);
  background: var(--c-teal-bg);
  position: relative;
  z-index: 10;
}

.eced-td--cell.is-head {
  font-weight: 600;
  background: var(--c-surface-dim);
}

.eced-td--cell.is-void {
  color: var(--c-text-faint);
  background: #fcfcfb;
}

.eced-td--void {
  color: transparent !important;
}

.eced-cell-val {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.is-row-lit {
  background: var(--c-teal-bg);
}

/* grid footer */

.eced-grid-foot {
  position: absolute;
  bottom: 10px;
  right: 10px;
}

.eced-reload {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 10px;
  font-size: 11px;
  font-weight: 500;
  font-family: var(--ff-sans);
  color: var(--c-text-soft);
  background: var(--c-surface);
  border: 1px solid var(--c-border);
  border-radius: var(--r-sm);
  cursor: pointer;
  transition: all 0.15s;
}

.eced-reload:hover {
  color: var(--c-teal);
  border-color: var(--c-teal);
  background: var(--c-teal-bg);
}

/* ─── Panel ─── */

.eced-panel {
  width: 320px;
  background: var(--c-surface);
  border-left: 1px solid var(--c-border);
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
}

.eced-panel-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 14px;
  border-bottom: 1px solid var(--c-border);
}

.eced-panel-title {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 13px;
  font-weight: 600;
}

.eced-panel-list {
  flex: 1;
  overflow-y: auto;
  padding: 10px;
  background: var(--c-bg);
}

.eced-panel-list::-webkit-scrollbar {
  width: 4px;
}

.eced-panel-list::-webkit-scrollbar-thumb {
  background: #d4d2cb;
  border-radius: 2px;
}

/* empty */

.eced-panel-none {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 44px 16px;
  text-align: center;
}

.eced-none-icon {
  color: var(--c-text-faint);
  margin-bottom: 14px;
  opacity: 0.4;
}

.eced-none-text {
  font-size: 12px;
  color: var(--c-text-faint);
  line-height: 1.6;
}

/* cards */

.eced-card {
  background: var(--c-surface);
  border: 1px solid var(--c-border);
  border-left: 3px solid var(--c-border);
  border-radius: 0 var(--r-md) var(--r-md) 0;
  overflow: hidden;
  transition: border-color 0.2s, box-shadow 0.2s;
  margin-bottom: 7px;
}

.eced-card:hover {
  border-color: var(--c-border-strong);
  border-left-color: var(--c-teal);
  box-shadow: var(--s1);
}

.eced-card-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 9px 10px 9px 12px;
  border-bottom: 1px solid var(--c-border);
}

.eced-card-meta {
  display: flex;
  align-items: center;
  gap: 7px;
  min-width: 0;
}

.eced-card-num {
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--c-teal-bg);
  color: var(--c-teal);
  font-size: 9px;
  font-weight: 700;
  border-radius: 50%;
  flex-shrink: 0;
}

.eced-card-key {
  font-size: 12px;
  font-weight: 600;
  color: var(--c-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.eced-card-ops {
  display: flex;
  align-items: center;
  gap: 5px;
  flex-shrink: 0;
}

.eced-card-mode {
  font-family: var(--ff-mono);
  font-size: 9px;
  font-weight: 600;
  letter-spacing: 0.03em;
  background: var(--c-bg);
  color: var(--c-text-soft);
  padding: 2px 6px;
  border-radius: 3px;
}

.eced-card-del {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border: none;
  background: transparent;
  color: var(--c-text-faint);
  border-radius: 3px;
  cursor: pointer;
  transition: all 0.15s;
}

.eced-card-del:hover {
  color: var(--c-red);
  background: rgba(229, 62, 62, 0.08);
}

.eced-card-body {
  padding: 7px 12px;
}

.eced-card-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 3px 0;
  font-size: 11px;
}

.eced-card-lbl {
  color: var(--c-text-faint);
}

.eced-card-val {
  color: var(--c-text-soft);
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 5px;
}

.eced-card-val--mono {
  font-family: var(--ff-mono);
  font-size: 10px;
}

.eced-card-skip {
  font-size: 9px;
  font-weight: 600;
  color: var(--c-teal);
  background: var(--c-teal-bg);
  padding: 1px 5px;
  border-radius: 3px;
}

/* ─── Dialogs ─── */

.eced-dlg :deep(.el-dialog__header) {
  padding: 14px 18px 0;
  margin: 0;
}

.eced-dlg :deep(.el-dialog__title) {
  font-size: 14px;
  font-weight: 700;
  font-family: var(--ff-sans);
}

.eced-dlg :deep(.el-dialog__body) {
  padding: 14px 18px;
}

.eced-dlg :deep(.el-dialog__footer) {
  padding: 0 18px 14px;
}

.eced-dlg :deep(.el-form-item__label) {
  font-size: 12px;
  font-weight: 500;
  color: var(--c-text-soft);
}

.eced-dlg :deep(.el-input__wrapper) {
  border-radius: var(--r-sm);
}

.eced-dlg :deep(.el-divider__text) {
  font-size: 10px;
  font-weight: 600;
  color: var(--c-text-faint);
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.eced-dlg-foot {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.eced-dlg-foot :deep(.el-button) {
  font-family: var(--ff-sans);
  font-size: 12px;
  font-weight: 500;
  border-radius: var(--r-sm);
}

/* json dialog */

.eced-dlg-json :deep(.el-dialog__header) {
  padding: 14px 18px 0;
  margin: 0;
}

.eced-dlg-json :deep(.el-dialog__title) {
  font-size: 14px;
  font-weight: 700;
  font-family: var(--ff-sans);
}

.eced-dlg-json :deep(.el-dialog__body) {
  padding: 10px 18px;
}

.eced-dlg-json :deep(.el-dialog__footer) {
  padding: 0 18px 14px;
}

.eced-json-box {
  background: #12131a;
  border-radius: var(--r-md);
  overflow: hidden;
  border: 1px solid #1e2030;
}

.eced-json-pre {
  margin: 0;
  padding: 14px 18px;
  max-height: 360px;
  overflow-y: auto;
  font-family: var(--ff-mono);
  font-size: 11px;
  line-height: 1.8;
  color: #e2e4ec;
  letter-spacing: 0.01em;
  tab-size: 2;
}

.eced-json-pre::-webkit-scrollbar {
  width: 4px;
}

.eced-json-pre::-webkit-scrollbar-thumb {
  background: #2a2d42;
  border-radius: 2px;
}
</style>
