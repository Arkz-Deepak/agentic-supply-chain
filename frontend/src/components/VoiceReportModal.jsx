import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mic,
  MicOff,
  Radio,
  Send,
  Sparkles,
  AlertTriangle,
  X,
  Volume2,
  CheckCircle2,
} from 'lucide-react';
import { playMechanicalClick, playDispatchAlert } from '../utils/soundEffects';

export default function VoiceReportModal({
  isOpen,
  onClose,
  onSubmitVoiceReport,
  isProcessing = false,
}) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [speechSupported, setSpeechSupported] = useState(true);
  const [statusMessage, setStatusMessage] = useState('Click microphone to speak natural language report');
  const recognitionRef = useRef(null);

  // Suggested prompt phrases for the hackathon pitch
  const samplePhrases = [
    "Yo, I'm near Khandagiri junction on NH-16. There's a massive transport strike and 4ft waterlogging, none of the trucks can move!",
    "Alert dispatch! Roadblock on NH-16 Sector 9. Farmers and truckers are protesting, highway is completely shut down.",
    "Emergency report from TRK-8821: Flash flood at Tamando junction, need immediate alternative bypass to IIT Bhubaneswar.",
  ];

  // Initialize Web Speech API
  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSpeechSupported(false);
      setStatusMessage('Web Speech API not natively supported in this browser. You can type or click sample phrases.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
      setStatusMessage('Listening... Speak naturally (e.g., "Yo, I am near Khandagiri...")');
    };

    recognition.onresult = (event) => {
      let currentTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        currentTranscript += event.results[i][0].transcript;
      }
      setTranscript(currentTranscript);
    };

    recognition.onerror = (event) => {
      console.warn('Speech recognition error:', event.error);
      setIsListening(false);
      setStatusMessage(`Microphone: ${event.error}. You can type or use sample phrases.`);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const toggleListening = () => {
    playMechanicalClick();
    if (!recognitionRef.current) {
      // Fallback: cycle a sample phrase
      const randomPhrase = samplePhrases[Math.floor(Math.random() * samplePhrases.length)];
      setTranscript(randomPhrase);
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
      setStatusMessage('Audio recorded. Ready to process with Gemini AI.');
    } else {
      setTranscript('');
      try {
        recognitionRef.current.start();
      } catch (err) {
        console.warn('Failed to start speech recognition:', err);
      }
    }
  };

  const handleUseSample = (phrase) => {
    playMechanicalClick();
    setTranscript(phrase);
    setStatusMessage('Sample voice transmission loaded.');
  };

  const handleSend = () => {
    if (!transcript.trim()) return;
    playDispatchAlert();
    onSubmitVoiceReport(transcript);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-xl rounded-2xl glass-panel border border-cyan-500/30 p-6 shadow-[0_0_40px_rgba(0,240,255,0.25)] overflow-hidden"
        >
          {/* Glowing cyber accents */}
          <div className="absolute -top-24 -right-24 w-48 h-48 rounded-full bg-cyber-cyan/15 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-48 h-48 rounded-full bg-rose-500/15 blur-3xl pointer-events-none" />

          {/* Modal Header */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-cyber-cyan">
                <Radio className="h-5 w-5 animate-pulse" />
              </div>
              <div>
                <h3 className="font-mono text-sm font-bold text-white uppercase tracking-wider">
                  Driver Voice Transmission Webhook
                </h3>
                <p className="text-[10px] font-mono text-slate-400">
                  Unstructured Human Speech &rarr; Gemini NLP Entity Extraction &rarr; Autonomous Reroute
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                playMechanicalClick();
                onClose();
              }}
              className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Microphone Central Button & Visual Soundwave */}
          <div className="flex flex-col items-center justify-center py-4 space-y-3">
            <div className="relative">
              {isListening && (
                <>
                  <motion.div
                    animate={{ scale: [1, 1.35, 1], opacity: [0.6, 0.1, 0.6] }}
                    transition={{ repeat: Infinity, duration: 1.4 }}
                    className="absolute -inset-4 rounded-full border border-rose-500 bg-rose-500/20"
                  />
                  <motion.div
                    animate={{ scale: [1, 1.7, 1], opacity: [0.4, 0, 0.4] }}
                    transition={{ repeat: Infinity, duration: 1.4, delay: 0.2 }}
                    className="absolute -inset-8 rounded-full border border-rose-400/40"
                  />
                </>
              )}

              <button
                onClick={toggleListening}
                className={`relative flex h-20 w-20 items-center justify-center rounded-full transition-all shadow-lg ${
                  isListening
                    ? 'bg-rose-600 text-white shadow-[0_0_25px_rgba(244,63,94,0.7)] animate-pulse'
                    : 'bg-dark-900 border-2 border-cyan-500/60 text-cyber-cyan shadow-[0_0_20px_rgba(0,240,255,0.4)] hover:scale-105'
                }`}
              >
                {isListening ? <Mic className="h-9 w-9" /> : <Mic className="h-9 w-9" />}
              </button>
            </div>

            {/* Status indicator */}
            <div className="flex items-center gap-2 text-xs font-mono text-center">
              <span
                className={`h-2 w-2 rounded-full ${
                  isListening ? 'bg-rose-500 animate-ping' : 'bg-cyan-400'
                }`}
              />
              <span className={isListening ? 'text-rose-400 font-bold' : 'text-slate-300'}>
                {statusMessage}
              </span>
            </div>
          </div>

          {/* Live Transcript Display Box */}
          <div className="space-y-1.5 mb-4">
            <label className="text-[11px] font-mono text-slate-400 flex items-center justify-between">
              <span>Speech-to-Text Raw Output:</span>
              <span className="text-[10px] text-cyan-400">Natural Voice Format</span>
            </label>
            <textarea
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder='Click the microphone and say: "Yo, I am near Khandagiri junction on NH-16, there is a huge strike and flood..." or select a sample phrase below.'
              rows={3}
              className="w-full rounded-xl bg-dark-950/90 border border-slate-700 p-3 text-xs font-mono text-slate-100 placeholder-slate-600 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 transition"
            />
          </div>

          {/* Quick Pitch Presets */}
          <div className="space-y-1.5 mb-5">
            <span className="text-[10px] font-mono text-slate-500">
              One-Click Pitch Phrases (Backup if mic is muted):
            </span>
            <div className="space-y-1">
              {samplePhrases.map((phrase, idx) => (
                <button
                  key={idx}
                  onClick={() => handleUseSample(phrase)}
                  className="w-full text-left p-1.5 rounded-lg bg-dark-900/60 hover:bg-dark-850 border border-slate-800 text-[10px] font-mono text-slate-400 hover:text-cyan-300 transition truncate"
                >
                  &ldquo;{phrase}&rdquo;
                </button>
              ))}
            </div>
          </div>

          {/* Action Footer */}
          <div className="flex items-center justify-between border-t border-slate-800 pt-3">
            <button
              onClick={() => {
                setTranscript('');
                setStatusMessage('Cleared. Click mic to speak.');
              }}
              className="text-xs font-mono text-slate-500 hover:text-slate-300"
            >
              Clear
            </button>

            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              disabled={!transcript.trim() || isProcessing}
              onClick={handleSend}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 via-rose-500 to-amber-500 px-5 py-2.5 text-xs font-mono font-bold text-white shadow-[0_0_20px_rgba(244,63,94,0.5)] transition hover:brightness-110 disabled:opacity-40"
            >
              <Sparkles className="h-4 w-4" />
              <span>INGEST VOICE & TRIGGER AI REROUTE</span>
              <Send className="h-3.5 w-3.5" />
            </motion.button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
