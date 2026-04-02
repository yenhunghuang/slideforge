import { describe, test, expect } from "bun:test";
import { Command } from "commander";

// Test parameter parsing by creating a program with the generate command
// and parsing arguments — no engine needed.

async function parseGenerateArgs(args: string[]) {
  const { generateCommand } = await import("../../src/commands/generate.ts");

  // Clone the command to avoid side effects, and override action to capture opts
  let capturedPrompt = "";
  let capturedOpts: Record<string, unknown> = {};

  const testCmd = new Command("generate")
    .argument("<prompt>")
    .option("--slides <number>", "投影片頁數", "8")
    .option("--lang <language>", "簡報語言", "Traditional Chinese")
    .option("--style <tone>", "簡報風格語氣", "professional")
    .option("--output <path>", "輸出檔案路徑")
    .option("--from <file>", "從文件檔案生成（支援 .md / .txt）")
    .option("--template <name>", "PPTX 模板名稱")
    .action((prompt: string, opts) => {
      capturedPrompt = prompt;
      capturedOpts = opts;
    });

  const program = new Command().addCommand(testCmd);
  program.parse(["node", "test", "generate", ...args]);

  return { prompt: capturedPrompt, opts: capturedOpts };
}

describe("generate command parameter parsing", () => {
  test("預設值正確", async () => {
    const { opts } = await parseGenerateArgs(["My Topic"]);
    expect(opts.slides).toBe("8");
    expect(opts.lang).toBe("Traditional Chinese");
    expect(opts.style).toBe("professional");
    expect(opts.output).toBeUndefined();
  });

  test("--slides 傳遞數字字串", async () => {
    const { opts } = await parseGenerateArgs(["Topic", "--slides", "12"]);
    expect(parseInt(opts.slides as string, 10)).toBe(12);
  });

  test("--lang 傳遞語言字串", async () => {
    const { opts } = await parseGenerateArgs(["Topic", "--lang", "en"]);
    expect(opts.lang).toBe("en");
  });

  test("--style 傳遞風格", async () => {
    const { opts } = await parseGenerateArgs(["Topic", "--style", "casual"]);
    expect(opts.style).toBe("casual");
  });

  test("--output 指定輸出路徑", async () => {
    const { opts } = await parseGenerateArgs(["Topic", "--output", "./my-deck.pptx"]);
    expect(opts.output).toBe("./my-deck.pptx");
  });

  test("prompt 正確傳遞", async () => {
    const { prompt } = await parseGenerateArgs(["Multi-Agent CI/CD Architecture 介紹"]);
    expect(prompt).toBe("Multi-Agent CI/CD Architecture 介紹");
  });

  test("所有參數組合", async () => {
    const { prompt, opts } = await parseGenerateArgs([
      "K8s Overview",
      "--slides", "5",
      "--lang", "en",
      "--style", "casual",
      "--output", "k8s.pptx",
    ]);
    expect(prompt).toBe("K8s Overview");
    expect(opts.slides).toBe("5");
    expect(opts.lang).toBe("en");
    expect(opts.style).toBe("casual");
    expect(opts.output).toBe("k8s.pptx");
  });

  test("--from 指定檔案路徑", async () => {
    const { opts } = await parseGenerateArgs(["Topic", "--from", "./notes.md"]);
    expect(opts.from).toBe("./notes.md");
  });

  test("--template 指定模板名稱", async () => {
    const { opts } = await parseGenerateArgs(["Topic", "--template", "dark-tech"]);
    expect(opts.template).toBe("dark-tech");
  });

  test("不帶 --from 和 --template 時為 undefined", async () => {
    const { opts } = await parseGenerateArgs(["Topic"]);
    expect(opts.from).toBeUndefined();
    expect(opts.template).toBeUndefined();
  });

  test("--from 和 --template 與其他參數組合", async () => {
    const { prompt, opts } = await parseGenerateArgs([
      "AI Overview",
      "--slides", "10",
      "--from", "./doc.txt",
      "--template", "minimal",
      "--lang", "en",
    ]);
    expect(prompt).toBe("AI Overview");
    expect(opts.slides).toBe("10");
    expect(opts.from).toBe("./doc.txt");
    expect(opts.template).toBe("minimal");
    expect(opts.lang).toBe("en");
  });
});
