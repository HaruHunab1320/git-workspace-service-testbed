import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNervStore } from '../store/useNervStore';

interface TerminalLine {
  type: 'input' | 'output' | 'error' | 'system';
  text: string;
}

const BOOT_MESSAGES: string[] = [
  '[SYSTEM_REPORT] NERV COMMAND TERMINAL v2.51 — MAGI INTERFACE',
  '========================================',
  '[SYSTEM_REPORT] Establishing uplink to MAGI system...',
  '[SYSTEM_REPORT] MELCHIOR-1 ... ONLINE',
  '[SYSTEM_REPORT] BALTHASAR-2 ... ONLINE',
  '[SYSTEM_REPORT] CASPER-3 ... ONLINE',
  '[SYSTEM_REPORT] All systems nominal. Type "help" for available commands.',
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

      const inputLine: TerminalLine = { type: 'input', text: `NERV> ${trimmed}` };
      const outputLines: TerminalLine[] = [inputLine];

      const parts = trimmed.split(/\s+/);
      const cmd = parts[0].toLowerCase();
      const flag = parts[1]?.toLowerCase();

      switch (cmd) {
        case 'system': {
          if (flag === '--status') {
            const syncEntries = Object.entries(store.syncRatios);
            outputLines.push(
              { type: 'output', text: '[SYSTEM_REPORT] --- NERV SYSTEM STATUS ---' },
              { type: 'output', text: `[SYSTEM_REPORT] Emergency Level : ${store.emergencyLevel}` },
              { type: 'output', text: `[SYSTEM_REPORT] MAGI Status     : ${store.magiStatus}` },
              { type: 'output', text: `[SYSTEM_REPORT] System Alerts   : ${store.systemAlerts.length} active` },
            );
            if (syncEntries.length > 0) {
              outputLines.push({ type: 'output', text: '[SYSTEM_REPORT] Sync Ratios:' });
              for (const [pilotId, ratio] of syncEntries) {
                outputLines.push({
                  type: 'output',
                  text: `[SYSTEM_REPORT]   ${pilotId}: ${ratio.toFixed(1)}%`,
                });
              }
            } else {
              outputLines.push({ type: 'output', text: '[SYSTEM_REPORT] Sync Ratios     : No pilots registered' });
            }
            outputLines.push(
              { type: 'output', text: '[SYSTEM_REPORT] MAGI Votes:' },
              { type: 'output', text: `[SYSTEM_REPORT]   MELCHIOR-1  : ${store.magiVotes.melchior ? 'APPROVE' : 'REJECT'}` },
              { type: 'output', text: `[SYSTEM_REPORT]   BALTHASAR-2 : ${store.magiVotes.balthasar ? 'APPROVE' : 'REJECT'}` },
              { type: 'output', text: `[SYSTEM_REPORT]   CASPER-3    : ${store.magiVotes.casper ? 'APPROVE' : 'REJECT'}` },
              { type: 'output', text: '[SYSTEM_REPORT] --------------------------' },
            );
          } else {
            outputLines.push({
              type: 'error',
              text: '[SYSTEM_REPORT] Usage: system --status',
            });
          }
          break;
        }

        case 'magi': {
          if (flag === '--vote') {
            const melchior = Math.random() > 0.5;
            const balthasar = Math.random() > 0.5;
            const casper = Math.random() > 0.5;
            const votes = { melchior, balthasar, casper };
            useNervStore.getState().setMagiVotes(votes);
            const approvals = [melchior, balthasar, casper].filter(Boolean).length;
            const consensus = approvals >= 2;
            const status = approvals >= 2 ? 'AGREE' : approvals === 0 ? 'DISAGREE' : 'CONFLICT';
            outputLines.push(
              { type: 'output', text: '[SYSTEM_REPORT] MAGI VOTING INITIATED...' },
              { type: 'output', text: `[SYSTEM_REPORT]   MELCHIOR-1  : ${melchior ? 'APPROVE' : 'REJECT'}` },
              { type: 'output', text: `[SYSTEM_REPORT]   BALTHASAR-2 : ${balthasar ? 'APPROVE' : 'REJECT'}` },
              { type: 'output', text: `[SYSTEM_REPORT]   CASPER-3    : ${casper ? 'APPROVE' : 'REJECT'}` },
              { type: 'output', text: `[SYSTEM_REPORT] MAGI Status: ${status}` },
              {
                type: 'system',
                text: consensus
                  ? '[SYSTEM_REPORT] PRIORITY: APPROVED (2/3 consensus reached)'
                  : '[SYSTEM_REPORT] PRIORITY: REJECTED (consensus not reached)',
              },
            );
          } else {
            outputLines.push({
              type: 'error',
              text: '[SYSTEM_REPORT] Usage: magi --vote',
            });
          }
          break;
        }

        case 'signal': {
          if (flag === '--emergency') {
            useNervStore.getState().setEmergencyLevel('EMERGENCY');
            useNervStore.getState().addSystemAlert({
              message: 'EMERGENCY SIGNAL ACTIVATED — All units to battle stations',
              severity: 'EMERGENCY',
            });
            outputLines.push(
              { type: 'error', text: '[SYSTEM_REPORT] !!! EMERGENCY SIGNAL ACTIVATED !!!' },
              { type: 'error', text: '[SYSTEM_REPORT] All units to battle stations.' },
              { type: 'error', text: '[SYSTEM_REPORT] Emergency level set to: EMERGENCY' },
            );
          } else if (flag === '--alert') {
            useNervStore.getState().setEmergencyLevel('ALERT');
            useNervStore.getState().addSystemAlert({
              message: 'ALERT STATUS ACTIVATED',
              severity: 'ALERT',
            });
            outputLines.push(
              { type: 'system', text: '[SYSTEM_REPORT] ALERT STATUS ACTIVATED.' },
              { type: 'system', text: '[SYSTEM_REPORT] Emergency level set to: ALERT' },
            );
          } else if (flag === '--normal') {
            useNervStore.getState().setEmergencyLevel('NORMAL');
            useNervStore.getState().clearSystemAlerts();
            outputLines.push(
              { type: 'output', text: '[SYSTEM_REPORT] All clear. Returning to normal operations.' },
              { type: 'output', text: '[SYSTEM_REPORT] Emergency level set to: NORMAL' },
            );
          } else {
            outputLines.push({
              type: 'error',
              text: '[SYSTEM_REPORT] Usage: signal --emergency | --alert | --normal',
            });
          }
          break;
        }

        case 'help': {
          outputLines.push(
            { type: 'output', text: '[SYSTEM_REPORT] --- AVAILABLE COMMANDS ---' },
            { type: 'output', text: '[SYSTEM_REPORT] system --status      Display current NERV system state' },
            { type: 'output', text: '[SYSTEM_REPORT] magi --vote          Initiate MAGI voting sequence' },
            { type: 'output', text: '[SYSTEM_REPORT] signal --emergency   Activate emergency protocol' },
            { type: 'output', text: '[SYSTEM_REPORT] signal --alert       Activate alert status' },
            { type: 'output', text: '[SYSTEM_REPORT] signal --normal      Return to normal operations' },
            { type: 'output', text: '[SYSTEM_REPORT] clear                Clear terminal output' },
            { type: 'output', text: '[SYSTEM_REPORT] help                 Show this message' },
            { type: 'output', text: '[SYSTEM_REPORT] --------------------------' },
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
            text: `[SYSTEM_REPORT] Unknown command: "${cmd}". Type "help" for available commands.`,
          });
        }
      }

      appendLines(outputLines);
    },
    [store.emergencyLevel, store.syncRatios, store.magiVotes, store.magiStatus, store.systemAlerts, appendLines],
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
      className="flex flex-col bg-[#050505] border border-[#FF9900] font-['Share_Tech_Mono'] text-sm h-full min-h-[300px]"
      onClick={() => inputRef.current?.focus()}
    >
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
