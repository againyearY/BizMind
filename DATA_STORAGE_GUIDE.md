# 🚨 BizMind Phase 2 数据保存问题说明与解决方案

## 问题分析

### 用户反馈
> "我在程序里面输入的信息存哪里去了，根本找不到啊"

### 根本原因
**你的数据 ✅ 实际上已经被保存了！** 

问题不是数据没保存，而是：
1. **应用没有显示已保存的数据** —— 原来的 Phase 2 UI 只有存储功能，没有查看功能
2. **没有看板界面** —— Phase 2 没实现 Phase 4 的看板功能
3. **用户无法验证** —— 没有调试工具来确认数据是否保存

## 现已修复的内容

### 1. ✅ 新增数据查询命令

**Rust 后端** (`src-tauri/src/commands.rs`):
```rust
#[tauri::command]
pub async fn get_messages(db_state: State<'_, DbState>) -> Result<Vec<Message>, String> {
    db::get_messages(&db_state)
}

#[tauri::command]
pub async fn get_db_path(db_state: State<'_, DbState>) -> Result<String, String> {
    Ok(db_state.path.to_string_lossy().to_string())
}
```

**数据库函数** (`src-tauri/src/db.rs`):
```rust
pub fn get_messages(db_state: &DbState) -> Result<Vec<Message>, String> {
    // 返回最后 100 条消息，按创建时间倒序
}
```

### 2. ✅ 新增前端服务

**数据库服务** (`src/services/db.ts`):
```typescript
export const getMessages = async (): Promise<Message[]> => {
    const messages = await invoke<Message[]>("get_messages");
    return messages;
};

export const getDbPath = async (): Promise<string> => {
    const path = await invoke<string>("get_db_path");
    return path;
};
```

### 3. ✅ 新增调试面板

**组件** (`src/components/DebugPanel.tsx`):
- 💡 右下角显示调试面板
- 📂 显示数据库路径
- 📊 显示所有已保存的消息
- 🔄 实时刷新数据

**使用方法**:
1. 启动应用: `pnpm tauri dev`
2. 在右下角找到 "🐛 调试面板" 按钮
3. 点击展开
4. 点击 "刷新数据" 按钮
5. 查看所有已保存的消息！

## 数据存储位置

### Windows
```
%APPDATA%\bizmind\db\bizmind.sqlite
```

**展开后的路径示例**:
```
C:\Users\{用户名}\AppData\Roaming\bizmind\db\bizmind.sqlite
```

### 表结构
```sql
CREATE TABLE messages (
  id TEXT PRIMARY KEY,              -- 消息 UUID
  content_raw TEXT NOT NULL,        -- 原始输入内容
  content_summary TEXT,             -- AI 摘要（Phase 3）
  source_channel TEXT,              -- 来源：wechat/qq/email/telegram/other
  category TEXT,                    -- 分类：lead/maintain/progress/finance/todo/misc
  customer_name TEXT,               -- 客户名（AI 提取，Phase 3）
  project_name TEXT,                -- 项目名（AI 提取，Phase 3）
  amount REAL,                      -- 金额（AI 提取，Phase 3）
  extracted_date TEXT,              -- 日期（AI 提取，Phase 3）
  is_urgent INTEGER,                -- 紧急标记：0/1
  status TEXT,                      -- 状态：unprocessed/processed/archived
  attachment_path TEXT,             -- 文件路径（Phase 5）
  ai_confidence REAL,               -- AI 置信度（Phase 3）
  user_corrected INTEGER,           -- 用户是否修正：0/1
  created_at TEXT,                  -- 创建时间（ISO 8601）
  updated_at TEXT                   -- 更新时间（ISO 8601）
);
```

## 如何验证数据已保存

### 方法 1: 使用调试面板（推荐）✅

1. 运行应用: `pnpm tauri dev`
2. 按 `Ctrl+Shift+A` 弹出输入窗口
3. 输入任意文本，比如：`这是一条测试消息`
4. 选择来源频道，比如：`微信`
5. 点击 "归档" 按钮
6. 在右下角看到绿色 "BM" 球（表示成功）
7. **向下看右下角** — 点击 "🐛 调试面板"
8. 点击 "刷新数据"
9. 你应该能看到刚才输入的消息！

### 方法 2: 手动检查数据库文件

**Windows 资源管理器**:
1. 按 `Win+R` 打开运行框
2. 输入: `%APPDATA%\bizmind\db`
3. 进去后应该能看到 `bizmind.sqlite` 文件
4. 记下此文件的修改时间（应该是最近的）

### 方法 3: 使用检查脚本（开发者用）

```bash
cd "d:\AI-PM\claude-project-kit (2)\bizmind\bizmind"
cargo run --bin check_db --manifest-path src-tauri/Cargo.toml
```

**输出示例**:
```
🔍 检查数据库: C:\Users\yao\AppData\Roaming\bizmind\db\bizmind.sqlite
✅ 数据库连接成功
📊 messages 表中有 3 条记录

📋 最近的 5 条记录:
  1. ID: a1b2c3d4
     内容: 这是一条测试消息
     来源: wechat | 分类: misc
     时间: 2026-04-09T14:30:45.123Z
  ...
```

## Phase 2 完整功能检查

| 功能 | 状态 | 说明 |
|------|------|------|
| 快捷键 (Ctrl+Shift+A) | ✅ | 弹出输入窗口 |
| 来源频道选择 | ✅ | wechat/qq/email/telegram/other |
| 文本输入 | ✅ | 最多 10000 字符 |
| 紧急标记 | ✅ | 一键标记为紧急 |
| **数据保存** | ✅ | 新增：已验证保存 |
| **数据查询** | ✅ | **新增：get_messages 命令** |
| **调试面板** | ✅ | **新增：可视化显示数据** |
| 数据库初始化 | ✅ | SQLite 自动建表 |
| Esc/外部关闭 | ✅ | 按 Esc 或点击外部关闭 |

## 常见问题

### Q1: 我没看到调试面板
**A**: 右下角的小按钮。如果还是找不到，可能需要：
1. 重新启动应用: `pnpm tauri dev`
2. 清理浏览器缓存: 刷新页面 (F5)

### Q2: 调试面板说"没有消息"
**A**: 检查：
1. 你已经点击了"归档"按钮吗？（不是"归档并标记紧急"）
2. 点击后有看到绿色的短暂提示吗？
3. 试试在调试面板点击"刷新数据"按钮

### Q3: 我想看原始 SQL 数据怎么办？
**A**: 下载 SQLite 浏览器工具（比如 DB Browser for SQLite），打开：
```
C:\Users\{你的用户名}\AppData\Roaming\bizmind\db\bizmind.sqlite
```

### Q4: 数据可以删除吗？
**A**: 目前 Phase 2 没有删除功能。数据文件位置：
```
%APPDATA%\bizmind\db\bizmind.sqlite
```
直接删除此文件会清除所有数据（下次启动应用会重新创建）。

## 数据流程流程图

```
Ctrl+Shift+A
    ↓
输入窗口弹出
    ↓
用户输入文本 + 选择来源 + 是否紧急
    ↓
点击"归档"
    ↓
前端调用 save_message() 命令
    ↓
Rust 后端生成 UUID + 当前时间戳
    ↓
INSERT INTO messages 表
    ↓
显示绿色成功提示 ✅
    ↓
数据持久化到 SQLite 文件
────────────────────────────
    ↓
调试面板点击"刷新数据"
    ↓
调用 get_messages() 命令
    ↓
Rust 后端查询最后 100 条
    ↓
返回 JSON 数组给前端
    ↓
调试面板显示所有消息 📊
```

## 代码修改总结

### 新增文件
- `src/components/DebugPanel.tsx` — 调试面板组件

### 修改文件
- `src-tauri/src/commands.rs` — 新增 get_messages, get_db_path
- `src-tauri/src/db.rs` — 新增 get_messages() 函数
- `src-tauri/src/lib.rs` — 注册新命令
- `src/services/db.ts` — 新增服务函数
- `src/App.tsx` — 挂载调试面板

### 新增脚本
- `src-tauri/src/bin/check_db.rs` — 数据库检查工具

## 下一步

- [ ] 运行 `pnpm tauri dev`
- [ ] 按 Ctrl+Shift+A，输入测试消息
- [ ] 点击"归档"看成功提示
- [ ] 打开右下角的 "🐛 调试面板"
- [ ] 点击"刷新数据"看你的消息！
- [ ] 继续输入更多消息测试

**你的数据是安全的！它就在数据库里！** ✅

---

如有问题，请检查:
1. 应用启动时有无错误消息
2. 数据库文件是否存在
3. 调试面板中的"数据库路径"是否正确
