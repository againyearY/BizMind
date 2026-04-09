// FEAT-005: 看板主体
import { useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useMessageStore } from "../stores/messageStore";
import type { Category, Message } from "../types";
import { KanbanColumn } from "./KanbanColumn";

interface KanbanBoardProps {
  onSelectMessage: (message: Message) => void;
}

const CATEGORIES: Category[] = ["lead", "maintain", "progress", "finance", "todo", "misc"];
const PAGE_SIZE = 20;

export const KanbanBoard = ({ onSelectMessage }: KanbanBoardProps) => {
  const messages = useMessageStore((state) => state.messages);
  const setMessages = useMessageStore((state) => state.setMessages);
  const addMessages = useMessageStore((state) => state.addMessages);
  const loading = useMessageStore((state) => state.loading);
  const setLoading = useMessageStore((state) => state.setLoading);
  const pageByCategory = useMessageStore((state) => state.pageByCategory);
  const nextPage = useMessageStore((state) => state.nextPage);

  // 初始化：加载所有分类的第一页
  useEffect(() => {
    const loadInitialMessages = async () => {
      setLoading(true);
      try {
        for (const category of CATEGORIES) {
          const result = await invoke<Message[]>("get_messages_by_category", {
            category,
            limit: PAGE_SIZE,
            offset: 0,
          });
          setMessages(category, result);
        }
      } catch (error) {
        console.error("Failed to load initial messages:", error);
      } finally {
        setLoading(false);
      }
    };

    loadInitialMessages();
  }, [setMessages, setLoading]);

  // 处理加载更多
  const handleLoadMore = async (category: Category) => {
    const offset = (pageByCategory[category] + 1) * PAGE_SIZE;

    try {
      const result = await invoke<Message[]>("get_messages_by_category", {
        category,
        limit: PAGE_SIZE,
        offset,
      });

      if (result.length > 0) {
        addMessages(category, result);
        nextPage(category);
      }
    } catch (error) {
      console.error(`Failed to load more messages for ${category}:`, error);
    }
  };

  return (
    <div className="flex h-full gap-4 overflow-x-auto bg-white p-4">
      {CATEGORIES.map((category) => (
        <KanbanColumn
          key={category}
          category={category}
          title=""
          messages={messages[category] || []}
          onClickCard={onSelectMessage}
          onLoadMore={() => handleLoadMore(category)}
          hasMore={(messages[category]?.length || 0) % PAGE_SIZE === 0 && (messages[category]?.length || 0) > 0}
          loading={loading}
        />
      ))}
    </div>
  );
};
