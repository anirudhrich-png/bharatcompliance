interface BhashiniASRResponse {
  pipelineResponse: Array<{
    taskType: string;
    output: Array<{
      source: string;
    }>;
  }>;
}

export async function transcribeAudio(
  audioBase64: string,
  language: string
): Promise<{ transcript: string }> {
  const apiKey = process.env.BHASHINI_API_KEY;
  const userId = process.env.BHASHINI_USER_ID;

  if (!apiKey || !userId) {
    throw new Error("BHASHINI_NOT_CONFIGURED");
  }

  const response = await fetch(
    "https://dhruva-api.bhashini.gov.in/services/inference/pipeline",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        userId,
        ulcaApiKey: apiKey,
      },
      body: JSON.stringify({
        pipelineTasks: [
          {
            taskType: "asr",
            config: {
              language: {
                sourceLanguage: language,
              },
            },
          },
        ],
        inputData: {
          audio: [{ audioContent: audioBase64 }],
        },
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Bhashini API error ${response.status}: ${errorText.slice(0, 200)}`);
  }

  const data = (await response.json()) as BhashiniASRResponse;
  const transcript = data.pipelineResponse?.[0]?.output?.[0]?.source ?? "";

  if (!transcript) {
    throw new Error("Bhashini returned empty transcript");
  }

  return { transcript };
}
