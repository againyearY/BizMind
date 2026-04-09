// FEAT-LLM-001: LLM API调用封装
// 支持文本模型和多模态模型，实现降级策略和Token计费

use serde::{Deserialize, Serialize};
use serde_json::json;
use std::time::Duration;
use tokio::time::timeout;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LLMConfig {
    pub api_key: String,
    pub base_url: String,
    pub model: String,
    pub vision_model: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LLMTextRequest {
    pub system_prompt: String,
    pub user_message: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LLMTextResponse {
    pub content: String,
    pub usage: TokenUsage,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TokenUsage {
    pub prompt_tokens: u32,
    pub completion_tokens: u32,
    pub total_tokens: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OpenAIResponse {
    pub choices: Vec<Choice>,
    pub usage: Usage,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Choice {
    pub message: Message,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Message {
    pub content: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Usage {
    pub prompt_tokens: u32,
    pub completion_tokens: u32,
    pub total_tokens: u32,
}

/// FEAT-LLM-001: 文本模型调用 - 实体提取和分类
/// 超时时间: 30秒 (ModelScope API 响应较慢，需要较长超时)
pub async fn call_llm_text(
    config: &LLMConfig,
    request: &LLMTextRequest,
) -> Result<LLMTextResponse, String> {
    if config.api_key.is_empty() {
        return Err("API Key未配置".to_string());
    }

    eprintln!("[LLM Rust] 🔄 开始调用 LLM (模型: {}, 端点: {})", config.model, config.base_url);

    let client = reqwest::Client::new();
    let endpoint = format!("{}/chat/completions", config.base_url.trim_end_matches('/'));

    let request_body = json!({
        "model": config.model,
        "messages": [
            {
                "role": "system",
                "content": request.system_prompt
            },
            {
                "role": "user",
                "content": request.user_message
            }
        ],
        "max_tokens": 1000,
        "temperature": 0.7
    });

    let fut = client
        .post(&endpoint)
        .header("Authorization", format!("Bearer {}", config.api_key))
        .header("Content-Type", "application/json")
        .json(&request_body)
        .send();

    match timeout(Duration::from_secs(30), fut).await {
        Ok(Ok(response)) => {
            let status = response.status();
            eprintln!("[LLM Rust] 📨 收到响应: HTTP {}", status);
            
            match response.json::<OpenAIResponse>().await {
                Ok(resp) => {
                    if resp.choices.is_empty() {
                        eprintln!("[LLM Rust] ❌ LLM返回空响应");
                        return Err("LLM返回空响应".to_string());
                    }
                    eprintln!("[LLM Rust] ✅ 成功: {} tokens", resp.usage.total_tokens);
                    Ok(LLMTextResponse {
                        content: resp.choices[0].message.content.clone(),
                        usage: TokenUsage {
                            prompt_tokens: resp.usage.prompt_tokens,
                            completion_tokens: resp.usage.completion_tokens,
                            total_tokens: resp.usage.total_tokens,
                        },
                    })
                }
                Err(e) => {
                    eprintln!("[LLM Rust] ❌ JSON解析失败: {}", e);
                    Err(format!("JSON解析失败: {}", e))
                }
            }
        }
        Ok(Err(e)) => {
            eprintln!("[LLM Rust] ❌ API调用失败: {}", e);
            Err(format!("API调用失败: {}", e))
        }
        Err(_) => {
            eprintln!("[LLM Rust] ❌ LLM调用超时(>30秒) - 可能是网络问题或 API 响应过慢");
            Err("LLM调用超时(>30秒) - 请检查网络连接或稍后重试".to_string())
        }
    }
}

/// FEAT-LLM-001: 多模态模型调用 - 截图识别
/// 超时时间: 15秒
pub async fn call_llm_vision(
    config: &LLMConfig,
    system_prompt: &str,
    image_base64: &str,
    image_media_type: &str,
) -> Result<LLMTextResponse, String> {
    if config.api_key.is_empty() {
        return Err("API Key未配置".to_string());
    }

    if config.vision_model.is_empty() {
        return Err("当前模型不支持截图识别".to_string());
    }

    let client = reqwest::Client::new();
    let endpoint = format!("{}/chat/completions", config.base_url.trim_end_matches('/'));

    let request_body = json!({
        "model": config.vision_model,
        "messages": [
            {
                "role": "system",
                "content": system_prompt
            },
            {
                "role": "user",
                "content": [
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": format!("data:{};base64,{}", image_media_type, image_base64)
                        }
                    }
                ]
            }
        ],
        "max_tokens": 2000,
        "temperature": 0.1
    });

    let fut = client
        .post(&endpoint)
        .header("Authorization", format!("Bearer {}", config.api_key))
        .header("Content-Type", "application/json")
        .json(&request_body)
        .send();

    match timeout(Duration::from_secs(15), fut).await {
        Ok(Ok(response)) => {
            match response.json::<OpenAIResponse>().await {
                Ok(resp) => {
                    if resp.choices.is_empty() {
                        return Err("LLM返回空响应".to_string());
                    }
                    Ok(LLMTextResponse {
                        content: resp.choices[0].message.content.clone(),
                        usage: TokenUsage {
                            prompt_tokens: resp.usage.prompt_tokens,
                            completion_tokens: resp.usage.completion_tokens,
                            total_tokens: resp.usage.total_tokens,
                        },
                    })
                }
                Err(e) => Err(format!("JSON解析失败: {}", e)),
            }
        }
        Ok(Err(e)) => Err(format!("API调用失败: {}", e)),
        Err(_) => Err("LLM调用超时(>15秒)".to_string()),
    }
}
