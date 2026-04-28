<script setup lang="ts">
import ExcelConfigEditor from './components/ExcelConfigEditor.vue';
import type { ExcelConfig } from './types';

function handleGenerate(config: ExcelConfig, json: string) {
  console.log('生成的配置:', config);
  console.log('JSON:', json);
}
</script>

<template>
  <div style="height: 100vh">
    <ExcelConfigEditor
      template-name="订单模板"
      @generate="handleGenerate"
    />
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
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}
</style>
