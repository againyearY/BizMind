import { useEffect, useState } from "react";
import { FloatingBall } from "./components/FloatingBall";
import { InputWindow } from "./components/InputWindow";
import { DebugPanel } from "./components/DebugPanel";
import { KanbanBoard } from "./components/KanbanBoard";
import { SearchBar } from "./components/SearchBar";
import { SearchResults } from "./components/SearchResults";
import { DetailPanel } from "./components/DetailPanel";
import { useHotkey } from "./hooks/useHotkey";
import { useUiStore } from "./stores/uiStore";
import { useMessageStore } from "./stores/messageStore";
import type { Message } from "./types";

function App() {
  const floatingState = useUiStore((state) => state.floatingState);
  const close = useUiStore((state) => state.close);
  const viewMode = useMessageStore((state) => state.viewMode);
  const searchResults = useMessageStore((state) => state.searchResults);
  
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useHotkey();

  useEffect(() => {
    if (floatingState !== "expanded" && floatingState !== "processing" && floatingState !== "error") {
      return;
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        close();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [floatingState, close]);

  const showInput = floatingState === "expanded" || floatingState === "processing" || floatingState === "error";

  const handleMessageRefresh = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      {/* 顶部搜索栏 */}
      <header className="bg-card border-b border-border sticky top-0 z-10">
        <div className="container mx-auto px-4">
          <SearchBar />
        </div>
      </header>

      {/* 主内容区域 */}
      <main className="flex-1 overflow-auto">
        <div className="container mx-auto px-4 h-full">
          {viewMode === "kanban" ? (
            <KanbanBoard key={refreshTrigger} onSelectMessage={setSelectedMessage} />
          ) : (
            <SearchResults results={searchResults} onSelectMessage={setSelectedMessage} />
          )}
        </div>
      </main>

      {/* 浮动球和快速输入 */}
      {showInput && <InputWindow onClose={close} />}
      <FloatingBall />

      {/* 详情面板 */}
      {selectedMessage && (
        <DetailPanel
          message={selectedMessage}
          onClose={() => setSelectedMessage(null)}
          onMessageUpdated={handleMessageRefresh}
        />
      )}

      {/* 调试面板 */}
      {/* <DebugPanel /> */}
    </div>
  );
}

export default App;