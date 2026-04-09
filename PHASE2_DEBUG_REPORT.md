# Phase 2 Debug 与测试总结

**项目**: BizMind v0.1.0 MVP  
**阶段**: Phase 2 — 悬浮球 + 文本归档（无 AI）  
**日期**: 2026-04-09  

## 问题诊断

### 原始错误
```
[plugin:vite:css] [postcss] It looks like you're trying to use `tailwindcss` 
directly as a PostCSS plugin. The PostCSS plugin has moved to a separate 
package, so to continue using Tailwind CSS with PostCSS you'll need to 
install `@tailwindcss/postcss` and update your PostCSS configuration.
```

### 根本原因
1. **PostCSS 配置错误**: `postcss.config.cjs` 仍然使用旧的 `tailwindcss` 包
2. **依赖配置错误**: `package.json` 中 `@types/react` 指向了错误的 npm 别名

## 修复步骤

### 1. 修复 PostCSS 配置

**文件**: `postcss.config.cjs`

**修改前**:
```javascript
module.exports = {
  plugins: [
    require('tailwindcss'),      // ❌ 旧方式
    require('autoprefixer'),
  ],
};
```

**修改后**:
```javascript
module.exports = {
  plugins: [
    require('@tailwindcss/postcss'),  // ✅ TailwindCSS 4.x 新方式
  ],
};
```

**原因**: TailwindCSS 4.x 将 PostCSS 插件独立到 `@tailwindcss/postcss` 包中，`autoprefixer` 已自动集成。

### 2. 修复依赖配置

**文件**: `package.json`

**修改前**:
```json
"@types/react": "npm:@tailwindcss/postcss7-compat",  // ❌ 错误的别名
```

**修改后**:
```json
"@types/react": "^19.1.0",  // ✅ 正确的版本
```

### 3. 重新安装依赖
```bash
rm -r node_modules
pnpm install
```

## 测试验证

### 测试框架设置
- **框架**: Jest 29.7.0 + ts-jest
- **测试文件**: `__tests__/phase2.test.ts`
- **运行命令**: `pnpm test`

### 测试覆盖范围

✅ **T-001: 快捷键弹出** (2/2 通过)
- Ctrl+Shift+A 快捷键触发事件
- 悬浮状态正确转换 (idle ↔ expanded)

✅ **T-002: Esc关闭** (2/2 通过)
- 按 Esc 键关闭输入窗口
- 点击外部关闭输入窗口

✅ **T-003: 文本归档保存** (6/6 通过)
- Message 对象结构完整
- UUID 自动生成
- 默认值正确设置 (category='misc', source_channel='other', status='unprocessed')
- 时间戳自动生成

✅ **T-004: 紧急标记** (1/1 通过)
- is_urgent 标志正确保存

✅ **T-005: 来源频道** (1/1 通过)
- 支持所有频道: wechat, qq, email, telegram, other

✅ **T-006: 内容限制** (2/2 通过)
- 最多 10000 字符支持
- 正确截断超长内容

✅ **T-007: UI 状态** (2/2 通过)
- 正常流: processing → success → idle
- 异常流: error → idle

✅ **T-008: 数据库** (4/4 通过)
- SQLite 数据库创建
- messages 和 app_config 表创建
- 正确的索引创建

✅ **集成测试** (2/2 通过)
- 完整用户流程验证
- 数据持久化验证

### 测试结果统计
```
Test Suites: 1 passed, 1 total
Tests:       22 passed, 22 total
Time:        0.918 s
```

## 应用运行验证

### Vite 开发服务器状态
```
✅ VITE v7.3.2 ready in 789 ms
✅ Local: http://localhost:1420/
✅ Cargo 编译成功 (dev profile)
✅ 应用启动: target\debug\bizmind.exe
✅ 热加载已激活 (HMR)
```

## Phase 2 功能检查清单

| 功能 | 状态 | 验证 |
|------|------|------|
| 快捷键 (Ctrl+Shift+A) | ✅ | T-001 |
| 悬浮球 UI | ✅ | FloatingBall.tsx |
| 输入窗口 | ✅ | InputWindow.tsx |
| Esc/外部点击关闭 | ✅ | T-002 |
| 来源频道选择 | ✅ | T-005 |
| 文本输入（max 10000 字) | ✅ | T-006 |
| 紧急标记 | ✅ | T-004 |
| 保存到数据库 | ✅ | T-003 |
| SQLite 初始化 | ✅ | T-008 |
| UI 状态管理 | ✅ | T-007 |

## 已安装的依赖版本

### 核心依赖
- React 19.2.4
- React DOM 19.2.4
- Zustand 5.0.12
- Tauri 2.10.1

### UI & 样式
- TailwindCSS 4.2.2 (with PostCSS plugin)
- Autoprefixer 10.4.27
- @dnd-kit/core 6.3.1 (用于 Phase 4 拖拽)
- @dnd-kit/sortable 10.0.0

### 构建和类型
- TypeScript 5.8.3
- Vite 7.3.2
- ts-jest 29.4.9

### 数据库
- tauri-plugin-sql 2.4.0
- rusqlite (via Tauri plugin)

### 快捷键
- tauri-plugin-global-shortcut 2.3.1

## 下一步

Phase 2 已完全工作。可以开始 Phase 3:

1. **LLM 接入**: 实现 `src-tauri/src/llm.rs` 和 `src/services/llm.ts`
2. **文本分类**: 接入云端 API (DeepSeek/Qwen/OpenAI)
3. **降级策略**: 处理 API 失败、超时、无 Key 等场景
4. **Token 计费**: 追踪 Token 使用，实现每日限额

详见 `docs/DEVELOPMENT_TASKS.md` Phase 3 部分。

## 故障排除参考

**如果遇到 CSS 编译错误**:
- 确保 `postcss.config.cjs` 使用 `@tailwindcss/postcss`
- 确保已安装 `@tailwindcss/postcss` (不是 `tailwindcss`)

**如果遇到 HMR (Hot Module Reload) 问题**:
- 检查 `vite.config.ts` 配置
- 或在 Vite 配置中设置: `server.hmr.overlay: false`

**如果测试失败**:
- 重新安装依赖: `rm -r node_modules && pnpm install`
- 清理 Jest 缓存: `pnpm jest --clearCache`
- 运行 TypeScript 检查: `pnpm tsc --noEmit`
