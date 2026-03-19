import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNervStore } from '../store/useNervStore';

interface TerminalLine {
  type: 'input' | 'output' | 'error' | 'system';
  text: string;
}

const BOOT_MESSAGES: string[] = [
  '[SYSTEM_REPORT] NERV COMMAND TERMINAL v2.51 — MAGI INTERFACE',
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
            const ratioEntries = Object.entries(store.syncRatios);
            outputLines.push(
              { type: 'output', text: '[SYSTEM_REPORT] --- NERV SYSTEM STATUS ---' },
              { type: 'output', text: `MAGI Status     : ${store.magiStatus}` },
              { type: 'output', text: `System Alerts   : ${store.systemAlerts.length}` },
              { type: 'output', text: `Sync Ratios:` },
            );
            if (ratioEntries.length === 0) {
              outputLines.push({ type: 'output', text: '  (no pilots registered)' });
            } else {
              ratioEntries.forEach(([id, ratio]) => {
                outputLines.push({ type: 'output', text: `  ${id}: ${ratio.toFixed(1)}%` });
              });
            }
            outputLines.push(
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
            useNervStore.setState(
              (() => {
                const votes = { melchior, balthasar, casper };
                const count = [melchior, balthasar, casper].filter(Boolean).length;
                const magiStatus = count >= 2 ? 'AGREE' as const : count === 1 ? 'CONFLICT' as const : 'DISAGREE' as const;
                return { magiVotes: votes, magiStatus };
              })(),
            );
            const count = [melchior, balthasar, casper].filter(Boolean).length;
            const status = count >= 2 ? 'AGREE' : count === 1 ? 'CONFLICT' : 'DISAGREE';
            outputLines.push(
              { type: 'output', text: '[SYSTEM_REPORT] MAGI VOTING INITIATED...' },
              { type: 'output', text: `  MELCHIOR-1  : ${melchior ? 'APPROVE' : 'REJECT'}` },
              { type: 'output', text: `  BALTHASAR-2 : ${balthasar ? 'APPROVE' : 'REJECT'}` },
              { type: 'output', text: `  CASPER-3    : ${casper ? 'APPROVE' : 'REJECT'}` },
              {
                type: 'system',
                text: `MAGI STATUS: ${status}`,
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
            useNervStore.setState((state) => ({
              systemAlerts: [
                ...state.systemAlerts,
                {
                  id: `alert-${Date.now()}`,
                  level: 'EMERGENCY' as const,
                  message: 'Manual emergency signal activated',
                  timestamp: Date.now(),
                },
              ],
            }));
            outputLines.push(
              { type: 'error', text: '[SYSTEM_REPORT] !!! EMERGENCY SIGNAL ACTIVATED !!!' },
              { type: 'error', text: 'All units to battle stations.' },
            );
          } else if (flag === '--alert') {
            useNervStore.setState((state) => ({
              systemAlerts: [
                ...state.systemAlerts,
                {
                  id: `alert-${Date.now()}`,
                  level: 'WARNING' as const,
                  message: 'Manual alert signal activated',
                  timestamp: Date.now(),
                },
              ],
            }));
            outputLines.push(
              { type: 'system', text: '[SYSTEM_REPORT] ALERT STATUS ACTIVATED.' },
            );
          } else if (flag === '--normal') {
            useNervStore.setState({ systemAlerts: [] });
            outputLines.push(
              { type: 'output', text: '[SYSTEM_REPORT] All clear. Returning to normal operations.' },
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
            { type: 'output', text: '[SYSTEM_REPORT] --- AVAILABLE COMMANDS ---' },
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
    [store.syncRatios, store.magiVotes, store.magiStatus, store.systemAlerts, appendLines],
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
        return 'text-[#FF3300]';
      case 'system':
        return 'text-[#FF9900]';
    }
  };

  return (
    <div
      className="flex flex-col bg-[#050505] border border-[#FF9900] font-['Share_Tech_Mono'] text-sm h-full min-h-[300px] relative"
      onClick={() => inputRef.current?.focus()}
    >
      {store.systemAlerts.length > 0 && (
        <div
          data-testid="emergency-overlay"
          className="absolute inset-0 bg-[#FF3300]/10 border-2 border-[#FF3300] animate-pulse z-10 pointer-events-none"
        />
      )}
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-1 border-b border-[#FF9900] bg-[#050505]">
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
          className="flex-1 bg-transparent text-[#39FF14] outline-none caret-[#39FF14] font-['Share_Tech_Mono'] text-sm placeholder-[#39FF14]/30"
          placeholder="Enter command..."
          autoFocus
          spellCheck={false}
          autoComplete="off"
        />
      </form>
    </div>
  );
}
