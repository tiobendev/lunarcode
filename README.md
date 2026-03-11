# 🌙 LunarCode

O LunarCode é um agente CLI movido a IA criado para transformar suas notas em Markdown (vaults do Obsidian) em uma base de conhecimento interativa, usando o **Ollama** localmente.

Diretamente do seu terminal, você pode fazer perguntas sobre suas notas, planejar novos projetos e automatizar a criação de conteúdo — tudo processado localmente para manter sua privacidade.

[![License: Personal/Non-Redistributable](https://img.shields.io/badge/License-Custom--Restrictive-red.svg)](./LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![Ollama](https://img.shields.io/badge/Ollama-necessário-blue.svg)](https://ollama.com/)

---

## ✨ Funcionalidades

- **Privacidade em Primeiro Lugar**: Suas notas nunca saem da sua máquina.
- **Consciência de Contexto**: Mencione notas específicas usando `@nome-da-nota.md` para dar contexto direto à IA.
- **Busca Integrada**: Recupera automaticamente trechos relevantes do seu vault se nenhuma nota específica for mencionada (RAG básico).
- **Interface TUI**: Uma interface de terminal bonita construída com **Ink** (React para CLI).
- **Multi-Modos**:
  - `ask`: Faça perguntas sobre sua base de conhecimento.
  - `plan`: Planejamento de projetos e geração de estruturas.
  - `build`: Criação e edição rápida de notas.

---

## 🚀 Início Rápido

### Pré-requisitos

1.  **Instalar o [Ollama](https://ollama.com/)**:
    - **Linux**: Execute `curl -fsSL https://ollama.com/install.sh | sh`
    - **macOS/Windows**: Baixe o instalador direto no site oficial.
2.  **Baixar um modelo**: O LunarCode usa por padrão o `llama3.2:3b`. Baixe-o executando:
    ```bash
    ollama pull llama3.2
    ```
3.  **Certificar que está rodando**: O Ollama geralmente inicia um servidor automaticamente. Você pode verificar acessando `http://localhost:11434` no seu navegador. Se aparecer "Ollama is running", está tudo certo!

### Instalação do LunarCode

```bash
git clone https://github.com/seu-usuario/lunarcode.git
cd lunarcode
npm install
npm run build
npm link
```

### Como Usar

1. **Inicialize** no seu vault:
   ```bash
   cd /caminho/do/seu/vault
   lunarcode init
   ```
2. **Abra** o terminal interativo:
   ```bash
   lunarcode open
   ```

*Dica: Este repositório inclui uma pasta `/lunarvault` com notas de exemplo para teste rápido.*

---

## 🛠 Estrutura do Projeto

- `src/core/`: Lógica principal para gerenciamento do vault e integração com Ollama.
- `src/commands/`: Definições de comandos CLI (usando `commander`).
- `src/modes/`: Comportamentos do agente (`ask`, `plan`, `build`).
- `src/ui/`: Componentes de interface construídos com **Ink**.

---

## 🤝 Contribuição

Este projeto está aberto para contribuições! Seja adicionando um novo modo, melhorando a performance do RAG ou corrigindo bugs na interface.

1. Faça um Fork do projeto
2. Crie uma branch para sua funcionalidade (`git checkout -b feature/nova-funcionalidade`)
3. Faça o commit das suas mudanças (`git commit -m 'Adiciona nova funcionalidade'`)
4. Envie para o GitHub (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

Veja mais detalhes em [CONTRIBUTING.md](./CONTRIBUTING.md).

---

## 🗺 Roadmap

- [ ] Integração completa com busca vetorial (usando `vectra`).
- [ ] Suporte para múltiplas notas simultâneas.
- [ ] Configuração de system prompts customizados.
- [ ] Exportação de histórico de chat para markdown.
- [ ] Criar sessão de chat com save, load e delete.

---

## 📄 Licença

Distribuído sob a licença MIT. Veja `LICENSE` para mais informações.

---