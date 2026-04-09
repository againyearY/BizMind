import { invoke } from "@tauri-apps/api/core";
import type { Message } from "../types";

export const saveMessage = async (message: Message) => {
  try {
    await invoke("save_message", { message });
  } catch (error) {
    console.error("save_message failed", error);
    window.alert("归档失败，请稍后重试");
    throw error;
  }
};

export const getMessages = async (): Promise<Message[]> => {
  try {
    const messages = await invoke<Message[]>("get_messages");
    return messages;
  } catch (error) {
    console.error("get_messages failed", error);
    return [];
  }
};

export const getDbPath = async (): Promise<string> => {
  try {
    const path = await invoke<string>("get_db_path");
    return path;
  } catch (error) {
    console.error("get_db_path failed", error);
    return "";
  }
};
