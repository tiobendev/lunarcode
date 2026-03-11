import fs from "fs";
import path from "path";
import chalk from "chalk";
import readline from "readline";

export async function initCommand() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const question = (q: string): Promise<string> =>
    new Promise((resolve) => rl.question(q, resolve));

  console.log(chalk.magenta("\n🌙 LunarCode — init\n"));

  const vaultPath = await question(
    chalk.gray("Vault path (default: current dir): ")
  );
  const model = await question(
    chalk.gray("Ollama model (default: llama3.2:3b): ")
  );

  rl.close();

  const config = {
    vault: vaultPath || process.cwd(),
    model: model || "llama3.2:3b",
    version: "0.1.0",
  };

  const configPath = path.join(process.cwd(), "lunarcode.config.json");
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

  console.log(chalk.magenta("\n✓ lunarcode.config.json created"));
  console.log(chalk.gray(`  vault → ${config.vault}`));
  console.log(chalk.gray(`  model → ${config.model}`));
  console.log(chalk.gray("\nRun: lunarcode open\n"));
}
