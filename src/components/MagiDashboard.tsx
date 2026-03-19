import React from 'react';
import { useNervStore } from '../store/useNervStore';

const MagiDashboard: React.FC = () => {
  const { magiVotes, magiStatus, systemAlerts } = useNervStore();

  const consensus = magiStatus === 'AGREE';
  const hasEmergencyAlerts = systemAlerts.length > 0;

  return (
    <div className="bg-[#050505] text-[#39FF14] border-1 border-[#FF9900] font-['Share_Tech_Mono'] p-4 relative">
      {hasEmergencyAlerts && (
        <div
          data-testid="emergency-overlay"
          className="absolute inset-0 bg-[#FF3300]/20 border-2 border-[#FF3300] animate-pulse z-10 flex items-center justify-center"
        >
          <span className="text-[#FF3300] text-2xl font-bold tracking-widest">
            [SYSTEM_REPORT] EMERGENCY ACTIVE
          </span>
        </div>
      )}
      <h2 className="text-xl mb-4">[SYSTEM_REPORT] MAGI SYSTEM</h2>
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
        {consensus ? 'PRIORITY: APPROVED' : magiStatus === 'CONFLICT' ? 'PRIORITY: CONFLICT' : 'PRIORITY: REJECTED'}
      </div>
      <div data-testid="magi-status" className="mt-2 text-xs opacity-60">
        MAGI STATUS: {magiStatus}
      </div>
    </div>
  );
};

export default MagiDashboard;
