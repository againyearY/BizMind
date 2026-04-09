
# BizMind — AI 信息归档桌面应用

BizMind 是为小微企业主/个体经营者打造的本地化 AI 信息归档工具。通过快捷键呼出悬浮窗，粘贴文本或截图，AI 自动分类并归档到可视化看板，极大提升碎片化业务信息的整理效率。

![](public/tauri.svg) <!-- 可替换为实际截图路径 -->

---

## 项目亮点

- **极简操作**：Ctrl+Shift+A 呼出悬浮窗，粘贴内容一键归档
- **AI 智能分类**：自动识别客户、项目、金额、日期等关键信息
- **本地数据存储**：所有数据本地 SQLite 保存，隐私安全
- **多模态支持**：支持文本与截图（图片粘贴自动 OCR）
- **看板视图**：信息自动聚合到可拖拽的看板卡片

---

## 技术栈

- **前端**：React 18+ (TypeScript strict), TailwindCSS 3+, Zustand, @dnd-kit
- **后端**：Tauri 2.x (Rust)，tauri-plugin-sql (SQLite)
- **AI**：云端 LLM API（OpenAI 兼容格式，多模态支持）
- **构建工具**：Vite + pnpm

> 禁止使用 Electron、Next.js、Prisma、ORM、CSS-in-JS、本地 OCR、npm/yarn

---

## 主要功能（MVP 范围）

- 悬浮球 + 快捷键呼出输入窗口
- 文本/图片粘贴，AI 自动分类归档
- 看板视图与卡片拖拽
- 详情面板、搜索、批量导入
- 首次启动引导、设置页、数据导出

详细功能规格与开发阶段见：
- [docs/SPEC_AI.md](../docs/SPEC_AI.md)
- [docs/DEVELOPMENT_TASKS.md](../docs/DEVELOPMENT_TASKS.md)

---

## 快速开始

```bash
pnpm install
pnpm tauri dev          # 开发模式
pnpm tauri build        # 生产构建
pnpm tsc --noEmit       # 类型检查
```

---

## 截图与界面预览

<!-- 保留原有 README 里的截图和说明，如有多张图片可依次插入 -->
![](public/tauri.svg)
![](public/vite.svg)

---

## 推荐开发环境

- [VS Code](https://code.visualstudio.com/) + [Tauri 插件](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode) + [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)

---

## 贡献与联系

欢迎 Issue/PR 反馈建议。更多背景、产品定位与商业决策见 [docs/PRD_Human.md](../docs/PRD_Human.md)。

---

© 2026 againyearY/BizMind. All rights reserved.
