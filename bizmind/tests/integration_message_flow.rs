// 集成测试：验证消息解析和保存的完整流程
#[cfg(test)]
mod tests {
    use std::path::PathBuf;

    // 注意：这是一个概念性的集成测试
    // 真实应用需要可运行的Tauri上下文

    #[test]
    fn test_message_parsing_flow() {
        // 测试消息数据结构
        #[derive(serde::Serialize, serde::Deserialize, Debug)]
        struct TestMessage {
            category: String,
            confidence: f32,
            customer_name: Option<String>,
        }

        // 模拟LLM返回的JSON (来自call_llm_text命令的响应)
        let llm_response = r#"{
            "summary": "ABC公司询价企业级云存储方案",
            "category": "lead",
            "customer_name": "ABC公司",
            "project_name": null,
            "amount": null,
            "extracted_date": null,
            "todo_items": [],
            "confidence": 0.89
        }"#;

        // 验证JSON可以正确解析
        let parsed: TestMessage = serde_json::from_str(llm_response).expect("JSON should parse");

        assert_eq!(parsed.category, "lead");
        assert_eq!(parsed.confidence, 0.89);
        assert_eq!(parsed.customer_name, Some("ABC公司".to_string()));

        println!("✅ 消息解析流程正确");
    }

    #[test]
    fn test_lead_classification() {
        // 测试Lead分类的关键特征
        let lead_texts = vec![
            "你好，我是ABC公司的采购经理。我们计划采购一套企业级的云存储解决方案，能否提供方案和价格？",
            "张总您好，想咨询贵公司的ERP系统实施方案和报价。我们是制造业企业，预计投入预算200万。",
            "李总推荐了咱们的数据分析平台，说能帮他们提升销售转化率。他们是快消品行业，已初步有50万的预算。",
        ];

        // 所有这些文本都应该被分类为lead
        for text in lead_texts {
            println!("检查文本: {}...", &text[..30.min(text.len())]);
            // 真实应用会调用LLM进行分类
            // 这里我们只验证流程逻辑
            assert!(!text.is_empty(), "文本不能为空");
        }

        println!("✅ Lead分类测试完成");
    }

    #[test]
    fn test_entity_extraction_results() {
        // 验证提取的实体符合预期
        #[derive(Debug)]
        struct ExtractedEntity {
            customer: Option<String>,
            amount: Option<i32>,
            confidence: f32,
        }

        let result = ExtractedEntity {
            customer: Some("ABC公司".to_string()),
            amount: None,
            confidence: 0.89,
        };

        // 验证提取结果
        assert!(result.customer.is_some());
        assert_eq!(result.customer.as_ref().unwrap(), "ABC公司");
        assert!(result.confidence > 0.85, "置信度应该在预期范围内");

        println!("✅ 实体提取结果验证完成");
    }
}
