<script setup lang="ts">
import ExcelConfigEditor from './components/ExcelConfigEditor.vue';
import type { ExcelConfig } from './types';

function handleGenerate(config: ExcelConfig, json: string) {
  console.log('生成的配置:', config);
  console.log('JSON:', json);
}
</script>

<template>
  <div class="app-container">
    <header class="app-header">
      <h1>Excel Config UI</h1>
      <span class="subtitle">可视化配置生成器</span>
    </header>
    <main class="app-main">
      <ExcelConfigEditor
        template-name="订单模板"
        @generate="handleGenerate"
      />
    </main>
  </div>
</template>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  height: 100%;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.app-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 20px;
  gap: 20px;
}

.app-header {
  text-align: center;
  color: #fff;
  padding: 10px 0;
}

.app-header h1 {
  font-size: 28px;
  font-weight: 700;
  margin-bottom: 4px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.app-header .subtitle {
  font-size: 14px;
  opacity: 0.9;
}

.app-main {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}
</style>
