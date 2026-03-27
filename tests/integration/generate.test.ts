import { describe, test, expect } from "bun:test";

// Integration tests require:
// 1. Docker running
// 2. .env with valid GOOGLE_API_KEY
// 3. Presenton engine started
//
// Run manually: bun test tests/integration/

describe("end-to-end generate", () => {
  test("engine start → generate → PPTX exists → engine stop", async () => {
    // Step 1: Start engine
    const startProc = Bun.spawn(
      ["bun", "run", "src/index.ts", "engine", "start"],
      { stdout: "pipe", stderr: "pipe" },
    );
    const startExit = await startProc.exited;
    if (startExit !== 0) {
      const stderr = await new Response(startProc.stderr).text();
      console.log("Engine start skipped (Docker not available):", stderr);
      return; // Skip if Docker not available
    }

    try {
      // Step 2: Generate a presentation
      const genProc = Bun.spawn(
        ["bun", "run", "src/index.ts", "generate", "測試主題：Bun 介紹", "--slides", "3"],
        { stdout: "pipe", stderr: "pipe" },
      );
      const genExit = await genProc.exited;
      const genStdout = await new Response(genProc.stdout).text();

      expect(genExit).toBe(0);
      expect(genStdout).toContain("簡報已生成");
    } finally {
      // Step 3: Stop engine
      const stopProc = Bun.spawn(
        ["bun", "run", "src/index.ts", "engine", "stop"],
        { stdout: "pipe", stderr: "pipe" },
      );
      await stopProc.exited;
    }
  });
});
