import { readNote, listNotes } from "../core/vault.js";
import { chat, ChatMessage } from "../core/ollama.js";
import { LunarConfig } from "../commands/open.js";
import { SemanticMemory } from "../core/memory.js";

function extractMentions(input: string): string[] {
  const matches = input.match(/@[\w\-áàãâéêíóõôúüçÁÀÃÂÉÊÍÓÕÔÚÜÇ\.]+/g) || [];
  return matches;
}

function extractWikiLinks(content: string): string[] {
  const matches = content.match(/\[\[(.*?)\]\]/g) || [];
  return matches.map(m => m.slice(2, -2).split("|")[0].trim());
}

export async function handleAsk(
  history: ChatMessage[],
  config: LunarConfig
): Promise<string> {
  const lastUserMsg = history[history.length - 1].content;
  const mentions = extractMentions(lastUserMsg);
  let context = "";
  let notFound: string[] = [];

  const allNotes = await listNotes(config.vault);

  if (mentions.length > 0) {
    const processedNotes = new Set<string>();
    for (const mention of mentions) {
      const note = await readNote(config.vault, mention);
      if (note && !processedNotes.has(note.filepath)) {
        processedNotes.add(note.filepath);
        context += `\n[ARQUIVO: ${note.filename}]\n${note.content}\n`;

        const deepLinks = extractWikiLinks(note.content);
        for (const link of deepLinks) {
          const linkedNote = await readNote(config.vault, link);
          if (linkedNote && !processedNotes.has(linkedNote.filepath)) {
            processedNotes.add(linkedNote.filepath);
            context += `\n[CONTEÚDO VINCULADO: ${linkedNote.filename}]\n${linkedNote.content.slice(0, 500)}...\n`;
          }
        }
      } else if (!note) {
        notFound.push(mention);
      }
    }
  } else {
    // Busca semântica apenas se não houver menções diretas
    const memory = new SemanticMemory(config.vault, config.model);
    const results = await memory.search(lastUserMsg);
    if (results.length > 0) {
      context = results
        .map((n) => `[NOTA RELEVANTE: ${n.filename}]\n${n.content.slice(0, 1000)}`)
        .join("\n\n");
    }
  }

  if (notFound.length > 0 && context === "") {
    return `Nota(s) nao encontrada(s): ${notFound.join(", ")}`;
  }

  const system = `Voce e o LUNAR.
Responda de forma tecnica e direta, sem emoticons ou emojis.
Sua unica fonte de verdade e o CONTEXTO abaixo.

LISTA DE ARQUIVOS NO DISCO:
${allNotes.join(", ")}

CONTEXTO DISPONIVEL:
${context || "Vazio."}

REGRAS:
1. Responda em Portugues do Brasil.
2. Se a informacao estiver no CONTEXTO, use-a. 
3. Se perguntarem o que tem no vault, liste os arquivos da lista acima.
4. Nunca admita que e uma IA.
5. Seja suscinto e preciso.`;

  const finalMessages: ChatMessage[] = [
    { role: "system", content: system },
    ...history.slice(-6) // Mantém as últimas 6 interações
  ];

  return await chat(config.model, finalMessages);
}
