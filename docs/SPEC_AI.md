<!-- 修改记录 v1.2 (2026-04-08)
1. [截图] 删除"截图按钮"和screenshot.rs，FEAT-003改为仅Ctrl+V粘贴图片触发
2. [引导] 新增FEAT-011首次启动向导，含Onboarding组件和API Key验证流程
3. [批量导入] FEAT-008删除"每5条合并调用"，改为单条串行调用LLM分类
4. [搜索] FEAT-007补充LIKE查询适用范围说明（≤5000条，超过后V1.0升级FTS5）
5. [图片] 第11章新增截图base64>5MB时canvas压缩为JPEG 80%的策略
6. [IPC] 删除take_screenshot命令
7. [目录] 删除screenshot.rs，新增Onboarding.tsx组件
8. [测试] 更新T-005/T-006截图相关用例，新增T-018/T-019引导向导用例
-->

# BizMind Technical Specification — AI Coding Context

> **用途**: 作为 VSCode Copilot / Claude / GPT 编码上下文输入
> **版本**: V1.2 | **日期**: 2026-04-08
> **约束**: 一人开发，仅实现P0功能，所有描述为确定性规格

---

## 1. 技术栈约束（强制）

| 层级 | 技术 | 版本 | 备注 |
|------|------|------|------|
| 桌面框架 | Tauri 2.x | latest stable | Rust后端 + WebView前端 |
| 前端 | React 18+ | with TypeScript | 严格类型 |
| 样式 | TailwindCSS 3+ | - | 不使用CSS-in-JS |
| 状态管理 | Zustand | latest | 不使用Redux |
| 拖拽 | @dnd-kit/core + @dnd-kit/sortable | latest | 看板卡片拖拽 |
| 数据库 | SQLite | via tauri-plugin-sql | 本地存储 |
| LLM | 云端API | OpenAI兼容格式 | 用户自备Key。文本模型+多模态模型 |
| 构建 | Vite | latest | Tauri默认前端构建 |
| 包管理 | pnpm | latest | 不使用npm/yarn |

**禁止使用**: Electron, Next.js, Prisma, 任何ORM, 任何CSS-in-JS库, 任何后端服务框架, 任何本地OCR引擎(PaddleOCR/Tesseract)

---

## 2. 项目目录结构（强制）

```
bizmind/
├── src-tauri/                    # Rust后端
│   ├── src/
│   │   ├── main.rs              # Tauri入口
│   │   ├── db.rs                # SQLite操作
│   │   ├── hotkey.rs            # 全局快捷键注册
│   │   ├── llm.rs               # LLM API调用封装（含多模态）
│   │   └── commands.rs          # Tauri IPC命令
│   ├── Cargo.toml
│   └── tauri.conf.json
├── src/                          # React前端
│   ├── App.tsx
│   ├── main.tsx
│   ├── components/
│   │   ├── FloatingBall.tsx     # 悬浮球
│   │   ├── InputWindow.tsx      # 悬浮输入窗
│   │   ├── BatchImport.tsx      # 聊天记录批量导入模式
│   │   ├── Onboarding.tsx       # 首次启动向导
│   │   ├── KanbanBoard.tsx      # 看板主体
│   │   ├── KanbanColumn.tsx     # 看板列
│   │   ├── KanbanCard.tsx       # 看板卡片
│   │   ├── DetailPanel.tsx      # 右侧详情面板
│   │   ├── SearchBar.tsx        # 搜索栏
│   │   └── Settings.tsx         # 设置页
│   ├── stores/
│   │   ├── messageStore.ts      # 信息条目状态
│   │   ├── uiStore.ts           # UI状态（窗口展开/收起等）
│   │   └── configStore.ts       # 用户配置
│   ├── hooks/
│   │   ├── useHotkey.ts         # 快捷键hook
│   │   └── useLLM.ts            # LLM调用hook
│   ├── services/
│   │   ├── db.ts                # 前端数据库操作封装
│   │   ├── llm.ts               # LLM API调用（文本+多模态）
│   │   └── importer.ts          # 聊天记录AI解析
│   ├── types/
│   │   └── index.ts             # 所有TypeScript类型定义
│   └── utils/
│       ├── format.ts            # 日期/金额格式化
│       ├── image.ts             # 图片压缩（base64超限时canvas压缩）
│       └── constants.ts         # 常量定义
├── package.json
├── tsconfig.json
├── tailwind.config.js
└── vite.config.ts
```

**用户数据目录**（运行时创建）：
```
~/.bizmind/                       # Windows: %APPDATA%/bizmind
├── db/
│   └── bizmind.sqlite            # 主数据库
├── attachments/
│   └── images/                   # 按YYYY-MM/子目录存放截图
├── config/
│   └── settings.json             # 用户配置（含API Key明文）
└── logs/
    └── app.log                   # 应用日志（最近7天轮转）
```

---

## 3. 数据模型（MVP必须字段）

### 3.1 TypeScript类型定义

```typescript
// ===== types/index.ts =====

// FEAT-DB-001: 信息条目
export interface Message {
  id: string;                    // UUID v4
  content_raw: string;           // 原始文本（用户输入或LLM识别结果）
  content_summary: string;       // AI生成摘要，≤50字
  source_channel: SourceChannel;
  category: Category;
  customer_name: string | null;  // AI提取的客户名（非外键，MVP不建Customer表）
  project_name: string | null;   // AI提取的项目名（非外键，MVP不建Project表）
  amount: number | null;         // AI提取的金额，单位：元
  extracted_date: string | null; // AI提取的日期，ISO 8601格式
  is_urgent: boolean;
  status: MessageStatus;
  attachment_path: string | null;// 本地文件路径（截图/拖入文件）
  ai_confidence: number;         // 0-1，AI分类置信度。0=AI未处理
  user_corrected: boolean;       // 用户是否修正过
  created_at: string;            // ISO 8601
  updated_at: string;            // ISO 8601
}

export type SourceChannel = 'wechat' | 'qq' | 'email' | 'telegram' | 'other';
export type Category = 'lead' | 'maintain' | 'progress' | 'finance' | 'todo' | 'misc';
export type MessageStatus = 'unprocessed' | 'processed' | 'archived';

// FEAT-DB-002: 应用配置
export interface AppConfig {
  llm_provider: 'deepseek' | 'qwen' | 'openai' | 'custom';
  llm_api_key: string;           // 明文存储在settings.json
  llm_base_url: string;          // API端点URL
  llm_model: string;             // 文本模型名，如 "deepseek-chat"
  llm_vision_model: string;      // 多模态模型名，如 "qwen-vl-plus"（为空则不支持截图识别）
  llm_daily_token_limit: number; // 每日Token限额，默认100000
  llm_tokens_used_today: number; // 今日已用Token
  hotkey: string;                // 默认 "Ctrl+Shift+A"
  theme: 'light' | 'dark' | 'system';
  onboarding_completed: boolean; // 首次启动向导是否已完成
}

// FEAT-DB-003: LLM调用结果（AI返回的结构化数据）
export interface LLMExtractionResult {
  summary: string;
  category: Category;
  customer_name: string | null;
  project_name: string | null;
  amount: number | null;
  extracted_date: string | null;
  todo_items: string[];
  confidence: number;
}

// FEAT-DB-004: 聊天记录解析结果
export interface ChatMessageParsed {
  timestamp: string | null;      // ISO日期时间或原始字符串
  sender: string | null;
  content: string;
}

// LLM Provider预设配置
export interface LLMProviderPreset {
  name: string;
  base_url: string;
  default_model: string;
  default_vision_model: string;  // 为空字符串表示不支持多模态
  supports_vision: boolean;
}
```

### 3.2 SQL DDL

```sql
-- FEAT-DB-001: 信息条目表
CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  content_raw TEXT NOT NULL,
  content_summary TEXT NOT NULL DEFAULT '',
  source_channel TEXT NOT NULL CHECK(source_channel IN ('wechat','qq','email','telegram','other')),
  category TEXT NOT NULL DEFAULT 'misc' CHECK(category IN ('lead','maintain','progress','finance','todo','misc')),
  customer_name TEXT,
  project_name TEXT,
  amount REAL,
  extracted_date TEXT,
  is_urgent INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'unprocessed' CHECK(status IN ('unprocessed','processed','archived')),
  attachment_path TEXT,
  ai_confidence REAL NOT NULL DEFAULT 0,
  user_corrected INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- 常用查询索引
CREATE INDEX IF NOT EXISTS idx_messages_category ON messages(category);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_customer ON messages(customer_name);
CREATE INDEX IF NOT EXISTS idx_messages_status ON messages(status);

-- FEAT-DB-002: 配置表
CREATE TABLE IF NOT EXISTS app_config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
```

### 3.3 MVP数据模型简化决策

| 原PRD实体 | MVP决策 | 原因 |
|-----------|---------|------|
| Customer表 | **不建表**，customer_name作为Message字段 | 避免关联查询复杂度。V1.0再抽离 |
| Project表 | **不建表**，project_name作为Message字段 | 同上 |
| Task表 | **不建表** | 待办作为todo_items在LLM返回中，MVP仅展示不管理 |
| FTS5虚拟表 | **不建** | MVP用LIKE查询结构化字段，V1.0再引入FTS5 |

---

## 4. LLM API调用规格

### 4.1 API调用封装 (FEAT-LLM-001)

```typescript
// services/llm.ts

// 文本补全调用（实体提取、分类）
interface LLMTextCallOptions {
  systemPrompt: string;
  userMessage: string;
  maxTokens: number;
  temperature: number;
}

// 多模态调用（截图识别）
interface LLMVisionCallOptions {
  systemPrompt: string;
  imageBase64: string;       // base64编码的图片（若>5MB需先压缩，见11.4）
  imageMediaType: string;    // "image/png" | "image/jpeg"
  maxTokens: number;
  temperature: number;
}

interface LLMResponse {
  content: string;
  usage: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
}
```

**调用规则**：
- 所有LLM调用使用OpenAI兼容的 `/v1/chat/completions` 端点
- 文本调用超时：**8秒**
- 多模态调用超时：**15秒**（图片处理较慢）
- 失败重试：**不重试**。失败后立即降级（见4.6）
- 每次调用前检查 `llm_tokens_used_today < llm_daily_token_limit`，超限则跳过AI处理

### 4.2 LLM Provider预设 (FEAT-LLM-002)

| Provider | base_url | 默认文本模型 | 默认多模态模型 | 支持图片 | 预估成本(每条) |
|----------|----------|-------------|---------------|---------|---------------|
| 阿里云Qwen | `https://dashscope.aliyuncs.com/compatible-mode` | `qwen-plus` | `qwen-vl-plus` | 是 | ~¥0.003 |
| DeepSeek | `https://api.deepseek.com` | `deepseek-chat` | _(无)_ | 否 | ~¥0.002 |
| OpenAI | `https://api.openai.com` | `gpt-4o-mini` | `gpt-4o-mini` | 是 | ~¥0.005 |
| 自定义 | 用户自填 | 用户自填 | 用户自填 | 用户自选 | - |

**设置页Provider选择时显示标注**：
- 阿里云Qwen：`支持截图识别`
- DeepSeek：`仅文本，不支持截图识别`
- OpenAI：`支持截图识别`
- 自定义：`请确认模型是否支持图片输入`

### 4.3 实体提取Prompt模板 (FEAT-LLM-003)

```
System Prompt:
---
你是一个信息分类助手。用户会给你一段从聊天软件/邮件中复制的文本，你需要提取结构化信息。

严格按以下JSON格式返回，不要返回任何其他内容：

{
  "summary": "≤50字的中文摘要",
  "category": "lead|maintain|progress|finance|todo|misc",
  "customer_name": "客户名或公司名，没有则null",
  "project_name": "项目名称，没有则null",
  "amount": 金额数字(元)，"3万"=30000，没有则null,
  "extracted_date": "ISO日期如2026-04-08，相对日期基于今天{TODAY}计算，没有则null",
  "todo_items": ["待办事项1", "待办事项2"],
  "confidence": 0.0到1.0的置信度
}

分类规则：
- lead: 新客户询价、首次接触、潜在商机
- maintain: 老客户沟通、售后、回访
- progress: 项目节点、交付、里程碑、进度更新
- finance: 报价、发票、转账、付款、对账
- todo: 明确的行动项、任务、截止日期
- misc: 无法归入以上类别
---

User Message:
---
来源渠道: {source_channel}
内容:
{content_raw}
---
```

**Prompt变量替换规则**：
- `{TODAY}` → 当前日期ISO格式（如 `2026-04-08`）
- `{source_channel}` → 用户选择的来源
- `{content_raw}` → 用户输入文本
- 预估每次调用：prompt ~400 tokens + completion ~200 tokens = **~600 tokens**

### 4.4 截图OCR Prompt模板 (FEAT-LLM-004)

使用多模态LLM的 `/v1/chat/completions` 端点，在messages中传入图片：

```json
{
  "model": "{llm_vision_model}",
  "messages": [
    {
      "role": "system",
      "content": "你是一个OCR助手。从用户提供的图片中提取所有可见的中文和英文文字，按从上到下、从左到右的阅读顺序输出为纯文本。保留原始换行。不要添加任何解释或总结。如果图片模糊或无法识别任何文字，只输出\"[无法识别]\"。"
    },
    {
      "role": "user",
      "content": [
        {
          "type": "image_url",
          "image_url": {
            "url": "data:{imageMediaType};base64,{imageBase64}"
          }
        }
      ]
    }
  ],
  "max_tokens": 2000,
  "temperature": 0.1
}
```

**处理流程**：
1. 用户Ctrl+V粘贴图片到输入窗 → 前端检测到图片内容
2. 图片保存到本地 `~/.bizmind/attachments/images/YYYY-MM/{uuid}.png`
3. 图片转base64（若>5MB先压缩，见11.4）
4. 调用多模态LLM获取文字
5. 将LLM返回的文字作为 `content_raw`
6. 再调用FEAT-LLM-003的实体提取Prompt进行分类
7. 总共2次LLM调用：OCR + 分类

**预估每次截图调用**：OCR ~1000 tokens + 分类 ~600 tokens = **~1600 tokens**

### 4.5 聊天记录解析Prompt模板 (FEAT-LLM-005)

```
System Prompt:
---
你是一个聊天记录解析器。用户会给你一段从微信/QQ等聊天软件复制的聊天记录文本。

请将其解析为JSON数组，每条消息包含：
- timestamp: ISO日期时间格式(如"2026-04-08T14:30:00")，如果只有时间没有日期则日期部分用null，完全无法识别则为null
- sender: 发送者名称，无法识别则为null
- content: 消息正文内容

只返回JSON数组，不要其他任何文字。示例：
[
  {"timestamp": "2026-04-08T09:15:00", "sender": "张总", "content": "报价单发我一下"},
  {"timestamp": "2026-04-08T09:16:00", "sender": "我", "content": "好的，马上发您"}
]

如果文本不像聊天记录，返回单条：[{"timestamp": null, "sender": null, "content": "原始文本"}]
---

User Message:
---
{pasted_chat_text}
---
```

**批量导入流程**：
1. 用户粘贴大段聊天文本到悬浮窗
2. 用户点击"批量导入"按钮
3. 调用FEAT-LLM-005解析为消息数组
4. 对解析出的每条消息，**单独串行调用** FEAT-LLM-003 进行实体提取（不合并、不并发）
5. 每条处理完毕后立即插入messages表
6. UI显示进度："正在处理第 12/35 条消息..."
7. 全部完成后显示结果摘要

**限制**：单次粘贴文本≤20000字符。超出提示截断或分批。

**成本说明**：单条串行调用虽然比合并调用消耗更多Token，但绝对成本很低（1000条消息约¥1），且避免了合并调用的上下文混淆问题，代码实现也更简单。

### 4.6 降级策略 (FEAT-LLM-006)

| 触发条件 | 降级行为 |
|----------|----------|
| 文本API调用超时(>8s) | 保存原始文本，category='misc'，ai_confidence=0，status='unprocessed' |
| 文本API返回非200 | 同上 |
| API Key未配置 | 同上。触发首次启动向导（若未完成）或设置页显示红色提示 |
| 返回JSON解析失败 | 同上 |
| 每日Token超限 | 同上。悬浮窗显示黄色提示"今日AI额度已用完" |
| 截图识别：vision_model为空 | 弹窗提示"当前模型不支持截图识别，请手动输入文字或切换支持多模态的模型（如阿里云Qwen）" |
| 截图识别：多模态调用超时(>15s) | 保存截图到本地，content_raw设为空，提示用户手动补充文字 |
| 截图识别：返回"[无法识别]" | 保存截图到本地，content_raw设为空，提示用户手动补充文字 |
| 批量导入：解析失败 | 将整段文本作为单条Message保存，category='misc' |
| 批量导入：单条分类失败 | 该条保存原始文本，category='misc'，ai_confidence=0，继续处理下一条 |

**所有降级保存的信息标记为 `status='unprocessed'`，用户可在看板中手动触发重新AI处理。**

---

## 5. 悬浮球状态机 (FEAT-UI-001)

### 5.1 状态定义

```typescript
type FloatingBallState =
  | 'idle'          // 收起状态，显示小圆球
  | 'expanded'      // 输入窗展开，等待用户输入
  | 'processing'    // AI处理中，显示加载动画
  | 'success'       // 归档成功，闪绿色0.5s后回到idle
  | 'error';        // 归档失败，闪红色+错误文案，2s后回到idle
```

### 5.2 状态转换

```
idle ──[Ctrl+Shift+A / 点击悬浮球]──> expanded

expanded ──[点击"归档"]──────────────> processing
expanded ──[Ctrl+V粘贴图片]──────────> (图片显示在输入窗预览区，状态不变，归档时触发多模态识别)
expanded ──[点击"批量导入"]──────────> (切换为BatchImport组件，状态不变)
expanded ──[Esc / 点击外部]──────────> idle
expanded ──[拖入文件]────────────────> processing (保存文件引用)

processing ──[AI成功返回]────────────> success
processing ──[AI失败/超时]───────────> error (降级保存后显示)

success ──[0.5s后自动]───────────────> idle
error ──[2s后自动]───────────────────> idle
```

### 5.3 BatchImport子状态（在expanded内）

```
input ──[用户点击"开始解析"]──> parsing (调用LLM解析聊天记录)
parsing ──[解析完成]──────────> classifying (逐条串行调用LLM分类，显示进度)
classifying ──[全部完成]──────> done (显示"已导入N条消息"，2s后关闭)
classifying ──[部分失败]──────> done (显示"已导入N条，M条失败")
parsing ──[解析失败]──────────> error (显示错误，用户可重试)
```

---

## 6. 核心功能规格

### FEAT-001: 全局快捷键

| 属性 | 规格 |
|------|------|
| 默认快捷键 | `Ctrl+Shift+A` (Windows), `Cmd+Shift+A` (Mac) |
| 实现方式 | Tauri `global_shortcut` plugin |
| 行为 | 若状态idle则切换到expanded；若expanded则切换到idle |
| 自定义 | 设置页可修改，存储在app_config表 |
| 冲突处理 | 注册失败时提示用户修改快捷键 |

### FEAT-002: 文本归档

| 属性 | 规格 |
|------|------|
| 输入 | 用户在InputWindow文本区手动粘贴的文本 |
| 最大长度 | 10000字符。超过截断并提示 |
| 来源选择 | 用户手动选Tab：wechat/qq/email/other。默认other |
| 紧急标记 | 点击"归档并标记紧急"设is_urgent=true |
| AI处理 | 调用FEAT-LLM-003的prompt，解析返回JSON填入Message字段 |
| 存储 | 插入messages表 |

### FEAT-003: 截图粘贴识别归档（多模态LLM）

| 属性 | 规格 |
|------|------|
| 触发 | 用户在InputWindow中按Ctrl+V粘贴图片，或拖拽图片文件到输入窗 |
| 检测方式 | 前端监听paste事件，检查clipboardData中是否包含image类型 |
| 图片预览 | 粘贴后在输入区显示图片缩略图（最大宽度350px） |
| 图片保存 | 保存到 `~/.bizmind/attachments/images/YYYY-MM/{uuid}.png` |
| 图片压缩 | base64编码后若>5MB，使用canvas压缩为JPEG质量80%再传输（见11.4） |
| 识别方式 | 将图片base64编码，调用FEAT-LLM-004的多模态Prompt |
| 不支持多模态时 | 弹窗提示"当前模型不支持截图识别"，给出两个选项：[手动输入文字] [去设置页切换模型] |
| 识别后处理 | LLM返回的文字作为content_raw，再调用FEAT-LLM-003分类 |
| attachment_path | 设为截图本地路径 |
| 超时 | 多模态调用15秒。超时降级保存截图，提示手动输入 |

### FEAT-005: 看板视图

| 属性 | 规格 |
|------|------|
| 列定义 | 6列固定：lead, maintain, progress, finance, todo, misc |
| 列标题 | 客户线索, 客户维护, 项目进度, 财务单据, 待办事项, 备忘杂项 |
| 列内排序 | 按created_at DESC（最新在上） |
| 分页 | 每列初始加载20条，滚动加载更多（每次+20） |
| 卡片内容 | 来源图标 + 相对时间 + content_summary + 标签(customer_name/project_name/amount) + 状态点 |
| 状态点颜色 | 绿=processed, 黄=unprocessed, 红=is_urgent |
| 拖拽 | 使用@dnd-kit，拖拽卡片到其他列时更新category字段，设user_corrected=true |
| 点击卡片 | 右侧滑出DetailPanel |

### FEAT-006: 详情面板

| 属性 | 规格 |
|------|------|
| 宽度 | 400px，从右侧滑入，动画200ms |
| 内容展示 | content_raw完整文本；附件图片缩略图(可点击放大) |
| 可编辑字段 | category(下拉), customer_name(文本), project_name(文本), amount(数字), is_urgent(开关) |
| 保存 | 字段修改后自动保存(debounce 500ms)，设user_corrected=true |
| 操作按钮 | [删除](确认弹窗) / [重新AI处理](重新调用LLM) |
| 关闭 | 点击面板外区域或按Esc |

### FEAT-007: 搜索

| 属性 | 规格 |
|------|------|
| 输入 | 顶部SearchBar，debounce 300ms后触发搜索 |
| 搜索策略 | **结构化字段优先**。执行以下SQL查询（OR组合）： |
| 搜索字段优先级 | 1. `customer_name LIKE '%{q}%'` 2. `project_name LIKE '%{q}%'` 3. `content_summary LIKE '%{q}%'` 4. `category = '{q}'`（精确匹配分类值） 5. `content_raw LIKE '%{q}%'`（备选，最后匹配） |
| 排序 | 匹配结构化字段的结果排在前面，content_raw匹配排在后面。同优先级按created_at DESC |
| 结果展示 | 替换看板为搜索结果列表（单列），卡片样式同看板 |
| 空搜索 | 回到正常看板视图 |
| 性能 | 数据量≤5000条时LIKE查询可满足≤500ms |

**搜索SQL示例**：
```sql
SELECT *,
  CASE
    WHEN customer_name LIKE '%张总%' THEN 1
    WHEN project_name LIKE '%张总%' THEN 2
    WHEN content_summary LIKE '%张总%' THEN 3
    WHEN content_raw LIKE '%张总%' THEN 4
    ELSE 5
  END AS match_priority
FROM messages
WHERE customer_name LIKE '%张总%'
   OR project_name LIKE '%张总%'
   OR content_summary LIKE '%张总%'
   OR content_raw LIKE '%张总%'
ORDER BY match_priority ASC, created_at DESC
LIMIT 50;
```

**注：LIKE查询在数据量≤5000条时性能可接受（≤500ms）。若用户数据量增长至1万条以上，V1.0版本将升级为FTS5全文索引。**

### FEAT-008: 聊天记录批量导入

| 属性 | 规格 |
|------|------|
| 入口 | 悬浮窗底部"批量导入"按钮，切换到BatchImport组件 |
| 输入方式 | 用户手动粘贴聊天记录文本到大文本框 |
| 最大长度 | 20000字符。超出提示截断 |
| 解析方式 | 调用FEAT-LLM-005的Prompt，返回ChatMessageParsed数组 |
| 分类方式 | 对解析出的每条消息，**单独串行调用** FEAT-LLM-003 进行实体提取。使用队列顺序处理，不并发 |
| 来源 | 统一设为用户选择的source_channel |
| 进度UI | 显示进度条："正在处理第 12/35 条消息..." |
| 完成UI | "已成功导入28条消息，3条处理失败" + [查看看板] 按钮 |
| 失败处理 | 单条分类失败时：该条保存原始文本，category='misc'，ai_confidence=0，继续处理下一条。解析阶段整体失败时：将整段文本作为单条Message保存 |

### FEAT-009: 文件拖拽保存

| 属性 | 规格 |
|------|------|
| 支持格式 | 任意文件 |
| 处理方式 | 仅复制文件到attachments目录 + 创建Message记录 |
| content_raw | `"[文件] {原始文件名}"` |
| AI处理 | **不做**。category默认'misc'，ai_confidence=0 |
| attachment_path | `~/.bizmind/attachments/files/{uuid}_{原始文件名}` |

---

## 7. 设置页规格 (FEAT-010)

### 7.1 设置项

| 分组 | 设置项 | 类型 | 默认值 |
|------|--------|------|--------|
| AI模型 | Provider选择 | 下拉: qwen/deepseek/openai/custom | qwen |
| AI模型 | API Key | 密码输入框 | 空 |
| AI模型 | API Base URL | 文本(qwen/deepseek/openai自动填充，custom可编辑) | 按Provider自动设置 |
| AI模型 | 文本模型名称 | 文本(预设自动填充，可编辑) | 按Provider自动设置 |
| AI模型 | 多模态模型名称 | 文本(DeepSeek时为空且禁用) | 按Provider自动设置 |
| AI模型 | 每日Token限额 | 数字输入 | 100000 |
| AI模型 | 今日已用/剩余 | 只读显示 | - |
| 快捷键 | 全局快捷键 | 快捷键录制 | Ctrl+Shift+A |
| 外观 | 主题 | 下拉: light/dark/system | system |
| 数据 | 导出所有数据 | 按钮 → JSON导出 | - |
| 数据 | 数据存储位置 | 只读路径显示 | - |

### 7.2 Provider选择时的UI标注

```
┌──────────────────────────────────────────────────┐
│  AI模型配置                                        │
│                                                    │
│  服务商:  [阿里云Qwen ▾]                            │
│          ✅ 支持截图识别（多模态）                     │
│                                                    │
│  API Key: [••••••••••••••••]                        │
│  ⓘ 你的API Key仅存储在本机，请勿分享配置文件          │
│                                                    │
│  文本模型:     [qwen-plus        ]                  │
│  多模态模型:   [qwen-vl-plus     ]                  │
│  每日Token限额: [100000          ]                  │
│  今日已用: 12,450 / 100,000                         │
└──────────────────────────────────────────────────┘
```

选择DeepSeek时：
```
│  服务商:  [DeepSeek ▾]                              │
│          ⚠️ 不支持截图识别（仅文本）                   │
```

### 7.3 API Key配置引导

当API Key为空时，显示蓝色引导卡片：

```
┌─────────────────────────────────────────────┐
│  📘 如何获取AI模型API Key                     │
│                                              │
│  推荐使用阿里云Qwen（支持截图识别，性价比高）：  │
│  1. 访问 dashscope.console.aliyun.com 注册    │
│  2. 开通"百炼大模型"服务                       │
│  3. 进入API-KEY管理，创建Key                   │
│  4. 复制Key粘贴到上方输入框                     │
│  5. 新用户有免费额度                           │
│                                              │
│  也支持DeepSeek、OpenAI等兼容服务              │
└─────────────────────────────────────────────┘
```

---

## 8. 首次启动向导 (FEAT-011)

### 8.1 触发条件

- `app_config` 表中 `onboarding_completed` 不存在或值为 `false`
- 或 `llm_api_key` 为空

满足任一条件时，应用启动后自动弹出Onboarding组件（全屏模态框，不可绕过）。

### 8.2 向导步骤

```
Step 1: 欢迎页
┌──────────────────────────────────────────────┐
│                                              │
│            🧠 欢迎使用 BizMind               │
│                                              │
│   把碎片信息变成结构化知识的AI助手              │
│                                              │
│   • 快捷键一键归档微信/QQ/邮件信息             │
│   • AI自动识别客户、项目、金额                 │
│   • 看板视图一目了然                          │
│                                              │
│                    [开始配置 →]                │
└──────────────────────────────────────────────┘

Step 2: 选择AI服务商
┌──────────────────────────────────────────────┐
│  选择AI服务商                                  │
│                                              │
│  ● 阿里云Qwen（推荐）                         │
│    支持截图识别，性价比高，新用户有免费额度       │
│                                              │
│  ○ DeepSeek                                  │
│    价格最低，仅支持文本（不支持截图识别）         │
│                                              │
│  ○ OpenAI                                    │
│    支持截图识别，需海外支付方式                  │
│                                              │
│  ○ 自定义（OpenAI兼容API）                     │
│                                              │
│           [← 上一步]    [下一步 →]             │
└──────────────────────────────────────────────┘

Step 3: 配置API Key
┌──────────────────────────────────────────────┐
│  配置API Key                                  │
│                                              │
│  📘 获取步骤：                                │
│  1. 点击下方链接注册/登录                      │
│  2. 创建API Key并复制                         │
│  3. 粘贴到下方输入框                           │
│                                              │
│  [打开注册页面 ↗]                              │
│                                              │
│  API Key: [____________________________]      │
│                                              │
│           [测试连接]                           │
│           ✅ 连接成功！模型响应正常              │
│                                              │
│           [← 上一步]    [下一步 →]             │
└──────────────────────────────────────────────┘

Step 4（可选）: 体验示例
┌──────────────────────────────────────────────┐
│  快速体验                                     │
│                                              │
│  我们准备了几条示例消息，帮你了解BizMind         │
│  的工作方式：                                  │
│                                              │
│  [导入示例数据]    [跳过，直接开始]             │
│                                              │
└──────────────────────────────────────────────┘

Step 5: 完成
┌──────────────────────────────────────────────┐
│                                              │
│           ✅ 配置完成！                        │
│                                              │
│   快捷键 Ctrl+Shift+A 随时唤出归档窗口         │
│                                              │
│                  [进入 BizMind]               │
└──────────────────────────────────────────────┘
```

### 8.3 测试连接实现

点击"测试连接"按钮时：
1. 使用用户填入的API Key和选择的Provider配置
2. 调用 `/v1/chat/completions`，发送简单请求：`{"messages":[{"role":"user","content":"hi"}],"max_tokens":5}`
3. 超时5秒
4. 成功(HTTP 200)：显示绿色 "✅ 连接成功！模型响应正常"
5. 失败(401)：显示红色 "❌ API Key无效，请检查后重试"
6. 失败(其他)：显示红色 "❌ 连接失败：{错误信息}"

### 8.4 完成后行为

- 将所有配置写入 `app_config` 表
- 设置 `onboarding_completed = true`
- 关闭模态框，显示主界面（看板）
- 若用户选择"导入示例数据"，插入3-5条预设Message记录到messages表

### 8.5 示例数据（预设）

```typescript
const SAMPLE_MESSAGES: Partial<Message>[] = [
  {
    content_raw: "张总说新项目预算大概在5万左右，下周三前需要给报价单",
    content_summary: "张总新项目预算5万，下周三前给报价",
    source_channel: 'wechat',
    category: 'lead',
    customer_name: '张总',
    amount: 50000,
    ai_confidence: 0.95,
    status: 'processed',
  },
  {
    content_raw: "李经理反馈上批货有两箱包装破损，要求补发",
    content_summary: "李经理反馈包装破损，要求补发",
    source_channel: 'wechat',
    category: 'maintain',
    customer_name: '李经理',
    ai_confidence: 0.90,
    status: 'processed',
  },
  {
    content_raw: "王总的网站改版项目，设计稿已确认，本周五开始前端开发",
    content_summary: "王总网站改版设计稿确认，周五启动前端",
    source_channel: 'email',
    category: 'progress',
    customer_name: '王总',
    project_name: '网站改版',
    ai_confidence: 0.92,
    status: 'processed',
  },
];
```

---

## 9. 验收测试用例

| ID | 场景 | 前置条件 | 操作 | 预期结果 | 验收标准 |
|----|------|----------|------|----------|----------|
| T-001 | 快捷键呼出 | 应用运行中，悬浮球idle | 按Ctrl+Shift+A | 悬浮输入窗弹出 | ≤500ms |
| T-002 | 快捷键关闭 | 输入窗expanded | 按Esc | 输入窗关闭，回到idle | 立即 |
| T-003 | 文本归档 | 已配置API Key | 粘贴"张总说报价3万"，点击归档 | AI返回：customer_name="张总"，amount=30000，category="finance" | ≤5s |
| T-004 | AI降级-无Key | API Key未配置 | 粘贴文本，点击归档 | 保存原始文本，category=misc，ai_confidence=0 | 立即保存 |
| T-005 | 图片粘贴识别 | 已配置Qwen(支持vision) | 系统截图后在输入窗Ctrl+V粘贴 | 显示缩略图→归档→LLM识别文字→分类 | ≤15s |
| T-006 | 图片粘贴降级-纯文本模型 | 已配置DeepSeek(无vision) | 在输入窗Ctrl+V粘贴图片 | 弹窗提示"当前模型不支持截图识别" | 立即 |
| T-007 | 大图片压缩 | 已配置Qwen，准备>5MB截图 | Ctrl+V粘贴大尺寸截图 | 自动压缩为JPEG 80%后传输，识别正常 | ≤15s |
| T-008 | 看板展示 | 已有10条归档信息 | 打开看板 | 信息按category分列显示 | ≤1s |
| T-009 | 卡片拖拽 | 看板中有卡片 | 将lead列卡片拖到maintain列 | category更新，user_corrected=true | 即时 |
| T-010 | 搜索-结构化字段 | 已有customer_name="张总"的信息 | 搜索框输入"张总" | 匹配customer_name的结果排在最前 | ≤500ms |
| T-011 | 搜索-原始文本 | 已有content_raw含"报价"的信息 | 搜索框输入"报价" | 显示匹配结果（排在结构化匹配之后） | ≤500ms |
| T-012 | 批量导入 | 已配置API Key | 粘贴20条微信聊天记录，点击批量导入 | 解析出消息列表，逐条串行处理显示"正在处理第N/20条"，全部归档 | 每条≤5s |
| T-013 | 批量导入-部分失败 | 已配置API Key | 粘贴含混乱格式的聊天记录 | 成功的条目正常归档，失败的保存为misc，显示"N条成功，M条失败" | 不中断 |
| T-014 | 文件拖拽 | 输入窗展开 | 拖入Excel文件 | 文件复制到attachments，创建Message记录 | 立即 |
| T-015 | Token限额 | 今日Token已用完 | 归档新信息 | 提示"今日AI额度已用完"，降级保存 | 无AI调用 |
| T-016 | 设置保存 | 设置页打开 | 修改快捷键为Ctrl+Shift+B | 新快捷键立即生效 | 即时 |
| T-017 | Provider切换 | 设置页打开 | 从Qwen切换到DeepSeek | base_url/model自动更新，vision_model清空 | 即时 |
| T-018 | 首次启动向导 | 首次运行，无任何配置 | 启动应用 | 自动弹出Onboarding向导 | 立即 |
| T-019 | 向导-测试连接 | 向导Step 3，已填入有效Key | 点击"测试连接" | 显示"连接成功" | ≤5s |
| T-020 | 向导-完成后不再显示 | 已完成向导 | 重启应用 | 直接进入主界面，不弹向导 | 立即 |

---

## 10. 忽略/延迟的功能清单（明确不做）

### MVP明确不做

| 功能 | 状态 | 原因 |
|------|------|------|
| 本地OCR引擎(PaddleOCR/Tesseract) | **永久不做** | 用多模态LLM替代 |
| 后台剪贴板监听 | **永久不做** | 侵入性强，用手动操作替代 |
| 截图自动提示条(ClipboardToast) | **永久不做** | 依赖剪贴板监听，已取消 |
| 悬浮窗内截图按钮 | **永久不做** | 用户自行系统截图后Ctrl+V粘贴 |
| 系统截图工具调用(screenshot.rs) | **永久不做** | 跨平台复杂，用户已熟悉系统截图 |
| API Key加密存储 | **永久不做** | 明文+本地提示即可 |
| 批量导入合并LLM调用 | **永久不做** | 合并调用引发上下文混淆，单条串行更简单准确 |
| FTS5全文索引 | **移至V1.0** | MVP用LIKE查询已够用 |
| 中文分词优化 | **移至V1.0+** | 结构化字段优先搜索 |
| Excel审阅助手 | **移至V2.0** | 与核心归档无关 |
| 自然语言查询(RAG) | **移至V1.5** | 需要向量数据库 |
| 智能提醒与待办管理 | **移至V1.0** | 系统通知复杂 |
| 语音备忘 | **永久砍掉** | 桌面端场景不自然 |
| 多设备同步 | **移至V1.5** | 需要云端服务 |
| 团队协作 | **移至V2.0** | 目标用户是1人老板 |
| 集成扩展 | **移至V2.0** | 每个集成独立工程量 |
| 数据洞察报表 | **移至V2.0** | 锦上添花 |
| 时间线视图 | **移至V1.0+** | 看板已满足MVP |
| 表格视图 | **移至V1.0+** | 同上 |
| Customer独立表 | **移至V1.0** | MVP用字符串字段代替 |
| Project独立表 | **移至V1.0** | 同上 |
| Task独立表 | **移至V1.0** | MVP不做待办管理 |
| 文件内容解析 | **降级** | 仅保存文件路径 |
| Mac支持 | **移至V1.0** | MVP先做Windows |
| 微信TXT文件正则解析 | **永久不做** | 用AI解析替代 |

---

## 11. Tauri IPC命令清单

```rust
// src-tauri/src/commands.rs

#[tauri::command] fn save_message(message: Message) -> Result<(), String>
#[tauri::command] fn get_messages(category: Option<String>, limit: u32, offset: u32) -> Result<Vec<Message>, String>
#[tauri::command] fn update_message(id: String, updates: MessageUpdate) -> Result<(), String>
#[tauri::command] fn delete_message(id: String) -> Result<(), String>
#[tauri::command] fn search_messages(query: String, limit: u32) -> Result<Vec<Message>, String>
#[tauri::command] fn call_llm_text(system_prompt: String, user_message: String) -> Result<LLMResponse, String>
#[tauri::command] fn call_llm_vision(system_prompt: String, image_base64: String, media_type: String) -> Result<LLMResponse, String>
#[tauri::command] fn get_config(key: String) -> Result<String, String>
#[tauri::command] fn set_config(key: String, value: String) -> Result<(), String>
#[tauri::command] fn save_attachment(source_path: String) -> Result<String, String>  // 返回保存路径
#[tauri::command] fn save_image_from_base64(base64: String) -> Result<String, String>  // 保存粘贴的图片，返回路径
#[tauri::command] fn get_token_usage_today() -> Result<u64, String>
#[tauri::command] fn export_all_data() -> Result<String, String>  // 返回导出文件路径
#[tauri::command] fn test_llm_connection(base_url: String, api_key: String, model: String) -> Result<bool, String>  // 向导测试连接
```

---

## 12. 关键实现注意事项

### 12.1 错误处理原则

- 所有Tauri命令返回 `Result<T, String>`
- 前端使用try-catch包裹所有invoke调用
- 数据库操作失败：弹toast提示，不崩溃
- LLM调用失败：静默降级，保存原始数据
- 截图识别失败：保存原图，提示用户手动输入
- 文件操作失败：弹toast提示，不影响其他功能

### 12.2 安全约束

| 约束 | 实现 |
|------|------|
| API Key存储 | 明文存储在 `~/.bizmind/config/settings.json`。设置页和向导中提示"你的API Key仅存储在本机，请勿分享此文件" |
| 截图不上传 | 所有图片文件仅存在本地。多模态LLM调用通过base64传输，不存储在服务器 |
| 数据导出 | 提供JSON格式全量导出功能 |

### 12.3 Token计费逻辑

```typescript
// 每次LLM调用后执行
async function trackTokenUsage(usage: { total_tokens: number }) {
  const today = new Date().toISOString().slice(0, 10); // "2026-04-08"
  const lastDate = await getConfig('llm_last_usage_date');

  if (lastDate !== today) {
    // 新的一天，重置计数
    await setConfig('llm_tokens_used_today', '0');
    await setConfig('llm_last_usage_date', today);
  }

  const current = parseInt(await getConfig('llm_tokens_used_today') || '0');
  await setConfig('llm_tokens_used_today', String(current + usage.total_tokens));
}

// 调用前检查
async function checkTokenBudget(): boolean {
  const used = parseInt(await getConfig('llm_tokens_used_today') || '0');
  const limit = parseInt(await getConfig('llm_daily_token_limit') || '100000');
  return used < limit;
}
```

### 12.4 图片粘贴base64压缩策略

用户粘贴的截图可能尺寸很大（如4K屏幕全屏截图），base64编码后可能超过Tauri IPC传输限制或LLM API的请求体限制。

```typescript
// utils/image.ts

const MAX_BASE64_SIZE = 5 * 1024 * 1024; // 5MB

async function compressImageIfNeeded(base64: string, mediaType: string): Promise<{ base64: string; mediaType: string }> {
  const sizeInBytes = (base64.length * 3) / 4;

  if (sizeInBytes <= MAX_BASE64_SIZE) {
    return { base64, mediaType }; // 无需压缩
  }

  // 使用canvas压缩为JPEG 80%
  const img = new Image();
  img.src = `data:${mediaType};base64,${base64}`;
  await img.decode();

  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0);

  const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.8);
  const compressedBase64 = compressedDataUrl.split(',')[1];

  return { base64: compressedBase64, mediaType: 'image/jpeg' };
}
```

**规则**：
- base64编码后大小≤5MB：直接传输，保持原格式(PNG)
- base64编码后大小>5MB：使用canvas压缩为JPEG质量80%后再传输
- 压缩后仍>5MB（极端情况）：按比例缩小分辨率（宽高各减半），再次压缩
