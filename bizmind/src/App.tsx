import { useEffect, useState } from "react";
import { FloatingBall } from "./components/FloatingBall";
import { InputWindow } from "./components/InputWindow";
import { KanbanBoard } from "./components/KanbanBoard";
import { SearchBar } from "./components/SearchBar";
import { SearchResults } from "./components/SearchResults";
import { DetailPanel } from "./components/DetailPanel";
import { DebugPanel } from "./components/DebugPanel";
import { ApiSettings } from "./components/ApiSettings";
import { ApiConfigPanel } from "./components/ApiConfigPanel";
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
  const [showApiSettings, setShowApiSettings] = useState(false);
  const [showApiConfig, setShowApiConfig] = useState(false);

  useHotkey();

  // Register Ctrl+Shift+P shortcut for API config panel
  useEffect(() => {
    const enableApiConfig = import.meta.env.VITE_ENABLE_API_CONFIG;
    if (!enableApiConfig) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.shiftKey && event.key === "P") {
        event.preventDefault();
        setShowApiConfig(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Handle Escape key to close windows
  useEffect(() => {
    const isWindowOpen =
      floatingState === "expanded" ||
      floatingState === "processing" ||
      floatingState === "error";

    if (!isWindowOpen) {
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

  const showInput =
    floatingState === "expanded" ||
    floatingState === "processing" ||
    floatingState === "error";

  const handleMessageRefresh = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  const isAnyModalOpen = showInput || selectedMessage || showApiSettings || showApiConfig;
  const blurClass = isAnyModalOpen ? "blur-sm opacity-40 pointer-events-none" : "";

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      {/* Top Navigation */}
      <header className={`sticky top-0 z-30 bg-surface border-b border-border shadow-sm transition-all duration-300 ${blurClass}`}>
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex-1">
            <SearchBar />
          </div>
          <div className="flex gap-2">
            {/* API Config Button (only when enabled) */}
            {import.meta.env.VITE_ENABLE_API_CONFIG && (
              <button
                onClick={() => setShowApiConfig(true)}
                className="px-3 py-2 text-text-muted hover:text-foreground hover:bg-bg-secondary rounded transition"
                title="API Config (Ctrl+Shift+P)"
              >
                cog
              </button>
            )}
            <button
              onClick={() => setShowApiSettings(true)}
              className="px-3 py-2 text-text-muted hover:text-foreground hover:bg-bg-secondary rounded transition"
              title="LLM API Settings"
            >
              settings
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className={`flex-1 overflow-auto bg-background transition-all duration-300 ${blurClass}`}>
        {viewMode === "kanban" ? (
          <KanbanBoard
            key={refreshTrigger}
            onSelectMessage={setSelectedMessage}
          />
        ) : (
          <SearchResults
            results={searchResults}
            onSelectMessage={setSelectedMessage}
          />
        )}
      </main>

      {/* Input Window */}
      {showInput && (
        <InputWindow onClose={close} onSaveSuccess={handleMessageRefresh} />
      )}

      {/* Floating Ball */}
      <FloatingBall />

      {/* Detail Panel */}
      {selectedMessage && (
        <DetailPanel
          message={selectedMessage}
          onClose={() => setSelectedMessage(null)}
          onMessageUpdated={handleMessageRefresh}
        />
      )}

      {/* API Config Panel (New) */}
      {import.meta.env.VITE_ENABLE_API_CONFIG && (
        <ApiConfigPanel
          isOpen={showApiConfig}
          onClose={() => setShowApiConfig(false)}
        />
      )}

      {/* API Settings Panel (Legacy) */}
      <ApiSettings
        isOpen={showApiSettings}
        onClose={() => setShowApiSettings(false)}
        onSave={handleMessageRefresh}
      />

      {/* Debug Panel */}
      <DebugPanel />
    </div>
  );
}

export default App;
