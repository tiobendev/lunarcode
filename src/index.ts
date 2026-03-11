#!/usr/bin/env node
import { program } from "commander";
import { initCommand } from "./commands/init.js";
import { openCommand } from "./commands/open.js";
import { indexCommand } from "./commands/index.js";

program
  .name("lunarcode")
  .description("AI-powered CLI for your Obsidian vault")
  .version("0.1.0");

program
  .command("init")
  .description("Initialize LunarCode in your vault")
  .action(initCommand);

program
  .command("open")
  .description("Open LunarCode terminal")
  .action(openCommand);

program
  .command("index")
  .description("Index your vault for semantic search")
  .action(indexCommand);
program.parse();
