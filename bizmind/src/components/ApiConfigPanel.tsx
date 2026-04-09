// FEAT-API-001: 独立的 API 配置管理面板
// 支持一键配置 ModelScope 和其他 LLM 提供商
// 功能可通过 VITE_ENABLE_API_CONFIG 环境变量禁用

import React, { useState } from "react";
import { useConfigStore } from "../stores/configStore";
import { testLLMConnection } from "../services/apiConfigService";
import {
  X as CloseIcon,
  Check as CheckIcon,
  AlertCircle as ErrorIcon,
  Loader as LoadingIcon,
  Copy as CopyIcon,
  Eye as EyeIcon,
  EyeOff as EyeOffIcon,
} from "lucide-react";

interface ApiConfigPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ApiConfigPanel: React.FC<ApiConfigPanelProps> = ({ isOpen, onClose }) => {
  const { config, setApiKey, setProvider, setBaseUrl, setModel, setVisionModel } =
    useConfigStore();

  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    timestamp: number;
  } | null>(null);
  const [showApiKey, setShowApiKey] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // ModelScope Qwen3 预设
  const MODELSCOPE_QWEN3_PRESETS = {
    "Qwen3-32B": "Qwen/Qwen3-32B",
    "Qwen3-70B": "Qwen/Qwen3-70B",
    "Qwen3-Plus": "Qwen/Qwen3-Plus",
    "Qwen3.5-35B": "Qwen/Qwen3.5-35B-A3B",
  };

  const handleTestConnection = async () => {
    if (!config) return;

    setIsTestingConnection(true);
    setTestResult(null);

    try {
      const result = await testLLMConnection({
        api_key: config.llm_api_key,
        base_url: config.llm_base_url,
        model: config.llm_model,
      });

      setTestResult({
        success: true,
        message: `✅ 连接成功! Token 消耗: ${result.usage.total_tokens}`,
        timestamp: Date.now(),
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      setTestResult({
        success: false,
        message: `❌ 连接失败: ${errorMessage}`,
        timestamp: Date.now(),
      });
    } finally {
      setIsTestingConnection(false);
    }
  };

  const handleSaveConfig = async () => {
    if (!config || !config.llm_api_key) {
      alert("请先填写 API Key");
      return;
    }

    setIsSaving(true);
    try {
      // 调用后端保存配置
      const { invoke } = await import("@tauri-apps/api/core");
      await invoke("save_config", { config });
      setTestResult({
        success: true,
        message: "✅ 配置已保存!",
        timestamp: Date.now(),
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      setTestResult({
        success: false,
        message: `❌ 保存失败: ${errorMessage}`,
        timestamp: Date.now(),
      });
    } finally {
      setIsSaving(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("已复制到剪贴板");
  };

  if (!isOpen || !config) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full mx-4">
        {/* 头部 */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">API 配置管理</h2>
            <p className="text-sm text-gray-500 mt-1">独立管理 LLM 提供商配置和 API 凭证</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <CloseIcon size={24} className="text-gray-500" />
          </button>
        </div>

        {/* 内容 */}
        <div className="p-6 space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto">
          {/* 快速预设 */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-3">⚡ 快速预设</h3>
            <div className="space-y-2">
              {/* ModelScope Qwen3 预设 */}
              <button
                onClick={() => {
                  setProvider("qwen");
                  setBaseUrl("https://api-inference.modelscope.cn/v1");
                  setModel("Qwen/Qwen3.5-35B-A3B");
                  setVisionModel("Qwen/Qwen3.5-35B-A3B");
                }}
                className="w-full text-left p-3 bg-white border border-blue-200 rounded hover:bg-blue-50 transition-colors"
              >
                <div className="font-semibold text-gray-900">🤖 ModelScope Qwen3</div>
                <div className="text-sm text-gray-600">
                  API: api-inference.modelscope.cn/v1 | 模型: Qwen3.5-35B
                </div>
              </button>

              {/* OpenAI 预设 */}
              <button
                onClick={() => {
                  setProvider("openai");
                  setBaseUrl("https://api.openai.com/v1");
                  setModel("gpt-4o-mini");
                  setVisionModel("gpt-4o-mini");
                }}
                className="w-full text-left p-3 bg-white border border-blue-200 rounded hover:bg-blue-50 transition-colors"
              >
                <div className="font-semibold text-gray-900">🔑 OpenAI</div>
                <div className="text-sm text-gray-600">API: api.openai.com/v1 | 模型: gpt-4o-mini</div>
              </button>

              {/* DeepSeek 预设 */}
              <button
                onClick={() => {
                  setProvider("deepseek");
                  setBaseUrl("https://api.deepseek.com");
                  setModel("deepseek-chat");
                  setVisionModel("");
                }}
                className="w-full text-left p-3 bg-white border border-blue-200 rounded hover:bg-blue-50 transition-colors"
              >
                <div className="font-semibold text-gray-900">🚀 DeepSeek</div>
                <div className="text-sm text-gray-600">API: api.deepseek.com | 模型: deepseek-chat</div>
              </button>
            </div>
          </div>

          {/* 手动配置 */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">⚙️ 手动配置</h3>

            {/* API Key */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                API Key <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <input
                    type={showApiKey ? "text" : "password"}
                    value={config.llm_api_key}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="输入您的 API Key..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showApiKey ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
                  </button>
                </div>
                <button
                  onClick={() => copyToClipboard(config.llm_api_key)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  title="复制"
                >
                  <CopyIcon size={20} className="text-gray-500" />
                </button>
              </div>
              {config.llm_provider === "qwen" && !config.llm_api_key && (
                <p className="text-sm text-gray-500 mt-2">
                  💡 您可以使用: <code className="bg-gray-100 px-2 py-1 rounded">ms-eee04013-7a1a-4ad3-a67a-afaf54ce805c</code>
                </p>
              )}
            </div>

            {/* Base URL */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                API 端点 <span className="text-red-500">*</span>
              </label>
              <input
                type="url"
                value={config.llm_base_url}
                onChange={(e) => setBaseUrl(e.target.value)}
                placeholder="https://api.example.com/v1"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* 模型选择 */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  文本模型 <span className="text-red-500">*</span>
                </label>
                {config.llm_provider === "qwen" ? (
                  <select
                    value={config.llm_model}
                    onChange={(e) => setModel(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {Object.entries(MODELSCOPE_QWEN3_PRESETS).map(([label, value]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={config.llm_model}
                    onChange={(e) => setModel(e.target.value)}
                    placeholder="如: gpt-4o-mini"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">视觉模型</label>
                <input
                  type="text"
                  value={config.llm_vision_model}
                  onChange={(e) => setVisionModel(e.target.value)}
                  placeholder="留空则使用文本模型"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* 当前配置预览 */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-3">📋 当前配置</h3>
            <div className="space-y-2 text-sm font-mono">
              <div className="flex justify-between">
                <span className="text-gray-600">Provider:</span>
                <span className="text-gray-900">{config.llm_provider}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Base URL:</span>
                <span className="text-gray-900 truncate">{config.llm_base_url}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Model:</span>
                <span className="text-gray-900">{config.llm_model}</span>
              </div>
              {config.llm_vision_model && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Vision Model:</span>
                  <span className="text-gray-900">{config.llm_vision_model}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-600">API Key:</span>
                <span className="text-gray-900">
                  {config.llm_api_key
                    ? `${config.llm_api_key.substring(0, 8)}...${config.llm_api_key.substring(config.llm_api_key.length - 4)}`
                    : "未设置"}
                </span>
              </div>
            </div>
          </div>

          {/* 测试结果 */}
          {testResult && (
            <div
              className={`p-4 rounded-lg flex items-start gap-3 ${
                testResult.success
                  ? "bg-green-50 border border-green-200"
                  : "bg-red-50 border border-red-200"
              }`}
            >
              {testResult.success ? (
                <CheckIcon size={20} className="text-green-600 flex-shrink-0 mt-0.5" />
              ) : (
                <ErrorIcon size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
              )}
              <div>
                <p
                  className={`text-sm font-medium ${
                    testResult.success ? "text-green-900" : "text-red-900"
                  }`}
                >
                  {testResult.message}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* 底部按钮 */}
        <div className="flex justify-between items-center p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={handleTestConnection}
            disabled={isTestingConnection || !config.llm_api_key}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {isTestingConnection && <LoadingIcon size={18} className="animate-spin" />}
            {isTestingConnection ? "测试中..." : "🧪 测试连接"}
          </button>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-100 transition-colors"
            >
              关闭
            </button>
            <button
              onClick={handleSaveConfig}
              disabled={isSaving || !config.llm_api_key}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {isSaving && <LoadingIcon size={18} className="animate-spin" />}
              {isSaving ? "保存中..." : "💾 保存配置"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
