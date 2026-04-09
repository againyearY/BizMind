// FEAT-006: 消息详情面板
import { useEffect, useState } from "react";
import type { Message } from "../types";
import { invoke } from "@tauri-apps/api/core";
import { useMessageStore } from "../stores/messageStore";

interface DetailPanelProps {
  message: Message | null;
  onClose: () => void;
  onMessageUpdated: () => void;
}

const CATEGORIES = ["lead", "maintain", "progress", "finance", "todo", "misc"];
const STATUSES = ["unprocessed", "processed", "archived"];

export const DetailPanel = ({ message, onClose, onMessageUpdated }: DetailPanelProps) => {
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState<Message | null>(null);
  const updateMessage = useMessageStore((state) => state.updateMessage);
  const deleteMessage = useMessageStore((state) => state.deleteMessage);

  useEffect(() => {
    setFormData(message);
  }, [message]);

  if (!message || !formData) return null;

  const handleSave = async () => {
    try {
      await invoke("update_message", { message: formData });
      updateMessage(formData);
      setEditing(false);
      onMessageUpdated();
    } catch (error) {
      console.error("Failed to update message:", error);
    }
  };

  const handleDelete = async () => {
    if (!confirm("确定要删除这条消息吗？")) return;

    try {
      await invoke("delete_message", { messageId: message.id });
      deleteMessage(message.id);
      onClose();
      onMessageUpdated();
    } catch (error) {
      console.error("Failed to delete message:", error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/30 z-50 flex items-end">
      {/* Overlay */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Panel */}
      <div className="relative w-full sm:w-96 bg-white shadow-lg max-h-screen overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex justify-between items-center">
          <h2 className="text-lg font-semibold">消息详情</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Source & Time */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <label className="text-gray-600 block mb-1">来源</label>
              <p className="font-medium">{message.source_channel || "-"}</p>
            </div>
            <div>
              <label className="text-gray-600 block mb-1">时间</label>
              <p className="text-gray-600">{new Date(message.created_at).toLocaleString()}</p>
            </div>
          </div>

          {/* Original Content */}
          <div>
            <label className="text-gray-600 text-sm block mb-1">原始内容</label>
            <div className="bg-gray-50 p-3 rounded border border-gray-200 text-sm text-gray-700 max-h-32 overflow-y-auto whitespace-pre-wrap break-words">
              {message.content_raw}
            </div>
          </div>

          {/* Editable Fields */}
          {editing ? (
            <>
              <div>
                <label className="text-gray-600 text-sm block mb-1">分类</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-gray-600 text-sm block mb-1">状态</label>
                <select
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      status: e.target.value as any,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-gray-600 text-sm block mb-1">客户名称</label>
                <input
                  type="text"
                  value={formData.customer_name || ""}
                  onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="text-gray-600 text-sm block mb-1">项目名称</label>
                <input
                  type="text"
                  value={formData.project_name || ""}
                  onChange={(e) => setFormData({ ...formData, project_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="text-gray-600 text-sm block mb-1">金额</label>
                <input
                  type="number"
                  value={formData.amount || ""}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value ? parseFloat(e.target.value) : 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="text-gray-600 text-sm block mb-1">摘要</label>
                <textarea
                  value={formData.content_summary || ""}
                  onChange={(e) => setFormData({ ...formData, content_summary: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700"
                >
                  保存
                </button>
                <button
                  onClick={() => setEditing(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded text-sm font-medium hover:bg-gray-300"
                >
                  取消
                </button>
              </div>
            </>
          ) : (
            <>
              {/* View Mode */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <label className="text-gray-600 block mb-1">分类</label>
                  <p className="font-medium">{message.category}</p>
                </div>
                <div>
                  <label className="text-gray-600 block mb-1">状态</label>
                  <p className="font-medium">{message.status}</p>
                </div>
              </div>

              {message.customer_name && (
                <div>
                  <label className="text-gray-600 text-sm block mb-1">客户</label>
                  <p>{message.customer_name}</p>
                </div>
              )}

              {message.project_name && (
                <div>
                  <label className="text-gray-600 text-sm block mb-1">项目</label>
                  <p>{message.project_name}</p>
                </div>
              )}

              {message.amount && (
                <div>
                  <label className="text-gray-600 text-sm block mb-1">金额</label>
                  <p className="font-medium text-green-600">{message.amount}</p>
                </div>
              )}

              {message.content_summary && (
                <div>
                  <label className="text-gray-600 text-sm block mb-1">摘要</label>
                  <p className="text-sm">{message.content_summary}</p>
                </div>
              )}

              <div className="text-sm bg-blue-50 p-3 rounded">
                <label className="text-gray-600 block mb-1">AI 信度</label>
                <div className="flex items-center gap-2">
                  <div className="text-xl">{"⭐".repeat(Math.round(message.ai_confidence || 0))}</div>
                  <span className="text-gray-600">{Math.round((message.ai_confidence || 0) * 100)}%</span>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  onClick={() => setEditing(true)}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700"
                >
                  编辑
                </button>
                <button
                  onClick={handleDelete}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded text-sm font-medium hover:bg-red-700"
                >
                  删除
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
