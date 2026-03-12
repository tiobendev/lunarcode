# LunarCode v0.2.1

O LunarCode e um agente de linha de comando (CLI) criado para transformar suas notas em Markdown em uma base de conhecimento inteligente. Ele utiliza o Ollama para processar todas as informacoes localmente, garantindo que seus dados nunca saiam da sua maquina.

Com esta ferramenta, voce pode conversar com seu Vault, planejar projetos e automatizar a criacao de arquivos diretamente do terminal.

---

## Funcionalidades Principais

- Memoria Semantica (RAG): O sistema indexa suas notas e consegue encontrar informacoes mesmo que voce nao cite o nome exato do arquivo.
- Historico Conversacional: O agente entende o contexto da conversa, permitindo perguntas de seguimento como "explique melhor" ou "o que mais?".
- Analise de Links Internos: Ao citar uma nota, o LUNAR analisa automaticamente os links para outras notas presentes no texto.
- Automacao de Notas (Modo Build): Criacao e edicao automatica de arquivos Markdown com estrutura profissional.
- Interface Minimalista: Uma interface de terminal focada em texto, sem distractoes e otimizada para produtividade.

---

## Modos de Operacao

O LunarCode possui tres modos principais que voce pode alternar usando a tecla Tab:

1. ASK (Consultar): Use para tirar duvidas sobre suas notas. 
   - Exemplo: "O que eu escrevi sobre neurociencia?"
   - Dica: Use @nome-do-arquivo.md para focar em uma nota especifica.

2. PLAN (Planejar): Ideal para criar estruturas, sumarios ou organizar ideias para um novo projeto.
   - Exemplo: "Crie um roteiro de estudos para o tema de metacognicao."

3. BUILD (Construir): O modo que interage com seus arquivos.
   - Exemplo: "Crie uma nota chamada cafe.md com os beneficios da bebida."
   - Exemplo: "Atualize a nota @neurociencia.md adicionando um resumo ao final."

---

## Guia de Instalacao

### Pre-requisitos

1. Ter o Ollama instalado em seu sistema:
   - Linux: curl -fsSL https://ollama.com/install.sh | sh
   - macOS/Windows: Download no site oficial da Ollama.

2. Baixar o modelo de IA base:
   ollama pull llama3.2

### Instalacao do Agente

Execute os seguintes comandos no seu terminal:

```bash
git clone https://github.com/tiobendev/lunarcode.git
cd lunarcode
npm install
npm run build
npm link
```

---

## Fluxo de Trabalho Passo a Passo

Paraecar a usar o LunarCode no seu Vault (pasta de notas), siga estes passos:

1. Configurar o Vault:
   Navegue ate a pasta das suas notas e execute:
   lunarcode init

2. Indexar as Notas:
   Para que a busca inteligente funcione, execute:
   lunarcode index
   (Repita este comando sempre que adicionar muitas notas novas para manter o indice atualizado).

3. Abrir a Interface:
   lunarcode open

---

## Atalhos de Teclado na Interface

- Tab: Alterna entre os modos ASK, PLAN e BUILD.
- Setas Cima/Baixo: Navega pelo historico de mensagens caso o texto seja longo.
- Ctrl + K: Abre o menu para trocar o modelo da IA.
- Ctrl + T: Abre o menu de temas de cores.
- Ctrl + H: Abre o manual de ajuda interno.
- Ctrl + C: Sai do aplicativo.

---

## Plano de Melhorias (Roadmap)

### Interface e Experiencia
- Implementar realce de sintaxe em blocos de codigo dentro do chat.
- Adicionar suporte para entrada de texto em multiplas linhas.
- Melhorar o indicador de progresso durante a indexacao de vaults grandes.

### Novas Capacidades
- Suporte para alternar entre diferentes Vaults sem fechar o programa.
- Criacao de "Personas" especializadas (ex: assistente academico ou assistente de codigo).
- Exportacao automatica de sessoes de chat para arquivos Markdown.

---

## Licenca

Este software utiliza uma Licenca Personalizada Restritiva. O uso pessoal e contribuicoes sao permitidos, mas a redistribuicao comercial ou o desenvolvimento de produtos derivados concorrentes e proibida. Consulte o arquivo LICENSE para detalhes completos.
