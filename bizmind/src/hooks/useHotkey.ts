import { useEffect } from "react";
import { listen } from "@tauri-apps/api/event";
import { useUiStore } from "../stores/uiStore";

export const useHotkey = () => {
  const toggleExpanded = useUiStore((state) => state.toggleExpanded);

  useEffect(() => {
    let unlisten: (() => void) | undefined;

    listen("toggle-floating", () => {
      toggleExpanded();
    }).then((dispose) => {
      unlisten = dispose;
    });

    return () => {
      if (unlisten) {
        unlisten();
      }
    };
  }, [toggleExpanded]);
};
