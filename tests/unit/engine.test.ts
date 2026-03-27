import { describe, test, expect, mock, beforeEach, afterAll } from "bun:test";
import type { EngineStatus } from "../../src/engine/docker.ts";

// Mock Bun.spawn
const originalSpawn = Bun.spawn;

function mockSpawn(exitCode: number, stdout: string, stderr: string = "") {
  // @ts-expect-error — overriding Bun.spawn for test
  Bun.spawn = mock(() => ({
    stdout: new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode(stdout));
        controller.close();
      },
    }),
    stderr: new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode(stderr));
        controller.close();
      },
    }),
    exited: Promise.resolve(exitCode),
  }));
}

describe("docker.ts", () => {
  beforeEach(() => {
    Bun.spawn = originalSpawn;
  });

  afterAll(() => {
    Bun.spawn = originalSpawn;
  });

  test("startEngine calls docker compose up -d", async () => {
    mockSpawn(0, "");
    const { startEngine } = await import("../../src/engine/docker.ts");
    await startEngine();

    expect(Bun.spawn).toHaveBeenCalledWith(
      ["docker", "compose", "-f", "docker-compose.yml", "up", "-d"],
      expect.any(Object),
    );
  });

  test("startEngine throws on non-zero exit code", async () => {
    mockSpawn(1, "", "error: no such service");

    // Re-import to pick up the mock
    // Since modules are cached, we test via direct function call
    const { startEngine } = await import("../../src/engine/docker.ts");
    await expect(startEngine()).rejects.toThrow("引擎啟動失敗");
  });

  test("stopEngine calls docker compose down", async () => {
    mockSpawn(0, "");
    const { stopEngine } = await import("../../src/engine/docker.ts");
    await stopEngine();

    expect(Bun.spawn).toHaveBeenCalledWith(
      ["docker", "compose", "-f", "docker-compose.yml", "down"],
      expect.any(Object),
    );
  });

  test("getEngineStatus parses running container", async () => {
    const containerJson = JSON.stringify({
      Name: "slideforge-presenton-1",
      State: "running",
    });
    mockSpawn(0, containerJson);

    const { getEngineStatus } = await import("../../src/engine/docker.ts");
    const status: EngineStatus = await getEngineStatus();

    expect(status.running).toBe(true);
    expect(status.containerName).toBe("slideforge-presenton-1");
  });

  test("getEngineStatus returns not running on empty output", async () => {
    mockSpawn(0, "");

    const { getEngineStatus } = await import("../../src/engine/docker.ts");
    const status: EngineStatus = await getEngineStatus();

    expect(status.running).toBe(false);
  });
});
