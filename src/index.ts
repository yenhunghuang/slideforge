#!/usr/bin/env bun
import { Command } from "commander";
import { initCommand } from "./commands/init.ts";
import { engineCommand } from "./commands/engine.ts";
import { generateCommand } from "./commands/generate.ts";

const program = new Command();

program
  .name("slideforge")
  .version("0.1.0")
  .description("SlideForge — 一句話生成技術簡報的 CLI 工具");

program.addCommand(initCommand);
program.addCommand(engineCommand);
program.addCommand(generateCommand);

// Global error handler
program.exitOverride();
try {
  program.parse();
} catch (err) {
  if (err instanceof Error && "code" in err && err.code === "commander.helpDisplayed") {
    process.exit(0);
  }
  if (err instanceof Error && "code" in err && err.code === "commander.version") {
    process.exit(0);
  }
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
}
