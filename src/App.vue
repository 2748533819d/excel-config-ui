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
    <ExcelConfigEditor
      template-name="订单模板"
      @generate="handleGenerate"
    />
  </div>
</template>

<style>
.app-container {
  height: 100vh;
  overflow: hidden;
}
</style>
