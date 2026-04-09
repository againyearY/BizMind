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
  processed: "bg-green-500",
  unprocessed: "bg-yellow-500",
  archived: "bg-slate-400",
};

const Tag = ({ icon, text, colorClass }: { icon: string; text: string; colorClass: string }) => (
  <div className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${colorClass}`}>
    <span className="mr-1">{icon}</span>
    {text}
  </div>
);

export const KanbanCard = ({ message, onClickCard }: KanbanCardProps) => {
  const statusDotStyle = useMemo(
    () => statusDotColors[message.status] || statusDotColors.unprocessed,
    [message.status]
  );

  const urgencyBorder = message.is_urgent ? "border-l-4 border-destructive" : "border-l-4 border-transparent";

  return (
    <div
      onClick={() => onClickCard(message)}
      className={`group cursor-pointer rounded-lg border border-border bg-card p-3 shadow-sm hover:shadow-md hover:border-primary/50 transition-all ${urgencyBorder}`}
    >
      {/* Header: Icon + Relative Time */}
      <div className="flex items-start justify-between mb-2">
        <span className="text-lg">{sourceChannelIcons[message.source_channel] || sourceChannelIcons.other}</span>
        <span className="text-xs text-text-muted">{formatRelativeTime(message.created_at)}</span>
      </div>

      {/* Summary Text */}
      <div className="mb-3">
        <p className="line-clamp-2 text-sm font-medium text-foreground">
          {message.content_summary || message.content_raw.slice(0, 80)}
        </p>
      </div>

      {/* Tags: Customer/Project/Amount */}
      <div className="flex flex-wrap gap-1 mb-3">
        {message.customer_name && (
          <Tag icon="👤" text={message.customer_name} colorClass="bg-secondary/10 text-secondary" />
        )}
        {message.project_name && (
          <Tag icon="📦" text={message.project_name} colorClass="bg-primary/10 text-primary" />
        )}
        {message.amount && (
          <Tag icon="💰" text={`¥${message.amount.toLocaleString()}`} colorClass="bg-success/10 text-success" />
        )}
      </div>

      {/* Footer: Status Dot + AI Confidence */}
      <div className="flex items-center justify-between pt-2 border-t border-border/50">
        <div className="flex items-center gap-1.5">
          <div className={`h-2 w-2 rounded-full ${statusDotStyle}`} />
          <span className="text-xs text-text-muted capitalize">{message.status}</span>
        </div>
        {message.ai_confidence > 0 && (
          <div className="flex items-center gap-1" title={`AI置信度: ${(message.ai_confidence * 100).toFixed(0)}%`}>
            <div className="w-12 bg-border rounded-full h-1">
              <div className="bg-primary h-1 rounded-full" style={{ width: `${message.ai_confidence * 100}%` }}></div>
            </div>
            <span className="text-xs text-text-muted">{Math.round(message.ai_confidence * 100)}%</span>
          </div>
        )}
      </div>
    </div>
  );
};
