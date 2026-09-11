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
  Smartphone,
  CheckCircle2,
} from 'lucide-react';
import { PRESET_HUBS } from '../data/mockRoutes';
import ParallaxCard from './ParallaxCard';
import { playMechanicalClick, playDispatchAlert } from '../utils/soundEffects';
import { apiClient } from '../api/client';
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
}) {
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [phoneReportStatus, setPhoneReportStatus] = useState(null);

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
      <ParallaxCard className="p-4" maxTilt={4}>
        <div className="flex flex-col space-y-3.5">
          {/* Section Header */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <Sliders className="h-4 w-4 text-cyber-cyan" />
              <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
                Corridor Controls &bull; IIT Bhubaneswar
              </h2>
            </div>
            <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/70 px-2 py-0.5 rounded border border-cyan-500/30">
              AHNDKA Command
            </span>
          </div>

          {/* Preset Hub Selectors */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
              <MapPin className="h-3 w-3 text-cyber-cyan" /> Select Regional Freight Corridor:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              <button
                onClick={() =>
                  handlePresetClick(
                    PRESET_HUBS[0], // Bhubaneswar Depot
                    PRESET_HUBS[1]  // IIT Bhubaneswar
                  )
                }
                className="px-2.5 py-1.5 rounded-lg bg-dark-900 border border-slate-800 text-[11px] font-mono text-slate-300 hover:border-cyan-500/50 hover:text-white transition text-left flex items-center justify-between"
              >
                <span>🚚 Bhubaneswar &rarr; IIT BBS</span>
                <span className="text-[10px] text-cyan-400 font-bold">NH-16</span>
              </button>
              <button
                onClick={() =>
                  handlePresetClick(
                    PRESET_HUBS[2], // Paradip Port
                    PRESET_HUBS[1]  // IIT Bhubaneswar
                  )
                }
                className="px-2.5 py-1.5 rounded-lg bg-dark-900 border border-slate-800 text-[11px] font-mono text-slate-300 hover:border-cyan-500/50 hover:text-white transition text-left flex items-center justify-between"
              >
                <span>⚓ Paradip Port &rarr; IIT BBS</span>
                <span className="text-[10px] text-purple-400 font-bold">Intermodal</span>
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
            {/* Phase 1 Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={isProcessing}
              onClick={() => {
                playMechanicalClick();
                onComputeRoute();
              }}
              className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyber-cyan p-2.5 text-xs font-mono font-bold text-black shadow-[0_0_20px_rgba(0,240,255,0.4)] transition hover:brightness-110 disabled:opacity-50"
            >
              <Navigation2 className="h-4 w-4 fill-current" />
              <span>Phase 1: Calculate Route</span>
            </motion.button>

            {/* Live Voice Microphone Disruption Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={isProcessing || disruptionState === 'detected'}
              onClick={handleOpenVoiceModal}
              className={`flex items-center justify-center gap-2 rounded-xl p-2.5 text-xs font-mono font-bold transition shadow-[0_0_20px_rgba(244,63,94,0.3)] disabled:opacity-50 ${
                disruptionState === 'detected'
                  ? 'bg-rose-950/80 text-rose-300 border border-rose-600'
                  : 'bg-gradient-to-r from-rose-600 via-rose-500 to-amber-500 text-white hover:brightness-110'
              }`}
            >
              <Mic className="h-4 w-4 animate-pulse" />
              <span>Phase 2: Speak Driver Report 🎙️</span>
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
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 p-3 text-xs font-mono font-bold text-black shadow-[0_0_25px_rgba(16,185,129,0.5)] transition hover:brightness-110"
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
              className="flex items-center gap-1.5 text-[11px] font-mono text-slate-400 hover:text-slate-200 transition"
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
      />
    </>
  );
}
