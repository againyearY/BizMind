/**
 * Rust 后端集成测试 - 直接测试 LLM 功能
 * 不依赖 Tauri 桥接，直接执行 Rust 代码
 */

extern crate bizmind_lib;

use bizmind_lib::llm::{LLMConfig, LLMTextRequest};

fn extract_json(response: &str) -> String {
    // 如果响应包含 ```json...``` markdown，提取其中的 JSON
    if let Some(start) = response.find("```json") {
        if let Some(end) = response[start + 7..].find("```") {
            return response[start + 7..start + 7 + end].trim().to_string();
        }
    }
    // 否则尝试直接找到 JSON 对象
    if let Some(start) = response.find('{') {
        if let Some(end) = response.rfind('}') {
            return response[start..=end].to_string();
        }
    }
    response.to_string()
}

#[tokio::test]
async fn test_llm_customer_lead_classification() {
    println!("\n=== 测试 1: LLM 客户线索分类 ===");
    
    let config = LLMConfig {
        api_key: "ms-85b8c78f-d170-4cde-a025-aacd388e8691".to_string(),
        base_url: "https://api-inference.modelscope.cn/v1".to_string(),
        model: "Qwen/Qwen3.5-35B-A3B".to_string(),
        vision_model: "Qwen/Qwen3.5-35B-A3B".to_string(),
    };

    let request = LLMTextRequest {
        system_prompt: r#"你是一个商业消息分类系统。分析用户输入的消息，按以下类别分类，并提取关键实体。
必须返回有效的 JSON 格式(不要添加任何 markdown 标记或其他文字，只返回纯 JSON):
{
  "category": "lead|maintain|progress|finance|todo|misc",
  "customer_name": "提取的客户名称或空字符",
  "project_name": "提取的项目名称或空字符",
  "amount": "提取的金额（数字），没有则为0",
  "date": "提取的日期或空字符",
  "summary": "消息简要总结",
  "confidence": 0.0到1.0的浮点数
}

分类标准:
- lead: 新客户询价/业务机会
- maintain: 客户投诉/反馈/技术支持
- progress: 项目推进/进展报告
- finance: 付款/发票/财务相关
- todo: 代办事项/会议/提醒
- misc: 其他不相关"#.to_string(),
        user_message: "李总想要咨询我们的ABC项目，报价预计200万".to_string(),
    };

    match bizmind_lib::llm::call_llm_text(&config, &request).await {
        Ok(response) => {
            println!("[✓] LLM API 调用成功");
            
            let json_str = extract_json(&response.content);
            println!("提取的 JSON: {}", json_str);

            match serde_json::from_str::<serde_json::Value>(&json_str) {
                Ok(parsed) => {
                    println!("[✓] 响应 JSON 解析成功");
                    
                    let category = parsed.get("category").and_then(|v| v.as_str()).unwrap_or("unknown");
                    let customer = parsed.get("customer_name").and_then(|v| v.as_str()).unwrap_or("");
                    let amount = parsed.get("amount").and_then(|v| v.as_i64()).unwrap_or(0);
                    let confidence = parsed.get("confidence").and_then(|v| v.as_f64()).unwrap_or(0.0);
                    
                    println!("分类: {}, 客户: {}, 金额: {}, 置信度: {:.2}", 
                             category, customer, amount, confidence);
                    println!("Token 消耗 - Prompt: {}, Completion: {}, 总计: {}", 
                             response.usage.prompt_tokens, 
                             response.usage.completion_tokens, 
                             response.usage.total_tokens);
                    
                    // 验证
                    assert!(!category.is_empty(), "分类不能为空");
                    assert!(confidence >= 0.0 && confidence <= 1.0, "置信度范围错误");
                    println!("[✓] 测试通过");
                }
                Err(e) => {
                    println!("[✗] JSON 解析失败: {}", e);
                    panic!("无法解析 LLM 响应");
                }
            }
        }
        Err(e) => {
            println!("[✗] LLM 调用失败: {}", e);
            panic!("LLM 错误: {}", e);
        }
    }
}

#[tokio::test]
async fn test_llm_maintenance_classification() {
    println!("\n=== 测试 2: LLM 维护分类 ===");
    
    let config = LLMConfig {
        api_key: "ms-85b8c78f-d170-4cde-a025-aacd388e8691".to_string(),
        base_url: "https://api-inference.modelscope.cn/v1".to_string(),
        model: "Qwen/Qwen3.5-35B-A3B".to_string(),
        vision_model: "Qwen/Qwen3.5-35B-A3B".to_string(),
    };

    let request = LLMTextRequest {
        system_prompt: r#"返回有效的 JSON 格式(只能返回纯 JSON，不要有任何其他字符):
{
  "category": "lead|maintain|progress|finance|todo|misc",
  "customer_name": "提取的客户"
}"#.to_string(),
        user_message: "张总反馈我们系统有个bug，积分计算逻辑错误，需要紧急修复".to_string(),
    };

    match bizmind_lib::llm::call_llm_text(&config, &request).await {
        Ok(response) => {
            println!("[✓] LLM 调用成功");
            
            let json_str = extract_json(&response.content);
            
            if let Ok(parsed) = serde_json::from_str::<serde_json::Value>(&json_str) {
                let category = parsed.get("category").and_then(|v| v.as_str()).unwrap_or("unknown");
                println!("分类结果: {}", category);
                assert!(["lead", "maintain", "progress", "finance", "todo", "misc"].contains(&category),
                        "无效的分类: {}", category);
                println!("[✓] 测试通过");
            } else {
                panic!("JSON 解析失败");
            }
        }
        Err(e) => panic!("LLM 错误: {}", e),
    }
}

#[tokio::test]
async fn test_api_configuration() {
    println!("\n=== 测试 3: API 配置验证 ===");
    
    let config = LLMConfig {
        api_key: "ms-85b8c78f-d170-4cde-a025-aacd388e8691".to_string(),
        base_url: "https://api-inference.modelscope.cn/v1".to_string(),
        model: "Qwen/Qwen3.5-35B-A3B".to_string(),
        vision_model: "Qwen/Qwen3.5-35B-A3B".to_string(),
    };

    assert!(!config.api_key.is_empty(), "API Key 不能为空");
    assert!(!config.base_url.is_empty(), "Base URL 不能为空");
    assert!(!config.model.is_empty(), "Model 不能为空");
    
    println!("API Key: {}...", &config.api_key[..20]);
    println!("Base URL: {}", config.base_url);
    println!("Model: {}", config.model);
    println!("[✓] 配置验证通过");
}
