// FEAT-LLM-003: LLM实体提取和分类服务层
import { invoke } from "@tauri-apps/api/core";
import type { LLMExtractionResult, SourceChannel } from "../types";

// FEAT-LLM-003: 实体提取Prompt模板
export const buildEntityExtractionPrompt = (
  sourceChannel: SourceChannel,
  contentRaw: string
): { systemPrompt: string; userMessage: string } => {
  const today = new Date().toISOString().split("T")[0];

  const systemPrompt = `你是一个信息分类助手。用户会给你一段从聊天软件/邮件中复制的文本，你需要提取结构化信息。

严格按以下JSON格式返回，不要返回任何其他内容：

{
  "summary": "≤50字的中文摘要",
  "category": "lead|maintain|progress|finance|todo|misc",
  "customer_name": "客户名或公司名，没有则null",
  "project_name": "项目名称，没有则null",
  "amount": 金额数字(元)，"3万"=30000，没有则null,
  "extracted_date": "ISO日期如2026-04-08，相对日期基于今天${today}计算，没有则null",
  "todo_items": ["待办事项1", "待办事项2"],
  "confidence": 0.0到1.0的置信度
}

分类规则：
- lead: 新客户询价、首次接触、潜在商机
- maintain: 老客户沟通、售后、回访
- progress: 项目节点、交付、里程碑、进度更新
- finance: 报价、发票、转账、付款、对账
- todo: 明确的行动项、任务、截止日期
- misc: 无法归入以上类别`;

  const userMessage = `来源渠道: ${sourceChannel}
内容:
${contentRaw}`;

  return { systemPrompt, userMessage };
};

// FEAT-LLM-004: 截图OCR Prompt模板
export const buildOCRPrompt = (): string => {
  return `你是一个OCR助手。从用户提供的图片中提取所有可见的中文和英文文字，按从上到下、从左到右的阅读顺序输出为纯文本。保留原始换行。不要添加任何解释或总结。如果图片模糊或无法识别任何文字，只输出"[无法识别]"。`;
};

// FEAT-LLM-001: 调用文本LLM进行实体提取
export const extractEntityFromText = async (
  sourceChannel: SourceChannel,
  contentRaw: string
): Promise<LLMExtractionResult | null> => {
  try {
    if (!contentRaw.trim()) {
      throw new Error("内容不能为空");
    }

    const { systemPrompt, userMessage } = buildEntityExtractionPrompt(sourceChannel, contentRaw);

    const response = await invoke<{ content: string }>("call_llm_text", {
      system_prompt: systemPrompt,
      user_message: userMessage,
    });

    // 解析JSON响应
    try {
      const result = JSON.parse(response.content) as LLMExtractionResult;
      return result;
    } catch (e) {
      console.error("LLM返回JSON解析失败:", e, response.content);
      throw new Error("LLM返回格式错误");
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("文本实体提取失败:", message);
    return null; // 降级返回null，前端会使用默认值
  }
};

// FEAT-LLM-001: 调用多模态LLM进行截图识别
export const extractTextFromImage = async (
  imageBase64: string,
  imageMediaType: string
): Promise<string | null> => {
  try {
    if (!imageBase64) {
      throw new Error("图片不能为空");
    }

    const systemPrompt = buildOCRPrompt();

    const response = await invoke<{ content: string }>("call_llm_vision", {
      system_prompt: systemPrompt,
      image_base64: imageBase64,
      image_media_type: imageMediaType,
    });

    // 检查是否无法识别
    if (response.content === "[无法识别]") {
      return null;
    }

    return response.content;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("图片识别失败:", message);
    return null; // 降级返回null，前端会提示用户手动输入
  }
};

// FEAT-LLM-005: 聊天记录解析 - 用于批量导入
export const parseChatMessages = async (chatText: string) => {
  try {
    const systemPrompt = `你是一个聊天记录解析器。用户会给你一段从微信/QQ等聊天软件复制的聊天记录文本。

请将其解析为JSON数组，每条消息包含：
- timestamp: ISO日期时间格式(如"2026-04-08T14:30:00")，如果只有时间没有日期则日期部分用null，完全无法识别则为null
- sender: 发送者名称，无法识别则为null
- content: 消息正文内容

只返回JSON数组，不要其他任何文字。示例：
[
  {"timestamp": "2026-04-08T09:15:00", "sender": "张总", "content": "报价单发我一下"},
  {"timestamp": "2026-04-08T09:16:00", "sender": "我", "content": "好的，马上发您"}
]

如果文本不像聊天记录，返回单条：[{"timestamp": null, "sender": null, "content": "原始文本"}]`;

    const response = await invoke<{ content: string }>("call_llm_text", {
      system_prompt: systemPrompt,
      user_message: chatText,
    });

    // 解析JSON数组
    try {
      const messages = JSON.parse(response.content);
      if (!Array.isArray(messages)) {
        throw new Error("返回格式不是数组");
      }
      return messages;
    } catch (e) {
      console.error("聊天记录解析JSON失败:", e);
      return null;
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("聊天记录解析失败:", message);
    return null;
  }
};
