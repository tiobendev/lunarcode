import { Ollama } from "ollama";

const ollama = new Ollama();

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export async function chat(
  model: string,
  messages: ChatMessage[]
): Promise<string> {
  const response = await ollama.chat({
    model,
    messages,
  });

  return response.message.content;
}

export async function streamChat(
  model: string,
  messages: ChatMessage[],
  onChunk: (chunk: string) => void
): Promise<string> {
  const stream = await ollama.chat({
    model,
    messages,
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

export async function getEmbeddings(model: string, prompt: string): Promise<number[]> {
  const response = await ollama.embeddings({
    model,
    prompt,
  });
  return response.embedding;
}
