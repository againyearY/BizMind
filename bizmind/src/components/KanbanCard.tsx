// FEAT-005: 看板卡片
import { useMemo } from "react";
import type { Message } from "../types";

interface KanbanCardProps {
  message: Message;
  onClickCard: (message: Message) => void;
}

// 来源频道icon mapping
const sourceChannelIcons: Record<string, string> = {
  wechat: "💬",
  qq: "🐧",
  email: "📧",
  telegram: "✈️",
  other: "📝",
};

// 相对时间格式化
const formatRelativeTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return "刚刚";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}分钟前`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}小时前`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}天前`;
  return date.toLocaleDateString();
};

// 状态点颜色
const statusDotColors: Record<string, string> = {
  processed: "bg-emerald-500",
  unprocessed: "bg-amber-500",
  archived: "bg-slate-400",
};

export const KanbanCard = ({ message, onClickCard }: KanbanCardProps) => {
  const statusDotStyle = useMemo(
    () => statusDotColors[message.status] || statusDotColors.unprocessed,
    [message.status]
  );

  const urgencyBorder = message.is_urgent ? "border-l-4 border-l-rose-500" : "";

  return (
    <div
      onClick={() => onClickCard(message)}
      className={`group cursor-pointer rounded-lg border border-slate-200 bg-white p-3 shadow-sm transition hover:shadow-md ${urgencyBorder}`}
    >
      {/* 头部：icon + 相对时间 */}
      <div className="flex items-start justify-between">
        <span className="text-lg">{sourceChannelIcons[message.source_channel] || sourceChannelIcons.other}</span>
        <span className="text-xs text-slate-500">{formatRelativeTime(message.created_at)}</span>
      </div>

      {/* 摘要文本 */}
      <div className="mt-2">
        <p className="line-clamp-2 text-sm text-slate-900">
          {message.content_summary || message.content_raw.slice(0, 60)}
        </p>
      </div>

      {/* 标签：客户/项目/金额 */}
      <div className="mt-2 flex flex-wrap gap-1">
        {message.customer_name && (
          <span className="inline-block rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700">
            👤 {message.customer_name}
          </span>
        )}
        {message.project_name && (
          <span className="inline-block rounded-full bg-purple-100 px-2 py-0.5 text-xs text-purple-700">
            📦 {message.project_name}
          </span>
        )}
        {message.amount && (
          <span className="inline-block rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700">
            💰 ¥{message.amount.toLocaleString()}
          </span>
        )}
      </div>

      {/* 底部：状态点 + AI置信度 */}
      <div className="mt-2 flex items-center justify-between">
        <div className={`h-2 w-2 rounded-full ${statusDotStyle}`} />
        {message.ai_confidence > 0 && (
          <span className="text-xs text-slate-500">
            AI {'⭐'.repeat(Math.ceil(message.ai_confidence * 5))} {(message.ai_confidence * 100).toFixed(0)}%
          </span>
        )}
      </div>
    </div>
  );
};
