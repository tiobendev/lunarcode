import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { glob } from "glob";

export interface Note {
  filename: string;
  filepath: string;
  title: string;
  content: string;
  frontmatter: Record<string, unknown>;
}

export async function readNote(vaultPath: string, filename: string): Promise<Note | null> {
  const clean = filename.replace(/^@/, "");
  const name = clean.endsWith(".md") ? clean : `${clean}.md`;

  // 1. tenta caminho direto
  const directPath = path.join(vaultPath, name);
  if (fs.existsSync(directPath)) {
    const raw = fs.readFileSync(directPath, "utf-8");
    const { data, content } = matter(raw);
    return {
      filename: name,
      filepath: directPath,
      title: (data.title as string) || name.replace(".md", ""),
      content,
      frontmatter: data,
    };
  }

  // 2. lista todos os .md e compara manualmente (resolve acentos/encoding)
  const all = await glob("**/*.md", { cwd: vaultPath });
  const match = all.find(
    (f) => path.basename(f).toLowerCase() === name.toLowerCase()
  );

  if (!match) return null;

  const filepath = path.join(vaultPath, match);
  const raw = fs.readFileSync(filepath, "utf-8");
  const { data, content } = matter(raw);

  return {
    filename: name,
    filepath,
    title: (data.title as string) || name.replace(".md", ""),
    content,
    frontmatter: data,
  };
}

export async function listNotes(vaultPath: string): Promise<string[]> {
  const files = await glob("**/*.md", { cwd: vaultPath });
  return files;
}

export async function searchNotes(vaultPath: string, query: string): Promise<Note[]> {
  const files = await listNotes(vaultPath);
  const q = query.toLowerCase();

  const results: Note[] = [];

  for (const file of files) {
    const filepath = path.join(vaultPath, file);
    const raw = fs.readFileSync(filepath, "utf-8");
    const { data, content } = matter(raw);

    if (content.toLowerCase().includes(q) || file.toLowerCase().includes(q)) {
      results.push({
        filename: path.basename(file),
        filepath,
        title: (data.title as string) || path.basename(file).replace(".md", ""),
        content,
        frontmatter: data,
      });
    }
  }

  return results.slice(0, 5);
}

export function createNote(vaultPath: string, filename: string, content: string): string {
  const name = filename.endsWith(".md") ? filename : `${filename}.md`;
  const filepath = path.join(vaultPath, name);
  fs.writeFileSync(filepath, content, "utf-8");
  return filepath;
}

export function editNote(filepath: string, content: string): void {
  fs.writeFileSync(filepath, content, "utf-8");
}