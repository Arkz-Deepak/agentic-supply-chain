import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mic,
  Radio,
  Send,
  Sparkles,
  X,
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

  const samplePhrases = [
    "Emergency dispatch! Major multi-vehicle car accident at Khandagiri junction on NH-16, both lanes completely blocked!",
    "Alert command! Heavy storm knocked down a massive banyan tree and wood logs across the highway near Khandagiri, road is impassable.",
    "Critical update: Severe flash flood and 4-foot waterlogging at Tamando junction NH-16, trucks are submerged.",
    "Roadblock alert: Transport union strike and dharna on the highway, all freight traffic stopped.",
  ];

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
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-xl rounded-2xl bg-white border border-sky-200 p-6 shadow-2xl overflow-hidden"
        >
          {/* Modal Header */}
          <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-100 border border-sky-300 text-sky-600">
                <Radio className="h-5 w-5 animate-pulse" />
              </div>
              <div>
                <h3 className="font-sans text-base font-bold text-slate-900">
                  Driver Voice Transmission Webhook
                </h3>
                <p className="text-[11px] font-sans text-slate-500">
                  Natural Human Speech &rarr; Gemini NLP Entity Extraction &rarr; Autonomous Reroute
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                playMechanicalClick();
                onClose();
              }}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Microphone Central Button & Visual Soundwave */}
          <div className="flex flex-col items-center justify-center py-3 space-y-3">
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
                    ? 'bg-rose-600 text-white shadow-[0_0_25px_rgba(244,63,94,0.6)] animate-pulse'
                    : 'bg-white border-2 border-sky-500 text-sky-600 shadow-[0_0_20px_rgba(14,165,233,0.3)] hover:scale-105'
                }`}
              >
                <Mic className="h-9 w-9" />
              </button>
            </div>

            {/* Status indicator */}
            <div className="flex items-center gap-2 text-xs font-sans text-center">
              <span
                className={`h-2 w-2 rounded-full ${
                  isListening ? 'bg-rose-600 animate-ping' : 'bg-sky-500'
                }`}
              />
              <span className={isListening ? 'text-rose-600 font-bold' : 'text-slate-600'}>
                {statusMessage}
              </span>
            </div>
          </div>

          {/* Live Transcript Display Box */}
          <div className="space-y-1.5 mb-4">
            <label className="text-xs font-sans font-semibold text-slate-700 flex items-center justify-between">
              <span>Speech-to-Text Raw Output:</span>
              <span className="text-[10px] font-mono text-sky-600 font-bold">Natural Voice Format</span>
            </label>
            <textarea
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder='Click the microphone and say: "Emergency! Multi-vehicle accident near Khandagiri..." or "Fallen tree and wood blocking the road...", or select a sample phrase below.'
              rows={3}
              className="w-full rounded-xl bg-slate-50 border border-slate-300 p-3 text-xs font-sans text-slate-800 placeholder-slate-400 focus:border-sky-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 transition"
            />
          </div>

          {/* Quick Pitch Presets */}
          <div className="space-y-1.5 mb-5">
            <span className="text-[11px] font-sans font-medium text-slate-500">
              One-Click Pitch Phrases (Backup if mic is muted):
            </span>
            <div className="space-y-1">
              {samplePhrases.map((phrase, idx) => (
                <button
                  key={idx}
                  onClick={() => handleUseSample(phrase)}
                  className="w-full text-left p-2 rounded-lg bg-slate-50 hover:bg-sky-50 border border-slate-200 text-xs font-sans text-slate-600 hover:text-sky-800 transition truncate shadow-xs"
                >
                  &ldquo;{phrase}&rdquo;
                </button>
              ))}
            </div>
          </div>

          {/* Action Footer */}
          <div className="flex items-center justify-between border-t border-slate-200 pt-3">
            <button
              onClick={() => {
                setTranscript('');
                setStatusMessage('Cleared. Click mic to speak.');
              }}
              className="text-xs font-sans font-medium text-slate-500 hover:text-slate-800"
            >
              Clear
            </button>

            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              disabled={!transcript.trim() || isProcessing}
              onClick={handleSend}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 via-rose-500 to-amber-500 px-5 py-2.5 text-xs font-sans font-bold text-white shadow-md hover:brightness-105 transition disabled:opacity-40"
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
