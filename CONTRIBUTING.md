# Contributing to LunarCode

First off, thank you for considering contributing to LunarCode! It's people like you that make it a great tool.

## Code of Conduct

Help us keep this project open and inclusive. Please be respectful and professional in your communications.

## How Can I Contribute?

### Reporting Bugs
If you find a bug, please open an issue and include:
- Your OS and Node.js version.
- Steps to reproduce the bug.
- Actual vs. Expected behavior.

### Suggesting Enhancements
Feature requests are welcome! Please explain the use case and how it benefits most users.

### Pull Requests
1. **Fork** the repository.
2. **Clone** it to your machine.
3. **Install dependencies**: `npm install`.
4. **Create a branch**: `git checkout -b feature/your-feature-name`.
5. **Develop**:
   - We use TypeScript for the logic and Ink (React) for the TUI.
   - Run in development mode: `npm run dev`.
6. **Build**: Ensure it builds without errors: `npm run build`.
7. **Submit**: Push to your fork and submit a PR.

## Development Setup

The project is a standard Node.js TypeScript project.

- Entry point: `src/index.ts`
- Commands: `src/commands/`
- UI: `src/ui/`

### Tools Used
- [Ollama](https://ollama.com/) for Local LLM.
- [Commander.js](https://github.com/tj/commander.js/) for CLI structure.
- [Ink](https://github.com/vadimdemedes/ink) for the terminal UI.
- [Vectra](https://github.com/mitch-denton/vectra) for the future Vector search.

## Style Guide
- Use descriptive variable names.
- Follow the existing project structure.
- Try to keep the UI clean and minimalist.
