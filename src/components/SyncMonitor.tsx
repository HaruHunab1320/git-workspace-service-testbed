import React from 'react';
import { useNervStore } from '../store/useNervStore';

const SyncMonitor: React.FC = () => {
  const { syncRatio, emergencyLevel } = useNervStore();

  const clampedRatio = Math.min(100, Math.max(0, syncRatio));
  const isEmergency = emergencyLevel === 'EMERGENCY';

  return (
    <div className="bg-black text-[#39FF14] border-1 border-[#FF9900] font-mono p-4">
      <h2 className="text-xl mb-4">SYNC RATIO MONITOR</h2>
      <div className="flex items-end gap-2 h-48">
        <div
          data-testid="sync-bar"
          className={`w-12 transition-all ${isEmergency ? 'bg-red-500 animate-pulse' : 'bg-[#39FF14]'}`}
          style={{ height: `${clampedRatio}%` }}
        />
      </div>
      <div data-testid="sync-value" className="mt-2">
        {clampedRatio.toFixed(1)}%
      </div>
      {isEmergency && (
        <div data-testid="emergency-warning" className="text-red-500 animate-pulse mt-2 font-bold">
          ⚠ EMERGENCY STATE ACTIVE
        </div>
      )}
    </div>
  );
};

export default SyncMonitor;
