// FEAT-007: 消息状态管理
import { create } from "zustand";
import type { Message, Category } from "../types";

export type MessageViewMode = "kanban" | "search";

export interface MessageState {
  // 数据
  messages: Record<Category, Message[]>;
  searchResults: Message[];

  // 状态
  viewMode: MessageViewMode;
  loading: boolean;
  error: string | null;

  // 分页状态
  pageByCategory: Record<Category, number>;
  pageSize: number;

  // 操作
  setMessages: (category: Category, messages: Message[]) => void;
  addMessages: (category: Category, messages: Message[]) => void;
  setSearchResults: (results: Message[]) => void;
  updateMessage: (updatedMessage: Message) => void;
  deleteMessage: (messageId: string, category?: Category) => void;
  setViewMode: (mode: MessageViewMode) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  nextPage: (category: Category) => void;
  resetPages: () => void;
}

const CATEGORIES: Category[] = ["lead", "maintain", "progress", "finance", "todo", "misc"];

export const useMessageStore = create<MessageState>((set) => {
  // 初始化每个分类为空数组
  const initialMessages: Record<Category, Message[]> = {} as Record<Category, Message[]>;
  CATEGORIES.forEach((cat) => {
    initialMessages[cat] = [];
  });

  const initialPageByCategory: Record<Category, number> = {} as Record<Category, number>;
  CATEGORIES.forEach((cat) => {
    initialPageByCategory[cat] = 0;
  });

  return {
    messages: initialMessages,
    searchResults: [],
    viewMode: "kanban",
    loading: false,
    error: null,
    pageByCategory: initialPageByCategory,
    pageSize: 20,

    setMessages: (category, messages) =>
      set((state) => ({
        messages: { ...state.messages, [category]: messages },
      })),

    addMessages: (category, newMessages) =>
      set((state) => ({
        messages: {
          ...state.messages,
          [category]: [...state.messages[category], ...newMessages],
        },
      })),

    setSearchResults: (results) => set({ searchResults: results }),

    updateMessage: (updatedMessage) =>
      set((state) => {
        const category = updatedMessage.category as Category;
        const messages = state.messages[category].map((msg) =>
          msg.id === updatedMessage.id ? updatedMessage : msg
        );
        return {
          messages: { ...state.messages, [category]: messages },
        };
      }),

    deleteMessage: (messageId, category) =>
      set((state) => {
        if (category) {
          const messages = state.messages[category].filter((msg) => msg.id !== messageId);
          return {
            messages: { ...state.messages, [category]: messages },
          };
        }
        // 如果没有指定category，从所有分类中删除
        const updatedMessages = { ...state.messages };
        CATEGORIES.forEach((cat) => {
          updatedMessages[cat] = updatedMessages[cat].filter((msg) => msg.id !== messageId);
        });
        return { messages: updatedMessages };
      }),

    setViewMode: (mode) => set({ viewMode: mode }),

    setLoading: (loading) => set({ loading }),

    setError: (error) => set({ error }),

    nextPage: (category) =>
      set((state) => ({
        pageByCategory: {
          ...state.pageByCategory,
          [category]: state.pageByCategory[category] + 1,
        },
      })),

    resetPages: () => {
      const newPageByCategory: Record<Category, number> = {} as Record<Category, number>;
      CATEGORIES.forEach((cat) => {
        newPageByCategory[cat] = 0;
      });
      return set({ pageByCategory: newPageByCategory });
    },
  };
});
