use crate::db;
use crate::db::{DbState, Message};
use crate::llm;
use tauri::State;

#[tauri::command]
pub async fn save_message(db_state: State<'_, DbState>, message: Message) -> Result<(), String> {
    db::save_message(&db_state, message).await
}

#[tauri::command]
pub async fn get_messages(db_state: State<'_, DbState>) -> Result<Vec<Message>, String> {
    db::get_messages(&db_state)
}

#[tauri::command]
pub async fn get_db_path(db_state: State<'_, DbState>) -> Result<String, String> {
    Ok(db_state.path.to_string_lossy().to_string())
}

// FEAT-LLM-001: 文本LLM调用命令
#[tauri::command]
pub async fn call_llm_text(
    db_state: State<'_, DbState>,
    system_prompt: String,
    user_message: String,
) -> Result<llm::LLMTextResponse, String> {
    // 获取LLM配置
    let config = db::get_llm_config(&db_state)?
        .ok_or_else(|| "LLM配置未找到，请先设置API Key".to_string())?;

    // 检查Token预算
    let has_budget = db::check_token_budget(&db_state, 100000)?;
    if !has_budget {
        return Err("今日AI额度已用完".to_string());
    }

    let request = llm::LLMTextRequest {
        system_prompt,
        user_message,
    };

    match llm::call_llm_text(&config, &request).await {
        Ok(response) => {
            // 记录Token使用
            let _ = db::track_token_usage(&db_state, response.usage.total_tokens);
            Ok(response)
        }
        Err(e) => Err(e),
    }
}

// FEAT-LLM-001: 多模态LLM调用命令
#[tauri::command]
pub async fn call_llm_vision(
    db_state: State<'_, DbState>,
    system_prompt: String,
    image_base64: String,
    image_media_type: String,
) -> Result<llm::LLMTextResponse, String> {
    // 获取LLM配置
    let config = db::get_llm_config(&db_state)?
        .ok_or_else(|| "LLM配置未找到，请先设置API Key".to_string())?;

    // 检查是否支持多模态
    if config.vision_model.is_empty() {
        return Err("当前模型不支持截图识别".to_string());
    }

    // 检查Token预算
    let has_budget = db::check_token_budget(&db_state, 100000)?;
    if !has_budget {
        return Err("今日AI额度已用完".to_string());
    }

    match llm::call_llm_vision(&config, &system_prompt, &image_base64, &image_media_type).await {
        Ok(response) => {
            // 记录Token使用
            let _ = db::track_token_usage(&db_state, response.usage.total_tokens);
            Ok(response)
        }
        Err(e) => Err(e),
    }
}

// FEAT-007: 按分类获取消息
#[tauri::command]
pub async fn get_messages_by_category(
    db_state: State<'_, DbState>,
    category: String,
    limit: i32,
    offset: i32,
) -> Result<Vec<Message>, String> {
    db::get_messages_by_category(&db_state, &category, limit, offset)
}

// FEAT-007: 搜索消息
#[tauri::command]
pub async fn search_messages(
    db_state: State<'_, DbState>,
    query: String,
    limit: i32,
) -> Result<Vec<Message>, String> {
    db::search_messages(&db_state, &query, limit)
}

// FEAT-006: 更新消息
#[tauri::command]
pub async fn update_message(db_state: State<'_, DbState>, message: Message) -> Result<(), String> {
    db::update_message(&db_state, &message)
}

// FEAT-006: 删除消息
#[tauri::command]
pub async fn delete_message(db_state: State<'_, DbState>, message_id: String) -> Result<(), String> {
    db::delete_message(&db_state, &message_id)
}
