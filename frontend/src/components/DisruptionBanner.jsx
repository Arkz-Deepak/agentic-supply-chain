import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CloudLightning, Cpu, ArrowRight, RefreshCw, CheckCircle2 } from 'lucide-react';
import { playMechanicalClick } from '../utils/soundEffects';

export default function DisruptionBanner({
  disruptionState, // 'idle' | 'detected' | 'rerouting' | 'resolved'
  onTriggerReroute,
  disruptedRoute = 'NH-16 (Route 99)',
  resolvedRoute = 'Route 101 (Daya Canal Green Bypass)',
}) {
  if (disruptionState === 'idle') return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -15, scale: 0.96 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="w-full mb-3"
      >
        {disruptionState === 'detected' && (
          <div className="relative overflow-hidden rounded-xl border border-rose-500/60 bg-gradient-to-r from-rose-950/85 via-dark-900/90 to-rose-950/85 p-3.5 shadow-[0_0_30px_rgba(244,63,94,0.35)] backdrop-blur-xl">
            <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent via-rose-500/10 to-transparent opacity-50 animate-scanline" />

            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 relative z-10">
              <div className="flex items-center gap-3">
                <motion.div
                  animate={{ scale: [1, 1.2, 1], rotate: [0, -4, 4, 0] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                  className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.5)] flex-shrink-0"
                >
                  <CloudLightning className="h-5 w-5" />
                </motion.div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="flex h-2 w-2 rounded-full bg-rose-500 animate-ping" />
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-rose-400">
                      LIVE ROADBLOCK DETECTED &bull; NH-16 KHANDAGIRI
                    </span>
                    <span className="rounded bg-rose-900/60 px-1.5 py-0.5 text-[9px] font-mono text-rose-300 border border-rose-700/50">
                      4FT WATERLOG + STRIKE
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold text-white tracking-wide mt-0.5">
                    Truck TRK-8821 Halted on <span className="font-mono text-rose-300 underline">{disruptedRoute}</span> en route to IIT Bhubaneswar
                  </h3>
                  <p className="text-[11px] text-rose-200/80">
                    Carrier telemetry triggered emergency brake. Strategist Agent recommends immediate recalculation via Daya West Canal artery.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end md:self-center">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    playMechanicalClick();
                    onTriggerReroute();
                  }}
                  className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-rose-600 to-cyber-rose px-3.5 py-2 text-xs font-mono font-bold text-white shadow-[0_0_18px_rgba(244,63,94,0.6)] hover:brightness-110"
                >
                  <Cpu className="h-3.5 w-3.5 animate-spin" />
                  TRIGGER AGENT REROUTE
                  <ArrowRight className="h-3.5 w-3.5" />
                </motion.button>
              </div>
            </div>
          </div>
        )}

        {disruptionState === 'rerouting' && (
          <div className="relative overflow-hidden rounded-xl border border-cyber-cyan/50 bg-gradient-to-r from-cyan-950/85 via-dark-900/90 to-blue-950/85 p-3.5 shadow-[0_0_30px_rgba(0,240,255,0.3)] backdrop-blur-xl">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
                  className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-cyber-cyan flex-shrink-0"
                >
                  <RefreshCw className="h-5 w-5" />
                </motion.div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="flex h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-cyber-cyan">
                      LANGGRAPH AGENT RECALCULATING CORRIDOR
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold text-white tracking-wide mt-0.5">
                    Strategist Node Bypassing Khandagiri Flood Bottleneck...
                  </h3>
                  <p className="text-[11px] text-cyan-200/80 font-mono">
                    Querying Daya Canal &bull; Sundarpada arterial &bull; Direct access to IIT Bhubaneswar South Gate
                  </p>
                </div>
              </div>

              <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-cyan-300">
                <span className="animate-pulse">Synthesizing Gemini 3.7 Plan...</span>
              </div>
            </div>
          </div>
        )}

        {disruptionState === 'resolved' && (
          <div className="relative overflow-hidden rounded-xl border border-emerald-500/50 bg-gradient-to-r from-emerald-950/85 via-dark-900/90 to-emerald-950/85 p-3.5 shadow-[0_0_30px_rgba(16,185,129,0.3)] backdrop-blur-xl">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex-shrink-0">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-400">
                      AUTONOMOUS RESOLUTION CONFIRMED
                    </span>
                    <span className="rounded bg-emerald-900/60 px-1.5 py-0.5 text-[9px] font-mono text-emerald-300 border border-emerald-700/50">
                      ETA DELTA: +7 MINS &bull; CLEAR WEATHER
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold text-white tracking-wide mt-0.5">
                    Truck Resumed Navigation via <span className="font-mono text-emerald-300">{resolvedRoute}</span>
                  </h3>
                  <p className="text-[11px] text-emerald-200/80">
                    Bypassed Khandagiri bottleneck completely. Scheduled delivery to IIT Bhubaneswar campus on track.
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
