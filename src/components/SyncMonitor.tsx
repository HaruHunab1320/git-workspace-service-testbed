import { useNervStore } from '../store/useNervStore';

export default function SyncMonitor() {
  const syncRatio = useNervStore((s) => s.syncRatio);
  const emergencyLevel = useNervStore((s) => s.emergencyLevel);
  const isEmergency = emergencyLevel === 'EMERGENCY';

  const barColor = isEmergency ? '#FF0000' : '#39FF14';
  const statusLabel =
    emergencyLevel === 'EMERGENCY'
      ? 'CRITICAL'
      : emergencyLevel === 'ALERT'
        ? 'CAUTION'
        : 'NOMINAL';

  return (
    <div className="nerv-panel flex flex-col items-center gap-4 p-4 font-mono">
      <h2 className="nerv-header w-full text-center text-[#FF9900] text-sm tracking-widest uppercase">
        Evangelion Sync-Ratio Monitor
      </h2>

      {/* Sync ratio numeric readout */}
      <div
        className="text-4xl tabular-nums"
        style={{ color: barColor }}
      >
        {syncRatio.toFixed(1)}%
      </div>

      {/* Vertical progress bar */}
      <div
        className="relative w-16 border border-[#FF9900] bg-black"
        style={{ height: 200 }}
      >
        {/* Scale markings */}
        {[0, 25, 50, 75, 100].map((tick) => (
          <div
            key={tick}
            className="absolute left-0 w-full border-t border-[#FF9900]/30"
            style={{ bottom: `${tick}%` }}
          >
            <span className="absolute -left-8 -top-2 text-[10px] text-[#FF9900]/60">
              {tick}
            </span>
          </div>
        ))}

        {/* Animated fill bar */}
        <div
          data-testid="sync-bar"
          className="absolute bottom-0 left-0 w-full transition-all duration-500 ease-in-out"
          style={{
            height: `${Math.min(Math.max(syncRatio, 0), 100)}%`,
            backgroundColor: barColor,
            boxShadow: isEmergency
              ? '0 0 12px #FF0000, inset 0 0 8px rgba(255,0,0,0.4)'
              : `0 0 8px ${barColor}40`,
            animation: isEmergency ? 'emergency-pulse 0.8s ease-in-out infinite' : 'none',
          }}
        />
      </div>

      {/* Status indicator */}
      <div
        className="text-xs tracking-[0.3em] uppercase"
        style={{
          color: isEmergency ? '#FF0000' : '#39FF14',
          animation: isEmergency ? 'emergency-pulse 0.8s ease-in-out infinite' : 'none',
        }}
      >
        STATUS: {statusLabel}
      </div>

      {/* Pilot designation */}
      <div className="text-[10px] text-[#FF9900]/50 tracking-widest">
        UNIT-02 // PILOT SYNC TELEMETRY
      </div>

      <style>{`
        @keyframes emergency-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}
