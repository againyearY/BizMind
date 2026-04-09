// FEAT-API-002: API 配置和连接测试服务
// 提供 API 连接测试、保存和加载功能

import { invoke } from "@tauri-apps/api/core";

export interface APITestRequest {
  api_key: string;
  base_url: string;
  model: string;
}

export interface APITestResponse {
  success: boolean;
  message: string;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * 测试 LLM API 连接
 * 发送一个简单的测试请求来验证 API 配置是否正确
 */
export const testLLMConnection = async (config: APITestRequest): Promise<APITestResponse> => {
  try {
    console.log("[API Config Service] 🔄 开始测试连接...", {
      base_url: config.base_url,
      model: config.model,
    });

    // 调用后端测试端点
    const response = await invoke<APITestResponse>("test_llm_connection", {
      apiKey: config.api_key,
      baseUrl: config.base_url,
      model: config.model,
    });

    console.log("[API Config Service] ✅ 连接测试成功", response);
    return response;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("[API Config Service] ❌ 连接测试失败:", errorMessage, error);
    throw new Error(`API 连接失败: ${errorMessage}`);
  }
};

/**
 * 从后端加载配置
 */
export const loadConfig = async () => {
  try {
    console.log("[API Config Service] 📂 加载配置...");
    const config = await invoke("load_config");
    console.log("[API Config Service] ✅ 配置加载成功");
    return config;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.warn("[API Config Service] ⚠️ 配置加载失败:", errorMessage);
    return null;
  }
};

/**
 * 验证 API 配置的有效性
 */
export const validateApiConfig = (
  apiKey: string,
  baseUrl: string,
  model: string
): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!apiKey || apiKey.trim() === "") {
    errors.push("API Key 不能为空");
  }

  if (!baseUrl || baseUrl.trim() === "") {
    errors.push("API 端点不能为空");
  } else {
    try {
      new URL(baseUrl);
    } catch {
      errors.push("API 端点格式无效，必须是完整的 URL");
    }
  }

  if (!model || model.trim() === "") {
    errors.push("模型名称不能为空");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

/**
 * 格式化 ModelScope 模型名称
 */
export const formatModelscopeModel = (model: string): string => {
  if (model.includes("Qwen")) {
    if (!model.startsWith("Qwen/")) {
      return `Qwen/${model}`;
    }
  }
  return model;
};

/**
 * 获取常见的模型列表
 */
export const getCommonModels = (provider: string) => {
  const models: Record<string, string[]> = {
    qwen: ["Qwen/Qwen3.5-35B-A3B", "Qwen/Qwen3-32B", "Qwen/Qwen3-70B", "Qwen/Qwen3-Plus"],
    openai: ["gpt-4o-mini", "gpt-4o", "gpt-4-turbo", "gpt-3.5-turbo"],
    deepseek: ["deepseek-chat", "deepseek-reasoner"],
    custom: [],
  };

  return models[provider] || [];
};
