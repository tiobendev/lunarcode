import React, { useState, useCallback, useEffect, useRef } from "react";
import { Box, Text, useInput, useApp, useStdout } from "ink";
import TextInput from "ink-text-input";
import { Ollama } from "ollama";
import { LunarConfig } from "../commands/open.js";
import { handleAsk } from "../modes/ask.js";
import { handleBuild } from "../modes/build.js";
import { handlePlan } from "../modes/plan.js";
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
  ask: "pergunte sobre notas  •  @nota.md para referenciar",
  plan: "planeje projetos e estruturas",
  build: "crie e edite notas com IA",
};

export function App({ config }: AppProps) {
  const { exit } = useApp();
  const { stdout } = useStdout();
  const termHeight = stdout?.rows ?? 30;
  const VISIBLE_MSGS = Math.max(4, termHeight - 12);

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
        if (mode === "ask") response = await handleAsk(value, config);
        else if (mode === "plan") response = await handlePlan(value, config);
        else if (mode === "build") response = await handleBuild(value, config);
        setMessages((prev) => [...prev, { role: "assistant", content: response, mode }]);
      } catch (err) {
        setMessages((prev) => [...prev, {
          role: "assistant",
          content: `✗ Erro: ${err instanceof Error ? err.message : String(err)}`,
          mode,
        }]);
      } finally {
        setLoading(false);
      }
    },
    [mode, config, loading, overlay]
  );

  const getModeColor = (m: Mode) => theme.modes[m];

  return (
    <Box flexDirection="column" paddingX={1}>

      {/* ── Header ── */}
      <Box flexDirection="row" marginBottom={1} columnGap={1}>
        <Text color={theme.secondary} bold>🌙</Text>
        <Text color={theme.muted}>│</Text>
        {MODES.map((m) =>
          mode === m
            ? <Text key={m} color={getModeColor(m)} bold inverse>  {m.toUpperCase()}  </Text>
            : <Text key={m} color={theme.muted}>  {m}  </Text>
        )}
        <Text color={theme.muted}>│</Text>
        <Text color={theme.primary} dimColor>{currentModel}</Text>
        <Text color={theme.muted}>│</Text>
        <Text color={theme.muted} dimColor>{theme.label}</Text>
      </Box>

      {/* ── Mode hint ── */}
      <Box marginBottom={1}>
        <Text color={getModeColor(mode)} dimColor>↳ {modeDesc[mode]}</Text>
      </Box>

      {/* ── Scroll indicator up ── */}
      {canScrollUp && (
        <Box justifyContent="center">
          <Text color={theme.muted} dimColor>↑ mais mensagens acima</Text>
        </Box>
      )}

      {/* ── Messages ── */}
      <Box flexDirection="column" marginBottom={1}>
        {visibleMessages.map((msg, i) => (
          <Box key={i} flexDirection="column" marginBottom={1}>
            {msg.role === "user" && (
              <Box columnGap={1}>
                <Text color={getModeColor(msg.mode ?? "ask")} bold>›</Text>
                <Text>{msg.content}</Text>
              </Box>
            )}
            {msg.role === "assistant" && (
              <Box flexDirection="column" marginLeft={2}>
                <Text color={theme.secondary} dimColor>🌙</Text>
                <Text>{msg.content}</Text>
              </Box>
            )}
            {msg.role === "system" && (
              <Text color={theme.muted} dimColor>{msg.content}</Text>
            )}
          </Box>
        ))}
      </Box>

      {/* ── Scroll indicator down ── */}
      {canScrollDown && (
        <Box justifyContent="center">
          <Text color={theme.muted} dimColor>↓ mais abaixo</Text>
        </Box>
      )}

      {/* ── Loading ── */}
      {loading && (
        <Box marginBottom={1} marginLeft={2}>
          <Text color={getModeColor(mode)} dimColor>⠿ processando...</Text>
        </Box>
      )}

      {/* ── Input ── */}
      {!loading && !overlay && (
        <Box columnGap={1}>
          <Text color={getModeColor(mode)} bold>{mode}</Text>
          <Text color={theme.muted}>›</Text>
          <TextInput value={input} onChange={setInput} onSubmit={handleSubmit} placeholder="..." />
        </Box>
      )}

      {/* ── Footer ── */}
      <Box marginTop={1} columnGap={2}>
        <Text color={theme.muted} dimColor>Tab modo</Text>
        <Text color={theme.muted} dimColor>↑↓ scroll</Text>
        <Text color={theme.muted} dimColor>Ctrl+K modelos</Text>
        <Text color={theme.muted} dimColor>Ctrl+T tema</Text>
        <Text color={theme.muted} dimColor>Ctrl+H ajuda</Text>
        <Text color={theme.muted} dimColor>Ctrl+C sair</Text>
      </Box>

      {/* ══ Overlay: Models ══ */}
      {overlay === "models" && (
        <Box flexDirection="column" borderStyle="round" borderColor={theme.secondary}
          paddingX={2} paddingY={1} marginTop={1}>
          <Text color={theme.secondary} bold>Modelos Ollama</Text>
          <Text color={theme.muted} dimColor>↑↓ navegar  Enter selecionar  Esc fechar</Text>
          <Box flexDirection="column" marginTop={1}>
            {models.length === 0
              ? <Text color={theme.muted}>carregando ou nenhum modelo encontrado...</Text>
              : models.map((m, i) => (
                <Box key={m} columnGap={1}>
                  <Text color={i === modelCursor ? theme.secondary : theme.muted}>
                    {i === modelCursor ? "▶" : " "}
                  </Text>
                  <Text
                    color={m === currentModel ? theme.success : i === modelCursor ? "white" : theme.muted}
                    bold={i === modelCursor}
                  >
                    {m}{m === currentModel ? "  ✓" : ""}
                  </Text>
                </Box>
              ))
            }
          </Box>
        </Box>
      )}

      {/* ══ Overlay: Themes ══ */}
      {overlay === "themes" && (
        <Box flexDirection="column" borderStyle="round" borderColor={theme.primary}
          paddingX={2} paddingY={1} marginTop={1}>
          <Text color={theme.primary} bold>Temas</Text>
          <Text color={theme.muted} dimColor>↑↓ navegar  Enter selecionar  Esc fechar</Text>
          <Box flexDirection="column" marginTop={1}>
            {themeNames.map((t, i) => (
              <Box key={t} columnGap={1}>
                <Text color={i === themeCursor ? theme.primary : theme.muted}>
                  {i === themeCursor ? "▶" : " "}
                </Text>
                <Text
                  color={t === themeName ? theme.success : i === themeCursor ? "white" : theme.muted}
                  bold={i === themeCursor}
                >
                  {themes[t].label}{t === themeName ? "  ✓" : ""}
                </Text>
              </Box>
            ))}
          </Box>
        </Box>
      )}

      {/* ══ Overlay: Help ══ */}
      {overlay === "help" && (
        <Box flexDirection="column" borderStyle="round" borderColor={theme.accent === "blue" ? "blue" : "cyan"}
          paddingX={2} paddingY={1} marginTop={1}>
          <Text color={theme.primary} bold>🌙 LunarCode — Ajuda</Text>
          <Box flexDirection="column" marginTop={1}>
            <Text color={theme.muted}><Text color="white" bold>Tab        </Text>  ciclar modos</Text>
            <Text color={theme.muted}><Text color="white" bold>↑ / ↓      </Text>  scroll mensagens</Text>
            <Text color={theme.muted}><Text color="white" bold>Ctrl+K     </Text>  selecionar modelo</Text>
            <Text color={theme.muted}><Text color="white" bold>Ctrl+T     </Text>  trocar tema</Text>
            <Text color={theme.muted}><Text color="white" bold>Ctrl+H     </Text>  ajuda</Text>
            <Text color={theme.muted}><Text color="white" bold>Esc        </Text>  fechar painel</Text>
            <Text color={theme.muted}><Text color="white" bold>Ctrl+C     </Text>  sair</Text>
          </Box>
          <Box flexDirection="column" marginTop={1}>
            <Text color={theme.primary} bold>Modos</Text>
            <Text color={theme.muted}><Text color={theme.modes.ask} bold>ask    </Text>  pergunte, use @nota.md</Text>
            <Text color={theme.muted}><Text color={theme.modes.plan} bold>plan   </Text>  planeje projetos</Text>
            <Text color={theme.muted}><Text color={theme.modes.build} bold>build  </Text>  crie e edite notas</Text>
          </Box>
          <Box marginTop={1}>
            <Text color={theme.muted} dimColor>Esc para fechar</Text>
          </Box>
        </Box>
      )}

    </Box>
  );
}
