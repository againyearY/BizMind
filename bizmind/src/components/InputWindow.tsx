import { useMemo, useState } from "react";
import { useUiStore } from "../stores/uiStore";
import { saveMessage } from "../services/db";
import { extractEntityFromText } from "../services/llm";
import type { Message, SourceChannel } from "../types";

const SOURCE_OPTIONS: { label: string; value: SourceChannel }[] = [
  { label: "微信", value: "wechat" },
  { label: "QQ", value: "qq" },
  { label: "邮件", value: "email" },
  { label: "其他", value: "other" },
];

const MAX_CONTENT_LENGTH = 10000;

interface InputWindowProps {
  onClose: () => void;
  onSaveSuccess?: () => void;
}

export const InputWindow = ({ onClose, onSaveSuccess }: InputWindowProps) => {
  const [sourceChannel, setSourceChannel] = useState<SourceChannel>("other");
  const [contentRaw, setContentRaw] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const { floatingState, errorMessage, setProcessing, setSuccess, setError } = useUiStore();

  const trimmedContent = useMemo(() => {
    const trimmed = contentRaw.trim();
    if (trimmed.length > MAX_CONTENT_LENGTH) {
      return trimmed.slice(0, MAX_CONTENT_LENGTH);
    }
    return trimmed;
  }, [contentRaw]);

  const handleSave = async (isUrgent: boolean) => {
    const content = trimmedContent;
    if (!content) {
      setNotice("请输入需要归档的内容");
      return;
    }

    setNotice(null);
    setProcessing();

    const now = new Date().toISOString();
    const message: Message = {
      id: "",
      content_raw: content,
      content_summary: "",
      source_channel: sourceChannel,
      category: "misc",
      customer_name: null,
      project_name: null,
      amount: null,
      extracted_date: null,
      is_urgent: isUrgent,
      status: "unprocessed",
      attachment_path: null,
      ai_confidence: 0,
      user_corrected: false,
      created_at: now,
      updated_at: now,
    };

    try {
      // FEAT-LLM-003: 调用LLM进行实体提取
      const extractionResult = await extractEntityFromText(sourceChannel, content);

      if (extractionResult) {
        // AI分类成功
        message.content_summary = extractionResult.summary;
        message.category = extractionResult.category;
        message.customer_name = extractionResult.customer_name;
        message.project_name = extractionResult.project_name;
        message.amount = extractionResult.amount;
        message.extracted_date = extractionResult.extracted_date;
        message.ai_confidence = Math.min(Math.max(extractionResult.confidence, 0), 1);
        message.status = "processed";
      } else {
        // FEAT-LLM-006: 降级策略 - AI失败则使用defaults
        message.category = "misc";
        message.ai_confidence = 0;
        message.status = "unprocessed";
      }

      // 保存到数据库
      await saveMessage(message);
      console.log("[InputWindow] ✅ 消息保存成功:", message.id, "类别:", message.category, "状态:", message.status);
      setContentRaw("");
      setSuccess();
      
      // 触发看板刷新
      onSaveSuccess?.();
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "归档失败，请稍后重试";
      console.error("[InputWindow] ❌ 归档失败:", errorMsg, error);
      setError(errorMsg);
    }
  };

  const lengthHint = `${trimmedContent.length}/${MAX_CONTENT_LENGTH}`;
  const isProcessing = floatingState === "processing";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md transition-all duration-300"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="w-[680px] rounded-lg bg-white p-6 border-2 border-slate-300 shadow-[0_24px_64px_rgba(15,23,42,0.35)] opacity-100">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-foreground">快速归档</h2>
            <p className="text-sm text-text-muted mt-1">粘贴内容，AI自动分类</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-text-muted bg-bg-secondary px-2 py-1 rounded">Ctrl+Shift+A</span>
            <button
              type="button"
              onClick={onClose}
              className="text-text-muted hover:text-foreground transition p-1 hover:bg-bg-secondary rounded"
              aria-label="关闭"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex gap-2 mb-4">
          {SOURCE_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setSourceChannel(option.value)}
              className={`rounded-lg px-4 py-2 text-sm transition font-medium ${
                sourceChannel === option.value
                  ? "bg-primary text-white shadow-md"
                  : "bg-bg-secondary text-text-secondary hover:bg-border hover:text-foreground"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className="mb-4">
          <textarea
            value={contentRaw}
            onChange={(event) => setContentRaw(event.target.value)}
            placeholder="粘贴微信/QQ/邮件内容，或手动输入..."
            className="h-40 w-full resize-none rounded-lg border border-border p-4 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10 transition bg-surface"
          />
          <div className="mt-2 flex items-center justify-between text-xs">
            <span className={notice ? "text-warning" : errorMessage ? "text-danger" : "text-text-muted"}>
              {notice ?? errorMessage ?? ""}
            </span>
            <span className="text-text-muted">{lengthHint}</span>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm font-medium text-text-secondary hover:bg-bg-secondary transition"
          >
            取消
          </button>
          <button
            type="button"
            onClick={() => handleSave(false)}
            disabled={isProcessing}
            className="rounded-lg bg-primary text-white px-5 py-2 text-sm font-medium hover:bg-primary-dark transition disabled:cursor-not-allowed disabled:bg-text-muted shadow-md hover:shadow-lg"
          >
            {isProcessing ? "归档中..." : "归档"}
          </button>
          <button
            type="button"
            onClick={() => handleSave(true)}
            disabled={isProcessing}
            className="rounded-lg border-2 border-danger text-danger px-5 py-2 text-sm font-medium hover:bg-danger/5 transition disabled:cursor-not-allowed disabled:border-text-muted disabled:text-text-muted"
          >
            🔴 标记紧急
          </button>
        </div>
      </div>
    </div>
  );
};
