import { LocalIndex } from "vectra";
import path from "path";
import fs from "fs";
import { getEmbeddings } from "./ollama.js";
import { listNotes, readNote } from "./vault.js";
import { Note } from "./vault.js";

export class SemanticMemory {
  private index: LocalIndex;
  private vaultPath: string;
  private model: string;

  constructor(vaultPath: string, model: string) {
    this.vaultPath = vaultPath;
    this.model = model;
    const indexPath = path.join(vaultPath, ".lunar", "index");
    this.index = new LocalIndex(indexPath);
  }

  async ensureIndex() {
    if (!(await this.index.isIndexCreated())) {
      await this.index.createIndex();
    }
  }

  async indexVault(onProgress?: (count: number, total: number) => void) {
    await this.ensureIndex();
    const files = await listNotes(this.vaultPath);
    let count = 0;

    for (const file of files) {
      const note = await readNote(this.vaultPath, file);
      if (note && note.content.trim()) {
        const vector = await getEmbeddings(this.model, note.content.slice(0, 4000));
        await this.index.upsertItem({
          id: note.filepath,
          vector,
          metadata: {
            filename: note.filename,
            filepath: note.filepath,
            title: note.title
          }
        });
      }
      count++;
      if (onProgress) onProgress(count, files.length);
    }
  }

  async search(query: string, limit: number = 3): Promise<Note[]> {
    await this.ensureIndex();
    const vector = await getEmbeddings(this.model, query);
    const results = await this.index.queryItems(vector, limit);

    const notes: Note[] = [];
    for (const item of results) {
      const filepath = item.item.id;
      if (fs.existsSync(filepath)) {
        const raw = fs.readFileSync(filepath, "utf-8");
        // Simplified read to avoid circular deps or re-reading logic
        notes.push({
          filename: path.basename(filepath),
          filepath: filepath,
          title: path.basename(filepath).replace(".md", ""),
          content: raw,
          frontmatter: {}
        });
      }
    }
    return notes;
  }
}
