import { Command } from "commander";
import ora from "ora";
import { validateEnv } from "../config/env.ts";
import {
  startEngine,
  stopEngine,
  getEngineStatus,
  healthCheck,
} from "../engine/docker.ts";

const start = new Command("start")
  .description("啟動 Presenton 引擎")
  .action(async () => {
    // Validate .env before starting
    const env = validateEnv();
    if (!env.valid) {
      for (const err of env.errors) {
        console.error(`✗ ${err.message}`);
      }
      console.error("\n請先執行 slideforge init 並設定 API Key");
      process.exit(1);
    }

    const spinner = ora("正在啟動引擎...").start();
    try {
      await startEngine();
      spinner.text = "等待引擎健康檢查...";

      // Poll health check with timeout
      const maxAttempts = 30;
      let healthy = false;
      for (let i = 0; i < maxAttempts; i++) {
        healthy = await healthCheck();
        if (healthy) break;
        await Bun.sleep(2000);
      }

      if (healthy) {
        spinner.succeed("引擎已啟動並通過健康檢查 ✓");
      } else {
        spinner.warn("引擎已啟動，但健康檢查尚未通過。請稍後用 slideforge engine status 確認");
      }
    } catch (err) {
      spinner.fail(`啟動失敗：${err instanceof Error ? err.message : String(err)}`);
      process.exit(1);
    }
  });

const stop = new Command("stop")
  .description("停止 Presenton 引擎")
  .action(async () => {
    const spinner = ora("正在停止引擎...").start();
    try {
      await stopEngine();
      spinner.succeed("引擎已停止 ✓");
    } catch (err) {
      spinner.fail(`停止失敗：${err instanceof Error ? err.message : String(err)}`);
      process.exit(1);
    }
  });

const status = new Command("status")
  .description("查看 Presenton 引擎狀態")
  .action(async () => {
    const engineStatus = await getEngineStatus();
    const healthy = engineStatus.running ? await healthCheck() : false;

    console.log("SlideForge 引擎狀態：");
    console.log(`  容器：${engineStatus.running ? "運行中" : "已停止"}${engineStatus.containerName ? ` (${engineStatus.containerName})` : ""}`);
    if (engineStatus.running) {
      console.log(`  API endpoint：http://localhost:5000`);
      console.log(`  健康狀態：${healthy ? "✓ 正常" : "✗ 無回應"}`);
    }
  });

export const engineCommand = new Command("engine")
  .description("管理 Presenton 引擎（start/stop/status）")
  .addCommand(start)
  .addCommand(stop)
  .addCommand(status);
