import React, { useState, useCallback, useEffect, useRef } from "react";
import path from "path";
import { Box, Text, useInput, useApp, useStdout } from "ink";
import TextInput from "ink-text-input";
import { Ollama } from "ollama";
import { LunarConfig } from "../commands/open.js";
import { handleAsk } from "../modes/ask.js";
import { handleBuild } from "../modes/build.js";
import { handlePlan } from "../modes/plan.js";
import { ChatMessage } from "../core/ollama.js";
import { themes, ThemeName, defaultTheme } from "./themes.js";

type Mode = "ask" | "plan" | "build";
type Overlay = null | "models" | "help" | "themes";

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
  mode?: Mode;
}

interface AppProps {
  config: LunarConfig;
}

const MODES: Mode[] = ["ask", "plan", "build"];

const modeDesc: Record<Mode, string> = {
  ask: "CONSULTE: Pergunte ou use @nota.md para ler um arquivo.",
  plan: "ORGANIZE: Estruture ideias, topicos e sumarios.",
  build: "AÇÃO: Crie arquivos ou atualize notas com '@nome.md'.",
};

export function App({ config }: AppProps) {
  const { exit } = useApp();
  const { stdout } = useStdout();
  const termHeight = stdout?.rows ?? 24;
  const VISIBLE_MSGS = Math.max(3, termHeight - 10); // Mais espaço real

  const [mode, setMode] = useState<Mode>("ask");
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [overlay, setOverlay] = useState<Overlay>(null);

  // models
  const [models, setModels] = useState<string[]>([]);
  const [modelCursor, setModelCursor] = useState(0);
  const [currentModel, setCurrentModel] = useState(config.model);

  // scroll
  const [scrollOffset, setScrollOffset] = useState(0);

  // themes
  const [themeName, setThemeName] = useState<ThemeName>(defaultTheme);
  const [themeCursor, setThemeCursor] = useState(0);
  const themeNames = Object.keys(themes) as ThemeName[];
  const theme = themes[themeName];

  useEffect(() => {
    const ollama = new Ollama();
    ollama.list()
      .then((res) => setModels(res.models.map((m: { name: string }) => m.name)))
      .catch(() => setModels([]));
  }, []);

  // auto-scroll to bottom when new message
  useEffect(() => {
    setScrollOffset(0);
  }, [messages]);

  const visibleMessages = (() => {
    const total = messages.length;
    const start = Math.max(0, total - VISIBLE_MSGS - scrollOffset);
    const end = Math.max(0, total - scrollOffset);
    return messages.slice(start, end);
  })();

  const canScrollUp = scrollOffset < messages.length - VISIBLE_MSGS;
  const canScrollDown = scrollOffset > 0;

  useInput((_inp, key) => {
    if (key.ctrl && _inp === "c") exit();
    if (key.escape) { setOverlay(null); return; }

    // scroll (sempre ativo)
    if (!overlay && key.upArrow && !loading) {
      setScrollOffset((s) => Math.min(s + 1, Math.max(0, messages.length - VISIBLE_MSGS)));
      return;
    }
    if (!overlay && key.downArrow && !loading) {
      setScrollOffset((s) => Math.max(0, s - 1));
      return;
    }

    if (!overlay) {
      if (key.tab && !loading) {
        setMode((prev) => MODES[(MODES.indexOf(prev) + 1) % MODES.length]);
        return;
      }
      if (key.ctrl && _inp === "k") { setOverlay("models"); setModelCursor(0); return; }
      if (key.ctrl && _inp === "h") { setOverlay("help"); return; }
      if (key.ctrl && _inp === "t") { setOverlay("themes"); setThemeCursor(themeNames.indexOf(themeName)); return; }
    }

    // overlay: models
    if (overlay === "models") {
      if (key.upArrow) { setModelCursor((c) => Math.max(0, c - 1)); return; }
      if (key.downArrow) { setModelCursor((c) => Math.min(models.length - 1, c + 1)); return; }
      if (key.return) {
        if (models[modelCursor]) {
          setCurrentModel(models[modelCursor]);
          config.model = models[modelCursor];
          setMessages((p) => [...p, { role: "system", content: `→ modelo: ${models[modelCursor]}` }]);
        }
        setOverlay(null);
        return;
      }
    }

    // overlay: themes
    if (overlay === "themes") {
      if (key.upArrow) { setThemeCursor((c) => Math.max(0, c - 1)); return; }
      if (key.downArrow) { setThemeCursor((c) => Math.min(themeNames.length - 1, c + 1)); return; }
      if (key.return) {
        setThemeName(themeNames[themeCursor]);
        setOverlay(null);
        return;
      }
    }
  });

  const handleSubmit = useCallback(
    async (value: string) => {
      if (!value.trim() || loading || overlay) return;
      setInput("");
      setScrollOffset(0);
      setMessages((prev) => [...prev, { role: "user", content: value, mode }]);
      setLoading(true);
      try {
        let response = "";
        const history: ChatMessage[] = messages
          .filter(m => m.role !== "system")
          .map(m => ({ role: m.role, content: m.content }));
        
        history.push({ role: "user", content: value });

        if (mode === "ask") response = await handleAsk(history, config);
        else if (mode === "plan") response = await handlePlan(history, config);
        else if (mode === "build") response = await handleBuild(history, config);
        
        setMessages((prev) => [...prev, { role: "assistant", content: response, mode }]);
      } catch (err) {
        setMessages((prev) => [...prev, {
          role: "assistant",
          content: `Erro: ${err instanceof Error ? err.message : String(err)}`,
          mode,
        }]);
      } finally {
        setLoading(false);
      }
    },
    [mode, config, loading, overlay, messages]
  );

  const getModeColor = (m: Mode) => theme.modes[m];

  return (
    <Box flexDirection="column" paddingX={1} height={termHeight}>
      
      {/* ── Top Status Bar ── */}
      <Box borderStyle="single" borderColor={theme.muted} paddingX={1} marginBottom={0}>
        <Box flexGrow={1}>
          <Text color={theme.primary} bold>LUNARCODE</Text>
          <Text color={theme.muted}> | </Text>
          <Text color={theme.secondary}>{currentModel}</Text>
        </Box>
        <Box>
          <Text color={theme.muted}>Vault: </Text>
          <Text color={theme.success} dimColor>{path.basename(config.vault)}</Text>
        </Box>
      </Box>

      {/* ── Mode Tabs ── */}
      <Box flexDirection="row" justifyContent="center" marginBottom={1}>
        {MODES.map((m) => (
          <Box key={m} marginX={1}>
            <Text 
              color={mode === m ? getModeColor(m) : theme.muted} 
              bold={mode === m}
              inverse={mode === m}
            >
              {`  ${m.toUpperCase()}  `}
            </Text>
          </Box>
        ))}
      </Box>

      {/* ── Help / Hint ── */}
        <Text color={theme.muted} italic>
          {modeDesc[mode]}
        </Text>

      {/* ── Scroll indicator up ── */}
      {canScrollUp && (
        <Box justifyContent="center">
          <Text color={theme.muted} dimColor>↑ mais mensagens acima</Text>
        </Box>
      )}

      {/* ── Main Content Area ── */}
      <Box flexDirection="column" flexGrow={1} borderStyle="round" borderColor={theme.muted} paddingX={1} marginY={0}>
        
        {/* Render Overlays or Messages */}
        {overlay === "models" ? (
          <Box flexDirection="column" paddingY={1}>
            <Text color={theme.secondary} bold>MODELOS OLLAMA</Text>
            <Text color={theme.muted} dimColor>↑↓ navegar | Enter selecionar | Esc fechar</Text>
            <Box flexDirection="column" marginTop={1}>
              {models.length === 0
                ? <Text color={theme.muted}>carregando ou nenhum modelo encontrado...</Text>
                : models.map((m, i) => (
                  <Box key={m} columnGap={1}>
                    <Text color={i === modelCursor ? theme.secondary : theme.muted}>{i === modelCursor ? "▶" : "  "}</Text>
                    <Text color={m === currentModel ? theme.success : i === modelCursor ? "white" : theme.muted} bold={i === modelCursor}>
                      {m}{m === currentModel ? "  ✓" : ""}
                    </Text>
                  </Box>
                ))
              }
            </Box>
          </Box>
        ) : overlay === "themes" ? (
          <Box flexDirection="column" paddingY={1}>
            <Text color={theme.primary} bold>TEMAS</Text>
            <Text color={theme.muted} dimColor>↑↓ navegar | Enter selecionar | Esc fechar</Text>
            <Box flexDirection="column" marginTop={1}>
              {themeNames.map((t, i) => (
                <Box key={t} columnGap={1}>
                  <Text color={i === themeCursor ? theme.primary : theme.muted}>{i === themeCursor ? "▶" : "  "}</Text>
                  <Text color={t === themeName ? theme.success : i === themeCursor ? "white" : theme.muted} bold={i === themeCursor}>
                    {themes[t].label}{t === themeName ? "  ✓" : ""}
                  </Text>
                </Box>
              ))}
            </Box>
          </Box>
        ) : overlay === "help" ? (
          <Box flexDirection="column" paddingY={1}>
            <Text color={theme.primary} bold>LUNARCODE - MANUAL DO USUARIO</Text>
            
            <Box flexDirection="column" marginTop={1}>
              <Text color="white" bold>MODOS:</Text>
              <Text color={theme.muted}>
                <Text color={theme.modes.ask} bold>● ASK: </Text> Use para tirar dúvidas. O Wizard só responde o que estiver nas notas.
                Dica: Digite <Text color="white">@nota.md</Text> para ele ler o arquivo completo.
              </Text>
              <Box marginTop={1}>
                <Text color={theme.muted}>
                  <Text color={theme.modes.plan} bold>● PLAN: </Text> Use para criar sumários, estruturas de pastas ou planejar projetos.
                </Text>
              </Box>
              <Box marginTop={1}>
                <Text color={theme.muted}>
                  <Text color={theme.modes.build} bold>● BUILD: </Text> O modo que escreve arquivos. 
                  Ex: "Crie uma nota sobre café" ou "Melhore o texto da nota @estudos.md".
                </Text>
              </Box>
            </Box>

            <Box flexDirection="column" marginTop={1}>
              <Text color="white" bold>ATALHOS:</Text>
              <Box columnGap={2}>
                <Text color={theme.muted}><Text color="white">Tab   </Text> Muda Modo</Text>
                <Text color={theme.muted}><Text color="white">Up/Dn </Text> Scroll Chat</Text>
                <Text color={theme.muted}><Text color="white">Ctrl+K</Text> Modelos</Text>
              </Box>
              <Box columnGap={2}>
                <Text color={theme.muted}><Text color="white">Ctrl+T</Text> Temas</Text>
                <Text color={theme.muted}><Text color="white">Ctrl+H</Text> Recuar Ajuda</Text>
                <Text color={theme.muted}><Text color="white">Ctrl+C</Text> Sair</Text>
              </Box>
            </Box>

            <Box marginTop={1}>
              <Text color={theme.warning} italic>Busca Semântica desativada? Rode 'lunarcode index' no terminal.</Text>
            </Box>
          </Box>
        ) : (
          <Box flexDirection="column">
            {canScrollUp && (
              <Box justifyContent="center" marginBottom={1}>
                <Text color={theme.warning} dimColor>── ↑ MAIS MENSAGENS (Use Setas) ──</Text>
              </Box>
            )}
            {visibleMessages.length === 0 && (
              <Box height={VISIBLE_MSGS} justifyContent="center" alignItems="center">
                <Text color={theme.muted} dimColor>Envie uma mensagem para começar...</Text>
              </Box>
            )}
            {visibleMessages.map((msg, i) => (
              <Box key={i} flexDirection="column" marginBottom={1}>
                <Box>
                  <Text color={msg.role === "user" ? getModeColor(msg.mode ?? "ask") : theme.secondary} bold>
                    {msg.role === "user" ? "VOCE " : "LUNAR "}
                  </Text>
                  <Text color={theme.muted}>| </Text>
                  <Box flexShrink={1}>
                     <Text wrap="wrap">{msg.content}</Text>
                  </Box>
                </Box>
              </Box>
            ))}
            {canScrollDown && (
              <Box justifyContent="center" marginTop={1}>
                <Text color={theme.warning} dimColor>── ↓ MAIS ABAIXO ──</Text>
              </Box>
            )}
          </Box>
        )}
      </Box>

      {/* ── Input Area ── */}
      <Box paddingX={1} marginY={0}>
        {loading ? (
          <Box paddingY={1}>
            <Text color={theme.warning}>⠿ Pensando...</Text>
          </Box>
        ) : (
          <Box paddingY={1}>
            <Text color={getModeColor(mode)} bold>{mode.toUpperCase()}</Text>
            <Text color={theme.muted}> ❯ </Text>
            <TextInput 
              value={input} 
              onChange={setInput} 
              onSubmit={handleSubmit} 
              placeholder={overlay ? "Feche o painel (Esc) para digitar..." : "Digite sua mensagem..."} 
              showCursor={!overlay}
            />
          </Box>
        )}
      </Box>

      {/* ── Bottom Status Bar ── */}
      <Box borderStyle="single" borderColor={theme.muted} paddingX={1}>
        <Text color={theme.muted} dimColor>
          TAB: Alternar | Ctrl+K: Modelos | Ctrl+T: Temas | Ctrl+H: Ajuda | Ctrl+C: Sair
        </Text>
      </Box>

    </Box>
  );
}
