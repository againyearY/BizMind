// Tauri API初始化工具函数

/**
 * 等待Tauri API初始化就绪
 * 在浏览器和Tauri环境中都能正确工作
 */
export const waitForTauriReady = async (maxRetries = 50): Promise<boolean> => {
  let retries = 0;
  while (typeof (window as any).__TAURI__ === "undefined" && retries < maxRetries) {
    await new Promise((resolve) => setTimeout(resolve, 100));
    retries++;
  }
  
  const isReady = typeof (window as any).__TAURI__ !== "undefined";
  if (!isReady) {
    console.warn("[Tauri] API 初始化失败，已超时");
  }
  return isReady;
};

/**
 * 检查Tauri API是否可用
 */
export const isTauriAvailable = (): boolean => {
  return typeof (window as any).__TAURI__ !== "undefined";
};
