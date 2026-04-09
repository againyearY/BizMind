// FEAT-007: 搜索结果列表
import type { Message } from "../types";
import { KanbanCard } from "./KanbanCard";

interface SearchResultsProps {
  results: Message[];
  onSelectMessage: (message: Message) => void;
}

export const SearchResults = ({ results, onSelectMessage }: SearchResultsProps) => {
  if (results.length === 0) {
    return (
      <div className="flex items-center justify-center h-96 text-gray-500">
        <div className="text-center">
          <p className="text-lg">未找到匹配的消息</p>
          <p className="text-sm text-gray-400 mt-2">尝试调整搜索关键词</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 p-4">
      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {results.map((message) => (
          <div key={message.id} onClick={() => onSelectMessage(message)} className="cursor-pointer">
            <KanbanCard message={message} onClickCard={onSelectMessage} />
          </div>
        ))}
      </div>
    </div>
  );
};
