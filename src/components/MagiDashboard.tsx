import { useNervStore } from '../store/useNervStore';

type MagiUnit = 'melchior' | 'balthasar' | 'casper';

interface VoteCardProps {
  unit: MagiUnit;
  vote: boolean;
  onToggle: () => void;
}

const MAGI_LABELS: Record<MagiUnit, { name: string; designation: string }> = {
  melchior: { name: 'MELCHIOR-1', designation: 'SCIENTIST' },
  balthasar: { name: 'BALTHASAR-2', designation: 'MOTHER' },
  casper: { name: 'CASPER-3', designation: 'WOMAN' },
};

function VoteCard({ unit, vote, onToggle }: VoteCardProps) {
  const label = MAGI_LABELS[unit];

  return (
    <button
      onClick={onToggle}
      className={`flex flex-col items-center gap-2 p-4 border border-[#FF9900] bg-black font-mono transition-colors cursor-pointer ${
        vote ? 'shadow-[0_0_15px_rgba(57,255,20,0.3)]' : 'shadow-[0_0_15px_rgba(255,153,0,0.2)]'
      }`}
    >
      <span className="text-xs text-[#FF9900] tracking-widest">{label.designation}</span>
      <span className="text-lg text-[#39FF14] tracking-wider">{label.name}</span>
      <div
        className={`mt-2 w-16 h-16 border-2 flex items-center justify-center text-2xl font-bold transition-colors ${
          vote
            ? 'border-[#39FF14] text-[#39FF14] bg-[#39FF14]/10'
            : 'border-[#FF9900] text-[#FF9900] bg-[#FF9900]/10'
        }`}
      >
        {vote ? '○' : '×'}
      </div>
      <span className={`text-sm tracking-widest ${vote ? 'text-[#39FF14]' : 'text-[#FF9900]'}`}>
        {vote ? 'APPROVE' : 'REJECT'}
      </span>
    </button>
  );
}

export function MagiDashboard() {
  const magiVotes = useNervStore((s) => s.magiVotes);
  const setMagiVotes = useNervStore((s) => s.setMagiVotes);

  const approveCount = [magiVotes.melchior, magiVotes.balthasar, magiVotes.casper].filter(Boolean).length;
  const consensus = approveCount >= 2;

  const toggleVote = (unit: MagiUnit) => {
    setMagiVotes({ ...magiVotes, [unit]: !magiVotes[unit] });
  };

  return (
    <div className="bg-black border border-[#FF9900] p-4 font-mono">
      <div className="flex items-center justify-between mb-4 border-b border-[#FF9900] pb-2">
        <h2 className="text-[#FF9900] text-sm tracking-[0.3em]">MAGI SYSTEM</h2>
        <span className="text-[#39FF14] text-xs tracking-widest animate-pulse">ONLINE</span>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        {(['melchior', 'balthasar', 'casper'] as const).map((unit) => (
          <VoteCard key={unit} unit={unit} vote={magiVotes[unit]} onToggle={() => toggleVote(unit)} />
        ))}
      </div>

      <div className="border border-[#FF9900] p-3 text-center">
        <span className="text-xs text-[#FF9900] tracking-widest block mb-1">CONSENSUS RESULT</span>
        <span
          className={`text-xl tracking-[0.2em] font-bold ${consensus ? 'text-[#39FF14]' : 'text-[#FF9900]'}`}
          data-testid="consensus-result"
        >
          {consensus ? 'PRIORITY: APPROVED' : 'PRIORITY: REJECTED'}
        </span>
        <span className="text-xs text-[#39FF14]/60 block mt-1">
          {approveCount}/3 AFFIRMATIVE
        </span>
      </div>
    </div>
  );
}
