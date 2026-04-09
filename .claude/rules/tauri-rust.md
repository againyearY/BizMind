---
paths:
  - "src-tauri/**/*.rs"
---

# Rust 后端规则（Tauri）

## 架构
- 所有数据库 SQL 集中在 `db.rs`，commands.rs 只做参数转发和调用 db 函数
- 所有 `#[tauri::command]` 返回 `Result<T, String>`
- 错误转换统一用 `.map_err(|e| e.to_string())?`
- LLM HTTP 调用集中在 `llm.rs`，使用 `reqwest` 库

## IPC 命令清单
完整命令签名见 docs/SPEC_AI.md 第 11 章。不要新增规格文档中未列出的命令。

## SQLite
- 建表 DDL 见 docs/SPEC_AI.md §3.2，直接复制使用
- 用户数据目录：`~/.bizmind/`（Windows: `%APPDATA%/bizmind`）
- 启动时调用 `init_db()` 自动建表（IF NOT EXISTS）
- Boolean 字段用 INTEGER (0/1)
- 日期字段用 TEXT (ISO 8601)

## LLM 调用
- 所有调用走 OpenAI 兼容的 `/v1/chat/completions`
- 文本调用超时 8 秒，多模态超时 15 秒
- 不做重试，失败立即返回错误让前端降级处理
- 不在 Rust 端做 JSON 响应解析，原始 content 字符串直接返回给前端
