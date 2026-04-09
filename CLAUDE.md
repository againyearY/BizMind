<!--
  BizMind 项目 CLAUDE.md
  此文件由 Claude Code 在每次会话启动时自动加载。
  保持 <200 行。详细技术规格见 docs/SPEC_AI.md。
-->

# BizMind — AI 信息归档桌面应用

小微企业主通过快捷键呼出悬浮窗，粘贴文本/截图，AI 自动分类归档到看板。
当前阶段：V0.1 MVP，仅 Windows，一人开发。

## 技术规格

完整功能编号(FEAT-xxx)、数据模型、Prompt 模板、降级策略、验收测试用例见：
@docs/SPEC_AI.md

产品背景与商业决策见：
@docs/PRD_Human.md

分阶段开发任务见：
@docs/DEVELOPMENT_TASKS.md

**实现任何功能前，YOU MUST 先读 docs/SPEC_AI.md 中对应的 FEAT 编号章节。**

## 技术栈（强制）

- Tauri 2.x（Rust 后端 + WebView 前端）
- React 18+ TypeScript strict
- TailwindCSS 3+，Zustand，@dnd-kit
- SQLite via tauri-plugin-sql
- LLM: 云端 API，OpenAI 兼容格式
- Vite + pnpm

**IMPORTANT: 禁止使用** Electron, Next.js, Prisma, 任何 ORM, CSS-in-JS,
后端服务框架, 本地 OCR 引擎(PaddleOCR/Tesseract), npm/yarn。

## 关键设计决策（不可更改）

1. 无本地 OCR — 截图识别通过多模态 LLM API（用户 Ctrl+V 粘贴图片）
2. 无剪贴板监听 — 所有操作由用户主动触发
3. 无悬浮窗内截图按钮 — 用户自行系统截图后粘贴
4. 无独立 Customer/Project/Task 表 — MVP 用 Message 表字符串字段
5. 无 FTS5 — 搜索用 LIKE，结构化字段优先匹配
6. API Key 明文存储于 ~/.bizmind/config/settings.json
7. 批量导入逐条串行调用 LLM，不合并
8. 图片 base64 > 5MB 时 canvas 压缩为 JPEG 80%

## 构建与运行

```bash
pnpm install
pnpm tauri dev          # 开发模式
pnpm tauri build        # 生产构建
pnpm tsc --noEmit       # 类型检查
```

## 代码注释规范

实现功能时在函数/模块顶部标注功能编号：
```typescript
// FEAT-002: 文本归档
// FEAT-LLM-003: 实体提取 Prompt — 模板见 docs/SPEC_AI.md §4.3
```

## 开发顺序

严格按以下顺序，每个 Phase 结束后必须可独立运行验证：

1. **Phase 1**: Tauri 初始化 + SQLite 建表 + 基础窗口
2. **Phase 2**: 悬浮球 + 快捷键 + 文本输入 + 保存（无 AI）
3. **Phase 3**: LLM 调用封装 + 实体提取 + 降级策略
4. **Phase 4**: 看板 + 卡片 + 拖拽 + 详情面板 + 搜索
5. **Phase 5**: 图片粘贴多模态识别 + 批量导入
6. **Phase 6**: 首次启动向导 + 设置页 + 数据导出 + 打磨

详细任务清单见 @docs/DEVELOPMENT_TASKS.md
