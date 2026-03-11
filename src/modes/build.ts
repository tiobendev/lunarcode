import { createNote, editNote, readNote, listNotes } from "../core/vault.js";
import { chat, ChatMessage } from "../core/ollama.js";
import { LunarConfig } from "../commands/open.js";

export async function handleBuild(
  history: ChatMessage[],
  config: LunarConfig
): Promise<string> {
  const lastUserMsg = history[history.length - 1].content;
  const notes = await listNotes(config.vault);
  const notesList = notes.slice(0, 20).join(", ");

  const system = `Voce e o LUNARBUILDER.
Sua missao e gerar ou editar arquivos Markdown tecnicos.
PROIBIDO Emojis.

NOTAS NO DISCO: ${notesList || "Nenhuma"}

REGRAS:
1. Responda APENAS com JSON.
2. Formato: {"action": "create" | "edit", "filename": "nome.md", "content": "conteudo completo"}
3. Em "edit", envie o arquivo TODO atualizado.
4. Use Portugues do Brasil.`;

  const finalMessages: ChatMessage[] = [
    { role: "system", content: system },
    { role: "user", content: lastUserMsg }
  ];

  const raw = await chat(config.model, finalMessages);

  try {
    // Limpeza agressiva para encontrar o JSON
    const firstBrace = raw.indexOf('{');
    const lastBrace = raw.lastIndexOf('}');
    
    if (firstBrace === -1 || lastBrace === -1 || lastBrace < firstBrace) {
      throw new Error("O modelo não retornou um comando válido (JSON não encontrado)");
    }

    const jsonString = raw.substring(firstBrace, lastBrace + 1);
    const parsed = JSON.parse(jsonString) as {
      action: "create" | "edit";
      filename: string;
      content: string;
    };

    // remove @ do filename caso modelo insista
    parsed.filename = parsed.filename.replace(/^@/, "");

    if (parsed.action === "create") {
      const filepath = createNote(config.vault, parsed.filename, parsed.content);
      return `Nota criada: ${parsed.filename}\n  -> ${filepath}`;
    }

    if (parsed.action === "edit") {
      const note = await readNote(config.vault, parsed.filename);
      if (!note) return `Nota "${parsed.filename}" nao encontrada`;
      editNote(note.filepath, parsed.content);
      return `Nota editada: ${parsed.filename}`;
    }

    return "Acao invalida";
  } catch (e) {
    return `Erro: ${e instanceof Error ? e.message : String(e)}\n\nResposta:\n${raw.slice(0, 200)}`;
  }
}
