---
paths:
  - "src/**/*.{ts,tsx}"
---

# React 前端规则

## 组件
- 函数式组件 + hooks，不使用 class 组件
- 文件命名：组件 PascalCase.tsx，其余 camelCase.ts
- 每个组件一个文件，不在同一文件中导出多个组件
- 导入顺序：React → 第三方库 → 本地组件 → stores/hooks → services → types → utils

## 状态管理
- 全部使用 Zustand，不使用 React Context 做全局状态
- Store 文件放 `src/stores/`，每个 store 一个文件
- Store 命名：`useXxxStore`（如 `useMessageStore`）

## 样式
- 只用 TailwindCSS class，不写自定义 CSS
- 暗色主题用 `dark:` 前缀
- 不需要响应式（桌面应用固定尺寸）

## Tauri IPC
- 所有 `invoke()` 调用必须包在 try-catch 中
- 封装在 `src/services/` 中，组件不直接调用 `invoke()`
- 失败时弹 toast 提示，不崩溃

## LLM 相关
- Prompt 模板定义在 `src/services/llm.ts`，完整模板见 docs/SPEC_AI.md §4.3-4.5
- LLM 调用失败 → 静默降级保存原始数据，设 `ai_confidence=0, status='unprocessed'`
- Token 计费逻辑见 docs/SPEC_AI.md §12.3

## 类型
- 所有类型定义集中在 `src/types/index.ts`
- 完整类型定义见 docs/SPEC_AI.md §3.1，直接复制使用
- 不使用 `any`，如果类型不确定用 `unknown` 后断言

## 图片处理
- 粘贴图片检测：监听 paste 事件，检查 `clipboardData` 中的 image 类型
- base64 > 5MB 时压缩：canvas → JPEG 80%（逻辑见 docs/SPEC_AI.md §12.4）
- 压缩逻辑放 `src/utils/image.ts`
