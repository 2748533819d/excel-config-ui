# Excel Config UI

📊 基于 Vue 3 + Univer 的 Excel 导入导出配置生成器组件

## 特性

- 🎨 **可视化配置** - 在表格中直接选择单元格配置提取规则
- 📝 **生成 JSON** - 生成与后端匹配的 JSON 配置文件
- 🔌 **易于集成** - 支持 npm 安装或 CDN 引入
- 📦 **纯前端** - 无需后端即可生成配置

## 安装

```bash
npm install excel-config-ui
```

## 快速开始

### 方式一：在 Vue 项目中使用

```vue
<template>
  <div style="height: 600px">
    <ExcelConfigEditor 
      @generate="handleGenerate"
    />
  </div>
</template>

<script setup>
import { ExcelConfigEditor } from 'excel-config-ui';

function handleGenerate(config, json) {
  console.log('生成的配置:', config);
  console.log('JSON:', json);
  // 可以将 json 发送给后端或保存为文件
}
</script>
```

### 方式二：在 HTML 中直接使用（CDN）

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>Excel Config</title>
  <script src="https://unpkg.com/vue@3/dist/vue.global.js"></script>
  <script src="https://unpkg.com/excel-config-ui/dist/excel-config-ui.umd.cjs"></script>
  <link rel="stylesheet" href="https://unpkg.com/element-plus/dist/index.css">
</head>
<body>
  <div id="app">
    <excel-config-editor ref="editor" style="height: 600px"></excel-config-editor>
    <button @click="download">下载配置</button>
  </div>

  <script>
    const { createApp } = Vue;
    const { ExcelConfigEditor } = ExcelConfigUI;

    createApp({
      components: { ExcelConfigEditor },
      methods: {
        download() {
          const config = this.$refs.editor.getConfig();
          console.log(config);
        }
      }
    }).mount('#app');
  </script>
</body>
</html>
```

## Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `showToolbar` | boolean | `true` | 是否显示工具栏 |
| `templateName` | string | `'模板'` | 模板名称 |
| `initialConfig` | ExcelConfig | `-` | 初始配置（用于编辑已有配置） |

## Events

| 事件名 | 参数 | 说明 |
|--------|------|------|
| `change` | `(config: ExcelConfig)` | 配置变化时触发 |
| `generate` | `(config: ExcelConfig, json: string)` | 点击生成配置时触发 |

## 暴露的方法

通过 `ref` 可以调用组件方法：

```vue
<template>
  <ExcelConfigEditor ref="editor" />
</template>

<script setup>
const editor = ref(null);

// 获取当前字段列表
const fields = editor.value.getFields();

// 获取配置对象
const config = editor.value.getConfig();

// 加载已有配置
editor.value.loadConfig(savedConfig);
</script>
```

## 生成的配置格式

组件生成的 JSON 配置与后端 Java 组件完全匹配：

```json
{
  "version": "1.0",
  "templateName": "订单模板",
  "extractions": [
    {
      "key": "orderNos",
      "header": { "match": "订单号" },
      "mode": "DOWN",
      "range": { "skipEmpty": true }
    },
    {
      "key": "amounts",
      "header": { "match": "金额" },
      "mode": "DOWN"
    }
  ],
  "exports": []
}
```

## 与后端 Java 组件联合使用

### 后端 Maven 坐标

```xml
<dependency>
    <groupId>io.github.cynosure-tech</groupId>
    <artifactId>excel-config-core</artifactId>
    <version>1.0.1</version>
</dependency>
```

### 1. 前端生成配置

```vue
<template>
  <ExcelConfigEditor 
    :template-name="templateName"
    @generate="handleGenerate"
  />
</template>

<script setup>
const templateName = ref('订单管理模板');

const handleGenerate = async (config, json) => {
  // 方式 1: 发送到后端保存
  await fetch('/api/excel-config/save', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config),
  });

  // 方式 2: 直接下载 JSON 文件
  // 用户可以将 JSON 文件上传到后端系统
};
</script>
```

### 2. 后端读取配置

```java
import com.excelconfig.ExcelConfigHelper;

// 读取配置文件
Map<String, Object> data = ExcelConfigHelper.read("template.xlsx")
    .config("config.json")  // 前端生成的配置文件
    .extract();

// 填充数据
ExcelConfigHelper.write("template.xlsx")
    .config("config.json")
    .data(inputData)
    .writeTo("output.xlsx");
```

### 3. 完整工作流程

```
┌─────────────────┐
│ 1. 前端上传 Excel │
│    模板文件      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 2. 可视化配置   │
│    提取/导出规则 │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 3. 生成 JSON    │
│    配置文件      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 4. 后端使用配置 │
│    处理 Excel    │
└─────────────────┘
```

## 开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建组件库
npm run build:lib

# 预览构建结果
npm run preview
```

## 技术栈

- Vue 3.5+
- TypeScript
- Univer (阿里开源表格引擎)
- Element Plus
- Vite

## License

MIT
