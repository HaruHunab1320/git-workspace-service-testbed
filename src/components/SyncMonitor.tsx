import React from 'react';
import { useNervStore } from '../store/useNervStore';

const SyncMonitor: React.FC = () => {
  const { syncRatios, emergencyLevel } = useNervStore();

  const ratioEntries = Object.entries(syncRatios);
  const avgRatio = ratioEntries.length > 0
    ? ratioEntries.reduce((sum, [, v]) => sum + v, 0) / ratioEntries.length
    : 0;
  const clampedRatio = Math.min(100, Math.max(0, avgRatio));
  const isEmergency = emergencyLevel === 'EMERGENCY';

  return (
    <div className="bg-[#050505] text-[#FF3300] border-1 border-[#FF9900] font-mono p-4">
      <h2 className="text-xl mb-4">[SYSTEM_REPORT] SYNC RATIO MONITOR</h2>
      <div className="flex items-end gap-2 h-48">
        <div
          data-testid="sync-bar"
          className={`w-12 transition-all ${isEmergency ? 'bg-red-500 animate-pulse' : 'bg-[#FF3300]'}`}
          style={{ height: `${clampedRatio}%` }}
        />
      </div>
      <div data-testid="sync-value" className="mt-2">
        {clampedRatio.toFixed(1)}%
      </div>
      {ratioEntries.length > 0 && (
        <div className="mt-2 text-xs space-y-1">
          {ratioEntries.map(([pilotId, ratio]) => (
            <div key={pilotId} className="text-[#FF9900]">
              {pilotId}: {ratio.toFixed(1)}%
            </div>
          ))}
        </div>
      )}
      {isEmergency && (
        <div data-testid="emergency-warning" className="text-red-500 animate-pulse mt-2 font-bold">
          ⚠ EMERGENCY STATE ACTIVE
        </div>
      )}
    </div>
  );
};

export default SyncMonitor;
