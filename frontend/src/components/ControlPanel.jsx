import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Navigation2,
  AlertTriangle,
  RotateCcw,
  Zap,
  Sliders,
  MapPin,
  Mic,
} from 'lucide-react';
import { PRESET_HUBS } from '../data/mockRoutes';
import ParallaxCard from './ParallaxCard';
import { playMechanicalClick } from '../utils/soundEffects';
import VoiceReportModal from './VoiceReportModal';

export default function ControlPanel({
  onComputeRoute,
  onTriggerDisruption,
  onAutonomousReroute,
  onReset,
  disruptionState,
  isProcessing,
  startPoint,
  destinationPoint,
  onSelectPreset,
  onVoiceReportSubmitted,
  hasActiveRoute = false,
}) {
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);

  const handlePresetClick = (hubA, hubB) => {
    playMechanicalClick();
    onSelectPreset(hubA, hubB);
  };

  const handleOpenVoiceModal = () => {
    playMechanicalClick();
    setIsVoiceModalOpen(true);
  };

  const handleVoiceSubmit = async (transcript) => {
    setIsVoiceModalOpen(false);
    if (onVoiceReportSubmitted) {
      await onVoiceReportSubmitted(transcript);
    } else {
      onTriggerDisruption();
    }
  };

  return (
    <>
      <ParallaxCard className="p-4" maxTilt={3}>
        <div className="flex flex-col space-y-3.5">
          {/* Section Header */}
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <div className="flex items-center gap-2">
              <Sliders className="h-4 w-4 text-sky-600" />
              <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-800">
                LogiPulse Controls &bull; IIT Bhubaneswar
              </h2>
            </div>
            <span className="text-[10px] font-mono font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200 shadow-sm">
              Tech Zephyr 4.0
            </span>
          </div>

          {/* Preset Hub Selectors */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-sans font-semibold text-slate-600 flex items-center gap-1">
              <MapPin className="h-3 w-3 text-sky-600" /> Select Regional Freight Corridor:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                onClick={() =>
                  handlePresetClick(
                    PRESET_HUBS[0], // Chennai Port
                    PRESET_HUBS[1]  // Oragadam
                  )
                }
                className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-sans text-slate-800 hover:border-sky-400 hover:bg-sky-50/60 transition text-left flex items-center justify-between shadow-sm"
              >
                <span className="font-semibold">🚢 Chennai Port &rarr; Oragadam</span>
                <span className="text-[10px] text-sky-600 font-bold font-mono">Port-Express</span>
              </button>
              <button
                onClick={() =>
                  handlePresetClick(
                    PRESET_HUBS[4] || PRESET_HUBS[0], // Bhubaneswar Depot
                    PRESET_HUBS[5] || PRESET_HUBS[1]  // IIT Bhubaneswar
                  )
                }
                className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-sans text-slate-800 hover:border-sky-400 hover:bg-sky-50/60 transition text-left flex items-center justify-between shadow-sm"
              >
                <span className="font-semibold">🚚 Bhubaneswar &rarr; IIT BBS</span>
                <span className="text-[10px] text-emerald-600 font-bold font-mono">NH-16</span>
              </button>
              <button
                onClick={() =>
                  handlePresetClick(
                    PRESET_HUBS[6] || PRESET_HUBS[0], // Paradip Port
                    PRESET_HUBS[5] || PRESET_HUBS[1]  // IIT Bhubaneswar
                  )
                }
                className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-sans text-slate-800 hover:border-sky-400 hover:bg-sky-50/60 transition text-left flex items-center justify-between shadow-sm"
              >
                <span className="font-semibold">⚓ Paradip Port &rarr; IIT BBS</span>
                <span className="text-[10px] text-purple-600 font-bold font-mono">Maritime</span>
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
            {/* Phase 1 Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={isProcessing}
              onClick={() => {
                playMechanicalClick();
                onComputeRoute();
              }}
              className={`flex items-center justify-center gap-2 rounded-xl p-2.5 text-xs font-sans font-bold text-white shadow-md hover:brightness-105 transition disabled:opacity-50 ${
                !hasActiveRoute
                  ? 'bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 ring-2 ring-sky-400/70 shadow-[0_0_18px_rgba(2,132,199,0.4)] animate-pulse'
                  : 'bg-gradient-to-r from-sky-500 to-blue-600'
              }`}
            >
              <Navigation2 className="h-4 w-4 fill-current" />
              <span>{hasActiveRoute ? 'Phase 1: Calculate Route (Recalculate)' : 'Phase 1: Calculate Route'}</span>
            </motion.button>

            {/* Live Voice Microphone Disruption Button */}
            <motion.button
              whileHover={hasActiveRoute ? { scale: 1.02 } : {}}
              whileTap={hasActiveRoute ? { scale: 0.98 } : {}}
              disabled={isProcessing || disruptionState === 'detected' || !hasActiveRoute}
              onClick={handleOpenVoiceModal}
              title={!hasActiveRoute ? 'Create a route with Phase 1 first' : 'Speak driver voice report'}
              className={`flex items-center justify-center gap-2 rounded-xl p-2.5 text-xs font-sans font-bold transition shadow-md ${
                !hasActiveRoute
                  ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed opacity-60'
                  : disruptionState === 'detected'
                  ? 'bg-rose-100 text-rose-800 border border-rose-300'
                  : 'bg-gradient-to-r from-rose-500 via-rose-600 to-amber-500 text-white hover:brightness-105'
              }`}
            >
              <Mic className={`h-4 w-4 ${hasActiveRoute ? 'animate-pulse' : ''}`} />
              <span>{hasActiveRoute ? 'Phase 2: Speak Driver Report 🎙️' : 'Phase 2: Awaiting Phase 1 🎙️'}</span>
            </motion.button>
          </div>

          {/* Autonomous Reroute Action */}
          {disruptionState === 'detected' && (
            <motion.button
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={isProcessing}
              onClick={() => {
                playMechanicalClick();
                onAutonomousReroute();
              }}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 p-3 text-xs font-sans font-bold text-white shadow-lg transition hover:brightness-105"
            >
              <Zap className="h-4 w-4 fill-current" />
              <span>AUTONOMOUS AGENT REROUTE & EMAIL STAKEHOLDERS</span>
            </motion.button>
          )}

          {/* Reset Button */}
          <div className="flex justify-end pt-0.5">
            <button
              onClick={() => {
                playMechanicalClick();
                onReset();
              }}
              className="flex items-center gap-1.5 text-xs font-mono text-slate-500 hover:text-slate-800 transition"
            >
              <RotateCcw className="h-3 w-3" /> Reset Corridor Simulation
            </button>
          </div>
        </div>
      </ParallaxCard>

      {/* Voice Report Modal */}
      <VoiceReportModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        onSubmitVoiceReport={handleVoiceSubmit}
        isProcessing={isProcessing}
        startPoint={startPoint}
        destinationPoint={destinationPoint}
      />
    </>
  );
}
