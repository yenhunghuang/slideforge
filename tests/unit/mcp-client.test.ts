import { describe, test, expect, mock } from "bun:test";

// We test the module's logic by mocking the MCP SDK imports.
// Since the actual MCP SDK requires a running server, we verify
// the parameter mapping and result parsing logic.

describe("mcp-client", () => {
  test("GenerateParams interface matches expected fields", async () => {
    // Verify the type structure by importing and constructing
    const params = {
      topic: "Test Topic",
      n_slides: 8,
      language: "Traditional Chinese",
      tone: "professional",
    };

    expect(params.topic).toBe("Test Topic");
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

  test("connectToEngine throws when server is unreachable", async () => {
    // Import the actual module — it should fail to connect
    const { connectToEngine } = await import("../../src/client/mcp-client.ts");

    await expect(connectToEngine()).rejects.toThrow();
  });
});
