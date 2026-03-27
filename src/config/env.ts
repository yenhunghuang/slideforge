export function getRequiredEnv(key: string): string {
  const value = process.env[key];
  if (!value || value.trim() === "") {
    throw new EnvError(key);
  }
  return value.trim();
}

export class EnvError extends Error {
  public readonly key: string;

  constructor(key: string) {
    super(`環境變數 ${key} 未設定或為空。請在 .env 檔案中設定此變數。`);
    this.name = "EnvError";
    this.key = key;
  }
}

export function validateEnv(): { valid: boolean; errors: EnvError[] } {
  const requiredKeys = ["GOOGLE_API_KEY"];
  const errors: EnvError[] = [];

  for (const key of requiredKeys) {
    const value = process.env[key];
    if (!value || value.trim() === "") {
      errors.push(new EnvError(key));
    }
  }

  return { valid: errors.length === 0, errors };
}

export function loadEnv(): void {
  // Bun automatically loads .env files, so this is a no-op.
  // Kept as an explicit entry point for future customization.
}
