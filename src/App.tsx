import { useNervStore } from './store/useNervStore'

function App() {
  const emergencyLevel = useNervStore((s) => s.emergencyLevel)
  const systemAlerts = useNervStore((s) => s.systemAlerts)

  return (
    <div className="min-h-screen bg-[#050505] text-[#FF3300] font-mono p-4">
      {/* NERV Header */}
      <header className="border-b border-[#FF9900] pb-4 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl text-[#FF9900] tracking-[0.3em] uppercase font-bold">
              NERV Command Center
            </h1>
            <p className="text-xs text-[#FF3300] mt-1 tracking-widest">
              GOD'S IN HIS HEAVEN — ALL'S RIGHT WITH THE WORLD
            </p>
          </div>
          <div className="text-right">
            <div className="text-xs text-[#FF9900]">[SYSTEM_REPORT] STATUS</div>
            <div
              className={`text-sm font-bold tracking-wider ${
                emergencyLevel === 'EMERGENCY'
                  ? 'text-red-500 animate-pulse'
                  : emergencyLevel === 'ALERT'
                    ? 'text-[#FF9900]'
                    : 'text-[#FF3300]'
              }`}
            >
              {emergencyLevel}
            </div>
          </div>
        </div>
      </header>

      {/* Emergency Overlay */}
      {systemAlerts.length > 0 && (
        <div className="mb-4 border border-red-500 bg-red-500/10 p-3 animate-pulse">
          <div className="text-red-500 font-bold text-sm mb-1">[SYSTEM_REPORT] ACTIVE ALERTS</div>
          {systemAlerts.map((alert) => (
            <div key={alert.id} className="text-red-400 text-xs">
              [{alert.severity}] {alert.message}
            </div>
          ))}
        </div>
      )}

      {/* Main Grid — component slots for other agents */}
      <main className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {/* Slot: MAGI Dashboard (Unit-01) */}
        <div className="nerv-panel min-h-[200px]">
          <div className="nerv-header">MAGI System</div>
          <p className="text-xs text-[#FF3300]/50">[SYSTEM_REPORT] Awaiting MAGI initialization...</p>
        </div>

        {/* Slot: Sync Monitor (Unit-02) */}
        <div className="nerv-panel min-h-[200px]">
          <div className="nerv-header">Sync Ratio Monitor</div>
          <p className="text-xs text-[#FF3300]/50">[SYSTEM_REPORT] Awaiting pilot sync data...</p>
        </div>

        {/* Slot: GeoFront Map (Unit-03) */}
        <div className="nerv-panel min-h-[200px]">
          <div className="nerv-header">GeoFront Tactical Map</div>
          <p className="text-xs text-[#FF3300]/50">[SYSTEM_REPORT] Awaiting geo-data feed...</p>
        </div>

        {/* Slot: NERV Terminal (Unit-04) — spans full width */}
        <div className="nerv-panel min-h-[150px] md:col-span-2 xl:col-span-3">
          <div className="nerv-header">Command Terminal</div>
          <p className="text-xs text-[#FF3300]/50">[SYSTEM_REPORT] Awaiting terminal initialization...</p>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-6 border-t border-[#FF9900]/30 pt-3 text-center">
        <p className="text-[10px] text-[#FF9900]/50 tracking-widest uppercase">
          NERV HQ — Tokyo-3 — MAGI OS v3.01
        </p>
      </footer>
    </div>
  )
}

export default App
