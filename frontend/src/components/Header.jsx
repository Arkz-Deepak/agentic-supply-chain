import React, { useState, useEffect } from 'react';
import { Cpu, Radio, Activity, Navigation, Volume2, VolumeX, MapPin, CloudSun } from 'lucide-react';
import { toggleAudio, isAudioEnabled } from '../utils/soundEffects';

export default function Header({ activePhase = 1, agentActive = false, liveWeather = null }) {
  const [timeString, setTimeString] = useState('');
  const [soundOn, setSoundOn] = useState(isAudioEnabled());

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeString(
        now.toTimeString().split(' ')[0] + ' IST'
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleToggleSound = () => {
    const newState = toggleAudio();
    setSoundOn(newState);
  };

  return (
    <header className="relative z-20 border-b border-cyan-500/20 bg-dark-900/85 backdrop-blur-xl px-4 md:px-6 py-2.5">
      <div className="flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Brand & Mission */}
        <div className="flex items-center gap-3">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyber-cyan/30 to-cyber-blue/40 border border-cyber-cyan/50 shadow-[0_0_15px_rgba(0,240,255,0.4)]">
            <Navigation className="h-5 w-5 text-cyber-cyan" />
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyber-cyan opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyber-cyan"></span>
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display text-lg font-bold tracking-wider text-white">
                NEXUS<span className="text-cyber-cyan">.AI</span>
              </h1>
              <span className="rounded bg-cyan-950/80 px-2 py-0.5 text-[10px] font-mono uppercase tracking-widest text-cyber-cyan border border-cyan-500/30 flex items-center gap-1">
                <MapPin className="h-2.5 w-2.5 text-cyber-cyan" /> IIT Bhubaneswar &bull; AHNDKA
              </span>
            </div>
            <p className="text-[11px] font-mono text-slate-400">
              Autonomous Logistics Orchestrator &bull; Live OpenWeather & OpenRouteService
            </p>
          </div>
        </div>

        {/* Live System Telemetry Badges & Audio Toggle */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
          {/* Real-time Weather Telemetry from OpenWeatherMap */}
          {liveWeather && (
            <div className="flex items-center gap-1.5 rounded-lg bg-cyan-950/40 px-2.5 py-1 border border-cyan-500/30 text-cyan-300">
              <CloudSun className="h-3.5 w-3.5 text-amber-400" />
              <span>{liveWeather.location || 'Jatani'}:</span>
              <span className="font-bold text-white">{liveWeather.temp_c}°C</span>
              <span className="text-slate-400 text-[10px]">({liveWeather.weather})</span>
            </div>
          )}

          {/* Sound Effect Toggle */}
          <button
            onClick={handleToggleSound}
            title={soundOn ? 'Audio SFX Enabled (Click to Mute)' : 'Audio SFX Muted (Click to Enable)'}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 border transition ${
              soundOn
                ? 'bg-cyan-950/70 border-cyan-500/50 text-cyan-300 shadow-[0_0_10px_rgba(0,240,255,0.25)]'
                : 'bg-dark-850 border-slate-800 text-slate-500 hover:text-slate-300'
            }`}
          >
            {soundOn ? <Volume2 className="h-3.5 w-3.5 text-cyber-cyan" /> : <VolumeX className="h-3.5 w-3.5 text-slate-500" />}
            <span>SFX: {soundOn ? 'ON' : 'MUTED'}</span>
          </button>

          {/* Dedicated Ports Indicator */}
          <div className="flex items-center gap-1.5 rounded-lg bg-dark-850 px-2.5 py-1 border border-slate-800 text-slate-300">
            <Activity className="h-3.5 w-3.5 text-emerald-400" />
            <span>Ports:</span>
            <span className="text-emerald-400 font-bold">5180 / 8010</span>
          </div>

          <div className="flex items-center gap-1.5 rounded-lg bg-dark-850 px-2.5 py-1 border border-slate-800 text-slate-300">
            <Radio className={`h-3.5 w-3.5 ${agentActive ? 'text-cyber-cyan animate-pulse' : 'text-slate-500'}`} />
            <span>Graph:</span>
            <span className="text-cyan-400 font-bold">Active</span>
          </div>

          <div className="hidden xl:flex items-center gap-1.5 rounded-lg bg-dark-850 px-2.5 py-1 border border-slate-800 text-slate-400">
            <span>SYS:</span>
            <span className="text-slate-200 font-semibold">{timeString}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
