# BizMind 分阶段开发任务清单

> Claude 按 Phase 顺序实现。每个 Phase 结束后必须能 `pnpm tauri dev` 正常运行。
> 功能编号(FEAT-xxx)对应 docs/SPEC_AI.md 中的详细规格。

---

## Phase 0 — 环境验证（人类手动执行，Claude 自动检测）

**目标**: 确保开发环境已安装，避免 Claude 运行时因缺少工具而失败。
0.1 检查 Node.js: node --version (需 ≥20)
0.2 检查 Rust: rustc --version (需已安装)
0.3 检查 pnpm: pnpm --version
0.4 检查 Claude Code: claude --version
0.5 若缺少任何一项，提示用户安装后再继续

**Claude 在 Phase 1 开始前必须执行以下检查**：
- 运行 `node --version`，若失败则提示“请先安装 Node.js 20+”
- 运行 `rustc --version`，若失败则提示“请先安装 Rust (https://rustup.rs)”
- 运行 `pnpm --version`，若失败则提示“请先安装 pnpm (npm install -g pnpm)”

只有全部通过才进入 Phase 1。

---

## Phase 1 — 项目骨架与数据库

**目标**: Tauri 项目初始化，SQLite 建表，用户数据目录创建。

```
1.1  pnpm create tauri-app 初始化（React + TypeScript + Vite 模板）
1.2  安装前端依赖：zustand, @dnd-kit/core, @dnd-kit/sortable
1.3  配置 TailwindCSS
1.4  安装 Tauri 插件：tauri-plugin-sql, tauri-plugin-global-shortcut
1.5  创建 src/types/index.ts — 复制 SPEC_AI.md §3.1 的类型定义
1.6  创建 src-tauri/src/db.rs — init_db() 执行 SPEC_AI.md §3.2 的 DDL
1.7  main.rs 启动时调用 init_db()，创建用户数据目录
```

**验证**: `pnpm tauri dev` 启动，~/.bizmind/db/bizmind.sqlite 生成，表存在。

---

## Phase 2 — 悬浮球 + 文本归档（无 AI）

**目标**: 核心交互循环。快捷键呼出 → 输入 → 保存。不接 LLM。

```
2.1  FloatingBall.tsx — 悬浮球（idle/expanded 切换）  [FEAT-UI-001]
2.2  InputWindow.tsx — 输入窗（来源Tab + 文本区 + 归档按钮）  [FEAT-002]
2.3  src/stores/uiStore.ts — FloatingBallState 状态管理
2.4  全局快捷键 Ctrl+Shift+A（hotkey.rs + useHotkey hook）  [FEAT-001]
2.5  commands.rs: save_message — 生成 UUID，category='misc'，插入 DB
2.6  src/services/db.ts — 封装 invoke 调用
2.7  连通：输入→归档→save→success→0.5s→idle
2.8  Esc 和点击外部关闭
```

**验证**: T-001(快捷键弹出), T-002(Esc关闭), 数据写入SQLite。

---

## Phase 3 — LLM 接入

**目标**: 接入云端 LLM，文本归档时自动分类。

```
3.1  src-tauri/src/llm.rs — call_llm_text() + call_llm_vision()  [FEAT-LLM-001]
3.2  commands.rs: 注册 call_llm_text, call_llm_vision 命令
3.3  src/services/llm.ts — 实体提取函数，构建 SPEC §4.3 的 Prompt
3.4  src/stores/configStore.ts — AppConfig 管理 + Provider 预设(§4.2)
3.5  修改归档流程：归档→processing→LLM→解析→更新字段→保存
3.6  降级策略(§4.6)：失败/超时/无Key→misc+confidence=0
3.7  Token 计费(§12.3)：trackTokenUsage + checkTokenBudget
```

**验证**: T-003(AI分类), T-004(无Key降级), T-015(Token超限)。

---

## Phase 4 — 看板 + 搜索

**目标**: 信息展示层。

```
4.1  commands.rs: get_messages + search_messages + update_message + delete_message
4.2  src/stores/messageStore.ts — 按 category 分组 + 分页
4.3  KanbanBoard.tsx — 6 列布局  [FEAT-005]
4.4  KanbanColumn.tsx — 列标题 + badge + 卡片列表
4.5  KanbanCard.tsx — 来源图标 + 时间 + 摘要 + 标签 + 状态点
4.6  @dnd-kit 拖拽：跨列移动更新 category + user_corrected=true
4.7  DetailPanel.tsx — 右侧滑入详情面板  [FEAT-006]
4.8  SearchBar.tsx — debounce 300ms + LIKE 查询(§FEAT-007)
4.9  App.tsx 主布局组装
```

**验证**: T-008(看板分列), T-009(拖拽), T-010/T-011(搜索优先级)。

---

## Phase 5 — 图片 + 批量导入

**目标**: 截图多模态识别 + 聊天记录批量导入。

```
5.1  InputWindow paste 事件监听（检测 image 类型）  [FEAT-003]
5.2  src/utils/image.ts — base64 > 5MB 压缩(§12.4)
5.3  commands.rs: save_image_from_base64
5.4  截图归档流程：粘贴→保存→压缩→vision LLM(§4.4)→文字→分类(§4.3)→保存
5.5  多模态不可用降级：vision_model 为空→弹窗提示
5.6  BatchImport.tsx — 大文本框 + 开始解析  [FEAT-008]
5.7  src/services/importer.ts — 解析(§4.5) + 逐条串行分类
5.8  进度 UI + 完成摘要
5.9  文件拖拽保存  [FEAT-009]
```

**验证**: T-005(图片识别), T-006(降级), T-007(压缩), T-012/T-013(批量导入)。

---

## Phase 6 — 向导 + 设置 + 收尾

**目标**: 首次启动引导、设置页、打磨体验。

```
6.1  Onboarding.tsx — 5步向导(§8章)  [FEAT-011]
6.2  commands.rs: test_llm_connection（验证 Key 有效性）
6.3  示例数据(§8.5 的 SAMPLE_MESSAGES)
6.4  App.tsx 启动检查 onboarding_completed
6.5  Settings.tsx — 完整设置页  [FEAT-010]
6.6  commands.rs: export_all_data（JSON 导出）
6.7  UI 打磨：toast、loading、闪色反馈、暗色主题
6.8  窗口行为：置顶、点击外部关闭、系统托盘
```

**验证**: T-018/T-019/T-020(向导), T-016/T-017(设置), 全量回归 T-001~T-020。
