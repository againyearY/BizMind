import { useUiStore } from "../stores/uiStore";

const stateStyles: Record<string, string> = {
  idle: "bg-slate-900",
  processing: "bg-amber-500",
  success: "bg-emerald-500",
  error: "bg-rose-500",
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
      className={`fixed right-6 top-1/2 z-40 flex h-14 w-14 -translate-y-1/2 items-center justify-center rounded-full text-white shadow-lg transition ${colorClass}`}
      aria-label="Toggle BizMind"
    >
      <span className="text-sm font-semibold">BM</span>
    </button>
  );
};
