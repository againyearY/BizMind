use crate::db::{self, DbState, Message};
use crate::llm;
use tauri::State;

#[tauri::command]
pub fn save_message(db_state: State<'_, DbState>, message: Message) -> Result<(), String> {
    db::save_message(&db_state, message)
}

#[tauri::command]
pub fn get_messages(db_state: State<'_, DbState>) -> Result<Vec<Message>, String> {
    db::get_messages(&db_state)
}

#[tauri::command]
pub fn get_db_path(db_state: State<'_, DbState>) -> Result<String, String> {
    Ok(db_state.path.to_string_lossy().to_string())
}

// FEAT-LLM-001: 文本LLM调用命令
#[tauri::command]
pub async fn call_llm_text(
    db_state: State<'_, DbState>,
    system_prompt: Option<String>,
    user_message: Option<String>,
    content: Option<String>,
) -> Result<llm::LLMTextResponse, String> {
    eprintln!("[Commands] 📨 收到 call_llm_text 请求");
    
    // 支持两种参数方式
    let (final_system_prompt, final_user_message) = if let Some(c) = content {
        // 如果使用 content 参数（向后兼容性）
        ("You are a helpful assistant. Respond briefly.".to_string(), c)
    } else {
        // 使用 system_prompt 和 user_message 参数
        (
            system_prompt.unwrap_or_else(|| "You are a helpful assistant. Respond briefly.".to_string()),
            user_message.ok_or_else(|| "user_message 不能为空".to_string())?
        )
    };
    
    eprintln!("[Commands] 📨 用户消息长度: {}", final_user_message.len());
    
    // 获取LLM配置
    let config = match db::get_llm_config(&db_state) {
        Ok(Some(cfg)) => {
            eprintln!("[Commands] ✅ LLM 配置已加载: 模型={}, 端点={}", cfg.model, cfg.base_url);
            cfg
        }
        Ok(None) => {
            eprintln!("[Commands] ❌ LLM 配置未找到");
            return Err("LLM配置未找到，请先设置API Key".to_string());
        }
        Err(e) => {
            eprintln!("[Commands] ❌ 读取 LLM 配置失败: {}", e);
            return Err(e);
        }
    };

    // 检查Token预算
    let has_budget = match db::check_token_budget(&db_state, 100000) {
        Ok(budget) => budget,
        Err(e) => {
            eprintln!("[Commands] ❌ 检查 Token 预算失败: {}", e);
            return Err(e);
        }
    };
    
    if !has_budget {
        eprintln!("[Commands] ❌ Token 预算已用完");
        return Err("今日AI额度已用完".to_string());
    }

    let request = llm::LLMTextRequest {
        system_prompt: final_system_prompt,
        user_message: final_user_message,
    };

    eprintln!("[Commands] 🔄 开始调用 LLM...");
    match llm::call_llm_text(&config, &request).await {
        Ok(response) => {
            eprintln!("[Commands] ✅ LLM 调用成功, 内容长度: {}", response.content.len());
            // 记录Token使用
            let _ = db::track_token_usage(&db_state, response.usage.total_tokens);
            Ok(response)
        }
        Err(e) => {
            eprintln!("[Commands] ❌ LLM 调用失败: {}", e);
            Err(e)
        }
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
pub fn get_messages_by_category(
    db_state: State<'_, DbState>,
    category: String,
    limit: i32,
    offset: i32,
) -> Result<Vec<Message>, String> {
    db::get_messages_by_category(&db_state, &category, limit, offset)
}

// FEAT-007: 搜索消息
#[tauri::command]
pub fn search_messages(
    db_state: State<'_, DbState>,
    query: String,
    limit: i32,
) -> Result<Vec<Message>, String> {
    db::search_messages(&db_state, &query, limit)
}

// FEAT-006: 更新消息
#[tauri::command]
pub fn update_message(
    db_state: State<'_, DbState>,
    id: String,
    updates: Message,
) -> Result<(), String> {
    db::update_message(&db_state, &id, &updates)
}

// FEAT-006: 删除消息
#[tauri::command]
pub fn delete_message(db_state: State<'_, DbState>, id: String) -> Result<(), String> {
    eprintln!("[Commands] 🗑️ 收到删除请求，消息ID: {}", id);
    match db::delete_message(&db_state, &id) {
        Ok(_) => {
            eprintln!("[Commands] ✅ 消息已删除: {}", id);
            Ok(())
        }
        Err(e) => {
            eprintln!("[Commands] ❌ 删除消息失败: {}", e);
            Err(e)
        }
    }
}

// FEAT-LLM-002: 保存LLM配置
#[tauri::command]
pub fn save_llm_config(
    db_state: State<'_, DbState>,
    api_key: String,
    base_url: String,
    model: String,
    vision_model: String,
) -> Result<(), String> {
    db::save_llm_config(&db_state, api_key, base_url, model, vision_model)
}

// FEAT-API-001: 测试LLM连接
#[tauri::command]
pub async fn test_llm_connection(
    api_key: String,
    base_url: String,
    model: String,
) -> Result<serde_json::Value, String> {
    eprintln!("[Commands] 🧪 开始测试 LLM 连接...");
    
    let config = llm::LLMConfig {
        api_key,
        base_url,
        model,
        vision_model: String::new(),
    };

    let test_request = llm::LLMTextRequest {
        system_prompt: "You are a helpful assistant. Respond briefly.".to_string(),
        user_message: "Respond with just 'OK' to test the connection.".to_string(),
    };

    match llm::call_llm_text(&config, &test_request).await {
        Ok(response) => {
            eprintln!("[Commands] ✅ LLM 连接测试成功, Token: {}", response.usage.total_tokens);
            Ok(serde_json::json!({
                "success": true,
                "message": "LLM 连接测试成功",
                "usage": {
                    "prompt_tokens": response.usage.prompt_tokens,
                    "completion_tokens": response.usage.completion_tokens,
                    "total_tokens": response.usage.total_tokens
                }
            }))
        }
        Err(e) => {
            eprintln!("[Commands] ❌ LLM 连接测试失败: {}", e);
            Err(format!("LLM 连接测试失败: {}", e))
        }
    }
}

// FEAT-API-002: 加载配置
#[tauri::command]
pub fn load_config(db_state: State<'_, DbState>) -> Result<serde_json::Value, String> {
    eprintln!("[Commands] 📂 加载配置...");
    
    match db::get_llm_config(&db_state) {
        Ok(Some(config)) => {
            eprintln!("[Commands] ✅ 配置加载成功");
            Ok(serde_json::json!({
                "llm_provider": "custom",
                "llm_api_key": config.api_key,
                "llm_base_url": config.base_url,
                "llm_model": config.model,
                "llm_vision_model": config.vision_model,
            }))
        }
        Ok(None) => {
            eprintln!("[Commands] ⚠️ 配置未找到，返回默认值");
            Ok(serde_json::json!({
                "llm_provider": "qwen",
                "llm_api_key": "",
                "llm_base_url": "https://api-inference.modelscope.cn/v1",
                "llm_model": "Qwen/Qwen3.5-35B-A3B",
                "llm_vision_model": "Qwen/Qwen3.5-35B-A3B",
            }))
        }
        Err(e) => {
            eprintln!("[Commands] ❌ 加载配置失败: {}", e);
            Err(format!("加载配置失败: {}", e))
        }
    }
}

// FEAT-API-003: 保存配置
#[tauri::command]
pub fn save_config(
    db_state: State<'_, DbState>,
    config: serde_json::Value,
) -> Result<(), String> {
    eprintln!("[Commands] 💾 保存配置...");
    
    let api_key = config
        .get("llm_api_key")
        .and_then(|v| v.as_str())
        .ok_or("缺少 llm_api_key")?
        .to_string();
    
    let base_url = config
        .get("llm_base_url")
        .and_then(|v| v.as_str())
        .ok_or("缺少 llm_base_url")?
        .to_string();
    
    let model = config
        .get("llm_model")
        .and_then(|v| v.as_str())
        .ok_or("缺少 llm_model")?
        .to_string();
    
    let vision_model = config
        .get("llm_vision_model")
        .and_then(|v| v.as_str())
        .unwrap_or("")
        .to_string();

    db::save_llm_config(&db_state, api_key, base_url, model, vision_model)
}
