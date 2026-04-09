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
