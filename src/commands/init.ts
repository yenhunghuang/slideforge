import { Command } from "commander";
import { existsSync, readFileSync, writeFileSync, copyFileSync } from "fs";
import { resolve } from "path";

const ENV_EXAMPLE = ".env.example";
const ENV_FILE = ".env";
const GITIGNORE = ".gitignore";

export const initCommand = new Command("init")
  .description("初始化 SlideForge 環境設定（.env.example + .gitignore）")
  .action(() => {
    const cwd = process.cwd();

    // 1. Ensure .env.example exists
    const envExamplePath = resolve(cwd, ENV_EXAMPLE);
    if (existsSync(envExamplePath)) {
      console.log(`✓ ${ENV_EXAMPLE} 已存在`);
    } else {
      writeFileSync(
        envExamplePath,
        [
          "# Google API Key — 用於 Gemini LLM 和 Nano Banana Pro 圖像生成",
          "# 取得方式：https://aistudio.google.com/apikey",
          "GOOGLE_API_KEY=your_key_here",
          "",
        ].join("\n"),
      );
      console.log(`✓ 已建立 ${ENV_EXAMPLE}`);
    }

    // 2. Ensure .gitignore contains .env
    const gitignorePath = resolve(cwd, GITIGNORE);
    if (existsSync(gitignorePath)) {
      const content = readFileSync(gitignorePath, "utf-8");
      if (!content.split("\n").some((line) => line.trim() === ".env")) {
        writeFileSync(gitignorePath, content.trimEnd() + "\n.env\n");
        console.log(`✓ 已將 .env 加入 ${GITIGNORE}`);
      } else {
        console.log(`✓ ${GITIGNORE} 已包含 .env`);
      }
    } else {
      writeFileSync(gitignorePath, ".env\n");
      console.log(`✓ 已建立 ${GITIGNORE}（包含 .env）`);
    }

    // 3. Hint: copy .env.example to .env
    const envPath = resolve(cwd, ENV_FILE);
    if (existsSync(envPath)) {
      console.log(`✓ ${ENV_FILE} 已存在`);
    } else {
      copyFileSync(envExamplePath, envPath);
      console.log(`✓ 已複製 ${ENV_EXAMPLE} → ${ENV_FILE}`);
    }

    console.log("\n📝 請編輯 .env 並填入你的 GOOGLE_API_KEY");
  });
