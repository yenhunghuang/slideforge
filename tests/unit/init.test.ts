import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "fs";
import { join } from "path";

const TEST_DIR = join(import.meta.dir, "__tmp_init_test__");

function runInit(cwd: string) {
  return Bun.spawn(["bun", "run", join(import.meta.dir, "../../src/index.ts"), "init"], {
    cwd,
    stdout: "pipe",
    stderr: "pipe",
  });
}

describe("slideforge init", () => {
  beforeEach(() => {
    mkdirSync(TEST_DIR, { recursive: true });
  });

  afterEach(() => {
    rmSync(TEST_DIR, { recursive: true, force: true });
  });

  test("建立 .env.example 和 .gitignore", async () => {
    const proc = runInit(TEST_DIR);
    await proc.exited;

    expect(existsSync(join(TEST_DIR, ".env.example"))).toBe(true);
    expect(existsSync(join(TEST_DIR, ".gitignore"))).toBe(true);

    const gitignore = readFileSync(join(TEST_DIR, ".gitignore"), "utf-8");
    expect(gitignore).toContain(".env");
  });

  test("建立 .env（從 .env.example 複製）", async () => {
    const proc = runInit(TEST_DIR);
    await proc.exited;

    expect(existsSync(join(TEST_DIR, ".env"))).toBe(true);
    const envContent = readFileSync(join(TEST_DIR, ".env"), "utf-8");
    expect(envContent).toContain("GOOGLE_API_KEY");
  });

  test("重複執行是冪等的", async () => {
    // First run
    await runInit(TEST_DIR).exited;
    const firstEnvExample = readFileSync(join(TEST_DIR, ".env.example"), "utf-8");

    // Second run
    const proc = runInit(TEST_DIR);
    const stdout = await new Response(proc.stdout).text();
    await proc.exited;

    // Files unchanged
    const secondEnvExample = readFileSync(join(TEST_DIR, ".env.example"), "utf-8");
    expect(secondEnvExample).toBe(firstEnvExample);
    expect(stdout).toContain("已存在");
  });

  test("既有 .gitignore 已包含 .env 時不重複加入", async () => {
    writeFileSync(join(TEST_DIR, ".gitignore"), "node_modules\n.env\n");

    await runInit(TEST_DIR).exited;

    const gitignore = readFileSync(join(TEST_DIR, ".gitignore"), "utf-8");
    const envLines = gitignore.split("\n").filter((l) => l.trim() === ".env");
    expect(envLines.length).toBe(1);
  });

  test("既有 .gitignore 缺少 .env 時追加", async () => {
    writeFileSync(join(TEST_DIR, ".gitignore"), "node_modules\n");

    await runInit(TEST_DIR).exited;

    const gitignore = readFileSync(join(TEST_DIR, ".gitignore"), "utf-8");
    expect(gitignore).toContain(".env");
  });
});
