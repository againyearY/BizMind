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
}

export const InputWindow = ({ onClose }: InputWindowProps) => {
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
      setContentRaw("");
      setSuccess();
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "归档失败，请稍后重试";
      setError(errorMsg);
    }
  };

  const lengthHint = `${trimmedContent.length}/${MAX_CONTENT_LENGTH}`;
  const isProcessing = floatingState === "processing";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="w-[680px] rounded-2xl bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">快速归档</h2>
          <span className="text-xs text-slate-500">Ctrl+Shift+A</span>
        </div>

        <div className="mt-4 flex gap-2">
          {SOURCE_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setSourceChannel(option.value)}
              className={`rounded-full px-4 py-1 text-sm transition ${
                sourceChannel === option.value
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className="mt-4">
          <textarea
            value={contentRaw}
            onChange={(event) => setContentRaw(event.target.value)}
            placeholder="粘贴微信/QQ/邮件内容，或手动输入..."
            className="h-44 w-full resize-none rounded-xl border border-slate-200 p-4 text-sm text-slate-900 focus:border-slate-400 focus:outline-none"
          />
          <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
            <span>{notice ?? errorMessage ?? ""}</span>
            <span>{lengthHint}</span>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => handleSave(false)}
            disabled={isProcessing}
            className="rounded-full bg-slate-900 px-5 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {isProcessing ? "归档中..." : "归档"}
          </button>
          <button
            type="button"
            onClick={() => handleSave(true)}
            disabled={isProcessing}
            className="rounded-full border border-rose-200 px-5 py-2 text-sm font-medium text-rose-600 transition hover:border-rose-300 hover:text-rose-700 disabled:cursor-not-allowed"
          >
            归档并标记紧急
          </button>
        </div>
      </div>
    </div>
  );
};
