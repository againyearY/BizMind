import { useEffect, useState } from "react";
import { getMessages, getDbPath } from "../services/db";
import type { Message } from "../types";

export const DebugPanel = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [dbPath, setDbPath] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const loadMessages = async () => {
    setIsLoading(true);
    try {
      const msgs = await getMessages();
      const path = await getDbPath();
      setMessages(msgs);
      setDbPath(path);
    } catch (error) {
      console.error("Failed to load messages:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isExpanded) {
      loadMessages();
    }
  }, [isExpanded]);

  return (
    <div className="fixed bottom-4 right-4 z-30 bg-white rounded-lg shadow-lg border border-slate-200">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-2 font-semibold text-left bg-slate-900 text-white rounded-t-lg hover:bg-slate-800 flex items-center justify-between"
      >
        <span>🐛 调试面板</span>
        <span className="text-xs">{isExpanded ? "▼" : "▶"}</span>
      </button>

      {isExpanded && (
        <div className="w-96 max-h-96 overflow-auto p-4">
          <div className="mb-3">
            <button
              onClick={loadMessages}
              disabled={isLoading}
              className="w-full bg-blue-500 text-white px-3 py-2 rounded text-sm font-medium hover:bg-blue-600 disabled:bg-slate-400"
            >
              {isLoading ? "加载中..." : "刷新数据"}
            </button>
          </div>

          <div className="mb-3 p-2 bg-slate-100 rounded text-xs">
            <div className="font-semibold text-slate-700">数据库路径:</div>
            <div className="text-slate-600 break-all mt-1">{dbPath || "加载中..."}</div>
          </div>

          <div className="mb-2">
            <div className="font-semibold text-slate-700 text-sm">
              已保存的消息 ({messages.length} 条)
            </div>
          </div>

          {messages.length === 0 ? (
            <div className="text-slate-500 text-sm italic">没有消息</div>
          ) : (
            <div className="space-y-2">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className="border border-slate-200 rounded p-2 bg-slate-50 text-xs"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-slate-700 truncate flex-1">
                      {msg.content_raw.substring(0, 30)}...
                    </span>
                    <span className="ml-2 px-2 py-0.5 bg-slate-200 rounded text-slate-600">
                      {msg.source_channel}
                    </span>
                  </div>
                  <div className="text-slate-600 grid grid-cols-2 gap-1">
                    <div>ID: {msg.id.substring(0, 8)}...</div>
                    <div>分类: {msg.category}</div>
                    <div>紧急: {msg.is_urgent ? "是" : "否"}</div>
                    <div>状态: {msg.status}</div>
                  </div>
                  <div className="text-slate-500 mt-1">
                    {new Date(msg.created_at).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
