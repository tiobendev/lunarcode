import { createNote, editNote, readNote } from "../core/vault.js";
import { chat } from "../core/ollama.js";
import { LunarConfig } from "../commands/open.js";

export async function handleBuild(
  input: string,
  config: LunarConfig
): Promise<string> {
  const system = `You are LunarBuilder, a file creation assistant. You MUST respond with ONLY a JSON object, no other text, no markdown, no explanation.

The JSON must follow this exact format:
{"action":"create","filename":"nome.md","content":"conteudo aqui"}

Rules:
- action is always "create" or "edit"
- filename must end in .md, NO @ symbol in filename
- content must be valid markdown
- NO text outside the JSON object
- NO markdown code blocks
- NO explanation before or after
- In code comments use Brazilian Portuguese
`;

  const raw = await chat(config.model, system, `User request: ${input}`);

  try {
    const clean = raw.replace(/```json/g, "").replace(/```/g, "").trim();
    const jsonMatch = clean.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("JSON não encontrado na resposta");

    const parsed = JSON.parse(jsonMatch[0]) as {
      action: "create" | "edit";
      filename: string;
      content: string;
    };

    // remove @ do filename caso modelo insista
    parsed.filename = parsed.filename.replace(/^@/, "");

    if (parsed.action === "create") {
      const filepath = createNote(config.vault, parsed.filename, parsed.content);
      return `✓ Nota criada: ${parsed.filename}\n  → ${filepath}`;
    }

    if (parsed.action === "edit") {
      const note = await readNote(config.vault, parsed.filename);
      if (!note) return `✗ Nota "${parsed.filename}" não encontrada`;
      editNote(note.filepath, parsed.content);
      return `✓ Nota editada: ${parsed.filename}`;
    }

    return "✗ Ação inválida";
  } catch (e) {
    return `✗ Erro: ${e instanceof Error ? e.message : String(e)}\n\nResposta:\n${raw.slice(0, 200)}`;
  }
}
