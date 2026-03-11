import { listNotes } from "../core/vault.js";
import { chat, ChatMessage } from "../core/ollama.js";
import { LunarConfig } from "../commands/open.js";

export async function handlePlan(
  history: ChatMessage[],
  config: LunarConfig
): Promise<string> {
  const lastUserMsg = history[history.length - 1].content;
  const notes = await listNotes(config.vault);
  const notesList = notes.slice(0, 30).join("\n");

  const system = `Voce e o LUNARPLANNER. Ajude a organizar o conhecimento.
PROIBIDO Emojis.

NOTAS NO VAULT:
${notesList || "(Vazio)"}

REGRAS:
- Use bullet points.
- Sugira links [[Nota]].`;

  const finalMessages: ChatMessage[] = [
    { role: "system", content: system },
    ...history.slice(-4)
  ];

  return await chat(config.model, finalMessages);
}
