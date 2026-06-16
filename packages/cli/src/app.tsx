import { useState, useEffect, useCallback, useMemo } from 'react';
import { Box, Text, useInput, useApp, type Key } from 'ink';
import {
  EmulatorController,
  ExecutionStopReason,
  AX_REG, BX_REG, CX_REG, DX_REG,
  CS_REG, DS_REG, ES_REG, SS_REG,
  SP_REG, BP_REG, DI_REG, SI_REG,
  FLAG_REG, IP_REG,
  CONSOLE_COLS,
} from '@emu8086/emulator';
import type { CompilerResult } from '@emu8086/compiler';
import type { NodeKeyProvider } from './node-key-provider.js';

type FinalViewLine = NonNullable<CompilerResult['finalView']>[number];

interface Props {
  controller: EmulatorController;
  keyProvider: NodeKeyProvider;
  finalView: FinalViewLine[];
  sourceLines: string[];
}

type Mode = 'idle' | 'running' | 'done';

const WINDOW = 8; // lines above and below current in source panel

/** Build a map from instruction address → 0-based source line index. */
function buildAddrMap(finalView: FinalViewLine[]): Map<number, number> {
  const map = new Map<number, number>();
  for (const line of finalView) {
    if (line.executableLine && line.lexicalLine?.index != null) {
      map.set(line.instructionAddr, line.lexicalLine.index);
    }
  }
  return map;
}

/** Build a map from 0-based source line index → instruction address. */
function buildLineToAddrMap(finalView: FinalViewLine[]): Map<number, number> {
  const map = new Map<number, number>();
  for (const line of finalView) {
    if (line.executableLine && line.lexicalLine?.index != null) {
      map.set(line.lexicalLine.index, line.instructionAddr);
    }
  }
  return map;
}

function toHex4(n: number): string {
  return n.toString(16).toUpperCase().padStart(4, '0');
}

function readRegs(ctrl: EmulatorController) {
  const r = ctrl.processor.register;
  return {
    ax: toHex4(r.readReg(AX_REG)),
    bx: toHex4(r.readReg(BX_REG)),
    cx: toHex4(r.readReg(CX_REG)),
    dx: toHex4(r.readReg(DX_REG)),
    cs: toHex4(r.readReg(CS_REG)),
    ds: toHex4(r.readReg(DS_REG)),
    es: toHex4(r.readReg(ES_REG)),
    ss: toHex4(r.readReg(SS_REG)),
    sp: toHex4(r.readReg(SP_REG)),
    bp: toHex4(r.readReg(BP_REG)),
    di: toHex4(r.readReg(DI_REG)),
    si: toHex4(r.readReg(SI_REG)),
    ip: toHex4(r.readReg(IP_REG)),
    flags: toHex4(r.readReg(FLAG_REG)),
    ipNum: r.readReg(IP_REG),
  };
}

function consoleText(ctrl: EmulatorController): string {
  const chars = ctrl.processor.cnsl.getDisplayChars();
  const cols = CONSOLE_COLS;
  let out = '';
  for (let i = 0; i < chars.length; i++) {
    if (i > 0 && i % cols === 0) out += '\n';
    out += chars[i].char || ' ';
  }
  return out.trimEnd();
}

function SourcePanel({
  sourceLines,
  addrMap,
  currentAddr,
  breakpoints,
  cursorLine,
}: {
  sourceLines: string[];
  addrMap: Map<number, number>;
  currentAddr: number;
  breakpoints: ReadonlySet<number>;
  cursorLine: number;
}) {
  const currentLineIdx = addrMap.get(currentAddr) ?? -1;

  // Scroll window follows the navigable cursor, not the IP
  const start = Math.max(0, cursorLine - WINDOW);
  const end = Math.min(sourceLines.length, cursorLine + WINDOW + 1);

  const visible = sourceLines.slice(start, end);

  return (
    <Box flexDirection="column" flexGrow={1} borderStyle="round" borderColor="gray" paddingX={1}>
      <Text bold underline>Source  <Text dimColor color="cyan">↑↓ move cursor  p=breakpoint</Text></Text>
      {visible.map((rawLine, i) => {
        const srcIdx = start + i;
        const isIP = srcIdx === currentLineIdx;
        const isCursor = srcIdx === cursorLine;
        const isBreakpoint = breakpoints.has(srcIdx);
        const lineNum = String(srcIdx + 1).padStart(3, ' ');
        const text = rawLine.length > 50 ? rawLine.slice(0, 49) + '…' : rawLine;
        // ▶ green = IP, › cyan = cursor (only when cursor ≠ IP), else space
        const indicator = isIP ? '▶' : isCursor ? '›' : ' ';
        const indicatorColor = isIP ? 'green' : 'cyan';
        return (
          <Box key={srcIdx}>
            <Text color="red">{isBreakpoint ? '●' : ' '}</Text>
            <Text color={isIP || isCursor ? indicatorColor : 'gray'}>{indicator} </Text>
            <Text dimColor={!isIP && !isCursor}>{lineNum}  </Text>
            <Text bold={isIP || isCursor} color={isIP ? 'green' : isCursor ? 'cyan' : undefined}>{text}</Text>
          </Box>
        );
      })}
      {sourceLines.length === 0 && <Text dimColor>(no source)</Text>}
    </Box>
  );
}

function HelpPanel() {
  return (
    <Box flexDirection="column" borderStyle="round" borderColor="cyan" paddingX={2} paddingY={1} marginTop={1}>
      <Text bold color="cyan">Keyboard controls</Text>
      <Box height={1} />
      <Box gap={2}>
        <Box flexDirection="column" gap={0}>
          <Text><Text color="yellow" bold>s</Text>  Single step</Text>
          <Text><Text color="yellow" bold>b</Text>  Step back</Text>
          <Text><Text color="yellow" bold>r</Text>  Run to end</Text>
          <Text><Text color="yellow" bold>R</Text>  Reset program</Text>
          <Text><Text color="yellow" bold>↑↓</Text> Move cursor (independent of IP)</Text>
          <Text><Text color="yellow" bold>p</Text>  Toggle breakpoint on cursor line</Text>
          <Text><Text color="yellow" bold>P</Text>  Clear all breakpoints</Text>
          <Text><Text color="yellow" bold>?</Text>  Toggle this help</Text>
          <Text><Text color="yellow" bold>q</Text>  Quit</Text>
        </Box>
        <Box flexDirection="column" gap={0} marginLeft={4}>
          <Text bold color="cyan">Assembly quick-reference</Text>
          <Text dimColor>Programs start with  <Text color="white">org 100h</Text></Text>
          <Text dimColor>Programs end with    <Text color="white">ret</Text></Text>
          <Text dimColor>Hex literals:        <Text color="white">0FFh  1234h</Text></Text>
          <Text dimColor>Decimal:             <Text color="white">10  255</Text></Text>
          <Text dimColor>Binary:              <Text color="white">1010b</Text></Text>
          <Text dimColor>Labels:              <Text color="white">myLabel:</Text></Text>
          <Text dimColor>Comments:            <Text color="white">; text</Text></Text>
        </Box>
      </Box>
      <Box height={1} />
      <Text bold color="cyan">Supported instructions</Text>
      <Text dimColor>Data    <Text color="white">MOV XCHG LEA PUSH POP PUSHF POPF</Text></Text>
      <Text dimColor>Math    <Text color="white">ADD SUB MUL DIV NEG INC DEC CMP</Text></Text>
      <Text dimColor>Bits    <Text color="white">AND OR XOR NOT TEST SHL SHR SAR ROL ROR RCL RCR</Text></Text>
      <Text dimColor>Flow    <Text color="white">JMP CALL RET Jcc LOOP</Text></Text>
      <Text dimColor>String  <Text color="white">MOVS LODS STOS CMPS SCAS  +REP/REPE/REPNE</Text></Text>
      <Text dimColor>Flags   <Text color="white">CLC STC CMC CLD STD</Text></Text>
      <Text dimColor>I/O     <Text color="white">INT 10h (video)  INT 21h (DOS console)</Text></Text>
    </Box>
  );
}

export function App({ controller, keyProvider, finalView, sourceLines }: Props) {
  const { exit } = useApp();
  const addrMap     = useMemo(() => buildAddrMap(finalView),       [finalView]);
  const lineToAddr  = useMemo(() => buildLineToAddrMap(finalView), [finalView]);
  const [regs, setRegs] = useState(() => readRegs(controller));
  const [output, setOutput] = useState('');
  const [status, setStatus] = useState('Loaded. s=step  b=back  r=run  p=breakpoint  ?=help  q=quit');
  const [mode, setMode] = useState<Mode>('idle');
  const [step, setStep] = useState(0);
  const [showHelp, setShowHelp] = useState(false);
  const [waiting, setWaiting] = useState(false);
  const [blink, setBlink] = useState(true);
  const [breakpoints, setBreakpoints] = useState<ReadonlySet<number>>(new Set());
  const [cursorLine, setCursorLine] = useState(0);

  const refresh = useCallback(() => {
    setRegs(readRegs(controller));
    setOutput(consoleText(controller));
    setStep(controller.t);
    setWaiting(controller.processor.cnsl.readMode);
  }, [controller]);

  useEffect(() => {
    const id = setInterval(() => {
      controller.tick();
      refresh();
    }, 16);
    return () => clearInterval(id);
  }, [controller, refresh]);

  // Blink cursor while waiting for input
  useEffect(() => {
    if (!waiting) { setBlink(true); return; }
    const id = setInterval(() => setBlink(b => !b), 530);
    return () => clearInterval(id);
  }, [waiting]);

  /** Snap the navigable cursor to the current IP line after any execution step. */
  const snapCursorToIP = useCallback(() => {
    const ip = controller.processor.register.readReg(IP_REG);
    const lineIdx = addrMap.get(ip);
    if (lineIdx != null) setCursorLine(lineIdx);
  }, [controller, addrMap]);

  useInput((input: string, key: Key) => {
    const raw = key.return ? '\r' : input;
    if (raw) keyProvider.deliverKey(raw);

    // Program is blocking on keyboard input — deliver the key but do not
    // interpret it as an emulator control command.
    if (waiting) return;

    if (mode === 'running') {
      if (input === 'q') { controller.stopRun(); exit(); }
      return;
    }

    // Arrow keys navigate the breakpoint cursor independently of the IP
    if (key.upArrow)   { setCursorLine(l => Math.max(0, l - 1)); return; }
    if (key.downArrow) { setCursorLine(l => Math.min(sourceLines.length - 1, l + 1)); return; }

    if (input === '?') { setShowHelp(h => !h); return; }
    if (input === 'q') { exit(); return; }

    if (input === 's') {
      const result = controller.singleStep();
      refresh();
      snapCursorToIP();
      if (result.done) {
        setMode('done');
        setStatus(`Done: ${result.endReason ?? 'execution ended'}  (R=reset  q=quit)`);
      }
    }

    if (input === 'b') {
      controller.stepBack();
      refresh();
      snapCursorToIP();
      setStatus('Stepped back.  s=step  r=run  ?=help  q=quit');
    }

    if (input === 'r') {
      if (mode === 'done') return;
      setMode('running');
      setStatus('Running…  q=quit');
      controller.startRun(
        () => refresh(),
        (reason: string) => {
          refresh();
          snapCursorToIP();
          if (reason === ExecutionStopReason.BREAKPOINT_HIT) {
            setMode('idle');
            setStatus('Breakpoint hit. s=step  r=run  p=toggle bp  q=quit');
          } else {
            setMode('done');
            setStatus(`Done: ${reason}  (R=reset  q=quit)`);
          }
        },
      );
    }

    if (input === 'R') {
      controller.stopRun();
      controller.reset();
      refresh();
      snapCursorToIP();
      setMode('idle');
      setShowHelp(false);
      setStatus('Reset. s=step  b=back  r=run  p=breakpoint  ?=help  q=quit');
    }

    if (input === 'p') {
      // Toggle breakpoint on the navigable cursor line, not necessarily the IP
      const addr = lineToAddr.get(cursorLine);
      if (addr == null) return;
      controller.toggleBreakpoint(addr);
      setBreakpoints(prev => {
        const next = new Set(prev);
        if (next.has(cursorLine)) next.delete(cursorLine);
        else next.add(cursorLine);
        return next;
      });
    }

    if (input === 'P') {
      controller.clearBreakpoints();
      setBreakpoints(new Set());
    }
  });

  const regRow = (label: string, val: string) => (
    <Box key={label}>
      <Text color="cyan">{label.padEnd(5)}</Text>
      <Text color="yellow">{val}</Text>
    </Box>
  );

  return (
    <Box flexDirection="column" padding={1}>
      {/* Header */}
      <Text bold color="green">8086 Emulator — CLI  (step {step})  <Text dimColor>? for help</Text></Text>
      <Box height={1} />

      {/* Main layout: Source left, Registers + Console right */}
      <Box flexDirection="row" gap={2}>
        {/* Source panel */}
        <SourcePanel sourceLines={sourceLines} addrMap={addrMap} currentAddr={regs.ipNum} breakpoints={breakpoints} cursorLine={cursorLine} />

        {/* Right column */}
        <Box flexDirection="column" gap={1}>
          {/* Registers panel */}
          <Box flexDirection="column" borderStyle="round" borderColor="gray" paddingX={1}>
            <Text bold underline>Registers</Text>
            {regRow('AX', regs.ax)}
            {regRow('BX', regs.bx)}
            {regRow('CX', regs.cx)}
            {regRow('DX', regs.dx)}
            <Box height={1} />
            {regRow('CS', regs.cs)}
            {regRow('DS', regs.ds)}
            {regRow('ES', regs.es)}
            {regRow('SS', regs.ss)}
            <Box height={1} />
            {regRow('SP', regs.sp)}
            {regRow('BP', regs.bp)}
            {regRow('SI', regs.si)}
            {regRow('DI', regs.di)}
            <Box height={1} />
            {regRow('IP', regs.ip)}
            {regRow('FL', regs.flags)}
          </Box>

          {/* Console panel */}
          <Box flexDirection="column" borderStyle="round" borderColor={waiting ? 'cyan' : 'gray'} paddingX={1}>
            <Text bold underline>
              Console{waiting ? <Text color="cyan"> — input{blink ? ' ▌' : '  '}</Text> : ''}
            </Text>
            <Text>{output || <Text dimColor>(empty)</Text>}</Text>
            {waiting && <Text color="cyan">{blink ? '▌' : ' '}</Text>}
          </Box>
        </Box>
      </Box>

      {/* Help panel */}
      {showHelp && <HelpPanel />}

      <Box height={1} />

      {/* Status bar */}
      <Box
        borderStyle="single"
        borderColor={waiting ? 'cyan' : mode === 'done' ? 'green' : mode === 'running' ? 'yellow' : 'gray'}
        paddingX={1}
      >
        {waiting
          ? <Text color="cyan">
              {controller.processor.int21_01
                ? 'Waiting for input — press any key'
                : 'Waiting for input — type text and press Enter'}
            </Text>
          : <Text color={mode === 'done' ? 'green' : mode === 'running' ? 'yellow' : 'white'}>{status}</Text>
        }
      </Box>
    </Box>
  );
}
