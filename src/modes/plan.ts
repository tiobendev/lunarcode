import { listNotes } from "../core/vault.js";
import { chat } from "../core/ollama.js";
import { LunarConfig } from "../commands/open.js";

export async function handlePlan(
  input: string,
  config: LunarConfig
): Promise<string> {
  const notes = await listNotes(config.vault);
  const notesList = notes.slice(0, 30).join("\n");

  const system = `Você é o LunarPlanner no modo PLAN. Você ajuda o usuário a planejar projetos, estudos e sistemas dentro do Obsidian.
Você tem acesso à lista de notas do vault. Use isso para sugerir conexões e estruturas.
Seja direto, prático e estruturado. Responda em português.

Notas disponíveis no vault:
${notesList || "(vault vazio)"}`;

  const response = await chat(config.model, system, input);
  return response;
}
