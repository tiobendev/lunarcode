import { readNote, searchNotes } from "../core/vault.js";
import { chat } from "../core/ollama.js";
import { LunarConfig } from "../commands/open.js";

function extractMentions(input: string): string[] {
  const matches = input.match(/@[\w\-áàãâéêíóõôúüçÁÀÃÂÉÊÍÓÕÔÚÜÇ\.]+/g) || [];
  return matches;
}

export async function handleAsk(
  input: string,
  config: LunarConfig
): Promise<string> {
  const mentions = extractMentions(input);
  let context = "";
  let notFound: string[] = [];

  if (mentions.length > 0) {
    for (const mention of mentions) {
      const note = await readNote(config.vault, mention);
      if (note) {
        context += `\n\n--- CONTEÚDO DE ${note.filename} ---\n${note.content}\n--- FIM ---`;
      } else {
        notFound.push(mention);
      }
    }
  } else {
    const results = await searchNotes(config.vault, input);
    if (results.length > 0) {
      context = results
        .slice(0, 3)
        .map((n) => `--- ${n.filename} ---\n${n.content.slice(0, 800)}\n--- FIM ---`)
        .join("\n\n");
    }
  }

  if (notFound.length > 0 && context === "") {
    return `✗ Nota(s) não encontrada(s) no vault: ${notFound.join(", ")}`;
  }

  const system = context
    ? `Você é se chama LunarWizard. Um agente especialista em ler, planejar e criar notas em markdown .md | Responda APENAS com base no conteúdo das notas abaixo. NÃO invente informações. Se a nota estiver vazia, diga isso.

NOTAS DO VAULT:
${context}

REGRAS:
- Use SOMENTE o conteúdo acima para responder
- Se não houver informação suficiente, diga "a nota não contém essa informação"
- Responda em português, de forma direta`
    : `Você é o LunarCode. Não há notas relevantes no vault para essa pergunta. Diga isso claramente ao usuário e sugira que ele use @nome-da-nota.md para referenciar uma nota específica.`;

  return await chat(config.model, system, input);
}
