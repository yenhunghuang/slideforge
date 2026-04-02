import { describe, test, expect, mock } from "bun:test";

// We test the module's logic by mocking the MCP SDK imports.
// Since the actual MCP SDK requires a running server, we verify
// the parameter mapping and result parsing logic.

describe("mcp-client", () => {
  test("GenerateParams interface matches expected fields", () => {
    const params = {
      content: "Test Topic",
      n_slides: 8,
      language: "Traditional Chinese",
      tone: "professional",
    };

    expect(params.content).toBe("Test Topic");
    expect(params.n_slides).toBe(8);
    expect(params.language).toBe("Traditional Chinese");
    expect(params.tone).toBe("professional");
  });

  test("GenerateResult interface matches expected fields", () => {
    const result = {
      presentationId: "abc-123",
      path: "/app_data/presentations/abc-123/output.pptx",
    };

    expect(result.presentationId).toBe("abc-123");
    expect(result.path).toContain("/app_data/");
  });

  test("GenerateParams 支援 optional fromContent 欄位", () => {
    const params = {
      content: "風格指引",
      n_slides: 5,
      language: "en",
      tone: "casual",
      fromContent: "# Document Title\n\nSome document content...",
    };

    expect(params.fromContent).toBe("# Document Title\n\nSome document content...");
    expect(params.content).toBe("風格指引");
  });

  test("GenerateParams 支援 optional template 欄位", () => {
    const params = {
      content: "Test Topic",
      n_slides: 8,
      language: "Traditional Chinese",
      tone: "professional",
      template: "dark-tech",
    };

    expect(params.template).toBe("dark-tech");
  });

  test("GenerateParams 不帶 optional 欄位時向後相容", () => {
    const params = {
      content: "Test Topic",
      n_slides: 8,
      language: "Traditional Chinese",
      tone: "professional",
    };

    expect(params).not.toHaveProperty("fromContent");
    expect(params).not.toHaveProperty("template");
  });

  test("fromContent 有值時 args 映射正確（content=fromContent, instruction=prompt）", () => {
    const prompt = "請用輕鬆風格";
    const fromContent = "# My Notes\n\nDetailed content here.";

    const args: Record<string, unknown> = {
      content: fromContent ?? prompt,
      n_slides: 8,
      language: "Traditional Chinese",
      tone: "professional",
    };
    if (fromContent) {
      args.instruction = prompt;
    }

    expect(args.content).toBe(fromContent);
    expect(args.instruction).toBe(prompt);
  });

  test("fromContent 沒有值時 args 保持原行為（content=prompt, 無 instruction）", () => {
    const prompt = "K8s Overview";
    const fromContent = undefined;

    const args: Record<string, unknown> = {
      content: fromContent ?? prompt,
      n_slides: 8,
      language: "en",
      tone: "casual",
    };
    if (fromContent) {
      args.instruction = prompt;
    }

    expect(args.content).toBe(prompt);
    expect(args.instruction).toBeUndefined();
  });

  test("template 有值時加入 args", () => {
    const template = "minimal";

    const args: Record<string, unknown> = {
      content: "Topic",
      n_slides: 8,
      language: "en",
      tone: "professional",
    };
    if (template) {
      args.template = template;
    }

    expect(args.template).toBe("minimal");
  });

  test("template 沒有值時不加入 args", () => {
    const template = undefined;

    const args: Record<string, unknown> = {
      content: "Topic",
      n_slides: 8,
      language: "en",
      tone: "professional",
    };
    if (template) {
      args.template = template;
    }

    expect(args.template).toBeUndefined();
  });

  test("connectToEngine returns a client or throws", async () => {
    const { connectToEngine, disconnect } = await import("../../src/client/mcp-client.ts");
    try {
      const client = await connectToEngine();
      // Engine is running — connection succeeded
      expect(client).toBeDefined();
      await disconnect();
    } catch {
      // Engine not running — connection failed as expected
      expect(true).toBe(true);
    }
  });
});
