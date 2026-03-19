import React from 'react';
import { useNervStore } from '../store/useNervStore';
import { MAGI_LABELS, eva_computeConsensus } from '../systems/magi';
import type { MagiSubSystem } from '../systems/magi';

/**
 * Props for the individual MAGI vote card sub-component.
 */
interface VoteCardProps {
  unit: MagiSubSystem;
  vote: boolean;
  onToggle: () => void;
}

/**
 * Interactive vote card for a single MAGI sub-system.
 * Displays the unit designation, name, vote indicator, and APPROVE/REJECT label.
 * Clicking the card toggles the vote.
 */
function VoteCard({ unit, vote, onToggle }: VoteCardProps) {
  const label = MAGI_LABELS[unit];

  return (
    <button
      data-testid={unit}
      onClick={onToggle}
      className={`flex flex-col items-center gap-2 p-4 border border-[#FF9900] bg-[#050505] font-['Share_Tech_Mono'] transition-colors cursor-pointer ${
        vote ? 'shadow-[0_0_15px_rgba(255,51,0,0.3)]' : 'shadow-[0_0_15px_rgba(255,153,0,0.2)]'
      }`}
    >
      <span className="text-xs text-[#FF9900] tracking-widest">{label.designation}</span>
      <span className="text-lg text-[#FF3300] tracking-wider">{label.name}</span>
      <div
        className={`mt-2 w-16 h-16 border-2 flex items-center justify-center text-2xl font-bold transition-colors ${
          vote
            ? 'border-[#FF3300] text-[#FF3300] bg-[#FF3300]/10'
            : 'border-[#FF9900] text-[#FF9900] bg-[#FF9900]/10'
        }`}
      >
        {vote ? '○' : '×'}
      </div>
      <span className={`text-sm tracking-widest ${vote ? 'text-[#FF3300]' : 'text-[#FF9900]'}`}>
        {vote ? 'APPROVE' : 'REJECT'}
      </span>
    </button>
  );
}

/**
 * MAGI Supercomputer Dashboard component.
 *
 * Displays the three MAGI sub-systems (MELCHIOR-1, BALTHASAR-2, CASPER-3)
 * as interactive vote cards, and computes 2/3 majority consensus in real-time.
 * Reads `magiVotes` and dispatches `setMagiVotes` via the global NERV store.
 */
export function MagiDashboard() {
  const magiVotes = useNervStore((s) => s.magiVotes);
  const setMagiVotes = useNervStore((s) => s.setMagiVotes);

  const consensus = eva_computeConsensus(magiVotes);

  const approveCount = [magiVotes.melchior, magiVotes.balthasar, magiVotes.casper].filter(Boolean).length;

  const toggleVote = (unit: MagiSubSystem) => {
    setMagiVotes({ [unit]: !magiVotes[unit] });
  };

  return (
    <div className="bg-[#050505] border border-[#FF9900] p-4 font-['Share_Tech_Mono']">
      <div className="flex items-center justify-between mb-4 border-b border-[#FF9900] pb-2">
        <h2 className="text-[#FF9900] text-sm tracking-[0.3em]">[SYSTEM_REPORT] MAGI SYSTEM</h2>
        <span className="text-[#FF3300] text-xs tracking-widest animate-pulse">ONLINE</span>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        {(['melchior', 'balthasar', 'casper'] as const).map((unit) => (
          <VoteCard key={unit} unit={unit} vote={magiVotes[unit]} onToggle={() => toggleVote(unit)} />
        ))}
      </div>

      <div className="border border-[#FF9900] p-3 text-center">
        <span className="text-xs text-[#FF9900] tracking-widest block mb-1">CONSENSUS RESULT</span>
        <span
          className={`text-xl tracking-[0.2em] font-bold ${consensus ? 'text-[#FF3300]' : 'text-[#FF9900]'}`}
          data-testid="consensus-result"
          data-consensus={consensus ? 'APPROVED' : 'REJECTED'}
        >
          {consensus ? 'PRIORITY: APPROVED' : 'PRIORITY: REJECTED'}
        </span>
        <span className="text-xs text-[#FF3300]/60 block mt-1">
          {approveCount}/3 AFFIRMATIVE
        </span>
      </div>
    </div>
  );
}

export default MagiDashboard;
