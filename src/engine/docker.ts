const COMPOSE_FILE = "docker-compose.yml";
const ENGINE_URL = "http://localhost:5000";

interface SpawnResult {
  exitCode: number;
  stdout: string;
  stderr: string;
}

async function runCommand(
  cmd: string[],
): Promise<SpawnResult> {
  const proc = Bun.spawn(cmd, {
    stdout: "pipe",
    stderr: "pipe",
  });
  const [stdout, stderr] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
  ]);
  const exitCode = await proc.exited;
  return { exitCode, stdout, stderr };
}

export async function startEngine(): Promise<void> {
  const result = await runCommand([
    "docker", "compose", "-f", COMPOSE_FILE, "up", "-d",
  ]);
  if (result.exitCode !== 0) {
    throw new Error(`引擎啟動失敗：${result.stderr}`);
  }
}

export async function stopEngine(): Promise<void> {
  const result = await runCommand([
    "docker", "compose", "-f", COMPOSE_FILE, "down",
  ]);
  if (result.exitCode !== 0) {
    throw new Error(`引擎停止失敗：${result.stderr}`);
  }
}

export interface EngineStatus {
  running: boolean;
  containerName?: string;
  state?: string;
}

export async function getEngineStatus(): Promise<EngineStatus> {
  const result = await runCommand([
    "docker", "compose", "-f", COMPOSE_FILE, "ps", "--format", "json",
  ]);
  if (result.exitCode !== 0 || result.stdout.trim() === "") {
    return { running: false };
  }

  try {
    // docker compose ps --format json outputs one JSON object per line
    const firstLine = result.stdout.trim().split("\n")[0]!;
    const container = JSON.parse(firstLine) as {
      Name: string;
      State: string;
    };
    return {
      running: container.State === "running",
      containerName: container.Name,
      state: container.State,
    };
  } catch {
    return { running: false };
  }
}

export async function healthCheck(): Promise<boolean> {
  try {
    const response = await fetch(ENGINE_URL, {
      signal: AbortSignal.timeout(5000),
    });
    return response.ok;
  } catch {
    return false;
  }
}
