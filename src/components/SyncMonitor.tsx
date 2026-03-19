import React from 'react';
import { useNervStore } from '../store/useNervStore';

const SyncMonitor: React.FC = () => {
  const { syncRatios, systemAlerts } = useNervStore();

  const ratioValues = Object.values(syncRatios);
  const avgRatio = ratioValues.length > 0
    ? ratioValues.reduce((sum, v) => sum + v, 0) / ratioValues.length
    : 0;
  const clampedRatio = Math.min(100, Math.max(0, avgRatio));
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
      <h2 className="text-xl mb-4">[SYSTEM_REPORT] SYNC RATIO MONITOR</h2>
      <div className="flex items-end gap-2 h-48">
        {Object.entries(syncRatios).map(([pilotId, ratio]) => {
          const clamped = Math.min(100, Math.max(0, ratio));
          return (
            <div
              key={pilotId}
              data-testid={`sync-bar-${pilotId}`}
              className={`w-12 transition-all ${hasEmergencyAlerts ? 'bg-red-500 animate-pulse' : 'bg-[#39FF14]'}`}
              style={{ height: `${clamped}%` }}
            />
          );
        })}
        {ratioValues.length === 0 && (
          <div
            data-testid="sync-bar"
            className="w-12 bg-[#39FF14]"
            style={{ height: '0%' }}
          />
        )}
      </div>
      <div data-testid="sync-value" className="mt-2">
        {clampedRatio.toFixed(1)}%
      </div>
      {hasEmergencyAlerts && (
        <div data-testid="emergency-warning" className="text-red-500 animate-pulse mt-2 font-bold">
          [SYSTEM_REPORT] EMERGENCY STATE ACTIVE
        </div>
      )}
    </div>
  );
};

export default SyncMonitor;
