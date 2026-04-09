# BizMind Claude 开发套件 — 使用说明

## 文件清单

```
claude-project-kit/
├── CLAUDE.md                        ← 项目根放置，Claude Code 自动加载
├── .claude/
│   ├── settings.json                ← 工具权限预配置
│   └── rules/
│       ├── tauri-rust.md            ← Rust 后端编码规则（仅 .rs 文件触发）
│       └── react-frontend.md        ← React 前端编码规则（仅 .ts/.tsx 触发）
├── docs/
│   ├── SPEC_AI.md                   ← 完整技术规格（功能编号、数据模型、Prompt、测试用例）
│   ├── PRD_Human.md                 ← 产品需求文档（商业决策、用户故事、版本路线图）
│   └── DEVELOPMENT_TASKS.md         ← 6 阶段开发任务清单
└── .claude_gitignore_additions      ← 需追加到 .gitignore 的内容
```

## 你只需要做以下 5 步，剩下的 Claude Code 会自动完成。

### 第一步：安装必要软件（只需一次）
- Node.js 20+（https://nodejs.org）
- Rust（https://rustup.rs）
- pnpm：执行命令 `npm install -g pnpm`
- Claude Code（内部已装好）

### 第二步：解压项目包
把收到的 `bizmind-claude-kit.zip` 解压到某个文件夹，例如 D:\bizmind

### 第三步：打开终端，进入项目目录
执行命令：
    cd D:\bizmind

### 第四步：让 Claude Code 初始化项目
执行命令：
    claude

等待 CC 启动，它会自动读取 CLAUDE.md，然后询问“是否允许执行命令？”——全部按回车允许。

### 第五步：告诉 CC 开始干活
在 CC 的输入框里输入下面这句话：

    请按照 docs/DEVELOPMENT_TASKS.md 中的 Phase 1 开始实现，完成后告诉我。

然后 CC 就会自动：
1. 创建 Tauri 项目
2. 安装依赖
3. 编写代码
4. 运行测试

每个 Phase 完成后，你再输入：

    Phase 1 已完成并验证，请继续 Phase 2。

一直做到 Phase 6 结束，软件就完成了。

## 常见问题
- Q: CC 卡住或报错怎么办？
  A: 把错误信息复制给 CC，它会尝试修复。如果一直不行，关闭终端重新执行 `claude`，它会接着上次的进度继续。
- Q: 我需要自己写代码吗？
  A: 完全不需要。CC 会写所有代码，你只负责运行命令和按回车。
- Q: 整个开发要多久？
  A: CC 自动写代码约 2-4 小时（取决于网络和 API 速率），期间你可以离开做其他事。
- Q: 如何确认 Rust 已安装？
  A: 在终端输入 `rustc --version`，若显示版本号则正常。

## 设计原理

| 文件 | 为什么这样设计 |
|------|--------------|
| `CLAUDE.md` <100行 | Claude Code 官方建议 <200 行。过长会被忽略。只放"Claude 猜不到的约束" |
| `@docs/SPEC_AI.md` 引用不内联 | 760 行规格文档内联会爆上下文。`@` 引用让 Claude 按需读取 |
| `.claude/rules/` 分文件 | 路径级规则：写 Rust 时不加载前端规则，反之亦然。减少噪音 |
| `DEVELOPMENT_TASKS.md` 分 Phase | 每次只给 Claude 一个 Phase 的任务，避免全量上下文过载 |
| `settings.json` 预授权 | 避免 Claude 每次执行 pnpm/cargo 命令时弹确认框 |
