import { useUiStore } from "../stores/uiStore";

const stateStyles: Record<string, string> = {
  idle: "bg-primary hover:bg-primary-dark shadow-lg",
  processing: "bg-secondary animate-pulse shadow-md",
  success: "bg-success shadow-lg",
  error: "bg-danger shadow-lg",
};

export const FloatingBall = () => {
  const floatingState = useUiStore((state) => state.floatingState);
  const toggleExpanded = useUiStore((state) => state.toggleExpanded);

  if (floatingState === "expanded" || floatingState === "processing" || floatingState === "error") {
    return null;
  }

  const colorClass = stateStyles[floatingState] ?? stateStyles.idle;

  return (
    <button
      type="button"
      onClick={toggleExpanded}
      className={`fixed right-6 bottom-8 z-40 flex h-14 w-14 items-center justify-center rounded-full text-white transition duration-300 focus:outline-none focus:ring-4 focus:ring-primary/30 ${colorClass}`}
      aria-label="快速归档"
      title="Ctrl+Shift+A"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-7 w-7">
        <path d="M12 8V4H8" />
        <rect width="16" height="12" x="4" y="8" rx="2" />
        <path d="M2 14h2" />
        <path d="M20 14h2" />
        <path d="M15 13v2" />
        <path d="M9 13v2" />
      </svg>
    </button>
  );
};
