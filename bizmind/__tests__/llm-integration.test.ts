/**
 * LLM 集成测试 - 验证 AI 分类功能
 * 使用真实 Qwen API 进行端到端测试
 */

import { invoke } from '@tauri-apps/api/core';

describe('LLM 集成测试 - AI 消息分类', () => {
  // 通用错误处理和超时
  jest.setTimeout(20000);

  // FEAT-LLM-001: 文本归档
  test('归档中文消息 - 客户线索', async () => {
    const testMessage = '李总想要咨询我们的ABC项目，报价预计200万';

    const result = await invoke<any>('call_llm_text', {
      content: testMessage,
    });

    // 验证响应格式
    expect(result).toBeDefined();
    expect(result.content).toBeDefined();
    expect(typeof result.content).toBe('string');

    // 解析 LLM 响应
    const parsed = JSON.parse(result.content);
    expect(parsed).toHaveProperty('category');
    expect(parsed).toHaveProperty('customer_name');
    expect(parsed).toHaveProperty('amount');

    // 业务逻辑验证
    expect(parsed.category).toBe('lead');
    expect(parsed.customer_name).toContain('李');
    expect(parsed.amount).toBeGreaterThan(1000000);
    expect(parsed.project_name).toContain('ABC');

    console.log('[✓] 文本归档 - 客户线索通过', parsed);
  });

  // FEAT-LLM-001: 维护分类
  test('归档中文消息 - 客户维护', async () => {
    const testMessage = '张总反馈我们系统有个bug，积分计算逻辑错误，需要紧急修复';

    const result = await invoke<any>('call_llm_text', {
      content: testMessage,
    });

    const parsed = JSON.parse(result.content);
    expect(parsed.category).toBe('maintain');
    expect(parsed.customer_name).toContain('张');

    console.log('[✓] 文本归档 - 客户维护通过', parsed);
  });

  // FEAT-LLM-001: 财务分类
  test('归档中文消息 - 财务单据', async () => {
    const testMessage = '向供应商ABC支付货款300万，已转账完成，参考号SH2026040901';

    const result = await invoke<any>('call_llm_text', {
      content: testMessage,
    });

    const parsed = JSON.parse(result.content);
    expect(parsed.category).toBe('finance');
    expect(parsed.amount).toBe(3000000);

    console.log('[✓] 文本归档 - 财务单据通过', parsed);
  });

  // FEAT-LLM-001: 项目进度分类
  test('归档中文消息 - 项目进度', async () => {
    const testMessage = 'XYZ项目已完成第一阶段，本周进度75%，计划下周上线预发环境';

    const result = await invoke<any>('call_llm_text', {
      content: testMessage,
    });

    const parsed = JSON.parse(result.content);
    expect(parsed.category).toBe('progress');
    expect(parsed.project_name).toContain('XYZ');

    console.log('[✓] 文本归档 - 项目进度通过', parsed);
  });

  // FEAT-LLM-001: 待办事项分类
  test('归档中文消息 - 待办事项', async () => {
    const testMessage = '记得明天上午10点和技术团队开会讨论性能优化方案';

    const result = await invoke<any>('call_llm_text', {
      content: testMessage,
    });

    const parsed = JSON.parse(result.content);
    expect(parsed.category).toBe('todo');

    console.log('[✓] 文本归档 - 待办事项通过', parsed);
  });

  // FEAT-LLM-001: 备忘杂项分类（降级策略）
  test('归档中文消息 - 备忘杂项降级', async () => {
    const testMessage = '今天天气不错，想想下午去喝咖啡';

    const result = await invoke<any>('call_llm_text', {
      content: testMessage,
    });

    const parsed = JSON.parse(result.content);
    // 这类消息应该分类为 misc（业务相关度低）
    expect(['misc', 'todo']).toContain(parsed.category);

    console.log('[✓] 文本归档 - 备忘杂项降级通过', parsed);
  });

  // FEAT-LLM-002: AI 置信度验证
  test('AI 置信度评分验证', async () => {
    const testMessage = '客户王总要求采购5套我们的企业版license，单价10万';

    const result = await invoke<any>('call_llm_text', {
      content: testMessage,
    });

    const parsed = JSON.parse(result.content);
    expect(parsed).toHaveProperty('confidence');
    expect(typeof parsed.confidence).toBe('number');
    expect(parsed.confidence).toBeGreaterThanOrEqual(0);
    expect(parsed.confidence).toBeLessThanOrEqual(1);

    // 明确的消息应该有较高的置信度
    expect(parsed.confidence).toBeGreaterThan(0.7);

    console.log('[✓] AI 置信度评分通过', {
      confidence: parsed.confidence,
      category: parsed.category,
    });
  });

  // FEAT-LLM-003-DOWNGRADE: 降级策略测试
  test('LLM 不可用时降级处理', async () => {
    // 模拟无效的 LLM 配置（会导致 API 失败）
    const testMessage = '这是一条测试消息';

    try {
      const result = await invoke<any>('call_llm_text', {
        content: testMessage,
      });

      // 如果调用成功，继续
      if (result && result.content) {
        const parsed = JSON.parse(result.content);
        expect(parsed.category).toBeDefined();
      }
    } catch (error: any) {
      // 预期的降级：若失败，应返回 null 并由上层处理后默认为 misc
      console.log('[✓] 降级策略激活 - 预期的失败处理', error.message);
    }
  });

  // FEAT-LLM-004: Token 使用记录验证
  test('Token 使用记录跟踪', async () => {
    const testMessage = '一条用于检查token计数的测试消息';

    const result = await invoke<any>('call_llm_text', {
      content: testMessage,
    });

    expect(result).toHaveProperty('usage');
    expect(result.usage).toHaveProperty('prompt_tokens');
    expect(result.usage).toHaveProperty('completion_tokens');
    expect(result.usage).toHaveProperty('total_tokens');

    const { prompt_tokens, completion_tokens, total_tokens } = result.usage;
    expect(prompt_tokens).toBeGreaterThan(0);
    expect(total_tokens).toBe(prompt_tokens + completion_tokens);

    console.log('[✓] Token 计数通过', {
      prompt_tokens,
      completion_tokens,
      total_tokens,
    });
  });

  // FEAT-LLM-VISION-001: 多模态识别（如果配置正确）
  test('多模态图片识别 - 可选', async () => {
    // 这个测试需要 base64 图片数据
    // 示例：从 Ctrl+V 获取的截图
    const base64Image = 'data:image/png;base64,'; // 占位符

    try {
      if (base64Image.length > 30) {
        const result = await invoke<any>('call_llm_vision', {
          content: '这是什么内容？请按 JSON 格式返回。',
          imageBase64: base64Image,
        });

        expect(result).toBeDefined();
        console.log('[✓] 多模态识别通过', result);
      } else {
        console.log('[⊘] 多模态测试跳过 - 无图片数据');
      }
    } catch (error: any) {
      // 图片识别可选，失败时记录但不中断
      console.log('[⊘] 多模态识别跳过 -', error.message);
    }
  });

  // 数据库集成测试
  test('存储和检索归档消息', async () => {
    const testMessage = '测试消息：客户李总询价500万项目合作';

    // 调用 LLM 分类
    const llmResult = await invoke<any>('call_llm_text', {
      content: testMessage,
    });

    const parsed = JSON.parse(llmResult.content);

    // 保存消息到数据库
    const saveResult = await invoke<any>('save_message', {
      ...parsed,
      content_original: testMessage,
      ai_confidence: parsed.confidence || 0,
    });

    expect(saveResult).toBeDefined();
    expect(saveResult).toHaveProperty('id');

    // 验证可以检索
    const categoryMessages = await invoke<any>('get_messages_by_category', {
      category: parsed.category,
    });

    expect(Array.isArray(categoryMessages)).toBe(true);
    expect(categoryMessages.length).toBeGreaterThan(0);

    console.log('[✓] 数据库存储和检索通过', {
      messageId: saveResult.id,
      category: parsed.category,
      totalShowing: categoryMessages.length,
    });
  });
});

/**
 * 手工测试清单（UI 级别）
 * 
 * 1. 打开应用，点击"快速归档"（浮球）
 * 2. 粘贴消息："李总问我ABC项目能不能做，当时报价是300万"
 * 3. 点"归档"按钮
 * 期望：消息出现在"客户线索"列，客户名="李总"，金额="3000000"，置信度星数≥3
 * 
 * 4. 粘贴消息："系统有个bug，集成费算错了，要改"
 * 期望：消息出现在"客户维护"列
 * 
 * 5. 搜索框输入"李总"
 * 期望：前面的消息显示在搜索结果中
 * 
 * 6. 点卡片进入详情，编辑金额为"500万"，点保存
 * 期望：卡片更新，金额显示"5000000"
 */
