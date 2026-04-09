// FEAT-LLM-002: LLM API 配置界面
import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";

const LLM_PROVIDERS = {
  deepseek: {
    name: "DeepSeek",
    baseUrl: "https://api.deepseek.com",
    model: "deepseek-chat",
    visionModel: "",
    docs: "https://platform.deepseek.com",
  },
  qwen: {
    name: "Qwen (阿里云)",
    baseUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1",
    model: "qwen-plus",
    visionModel: "qwen-vl-plus",
    docs: "https://help.aliyun.com/zh/dashscope",
  },
  openai: {
    name: "OpenAI",
    baseUrl: "https://api.openai.com/v1",
    model: "gpt-4o-mini",
    visionModel: "gpt-4o-mini",
    docs: "https://platform.openai.com",
  },
  custom: {
    name: "自定义",
    baseUrl: "",
    model: "",
    visionModel: "",
    docs: "",
  },
};

interface ApiSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: () => void;
}

export const ApiSettings = ({ isOpen, onClose, onSave }: ApiSettingsProps) => {
  const [provider, setProvider] = useState<keyof typeof LLM_PROVIDERS>("deepseek");
  const [apiKey, setApiKey] = useState("");
  const [baseUrl, setBaseUrl] = useState(LLM_PROVIDERS.deepseek.baseUrl);
  const [model, setModel] = useState(LLM_PROVIDERS.deepseek.model);
  const [visionModel, setVisionModel] = useState(LLM_PROVIDERS.deepseek.visionModel);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleProviderChange = (newProvider: keyof typeof LLM_PROVIDERS) => {
    setProvider(newProvider);
    const config = LLM_PROVIDERS[newProvider];
    setBaseUrl(config.baseUrl);
    setModel(config.model);
    setVisionModel(config.visionModel);
  };

  const handleSave = async () => {
    if (!apiKey.trim()) {
      setMessage({ type: "error", text: "请输入 API Key" });
      return;
    }
    if (!baseUrl.trim()) {
      setMessage({ type: "error", text: "请输入 API 地址" });
      return;
    }
    if (!model.trim()) {
      setMessage({ type: "error", text: "请输入模型名称" });
      return;
    }

    setSaving(true);
    try {
      await invoke("save_llm_config", {
        apiKey: apiKey.trim(),
        baseUrl: baseUrl.trim(),
        model: model.trim(),
        visionModel: visionModel.trim(),
      });
      setMessage({ type: "success", text: "配置保存成功！" });
      setTimeout(() => {
        onSave?.();
        onClose();
      }, 500);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      setMessage({ type: "error", text: `保存失败: ${errorMsg}` });
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/70 backdrop-blur-md" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
        <div className="w-full max-w-md rounded-lg bg-white p-6 border-2 border-slate-300 shadow-[0_24px_64px_rgba(15,23,42,0.35)] pointer-events-auto overflow-y-auto max-h-[90vh] opacity-100">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-foreground">LLM API 配置</h2>
            <button
              onClick={onClose}
              className="text-text-muted hover:text-foreground transition p-1"
              aria-label="Close"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

        {/* 服务商选择 */}
        <div className="mb-4">
          <label className="text-sm font-medium text-foreground block mb-2">服务商</label>
          <div className="grid grid-cols-2 gap-2">
            {(Object.keys(LLM_PROVIDERS) as Array<keyof typeof LLM_PROVIDERS>).map((key) => (
              <button
                key={key}
                onClick={() => handleProviderChange(key)}
                className={`py-2 px-3 rounded text-sm font-medium transition ${
                  provider === key
                    ? "bg-primary text-white"
                    : "bg-surface text-foreground hover:bg-surface/80"
                }`}
              >
                {LLM_PROVIDERS[key].name}
              </button>
            ))}
          </div>
        </div>

        {/* API Key */}
        <div className="mb-4">
          <label className="text-sm font-medium text-foreground block mb-1">API Key *</label>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="输入你的 API Key"
            className="w-full px-3 py-2 border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary text-sm bg-surface"
          />
          {provider !== "custom" && (
            <p className="text-xs text-text-muted mt-1">
              获取 API Key:{" "}
              <a href={LLM_PROVIDERS[provider].docs} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                {LLM_PROVIDERS[provider].docs}
              </a>
            </p>
          )}
        </div>

        {/* API 地址 */}
        <div className="mb-4">
          <label className="text-sm font-medium text-foreground block mb-1">API 地址 *</label>
          <input
            type="text"
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
            placeholder="例: https://api.deepseek.com"
            className="w-full px-3 py-2 border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary text-sm bg-surface"
          />
        </div>

        {/* 模型名称 */}
        <div className="mb-4">
          <label className="text-sm font-medium text-foreground block mb-1">文本模型 *</label>
          <input
            type="text"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            placeholder="例: deepseek-chat"
            className="w-full px-3 py-2 border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary text-sm bg-surface"
          />
        </div>

        {/* 多模态模型（可选） */}
        <div className="mb-4">
          <label className="text-sm font-medium text-foreground block mb-1">多模态模型（可选）</label>
          <input
            type="text"
            value={visionModel}
            onChange={(e) => setVisionModel(e.target.value)}
            placeholder="例: qwen-vl-plus（用于图片识别）"
            className="w-full px-3 py-2 border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary text-sm bg-surface"
          />
        </div>

        {/* 消息 */}
        {message && (
          <div
            className={`mb-4 p-3 rounded text-sm ${
              message.type === "success"
                ? "bg-success/10 text-success border border-success/20"
                : "bg-danger/10 text-danger border border-danger/20"
            }`}
          >
            {message.text}
          </div>
        )}

        {/* 按钮 */}
        <div className="flex gap-2 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-surface text-foreground rounded font-medium hover:bg-surface/80 transition disabled:opacity-50"
            disabled={saving}
          >
            取消
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-primary text-white rounded font-medium hover:bg-primary/90 transition disabled:opacity-50"
          >
            {saving ? "保存中..." : "保存配置"}
          </button>
        </div>
      </div>
      </div>
    </>
  );
};
