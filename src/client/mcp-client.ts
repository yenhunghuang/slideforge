import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

const MCP_ENDPOINT = "http://localhost:5000/mcp";

export interface GenerateParams {
  topic: string;
  n_slides: number;
  language: string;
  tone: string;
}

export interface GenerateResult {
  presentationId: string;
  path: string;
}

let client: Client | null = null;

export async function connectToEngine(): Promise<Client> {
  if (client) return client;

  const transport = new StreamableHTTPClientTransport(new URL(MCP_ENDPOINT));
  client = new Client({ name: "slideforge", version: "0.1.0" });
  await client.connect(transport);
  return client;
}

export async function generatePresentation(
  params: GenerateParams,
): Promise<GenerateResult> {
  const c = await connectToEngine();

  const result = await c.callTool({
    name: "generate_presentation",
    arguments: {
      topic: params.topic,
      n_slides: params.n_slides,
      language: params.language,
      tone: params.tone,
    },
  });

  // Parse the MCP tool result
  const content = result.content as Array<{ type: string; text?: string }>;
  const textContent = content.find((c) => c.type === "text");
  if (!textContent?.text) {
    throw new Error("MCP 回傳格式異常：缺少 text content");
  }

  const parsed = JSON.parse(textContent.text) as {
    presentation_id: string;
    path: string;
  };

  return {
    presentationId: parsed.presentation_id,
    path: parsed.path,
  };
}

export async function disconnect(): Promise<void> {
  if (client) {
    await client.close();
    client = null;
  }
}
