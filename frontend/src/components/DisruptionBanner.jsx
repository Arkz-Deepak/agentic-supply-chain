import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CloudLightning, Cpu, ArrowRight, RefreshCw, CheckCircle2 } from 'lucide-react';
import { playMechanicalClick } from '../utils/soundEffects';

export default function DisruptionBanner({
  disruptionState, // 'idle' | 'detected' | 'rerouting' | 'resolved'
  onTriggerReroute,
  disruptedRoute = 'NH-16 (Route 99)',
  resolvedRoute = 'Route 101 (Daya Canal Bypass)',
  activeHazard = null,
  startPoint = null,
  destinationPoint = null,
}) {
  if (disruptionState === 'idle') return null;

  const incidentBadge = activeHazard?.incident_type
    ? activeHazard.incident_type.replace(/_/g, ' ')
    : 'WATERLOGGING + STRIKE';

  const hazardLocation = activeHazard?.location || 'Active Freight Sector';
  const hazardDesc = activeHazard?.description || 'Active road blockage on freight corridor';
  const destName = destinationPoint?.shortName || 'Destination Hub';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -15, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -10, scale: 0.98 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="w-full mb-3"
      >
        {disruptionState === 'detected' && (
          <div className="relative overflow-hidden rounded-2xl border border-rose-300 bg-gradient-to-r from-rose-50 via-white to-rose-50 p-4 shadow-lg">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 relative z-10">
              <div className="flex items-center gap-3">
                <motion.div
                  animate={{ scale: [1, 1.15, 1], rotate: [0, -3, 3, 0] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                  className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-100 border border-rose-300 text-rose-600 shadow-sm flex-shrink-0"
                >
                  <CloudLightning className="h-6 w-6" />
                </motion.div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="flex h-2 w-2 rounded-full bg-rose-600 animate-ping" />
                    <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-rose-700">
                      LIVE ROADBLOCK DETECTED &bull; {hazardLocation.toUpperCase()}
                    </span>
                    <span className="rounded bg-rose-100 px-2 py-0.5 text-[10px] font-mono font-bold text-rose-800 border border-rose-300 uppercase">
                      {incidentBadge}
                    </span>
                  </div>
                  <h3 className="text-sm md:text-base font-bold text-slate-900 tracking-tight mt-0.5">
                    Carrier TRK-8821 Halted on <span className="font-mono text-rose-700 underline">{disruptedRoute}</span> en route to {destName}
                  </h3>
                  <p className="text-xs text-slate-600">
                    Carrier telemetry triggered emergency brake due to {incidentBadge.toLowerCase()}: &ldquo;{hazardDesc}&rdquo;. Strategist Agent recommends immediate recalculation via bypass corridor.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end md:self-center">
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => {
                    playMechanicalClick();
                    onTriggerReroute();
                  }}
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 to-rose-500 px-4 py-2.5 text-xs font-mono font-bold text-white shadow-md hover:brightness-110"
                >
                  <Cpu className="h-4 w-4 animate-spin" />
                  <span>TRIGGER AGENT REROUTE</span>
                  <ArrowRight className="h-4 w-4" />
                </motion.button>
              </div>
            </div>
          </div>
        )}

        {disruptionState === 'rerouting' && (
          <div className="relative overflow-hidden rounded-2xl border border-sky-300 bg-gradient-to-r from-sky-50 via-white to-blue-50 p-4 shadow-lg">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
                  className="flex h-12 w-12 items-center justify-center rounded-xl bg-sky-100 border border-sky-300 text-sky-600 flex-shrink-0"
                >
                  <RefreshCw className="h-6 w-6" />
                </motion.div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="flex h-2 w-2 rounded-full bg-sky-500 animate-pulse" />
                    <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-sky-700">
                      LANGGRAPH AGENT RECALCULATING CORRIDOR
                    </span>
                  </div>
                  <h3 className="text-sm md:text-base font-bold text-slate-900 tracking-tight mt-0.5">
                    Strategist Node Bypassing {hazardLocation} ({incidentBadge})...
                  </h3>
                  <p className="text-xs text-slate-600 font-mono">
                    Querying OpenRouteService &bull; Computing green bypass corridor &bull; Direct access to {destName}
                  </p>
                </div>
              </div>

              <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-sky-700 font-semibold">
                <span className="animate-pulse">Synthesizing Gemini Plan...</span>
              </div>
            </div>
          </div>
        )}

        {disruptionState === 'resolved' && (
          <div className="relative overflow-hidden rounded-2xl border border-emerald-300 bg-gradient-to-r from-emerald-50 via-white to-teal-50 p-4 shadow-lg">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 border border-emerald-300 text-emerald-600 flex-shrink-0">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-emerald-700">
                      AUTONOMOUS RESOLUTION CONFIRMED
                    </span>
                    <span className="rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-mono font-bold text-emerald-800 border border-emerald-300">
                      ETA DELTA: +7 MINS &bull; CLEAR ROAD
                    </span>
                  </div>
                  <h3 className="text-sm md:text-base font-bold text-slate-900 tracking-tight mt-0.5">
                    Carrier Resumed Navigation via <span className="font-mono text-emerald-700">{resolvedRoute}</span>
                  </h3>
                  <p className="text-xs text-slate-600">
                    Bypassed {hazardLocation} ({incidentBadge}) completely. Stakeholders notified via automated dispatch email.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
