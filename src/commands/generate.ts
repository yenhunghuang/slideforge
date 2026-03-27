import { Command } from "commander";
import ora from "ora";
import { resolve, basename } from "path";
import { existsSync, copyFileSync } from "fs";
import { validateEnv } from "../config/env.ts";
import { healthCheck } from "../engine/docker.ts";
import {
  generatePresentation as mcpGenerate,
  disconnect as mcpDisconnect,
} from "../client/mcp-client.ts";
import { generatePresentation as restGenerate } from "../client/rest-client.ts";

export const generateCommand = new Command("generate")
  .description("從一句話 prompt 生成 PPTX 簡報")
  .argument("<prompt>", "簡報主題描述")
  .option("--slides <number>", "投影片頁數", "8")
  .option("--lang <language>", "簡報語言", "Traditional Chinese")
  .option("--style <tone>", "簡報風格語氣", "professional")
  .option("--output <path>", "輸出檔案路徑")
  .action(async (prompt: string, options) => {
    // 1. Validate API Key
    const env = validateEnv();
    if (!env.valid) {
      for (const err of env.errors) {
        console.error(`✗ ${err.message}`);
      }
      console.error("\n請先執行 slideforge init 並設定 API Key");
      process.exit(1);
    }

    // 2. Check engine health
    const spinner = ora("檢查引擎狀態...").start();
    const healthy = await healthCheck();
    if (!healthy) {
      spinner.fail("引擎未啟動或無回應。請先執行 slideforge engine start");
      process.exit(1);
    }

    // 3. Generate via MCP (fallback to REST)
    spinner.text = `正在生成簡報：「${prompt}」...`;

    const params = {
      topic: prompt,
      n_slides: parseInt(options.slides, 10),
      language: options.lang,
      tone: options.style,
    };

    let result: { presentationId: string; path: string };

    try {
      result = await mcpGenerate(params);
      await mcpDisconnect();
    } catch {
      spinner.text = "MCP 連線失敗，切換至 REST API...";
      try {
        result = await restGenerate(params);
      } catch (restErr) {
        spinner.fail(
          `生成失敗：${restErr instanceof Error ? restErr.message : String(restErr)}`,
        );
        process.exit(1);
      }
    }

    // 4. Copy PPTX from app_data to output location
    const containerPath = result.path; // e.g. /app_data/presentations/xxx/output.pptx
    const hostPath = containerPath.replace(/^\/app_data/, "./app_data");
    const outputPath = resolve(
      options.output ?? `./${sanitizeFilename(prompt)}.pptx`,
    );

    if (existsSync(hostPath)) {
      copyFileSync(hostPath, outputPath);
      spinner.succeed(`簡報已生成：${outputPath}`);
    } else {
      spinner.warn(
        `生成完成但找不到檔案於 ${hostPath}。請檢查 app_data/ 目錄`,
      );
    }
  });

function sanitizeFilename(name: string): string {
  return name
    .replace(/[<>:"/\\|?*]/g, "")
    .replace(/\s+/g, "_")
    .slice(0, 50);
}
