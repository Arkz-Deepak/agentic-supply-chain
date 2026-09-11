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
    <header className="relative z-20 border-b border-sky-200/80 bg-white/95 backdrop-blur-xl px-4 md:px-6 py-2.5 shadow-sm">
      <div className="flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Brand & Mission */}
        <div className="flex items-center gap-3">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-sky-400 to-sky-600 shadow-[0_4px_12px_rgba(2,132,199,0.35)]">
            <Navigation className="h-5 w-5 text-white" />
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-sky-500"></span>
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display text-lg font-bold tracking-wider text-slate-900">
                NEXUS<span className="text-sky-600">.AI</span>
              </h1>
              <span className="rounded-md bg-sky-50 px-2 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider text-sky-700 border border-sky-200 flex items-center gap-1 shadow-sm">
                <MapPin className="h-2.5 w-2.5 text-sky-600" /> IIT Bhubaneswar &bull; AHNDKA
              </span>
            </div>
            <p className="text-[11px] font-sans text-slate-500 font-medium">
              Autonomous Logistics Command Center &bull; Real-Time Multi-Agent Rerouting
            </p>
          </div>
        </div>

        {/* Live System Telemetry Badges & Audio Toggle */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
          {/* Real-time Weather Telemetry from OpenWeatherMap */}
          {liveWeather && (
            <div className="flex items-center gap-1.5 rounded-lg bg-sky-50/80 px-2.5 py-1 border border-sky-200 text-sky-900 shadow-sm">
              <CloudSun className="h-3.5 w-3.5 text-amber-500" />
              <span>{liveWeather.location || 'Jatani'}:</span>
              <span className="font-bold text-sky-700">{liveWeather.temp_c}°C</span>
              <span className="text-slate-500 text-[10px]">({liveWeather.weather})</span>
            </div>
          )}

          {/* Sound Effect Toggle */}
          <button
            onClick={handleToggleSound}
            title={soundOn ? 'Audio SFX Enabled (Click to Mute)' : 'Audio SFX Muted (Click to Enable)'}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 border transition shadow-sm ${
              soundOn
                ? 'bg-sky-50 border-sky-300 text-sky-700 hover:bg-sky-100 font-semibold'
                : 'bg-slate-100 border-slate-200 text-slate-400 hover:text-slate-600'
            }`}
          >
            {soundOn ? <Volume2 className="h-3.5 w-3.5 text-sky-600" /> : <VolumeX className="h-3.5 w-3.5 text-slate-400" />}
            <span>SFX: {soundOn ? 'ON' : 'MUTED'}</span>
          </button>

          {/* Dedicated Ports Indicator */}
          <div className="flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1 border border-slate-200 text-slate-700 shadow-sm">
            <Activity className="h-3.5 w-3.5 text-emerald-600" />
            <span>Ports:</span>
            <span className="text-emerald-700 font-bold">5180 / 8010</span>
          </div>

          <div className="flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1 border border-slate-200 text-slate-700 shadow-sm">
            <Radio className={`h-3.5 w-3.5 ${agentActive ? 'text-sky-600 animate-pulse' : 'text-slate-400'}`} />
            <span>Graph:</span>
            <span className="text-sky-700 font-bold">Active</span>
          </div>

          <div className="hidden xl:flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1 border border-slate-200 text-slate-600 shadow-sm">
            <span>SYS:</span>
            <span className="text-slate-900 font-semibold">{timeString}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
