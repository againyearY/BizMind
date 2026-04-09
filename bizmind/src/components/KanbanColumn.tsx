// FEAT-005: 看板列
import { useState } from "react";
import type { Message, Category } from "../types";
import { KanbanCard } from "./KanbanCard";

interface KanbanColumnProps {
  category: Category;
  title?: string; // Optional for flexibility
  messages: Message[];
  onClickCard: (message: Message) => void;
  onLoadMore: () => void;
  hasMore: boolean;
  loading: boolean;
}

// 分类和标题的mapping
const categoryTitles: Record<Category, string> = {
  lead: "客户线索",
  maintain: "客户维护",
  progress: "项目进度",
  finance: "财务单据",
  todo: "待办事项",
  misc: "备忘杂项",
};

export const KanbanColumn = ({
  category,
  messages,
  onClickCard,
  onLoadMore,
  hasMore,
  loading,
}: KanbanColumnProps) => {
  const [isScrolling, setIsScrolling] = useState(false);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const element = e.currentTarget;
    // 检查是否滚动到底部
    if (element.scrollHeight - element.scrollTop <= element.clientHeight + 100) {
      if (!isScrolling && hasMore && !loading) {
        setIsScrolling(true);
        onLoadMore();
        setIsScrolling(false);
      }
    }
  };

  const title = categoryTitles[category] || category;

  return (
    <div className="flex h-full w-80 flex-col rounded-lg bg-slate-50 shadow-sm">
      {/* 列标题 + badge */}
      <div className="border-b border-slate-200 bg-white px-4 py-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-slate-900">{title}</h3>
          <span className="inline-flex items-center justify-center rounded-full bg-slate-900 px-2.5 py-0.5 text-xs font-medium text-white">
            {messages.length}
          </span>
        </div>
      </div>

      {/* 卡片列表 */}
      <div onScroll={handleScroll} className="flex-1 overflow-y-auto p-3">
        <div className="flex flex-col gap-3">
          {messages.map((message) => (
            <KanbanCard key={message.id} message={message} onClickCard={onClickCard} />
          ))}

          {/* 加载更多提示 */}
          {loading && (
            <div className="flex justify-center py-4">
              <div className="animate-spin">⏳</div>
            </div>
          )}

          {!hasMore && messages.length > 0 && (
            <div className="py-2 text-center text-xs text-slate-500">到底了</div>
          )}

          {messages.length === 0 && !loading && (
            <div className="flex h-32 items-center justify-center text-center">
              <span className="text-sm text-slate-400">暂无数据</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
