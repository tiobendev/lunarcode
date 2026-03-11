import fs from "fs";
import path from "path";
import chalk from "chalk";
import ora from "ora";
import { SemanticMemory } from "../core/memory.js";

export async function indexCommand() {
  const configPath = path.join(process.cwd(), "lunarcode.config.json");

  if (!fs.existsSync(configPath)) {
    console.log(chalk.red("\n✗ lunarcode.config.json not found"));
    console.log(chalk.gray("  Run: lunarcode init\n"));
    process.exit(1);
  }

  const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
  const spinner = ora("Indexando seu vault semanticamente...").start();

  try {
    const memory = new SemanticMemory(config.vault, config.model);
    await memory.indexVault((count, total) => {
      spinner.text = `Indexando: ${count}/${total} notas...`;
    });

    spinner.succeed(chalk.green("Vault indexado com sucesso!"));
    console.log(chalk.gray(`  Local: ${path.join(config.vault, ".lunar")}\n`));
  } catch (error) {
    spinner.fail(chalk.red("Erro na indexação:"));
    console.error(error);
  }
}
