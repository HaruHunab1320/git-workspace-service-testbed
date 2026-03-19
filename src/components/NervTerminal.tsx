import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNervStore } from '../store/useNervStore';

interface TerminalLine {
  type: 'input' | 'output' | 'error' | 'system';
  text: string;
}

const BOOT_MESSAGES: string[] = [
  'NERV COMMAND TERMINAL v2.51 — MAGI INTERFACE',
  '========================================',
  'Establishing uplink to MAGI system...',
  'MELCHIOR-1 ... ONLINE',
  'BALTHASAR-2 ... ONLINE',
  'CASPER-3 ... ONLINE',
  'All systems nominal. Type "help" for available commands.',
  '',
];

export default function NervTerminal() {
  const [history, setHistory] = useState<TerminalLine[]>(
    BOOT_MESSAGES.map((text) => ({ type: 'system', text })),
  );
  const [input, setInput] = useState('');
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const store = useNervStore();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  const appendLines = useCallback((lines: TerminalLine[]) => {
    setHistory((prev) => [...prev, ...lines]);
  }, []);

  const processCommand = useCallback(
    (raw: string) => {
      const trimmed = raw.trim();
      if (!trimmed) return;

      const inputLine: TerminalLine = { type: 'input', text: `> ${trimmed}` };
      const outputLines: TerminalLine[] = [inputLine];

      const parts = trimmed.split(/\s+/);
      const cmd = parts[0].toLowerCase();
      const flag = parts[1]?.toLowerCase();

      switch (cmd) {
        case 'system': {
          if (flag === '--status') {
            outputLines.push(
              { type: 'output', text: '--- NERV SYSTEM STATUS ---' },
              { type: 'output', text: `Emergency Level : ${store.emergencyLevel}` },
              { type: 'output', text: `Sync Ratio      : ${store.syncRatio.toFixed(1)}%` },
              { type: 'output', text: `MAGI Votes:` },
              { type: 'output', text: `  MELCHIOR-1  : ${store.magiVotes.melchior ? 'APPROVE' : 'REJECT'}` },
              { type: 'output', text: `  BALTHASAR-2 : ${store.magiVotes.balthasar ? 'APPROVE' : 'REJECT'}` },
              { type: 'output', text: `  CASPER-3    : ${store.magiVotes.casper ? 'APPROVE' : 'REJECT'}` },
              { type: 'output', text: '--------------------------' },
            );
          } else {
            outputLines.push({
              type: 'error',
              text: 'Usage: system --status',
            });
          }
          break;
        }

        case 'magi': {
          if (flag === '--vote') {
            const melchior = Math.random() > 0.5;
            const balthasar = Math.random() > 0.5;
            const casper = Math.random() > 0.5;
            useNervStore.setState({
              magiVotes: { melchior, balthasar, casper },
            });
            const approved = [melchior, balthasar, casper].filter(Boolean).length >= 2;
            outputLines.push(
              { type: 'output', text: 'MAGI VOTING INITIATED...' },
              { type: 'output', text: `  MELCHIOR-1  : ${melchior ? 'APPROVE' : 'REJECT'}` },
              { type: 'output', text: `  BALTHASAR-2 : ${balthasar ? 'APPROVE' : 'REJECT'}` },
              { type: 'output', text: `  CASPER-3    : ${casper ? 'APPROVE' : 'REJECT'}` },
              {
                type: 'system',
                text: approved
                  ? 'PRIORITY: APPROVED (2/3 consensus reached)'
                  : 'PRIORITY: REJECTED (consensus not reached)',
              },
            );
          } else {
            outputLines.push({
              type: 'error',
              text: 'Usage: magi --vote',
            });
          }
          break;
        }

        case 'signal': {
          if (flag === '--emergency') {
            useNervStore.setState({ emergencyLevel: 'EMERGENCY' });
            outputLines.push(
              { type: 'error', text: '!!! EMERGENCY SIGNAL ACTIVATED !!!' },
              { type: 'error', text: 'All units to battle stations.' },
              { type: 'error', text: 'Emergency level set to: EMERGENCY' },
            );
          } else if (flag === '--alert') {
            useNervStore.setState({ emergencyLevel: 'ALERT' });
            outputLines.push(
              { type: 'system', text: 'ALERT STATUS ACTIVATED.' },
              { type: 'system', text: 'Emergency level set to: ALERT' },
            );
          } else if (flag === '--normal') {
            useNervStore.setState({ emergencyLevel: 'NORMAL' });
            outputLines.push(
              { type: 'output', text: 'All clear. Returning to normal operations.' },
              { type: 'output', text: 'Emergency level set to: NORMAL' },
            );
          } else {
            outputLines.push({
              type: 'error',
              text: 'Usage: signal --emergency | --alert | --normal',
            });
          }
          break;
        }

        case 'help': {
          outputLines.push(
            { type: 'output', text: '--- AVAILABLE COMMANDS ---' },
            { type: 'output', text: 'system --status      Display current NERV system state' },
            { type: 'output', text: 'magi --vote          Initiate MAGI voting sequence' },
            { type: 'output', text: 'signal --emergency   Activate emergency protocol' },
            { type: 'output', text: 'signal --alert       Activate alert status' },
            { type: 'output', text: 'signal --normal      Return to normal operations' },
            { type: 'output', text: 'clear                Clear terminal output' },
            { type: 'output', text: 'help                 Show this message' },
            { type: 'output', text: '--------------------------' },
          );
          break;
        }

        case 'clear': {
          setHistory([]);
          return;
        }

        default: {
          outputLines.push({
            type: 'error',
            text: `Unknown command: "${cmd}". Type "help" for available commands.`,
          });
        }
      }

      appendLines(outputLines);
    },
    [store.emergencyLevel, store.syncRatio, store.magiVotes, appendLines],
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    processCommand(input);
    if (input.trim()) {
      setCommandHistory((prev) => [input.trim(), ...prev]);
    }
    setHistoryIndex(-1);
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHistoryIndex((prev) => {
        const next = Math.min(prev + 1, commandHistory.length - 1);
        if (next >= 0) setInput(commandHistory[next]);
        return next;
      });
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHistoryIndex((prev) => {
        const next = prev - 1;
        if (next < 0) {
          setInput('');
          return -1;
        }
        setInput(commandHistory[next]);
        return next;
      });
    }
  };

  const colorClass = (line: TerminalLine) => {
    switch (line.type) {
      case 'input':
        return 'text-[#39FF14]';
      case 'output':
        return 'text-[#39FF14] opacity-80';
      case 'error':
        return 'text-red-500';
      case 'system':
        return 'text-[#FF9900]';
    }
  };

  return (
    <div
      className="flex flex-col bg-black border border-[#FF9900] font-mono text-sm h-full min-h-[300px]"
      onClick={() => inputRef.current?.focus()}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-1 border-b border-[#FF9900] bg-black">
        <span className="text-[#FF9900] text-xs tracking-widest uppercase">
          NERV Command Terminal
        </span>
        <span className="text-[#39FF14] text-xs">
          MAGI UPLINK ● ACTIVE
        </span>
      </div>

      {/* Output area */}
      <div className="flex-1 overflow-y-auto p-3 space-y-0.5">
        {history.map((line, i) => (
          <div key={i} className={`whitespace-pre-wrap ${colorClass(line)}`}>
            {line.text}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <form onSubmit={handleSubmit} className="border-t border-[#FF9900] px-3 py-2 flex items-center gap-2">
        <span className="text-[#FF9900]">NERV&gt;</span>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1 bg-transparent text-[#39FF14] outline-none caret-[#39FF14] font-mono text-sm placeholder-[#39FF14]/30"
          placeholder="Enter command..."
          autoFocus
          spellCheck={false}
          autoComplete="off"
        />
      </form>
    </div>
  );
}
