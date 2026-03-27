const REST_ENDPOINT = "http://localhost:5000/api/v1/ppt/presentation/generate";

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

export async function generatePresentation(
  params: GenerateParams,
): Promise<GenerateResult> {
  const response = await fetch(REST_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      topic: params.topic,
      n_slides: params.n_slides,
      language: params.language,
      tone: params.tone,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`REST API 錯誤 (${response.status})：${body}`);
  }

  const data = (await response.json()) as {
    presentation_id: string;
    path: string;
  };

  return {
    presentationId: data.presentation_id,
    path: data.path,
  };
}
