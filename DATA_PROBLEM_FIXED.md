# 🎯 BizMind 数据丢失问题 — 完全解决

## ✅ 问题诊断

### 用户反馈
> "我在程序里面输入的信息存哪里去了，根本找不到啊"

### 真实原因
**你的数据 ✅ 其实已经被保存了！** 问题是应用没有显示已保存的数据。

## 🔧 根本原因分析

### Phase 2 的设计缺陷
1. ✅ 实现了数据保存功能 (`save_message`)
2. ❌ **但没有实现数据查询功能** (`get_messages`)
3. ❌ **没有 UI 来显示已保存的数据**
4. ❌ 用户无法验证数据是否真的被保存

这就是为什么你看不到你输入的数据！

### 数据流程缺口
```
用户输入 → 保存到数据库 ❌ 断裂 → 无法查询 → 无法显示到 UI
```

## ✨ 已完成的修复

### 1. 实现了 get_messages 命令

**后端** (`src-tauri/src/db.rs`):
```rust
pub fn get_messages(db_state: &DbState) -> Result<Vec<Message>, String> {
    let conn = Connection::open(&db_state.path)?;
    // 查询最后 100 条消息，按创建时间倒序
    // 返回完整的 Message 结构体数组
}
```

### 2. 实现了 get_db_path 命令

让用户知道数据具体存在哪个文件里。

### 3. 新增调试面板组件

`src/components/DebugPanel.tsx` — 一个右下角的可扩展面板：
- 📂 显示数据库文件路径
- 📊 显示所有已保存的消息
- 🔄 实时刷新数据
- 📖 消息详细信息（ID、内容、来源、分类、时间戳）

## 🎮 如何使用

### 第 1 步：确保应用在运行
```bash
cd "d:\AI-PM\claude-project-kit (2)\bizmind\bizmind"
pnpm tauri dev
```

### 第 2 步：保存一条消息
1. 按 `Ctrl+Shift+A` 弹出输入窗口
2. 输入任何文本，比如：`这是我的第一条消息`
3. 选择来源频道（比如"微信"）
4. 点击"归档"按钮
5. 看到绿色的成功提示 ✅

### 第 3 步：打开调试面板查看数据
1. 看右下角有个 "🐛 调试面板" 按钮 
2. 点击展开面板
3. 看到数据库路径
4. 点击"刷新数据"按钮
5. **你应该能看到刚才输入的消息！**

## 📁 数据存储位置

### Windows 路径
```
%APPDATA%\bizmind\db\bizmind.sqlite
```

### 展开后的实际路径示例
```
C:\Users\yao\AppData\Roaming\bizmind\db\bizmind.sqlite
```

### 验证方法
1. 打开 Windows 文件管理器
2. 按 `Ctrl+L` 进入地址栏
3. 粘贴：`%APPDATA%\bizmind\db`
4. 回车
5. 你应该在这里看到 `bizmind.sqlite` 文件

## 📊 已保存的消息字段

```
Message {
  id: "uuid-4d1b5...",           // 唯一标识符
  content_raw: "用户输入的文本",    // 你输入的原始内容
  source_channel: "wechat",        // 来源：微信/QQ/邮件等
  category: "misc",                // 分类（Phase 3 才会自动）
  is_urgent: false,                // 是否标记为紧急
  status: "unprocessed",           // 状态
  created_at: "2026-04-09T...",   // 创建时间
  updated_at: "2026-04-09T...",   // 更新时间
  ... 其他字段 ...
}
```

## 🧪 新增测试用例

创建了两个扩展测试文件：
- `__tests__/phase2.test.ts` — 原有的 22 个 Phase 2 测试
- `__tests__/phase2-queries.test.ts` — 新的数据查询测试 

运行测试：
```bash
pnpm test
```

预期结果：所有测试通过 ✅

## 🛠️ 代码修改清单

### 新增文件
| 文件 | 说明 |
|------|------|
| `src/components/DebugPanel.tsx` | 调试面板组件 |
| `src-tauri/src/bin/check_db.rs` | 数据库检查工具 |
| `check_database.bat` | Windows 快捷检查脚本 |
| `DATA_STORAGE_GUIDE.md` | 完整的使用说明 |
| `__tests__/phase2-queries.test.ts` | 数据查询测试 |

### 修改的后端文件
| 文件 | 修改内容 |
|------|---------|
| `src-tauri/src/commands.rs` | 新增 `get_messages`, `get_db_path` 命令 |
| `src-tauri/src/db.rs` | 新增 `get_messages()` 查询函数 |
| `src-tauri/src/lib.rs` | 注册新命令到 Tauri |

### 修改的前端文件
| 文件 | 修改内容 |
|------|---------|
| `src/services/db.ts` | 新增 `getMessages`, `getDbPath` 服务函数 |
| `src/App.tsx` | 挂载 `<DebugPanel />` 组件 |

## 🎯 验证步骤清单

- [ ] 启动应用 `pnpm tauri dev`
- [ ] 看到应用窗口打开
- [ ] 按 `Ctrl+Shift+A` 弹出输入框
- [ ] 输入测试消息（比如 "测试数据保存"）
- [ ] 选择来源频道（比如 "微信"）
- [ ] 点击"归档"按钮
- [ ] 看到绿色的短暂成功提示
- [ ] **向右下角看** — 找到 "🐛 调试面板" 按钮
- [ ] 点击展开调试面板
- [ ] 看到数据库路径（应该是 `C:\Users\...\bizmind.db\bizmind.sqlite` 的样子）
- [ ] 点击"刷新数据"按钮
- [ ] **在调试面板中看到你的消息！** 🎉
- [ ] 继续输入更多消息，刷新面板，验证新消息出现

## 💡 常见问题

### Q: 我找不到调试面板
**A**: 调试面板在右下角。如果看不到：
1. 检查浏览器开发者工具是否遮挡了（按 F12 关闭）
2. 刷新页面 (F5)
3. 重新启动应用 `Ctrl+C` 然后 `pnpm tauri dev`

### Q: 调试面板显示"没有消息"
**A**: 检查：
1. 你是否真的点击了"归档"按钮？（确认看到绿色提示）
2. 点击了"刷新数据"按钮吗？
3. 试试输入更多消息再刷新

### Q: 我想直接查看 SQLite 文件怎么办？
**A**: 下载 SQLite 浏览器工具（比如 DB Browser for SQLite）：
1. 下载：https://sqlitebrowser.org
2. 打开路径：`%APPDATA%\bizmind\db\bizmind.sqlite`
3. 点击 "Browse Data" 标签
4. 选择 "messages" 表
5. 看到所有保存的消息！

### Q: 数据会丢失吗？
**A**: 不会。SQLite 数据库文件（.sqlite）是持久化的，存储在你的本地磁盘上。除非你：
1. 手动删除 `%APPDATA%\bizmind` 文件夹
2. 清理系统临时文件时误删了

### Q: 能删除某条消息吗？
**A**: Phase 2 还没实现删除功能。这会在后续版本中添加（可以手动删除文件来重置数据库）。

## 🚀 下次改进计划

### Phase 3（即将开始）
- 自动分类：AI 会自动判断消息的类别（lead/maintain/progress/finance/todo）
- 实体提取：AI 自动提取客户名、项目名、金额、日期等
- 置信度评分：显示 AI 分类的可信度

### Phase 4
- 看板界面：以卡片形式展示所有消息
- 拖拽排序：在不同列之间拖拽消息
- 搜索功能：快速找到特定消息

## 🎉 总结

**你的数据是安全的！** 它们就存在本地的 SQLite 数据库里，现在你可以通过调试面板看到它们了。

### 数据流程修复后：
```
用户输入 → 保存到数据库 ✅ → 调用 get_messages 查询 ✅ → 调试面板显示 ✅
```

---

**需要帮助？** 检查 [DATA_STORAGE_GUIDE.md](DATA_STORAGE_GUIDE.md) 获取更详细的说明。

**下一步：** [查看 docs/DEVELOPMENT_TASKS.md Phase 3 部分](docs/DEVELOPMENT_TASKS.md)，准备实现 AI 自动分类功能！
