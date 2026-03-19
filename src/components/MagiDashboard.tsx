import React from 'react';
import { useNervStore } from '../store/useNervStore';

const MagiDashboard: React.FC = () => {
  const { magiVotes } = useNervStore();

  const approvedCount = [magiVotes.melchior, magiVotes.balthasar, magiVotes.casper].filter(Boolean).length;
  const consensus = approvedCount >= 2;

  return (
    <div className="bg-black text-[#39FF14] border-1 border-[#FF9900] font-mono p-4">
      <h2 className="text-xl mb-4">MAGI SYSTEM</h2>
      <div className="space-y-2">
        <div data-testid="melchior" className={magiVotes.melchior ? 'text-[#39FF14]' : 'text-[#FF9900]'}>
          MELCHIOR-1: {magiVotes.melchior ? 'APPROVE' : 'REJECT'}
        </div>
        <div data-testid="balthasar" className={magiVotes.balthasar ? 'text-[#39FF14]' : 'text-[#FF9900]'}>
          BALTHASAR-2: {magiVotes.balthasar ? 'APPROVE' : 'REJECT'}
        </div>
        <div data-testid="casper" className={magiVotes.casper ? 'text-[#39FF14]' : 'text-[#FF9900]'}>
          CASPER-3: {magiVotes.casper ? 'APPROVE' : 'REJECT'}
        </div>
      </div>
      <div
        data-testid="consensus"
        className={`mt-4 text-lg font-bold ${consensus ? 'text-[#39FF14]' : 'text-[#FF9900]'}`}
      >
        {consensus ? 'PRIORITY: APPROVED' : 'PRIORITY: REJECTED'}
      </div>
    </div>
  );
};

export default MagiDashboard;
