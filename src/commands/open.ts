import fs from "fs";
import path from "path";
import chalk from "chalk";
import { render } from "ink";
import React from "react";
import { App } from "../ui/App.js";

export interface LunarConfig {
  vault: string;
  model: string;
  version: string;
}

export async function openCommand() {
  const configPath = path.join(process.cwd(), "lunarcode.config.json");

  if (!fs.existsSync(configPath)) {
    console.log(chalk.red("\n✗ lunarcode.config.json not found"));
    console.log(chalk.gray("  Run: lunarcode init\n"));
    process.exit(1);
  }

  const config: LunarConfig = JSON.parse(fs.readFileSync(configPath, "utf-8"));

  render(React.createElement(App, { config }));
}
