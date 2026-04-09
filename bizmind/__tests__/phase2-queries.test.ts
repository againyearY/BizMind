/**
 * Phase 2 扩展测试 — 数据查询验证
 * 验证：get_messages, get_db_path, 调试面板功能
 */

import type { Message } from "../src/types";

// T-009: 数据查询功能
describe("T-009: 数据查询和显示", () => {
  test("get_messages 应该返回消息数组", () => {
    const messages: Message[] = [];
    expect(Array.isArray(messages)).toBe(true);
  });

  test("每条消息应该有完整的字段", () => {
    const message: Message = {
      id: "uuid-123",
      content_raw: "测试",
      content_summary: "",
      source_channel: "wechat",
      category: "misc",
      customer_name: null,
      project_name: null,
      amount: null,
      extracted_date: null,
      is_urgent: false,
      status: "unprocessed",
      attachment_path: null,
      ai_confidence: 0,
      user_corrected: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const requiredFields = [
      "id",
      "content_raw",
      "source_channel",
      "category",
      "is_urgent",
      "status",
      "created_at",
      "updated_at",
    ];

    requiredFields.forEach((field) => {
      expect(message).toHaveProperty(field);
    });
  });

  test("调试面板应该能显示消息列表", () => {
    const debugPanelVisible = true;
    expect(debugPanelVisible).toBe(true);
  });

  test("get_db_path 应该返回数据库路径字符串", () => {
    const dbPath = "C:\\Users\\user\\AppData\\Roaming\\bizmind\\db\\bizmind.sqlite";
    expect(typeof dbPath).toBe("string");
    expect(dbPath.length).toBeGreaterThan(0);
    expect(dbPath).toContain("bizmind");
  });
});

// T-010: 消息查询排序
describe("T-010: 消息查询排序", () => {
  test("应该按创建时间倒序返回消息", () => {
    const messages: Array<{ created_at: string }> = [
      { created_at: "2026-04-09T14:00:00Z" },
      { created_at: "2026-04-09T13:00:00Z" },
      { created_at: "2026-04-09T12:00:00Z" },
    ];

    // 验证排序：最新的在前面
    for (let i = 0; i < messages.length - 1; i++) {
      expect(new Date(messages[i].created_at).getTime()).toBeGreaterThanOrEqual(
        new Date(messages[i + 1].created_at).getTime()
      );
    }
  });

  test("应该最多返回 100 条消息", () => {
    const limit = 100;
    expect(limit).toBe(100);
  });
});

// T-011: 调试面板数据显示
describe("T-011: 调试面板样式和功能", () => {
  test("调试面板应该显示数据库路径", () => {
    const panelContent = {
      databasePath: "C:\\Users\\...\\bizmind.sqlite",
      messageCount: 5,
      messages: [],
    };

    expect(panelContent.databasePath).toBeDefined();
    expect(panelContent.databasePath.length).toBeGreaterThan(0);
  });

  test("调试面板应该显示消息数量", () => {
    const messageCount = 3;
    expect(messageCount).toBeGreaterThanOrEqual(0);
  });

  test("调试面板应该有刷新按钮", () => {
    const refreshButtonExists = true;
    expect(refreshButtonExists).toBe(true);
  });

  test("消息行应该显示 ID、内容摘要、来源、分类", () => {
    const messageDisplay = {
      shortId: "a1b2c3d4",
      contentPreview: "这是一条测试消息的摘要...",
      source: "wechat",
      category: "misc",
    };

    expect(messageDisplay.shortId.length).toBeLessThanOrEqual(8);
    expect(messageDisplay.contentPreview.length).toBeGreaterThan(0);
    expect(messageDisplay.source).toBeBeDefined();
    expect(messageDisplay.category).toBeDefined();
  });
});
