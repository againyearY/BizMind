// FEAT-007: 搜索栏
import { ChangeEvent, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useMessageStore } from "../stores/messageStore";
import type { Message } from "../types";

export const SearchBar = () => {
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const setSearchResults = useMessageStore((state) => state.setSearchResults);
  const setViewMode = useMessageStore((state) => state.setViewMode);

  const handleInputChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);

    if (value.trim() === "") {
      setSearchResults([]);
      setViewMode("kanban");
      return;
    }

    setSearching(true);
    try {
      const results = await invoke<Message[]>("search_messages", {
        query: value,
        limit: 100,
      });
      setSearchResults(results);
      setViewMode("search");
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="px-4 py-3 border-b border-gray-200 bg-white">
      <div className="relative">
        <input
          type="text"
          placeholder="搜索客户名称、项目、金额、内容..."
          value={query}
          onChange={handleInputChange}
          className="w-full px-4 py-2 pr-10 rounded-lg border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {searching && (
          <div className="absolute right-3 top-2.5">
            <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full" />
          </div>
        )}
      </div>
    </div>
  );
};
