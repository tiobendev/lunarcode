import { Ollama } from "ollama";

const ollama = new Ollama();

export async function chat(
  model: string,
  systemPrompt: string,
  userMessage: string
): Promise<string> {
  const response = await ollama.chat({
    model,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessage },
    ],
  });

  return response.message.content;
}

export async function streamChat(
  model: string,
  systemPrompt: string,
  userMessage: string,
  onChunk: (chunk: string) => void
): Promise<string> {
  const stream = await ollama.chat({
    model,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessage },
    ],
    stream: true,
  });

  let full = "";
  for await (const chunk of stream) {
    const text = chunk.message.content;
    full += text;
    onChunk(text);
  }

  return full;
}
