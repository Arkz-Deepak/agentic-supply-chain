import React from 'react';
import { Clock, Route, ShieldAlert, Activity } from 'lucide-react';
import ParallaxCard from './ParallaxCard';

export default function RouteStatsCard({
  activeRouteName = 'NH-16 Route 99',
  disruptionState = 'idle', // 'idle' | 'detected' | 'rerouting' | 'resolved'
  distanceKm = 28,
  etaMinutes = 38,
}) {
  const isBlocked = disruptionState === 'detected';
  const isRerouted = disruptionState === 'resolved';

  const formatTime = (mins) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return h > 0 ? `${h}h ${m}m` : `${m} mins`;
  };

  return (
    <ParallaxCard className="p-3.5" maxTilt={3}>
      <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-2.5">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-sky-600" />
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-800">
            Odisha Corridor Telemetry &bull; IIT Bhubaneswar
          </h3>
        </div>
        <span
          className={`text-[10px] font-mono px-2 py-0.5 rounded-md font-bold uppercase tracking-wider border shadow-sm ${
            isBlocked
              ? 'bg-rose-50 text-rose-700 border-rose-300'
              : isRerouted
              ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
              : 'bg-sky-50 text-sky-700 border-sky-300'
          }`}
        >
          {isBlocked ? 'NH-16 HALTED' : isRerouted ? 'DAYA BYPASS ACTIVE' : 'CORRIDOR CLEAR'}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 font-mono">
        {/* Active Corridor */}
        <div className="rounded-xl bg-slate-50 p-2.5 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-1.5 text-slate-500 text-[10px] mb-0.5">
            <Route className="h-3 w-3 text-sky-600" />
            <span>CORRIDOR</span>
          </div>
          <div className="text-xs font-bold text-slate-900 truncate">
            {isRerouted ? 'route_101_express' : activeRouteName}
          </div>
          <div className="text-[9px] text-slate-500 mt-0.5">
            {isRerouted ? 'Daya Canal Green Link' : 'NH-16 Primary Arterial'}
          </div>
        </div>

        {/* ETA */}
        <div className="rounded-xl bg-slate-50 p-2.5 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-1.5 text-slate-500 text-[10px] mb-0.5">
            <Clock className="h-3 w-3 text-sky-600" />
            <span>EST. TIME</span>
          </div>
          <div className="text-xs font-bold text-slate-900">
            {isRerouted ? formatTime(etaMinutes + 7) : isBlocked ? 'HALTED' : formatTime(etaMinutes)}
          </div>
          <div className="text-[9px] text-slate-500 mt-0.5">
            {isRerouted ? '+7 min detour' : isBlocked ? 'Khandagiri blocked' : 'On Schedule'}
          </div>
        </div>

        {/* Distance */}
        <div className="rounded-xl bg-slate-50 p-2.5 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-1.5 text-slate-500 text-[10px] mb-0.5">
            <Activity className="h-3 w-3 text-purple-600" />
            <span>DISTANCE</span>
          </div>
          <div className="text-xs font-bold text-slate-900">
            {isRerouted ? `${distanceKm + 4} km` : `${distanceKm} km`}
          </div>
          <div className="text-[9px] text-slate-500 mt-0.5">
            {isRerouted ? 'Via Sundarpada Link' : 'Direct via NH-16'}
          </div>
        </div>

        {/* Risk / Weather Level */}
        <div className="rounded-xl bg-slate-50 p-2.5 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-1.5 text-slate-500 text-[10px] mb-0.5">
            <ShieldAlert
              className={`h-3 w-3 ${
                isBlocked ? 'text-rose-600' : isRerouted ? 'text-emerald-600' : 'text-slate-500'
              }`}
            />
            <span>RISK INDEX</span>
          </div>
          <div
            className={`text-xs font-bold ${
              isBlocked ? 'text-rose-600' : isRerouted ? 'text-emerald-600' : 'text-sky-700'
            }`}
          >
            {isBlocked ? '99% BLOCKED' : isRerouted ? '3.5% SAFE' : '10.2% NOMINAL'}
          </div>
          <div className="text-[9px] text-slate-500 mt-0.5">
            {isBlocked ? 'Waterlog / Strike' : isRerouted ? 'Paved Canal Bypass' : 'Normal Traffic'}
          </div>
        </div>
      </div>
    </ParallaxCard>
  );
}
