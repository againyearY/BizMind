// FEAT-DB-001, FEAT-DB-002: 数据库初始化
use rusqlite::types::Value;
use rusqlite::Connection;
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use tauri::AppHandle;
use tauri::Manager;
use uuid::Uuid;

pub struct DbState {
    pub path: PathBuf,
}

pub fn build_db_state(app: &AppHandle) -> Result<DbState, String> {
    let mut dir = app
        .path()
        .app_data_dir()
        .map_err(|e| e.to_string())?;
    dir.push("bizmind/db");
    std::fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    dir.push("bizmind.sqlite");

    Ok(DbState { path: dir })
}

pub fn init_db(db_state: &DbState) -> Result<(), String> {
    let conn = Connection::open(&db_state.path).map_err(|e| e.to_string())?;
    conn.execute_batch(include_str!("./migrations/init.sql"))
        .map_err(|e| e.to_string())?;
    Ok(())
}

// FEAT-DB-001: 信息条目
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Message {
    pub id: String,
    pub content_raw: String,
    pub content_summary: String,
    pub source_channel: String,
    pub category: String,
    pub customer_name: Option<String>,
    pub project_name: Option<String>,
    pub amount: Option<f64>,
    pub extracted_date: Option<String>,
    pub is_urgent: bool,
    pub status: String,
    pub attachment_path: Option<String>,
    pub ai_confidence: f64,
    pub user_corrected: bool,
    pub created_at: String,
    pub updated_at: String,
}

pub async fn save_message(db_state: &DbState, message: Message) -> Result<(), String> {
    let conn = Connection::open(&db_state.path).map_err(|e| e.to_string())?;
    let now = chrono::Utc::now().to_rfc3339();
    let id = if message.id.trim().is_empty() {
        Uuid::new_v4().to_string()
    } else {
        message.id
    };
    let category = if message.category.trim().is_empty() {
        "misc".to_string()
    } else {
        message.category
    };
    let source_channel = if message.source_channel.trim().is_empty() {
        "other".to_string()
    } else {
        message.source_channel
    };
    let status = if message.status.trim().is_empty() {
        "unprocessed".to_string()
    } else {
        message.status
    };
    let created_at = if message.created_at.trim().is_empty() {
        now.clone()
    } else {
        message.created_at
    };

    let sql = r#"
        INSERT INTO messages (
          id, content_raw, content_summary, source_channel, category,
          customer_name, project_name, amount, extracted_date, is_urgent,
          status, attachment_path, ai_confidence, user_corrected, created_at, updated_at
        ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16)
    "#;

    let params = vec![
        Value::Text(id),
        Value::Text(message.content_raw),
        Value::Text(message.content_summary),
        Value::Text(source_channel),
        Value::Text(category),
        option_string_to_value(message.customer_name),
        option_string_to_value(message.project_name),
        option_f64_to_value(message.amount),
        option_string_to_value(message.extracted_date),
        Value::Integer(if message.is_urgent { 1 } else { 0 }),
        Value::Text(status),
        option_string_to_value(message.attachment_path),
        Value::Real(message.ai_confidence),
        Value::Integer(if message.user_corrected { 1 } else { 0 }),
        Value::Text(created_at),
        Value::Text(now),
    ];

    let mut stmt = conn.prepare(sql).map_err(|e| e.to_string())?;
    stmt.execute(rusqlite::params_from_iter(params))
        .map_err(|e| e.to_string())?;
    Ok(())
}

fn option_string_to_value(value: Option<String>) -> Value {
    match value {
        Some(text) => Value::Text(text),
        None => Value::Null,
    }
}

fn option_f64_to_value(value: Option<f64>) -> Value {
    match value {
        Some(amount) => Value::Real(amount),
        None => Value::Null,
    }
}

// FEAT-DB-003: 查询关键消息
pub fn get_messages(db_state: &DbState) -> Result<Vec<Message>, String> {
    let conn = Connection::open(&db_state.path).map_err(|e| e.to_string())?;
    
    let mut stmt = conn
        .prepare(
            "SELECT id, content_raw, content_summary, source_channel, category, 
                    customer_name, project_name, amount, extracted_date, is_urgent, 
                    status, attachment_path, ai_confidence, user_corrected, created_at, updated_at 
             FROM messages ORDER BY created_at DESC LIMIT 100"
        )
        .map_err(|e| e.to_string())?;
    
    let messages = stmt
        .query_map([], |row| {
            Ok(Message {
                id: row.get(0)?,
                content_raw: row.get(1)?,
                content_summary: row.get(2)?,
                source_channel: row.get(3)?,
                category: row.get(4)?,
                customer_name: row.get(5)?,
                project_name: row.get(6)?,
                amount: row.get(7)?,
                extracted_date: row.get(8)?,
                is_urgent: row.get::<_, i32>(9)? != 0,
                status: row.get(10)?,
                attachment_path: row.get(11)?,
                ai_confidence: row.get(12)?,
                user_corrected: row.get::<_, i32>(13)? != 0,
                created_at: row.get(14)?,
                updated_at: row.get(15)?,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;
    
    Ok(messages)
}

// FEAT-LLM-003: Token计费跟踪
pub fn track_token_usage(db_state: &DbState, tokens_used: u32) -> Result<(), String> {
    let conn = Connection::open(&db_state.path).map_err(|e| e.to_string())?;
    let now = chrono::Utc::now().format("%Y-%m-%d").to_string();

    // 获取今日已用Token
    let mut stmt = conn
        .prepare("SELECT value FROM app_config WHERE key = ?1")
        .map_err(|e| e.to_string())?;

    let today_used: u32 = stmt
        .query_row([format!("token_used_today_{}", now)], |row| {
            let val: String = row.get(0)?;
            Ok(val.parse::<u32>().unwrap_or(0))
        })
        .unwrap_or(0);

    let new_total = today_used + tokens_used;

    // 更新Token计数
    let sql_update = "INSERT OR REPLACE INTO app_config (key, value, updated_at) VALUES (?1, ?2, ?3)";
    conn.execute(
        sql_update,
        rusqlite::params![
            format!("token_used_today_{}", now),
            new_total.to_string(),
            chrono::Utc::now().to_rfc3339()
        ],
    )
    .map_err(|e| e.to_string())?;

    Ok(())
}

// FEAT-LLM-003: 检查Token是否超过每日限额
pub fn check_token_budget(db_state: &DbState, limit: u32) -> Result<bool, String> {
    let conn = Connection::open(&db_state.path).map_err(|e| e.to_string())?;
    let now = chrono::Utc::now().format("%Y-%m-%d").to_string();

    let mut stmt = conn
        .prepare("SELECT value FROM app_config WHERE key = ?1")
        .map_err(|e| e.to_string())?;

    let today_used: u32 = stmt
        .query_row([format!("token_used_today_{}", now)], |row| {
            let val: String = row.get(0)?;
            Ok(val.parse::<u32>().unwrap_or(0))
        })
        .unwrap_or(0);

    Ok(today_used < limit)
}

// FEAT-DB-002: 获取LLM配置
pub fn get_llm_config(db_state: &DbState) -> Result<Option<crate::llm::LLMConfig>, String> {
    let conn = Connection::open(&db_state.path).map_err(|e| e.to_string())?;

    let mut stmt = conn
        .prepare("SELECT value FROM app_config WHERE key = ?1")
        .map_err(|e| e.to_string())?;

    let mut config = crate::llm::LLMConfig {
        api_key: String::new(),
        base_url: String::new(),
        model: String::new(),
        vision_model: String::new(),
    };

    let api_key = stmt
        .query_row(["llm_api_key"], |row| row.get::<_, String>(0))
        .ok();

    if api_key.is_none() {
        return Ok(None);
    }

    config.api_key = api_key.unwrap();
    config.base_url = stmt
        .query_row(["llm_base_url"], |row| row.get::<_, String>(0))
        .unwrap_or_else(|_| "https://api.deepseek.com".to_string());
    config.model = stmt
        .query_row(["llm_model"], |row| row.get::<_, String>(0))
        .unwrap_or_else(|_| "deepseek-chat".to_string());
    config.vision_model = stmt
        .query_row(["llm_vision_model"], |row| row.get::<_, String>(0))
        .unwrap_or_else(|_| String::new());

    Ok(Some(config))
}

// FEAT-007: 按分类获取消息（分组且分页）
pub fn get_messages_by_category(
    db_state: &DbState,
    category: &str,
    limit: i32,
    offset: i32,
) -> Result<Vec<Message>, String> {
    let conn = Connection::open(&db_state.path).map_err(|e| e.to_string())?;

    let mut stmt = conn
        .prepare(
            "SELECT id, content_raw, content_summary, source_channel, category, 
                    customer_name, project_name, amount, extracted_date, is_urgent, 
                    status, attachment_path, ai_confidence, user_corrected, created_at, updated_at 
             FROM messages 
             WHERE category = ?1 
             ORDER BY created_at DESC 
             LIMIT ?2 OFFSET ?3",
        )
        .map_err(|e| e.to_string())?;

    let messages = stmt
        .query_map(rusqlite::params![category, limit, offset], |row| {
            Ok(Message {
                id: row.get(0)?,
                content_raw: row.get(1)?,
                content_summary: row.get(2)?,
                source_channel: row.get(3)?,
                category: row.get(4)?,
                customer_name: row.get(5)?,
                project_name: row.get(6)?,
                amount: row.get(7)?,
                extracted_date: row.get(8)?,
                is_urgent: row.get::<_, i32>(9)? != 0,
                status: row.get(10)?,
                attachment_path: row.get(11)?,
                ai_confidence: row.get(12)?,
                user_corrected: row.get::<_, i32>(13)? != 0,
                created_at: row.get(14)?,
                updated_at: row.get(15)?,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    Ok(messages)
}

// FEAT-007: 搜索消息 - 结构化字段优先
pub fn search_messages(db_state: &DbState, query: &str, limit: i32) -> Result<Vec<Message>, String> {
    let conn = Connection::open(&db_state.path).map_err(|e| e.to_string())?;
    let search_pattern = format!("%{}%", query);

    let mut stmt = conn
        .prepare(
            "SELECT id, content_raw, content_summary, source_channel, category, 
                    customer_name, project_name, amount, extracted_date, is_urgent, 
                    status, attachment_path, ai_confidence, user_corrected, created_at, updated_at,
                    CASE
                        WHEN customer_name LIKE ?1 THEN 1
                        WHEN project_name LIKE ?1 THEN 2
                        WHEN content_summary LIKE ?1 THEN 3
                        WHEN content_raw LIKE ?1 THEN 4
                        ELSE 5
                    END AS match_priority
             FROM messages
             WHERE customer_name LIKE ?1
                OR project_name LIKE ?1
                OR content_summary LIKE ?1
                OR content_raw LIKE ?1
             ORDER BY match_priority ASC, created_at DESC
             LIMIT ?2",
        )
        .map_err(|e| e.to_string())?;

    let messages = stmt
        .query_map(rusqlite::params![search_pattern, limit], |row| {
            Ok(Message {
                id: row.get(0)?,
                content_raw: row.get(1)?,
                content_summary: row.get(2)?,
                source_channel: row.get(3)?,
                category: row.get(4)?,
                customer_name: row.get(5)?,
                project_name: row.get(6)?,
                amount: row.get(7)?,
                extracted_date: row.get(8)?,
                is_urgent: row.get::<_, i32>(9)? != 0,
                status: row.get(10)?,
                attachment_path: row.get(11)?,
                ai_confidence: row.get(12)?,
                user_corrected: row.get::<_, i32>(13)? != 0,
                created_at: row.get(14)?,
                updated_at: row.get(15)?,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    Ok(messages)
}

// FEAT-006: 更新消息
pub fn update_message(db_state: &DbState, message: &Message) -> Result<(), String> {
    let conn = Connection::open(&db_state.path).map_err(|e| e.to_string())?;
    let now = chrono::Utc::now().to_rfc3339();

    let sql = r#"
        UPDATE messages SET
          content_summary = ?1,
          category = ?2,
          customer_name = ?3,
          project_name = ?4,
          amount = ?5,
          extracted_date = ?6,
          is_urgent = ?7,
          status = ?8,
          user_corrected = ?9,
          updated_at = ?10
        WHERE id = ?11
    "#;

    conn.execute(
        sql,
        rusqlite::params![
            &message.content_summary,
            &message.category,
            option_string_to_value(message.customer_name.clone()),
            option_string_to_value(message.project_name.clone()),
            option_f64_to_value(message.amount),
            option_string_to_value(message.extracted_date.clone()),
            if message.is_urgent { 1 } else { 0 },
            &message.status,
            if message.user_corrected { 1 } else { 0 },
            now,
            &message.id
        ],
    )
    .map_err(|e| e.to_string())?;

    Ok(())
}

// FEAT-006: 删除消息
pub fn delete_message(db_state: &DbState, message_id: &str) -> Result<(), String> {
    let conn = Connection::open(&db_state.path).map_err(|e| e.to_string())?;

    conn.execute("DELETE FROM messages WHERE id = ?1", [message_id])
        .map_err(|e| e.to_string())?;

    Ok(())
}

