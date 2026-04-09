// FEAT-DB-002: LLM配置管理
import { create } from "zustand";
import type { AppConfig, LLMProviderPreset } from "../types";

// LLM Provider预设
export const LLM_PROVIDER_PRESETS: Record<string, LLMProviderPreset> = {
  deepseek: {
    name: "DeepSeek",
    base_url: "https://api.deepseek.com",
    default_model: "deepseek-chat",
    default_vision_model: "",
    supports_vision: false,
  },
  qwen: {
    name: "阿里云 Qwen",
    base_url: "https://dashscope.aliyuncs.com/compatible-mode",
    default_model: "qwen-plus",
    default_vision_model: "qwen-vl-plus",
    supports_vision: true,
  },
  openai: {
    name: "OpenAI",
    base_url: "https://api.openai.com/v1",
    default_model: "gpt-4o-mini",
    default_vision_model: "gpt-4o-mini",
    supports_vision: true,
  },
  custom: {
    name: "自定义",
    base_url: "",
    default_model: "",
    default_vision_model: "",
    supports_vision: false,
  },
};

export interface ConfigState {
  config: AppConfig | null;
  loading: boolean;
  error: string | null;

  // 操作
  setConfig: (config: AppConfig) => void;
  setApiKey: (key: string) => void;
  setProvider: (provider: "deepseek" | "qwen" | "openai" | "custom") => void;
  setBaseUrl: (url: string) => void;
  setModel: (model: string) => void;
  setVisionModel: (model: string) => void;
  setError: (error: string | null) => void;
  resetError: () => void;
}

// 默认配置
const DEFAULT_CONFIG: AppConfig = {
  llm_provider: "deepseek",
  llm_api_key: "",
  llm_base_url: "https://api.deepseek.com",
  llm_model: "deepseek-chat",
  llm_vision_model: "",
  llm_daily_token_limit: 100000,
  llm_tokens_used_today: 0,
  hotkey: "Ctrl+Shift+A",
  theme: "system",
  onboarding_completed: false,
};

export const useConfigStore = create<ConfigState>((set) => ({
  config: DEFAULT_CONFIG,
  loading: false,
  error: null,

  setConfig: (config) => set({ config }),

  setApiKey: (key) =>
    set((state) => ({
      config: state.config ? { ...state.config, llm_api_key: key } : null,
    })),

  setProvider: (provider) =>
    set((state) => {
      if (!state.config) return {};
      const preset = LLM_PROVIDER_PRESETS[provider];
      return {
        config: {
          ...state.config,
          llm_provider: provider,
          llm_base_url: preset.base_url,
          llm_model: preset.default_model,
          llm_vision_model: preset.default_vision_model,
        },
      };
    }),

  setBaseUrl: (url) =>
    set((state) => ({
      config: state.config ? { ...state.config, llm_base_url: url } : null,
    })),

  setModel: (model) =>
    set((state) => ({
      config: state.config ? { ...state.config, llm_model: model } : null,
    })),

  setVisionModel: (model) =>
    set((state) => ({
      config: state.config ? { ...state.config, llm_vision_model: model } : null,
    })),

  setError: (error) => set({ error }),

  resetError: () => set({ error: null }),
}));
