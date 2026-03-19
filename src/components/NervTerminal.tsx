import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNervStore } from '../store/useNervStore';
import type { NervState, EmergencyLevel } from '../store/useNervStore';

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

/**
 * Formats a MAGI vote boolean as a display string.
 * @param vote - The boolean vote value
 * @returns 'APPROVE' or 'REJECT'
 */
function eva_formatVote(vote: boolean): string {
  return vote ? 'APPROVE' : 'REJECT';
}

/**
 * Determines the consensus result from the current MAGI status.
 * @param approvedCount - Number of MAGI subsystems that approved
 * @returns Formatted consensus result string
 */
function eva_consensusResult(approvedCount: number): string {
  return approvedCount >= 2
    ? 'PRIORITY: APPROVED (2/3 consensus reached)'
    : 'PRIORITY: REJECTED (consensus not reached)';
}

/** Selector for terminal-relevant state slices. */
const selectTerminalState = (state: NervState) => ({
  emergencyLevel: state.emergencyLevel,
  syncRatios: state.syncRatios,
  magiVotes: state.magiVotes,
  magiStatus: state.magiStatus,
  systemAlerts: state.systemAlerts,
  setEmergencyLevel: state.setEmergencyLevel,
  randomizeMagiVotes: state.randomizeMagiVotes,
  addSystemAlert: state.addSystemAlert,
  clearSystemAlerts: state.clearSystemAlerts,
});

/**
 * NERV Command Terminal — command-line interface for NERV operators.
 * Provides system status inspection, MAGI voting, and emergency signal control.
 * Reads and writes state via the global `useNervStore`.
 */
export default function NervTerminal() {
  const [history, setHistory] = useState<TerminalLine[]>(
    BOOT_MESSAGES.map((text) => ({ type: 'system', text })),
  );
  const [input, setInput] = useState('');
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    emergencyLevel,
    syncRatios,
    magiVotes,
    magiStatus,
    systemAlerts,
    setEmergencyLevel,
    randomizeMagiVotes,
    addSystemAlert,
    clearSystemAlerts,
  } = useNervStore(selectTerminalState);

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
              { type: 'output', text: '[SYSTEM_REPORT] --- NERV SYSTEM STATUS ---' },
              { type: 'output', text: `[SYSTEM_REPORT] Emergency Level : ${emergencyLevel}` },
              { type: 'output', text: `[SYSTEM_REPORT] MAGI Status     : ${magiStatus}` },
            );

            // Per-pilot sync ratios
            const pilotIds = Object.keys(syncRatios);
            outputLines.push({ type: 'output', text: '[SYSTEM_REPORT] Sync Ratios:' });
            if (pilotIds.length === 0) {
              outputLines.push({ type: 'output', text: '[SYSTEM_REPORT]   (no pilots registered)' });
            } else {
              for (const pilotId of pilotIds) {
                outputLines.push({
                  type: 'output',
                  text: `[SYSTEM_REPORT]   ${pilotId} : ${syncRatios[pilotId].toFixed(1)}%`,
                });
              }
            }

            outputLines.push(
              { type: 'output', text: '[SYSTEM_REPORT] MAGI Votes:' },
              { type: 'output', text: `[SYSTEM_REPORT]   MELCHIOR-1  : ${eva_formatVote(magiVotes.melchior)}` },
              { type: 'output', text: `[SYSTEM_REPORT]   BALTHASAR-2 : ${eva_formatVote(magiVotes.balthasar)}` },
              { type: 'output', text: `[SYSTEM_REPORT]   CASPER-3    : ${eva_formatVote(magiVotes.casper)}` },
            );

            // System alerts
            if (systemAlerts.length === 0) {
              outputLines.push({ type: 'output', text: '[SYSTEM_REPORT] System Alerts   : NONE' });
            } else {
              outputLines.push({ type: 'output', text: `[SYSTEM_REPORT] System Alerts   : ${systemAlerts.length} active` });
              for (const alert of systemAlerts) {
                const message = typeof alert === 'string' ? alert : alert.message;
                outputLines.push({ type: 'error', text: `[SYSTEM_REPORT]   - ${message}` });
              }
            }

            outputLines.push({ type: 'output', text: '[SYSTEM_REPORT] --------------------------' });
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
            randomizeMagiVotes();
            // Read the freshly randomized votes from the store
            const freshState = useNervStore.getState();
            const votes = freshState.magiVotes;
            const approvedCount = [votes.melchior, votes.balthasar, votes.casper].filter(Boolean).length;

            outputLines.push(
              { type: 'output', text: '[SYSTEM_REPORT] MAGI VOTING INITIATED...' },
              { type: 'output', text: `[SYSTEM_REPORT]   MELCHIOR-1  : ${eva_formatVote(votes.melchior)}` },
              { type: 'output', text: `[SYSTEM_REPORT]   BALTHASAR-2 : ${eva_formatVote(votes.balthasar)}` },
              { type: 'output', text: `[SYSTEM_REPORT]   CASPER-3    : ${eva_formatVote(votes.casper)}` },
              { type: 'system', text: `[SYSTEM_REPORT] ${eva_consensusResult(approvedCount)}` },
              { type: 'system', text: `[SYSTEM_REPORT] MAGI STATUS: ${freshState.magiStatus}` },
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
            setEmergencyLevel('EMERGENCY');
            addSystemAlert({ message: 'EMERGENCY SIGNAL ACTIVATED BY OPERATOR', level: 'EMERGENCY' });
            outputLines.push(
              { type: 'error', text: '[SYSTEM_REPORT] !!! EMERGENCY SIGNAL ACTIVATED !!!' },
              { type: 'error', text: '[SYSTEM_REPORT] All units to battle stations.' },
              { type: 'error', text: '[SYSTEM_REPORT] Emergency level set to: EMERGENCY' },
            );
          } else if (flag === '--alert') {
            setEmergencyLevel('ALERT');
            outputLines.push(
              { type: 'system', text: '[SYSTEM_REPORT] ALERT STATUS ACTIVATED.' },
              { type: 'system', text: '[SYSTEM_REPORT] Emergency level set to: ALERT' },
            );
          } else if (flag === '--normal') {
            setEmergencyLevel('NORMAL');
            outputLines.push(
              { type: 'output', text: '[SYSTEM_REPORT] All clear. Returning to normal operations.' },
              { type: 'output', text: '[SYSTEM_REPORT] Emergency level set to: NORMAL' },
            );
          } else {
            outputLines.push({
              type: 'error',
              text: 'Usage: signal --emergency | --alert | --normal',
            });
          }
          break;
        }

        case 'alert': {
          if (flag === '--list') {
            const freshAlerts = useNervStore.getState().systemAlerts;
            if (freshAlerts.length === 0) {
              outputLines.push({ type: 'output', text: '[SYSTEM_REPORT] No active alerts.' });
            } else {
              outputLines.push({ type: 'output', text: `[SYSTEM_REPORT] --- ACTIVE ALERTS (${freshAlerts.length}) ---` });
              for (const a of freshAlerts) {
                const time = new Date(a.timestamp).toTimeString().slice(0, 8);
                outputLines.push({
                  type: a.level === 'EMERGENCY' || a.level === 'CRITICAL' ? 'error' : 'output',
                  text: `[${time}] [${a.level}] ${a.message}`,
                });
              }
              outputLines.push({ type: 'output', text: '[SYSTEM_REPORT] --------------------------' });
            }
          } else if (flag === '--clear') {
            clearSystemAlerts();
            outputLines.push({ type: 'output', text: '[SYSTEM_REPORT] All system alerts cleared.' });
          } else {
            outputLines.push({
              type: 'error',
              text: 'Usage: alert --list | --clear',
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
            { type: 'output', text: 'alert --list         Display active system alerts' },
            { type: 'output', text: 'alert --clear        Clear all system alerts' },
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
    [emergencyLevel, syncRatios, magiVotes, magiStatus, systemAlerts, setEmergencyLevel, randomizeMagiVotes, addSystemAlert, clearSystemAlerts, appendLines],
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
