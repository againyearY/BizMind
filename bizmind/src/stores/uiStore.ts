import { create } from "zustand";

export type FloatingBallState = "idle" | "expanded" | "processing" | "success" | "error";

interface UiState {
  floatingState: FloatingBallState;
  errorMessage: string | null;
  open: () => void;
  close: () => void;
  toggleExpanded: () => void;
  setProcessing: () => void;
  setSuccess: () => void;
  setError: (message: string) => void;
}

const transitionToIdle = (setState: (state: Partial<UiState>) => void, delayMs: number) => {
  window.setTimeout(() => {
    setState({ floatingState: "idle", errorMessage: null });
  }, delayMs);
};

export const useUiStore = create<UiState>((set, get) => ({
  floatingState: "idle",
  errorMessage: null,
  open: () => set({ floatingState: "expanded", errorMessage: null }),
  close: () => set({ floatingState: "idle", errorMessage: null }),
  toggleExpanded: () => {
    const { floatingState } = get();
    set({ floatingState: floatingState === "expanded" ? "idle" : "expanded", errorMessage: null });
  },
  setProcessing: () => set({ floatingState: "processing", errorMessage: null }),
  setSuccess: () => {
    set({ floatingState: "success", errorMessage: null });
    transitionToIdle(set, 500);
  },
  setError: (message: string) => {
    set({ floatingState: "error", errorMessage: message });
    transitionToIdle(set, 2000);
  },
}));
