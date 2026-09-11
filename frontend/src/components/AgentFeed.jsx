import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Terminal,
  Cpu,
  Wrench,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Code2,
  Sparkles,
  Mail,
  Copy,
  Check,
  Send,
} from 'lucide-react';

export default function AgentFeed({
  steps = [],
  currentState = {},
  isStreaming = false,
  emailDispatched = null,
}) {
  const [activeTab, setActiveTab] = useState('timeline'); // 'timeline' | 'email' | 'state'
  const [copied, setCopied] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [steps, isStreaming]);

  const copyState = () => {
    navigator.clipboard.writeText(JSON.stringify(currentState, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getNodeBadge = (node, type) => {
    if (type === 'INCOMING_ALERT') {
      return (
        <span className="flex items-center gap-1 rounded bg-rose-500/20 px-2 py-0.5 text-[10px] font-bold text-rose-400 border border-rose-500/30">
          <AlertTriangle className="h-3 w-3" /> CROWDSOURCED ALERT
        </span>
      );
    }
    if (type === 'TOOL_CALL') {
      return (
        <span className="flex items-center gap-1 rounded bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-300 border border-amber-500/30">
          <Wrench className="h-3 w-3" /> TOOL EXECUTION
        </span>
      );
    }
    if (type === 'AUTONOMOUS_RECOVERY' || type === 'EXECUTION_COMPLETE') {
      return (
        <span className="flex items-center gap-1 rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/30">
          <CheckCircle2 className="h-3 w-3" /> RECOVERY NODE
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1 rounded bg-cyan-500/20 px-2 py-0.5 text-[10px] font-bold text-cyber-cyan border border-cyan-500/30">
        <Cpu className="h-3 w-3" /> STRATEGIST AGENT
      </span>
    );
  };

  return (
    <div className="flex flex-col h-full rounded-2xl glass-panel border border-cyan-500/20 overflow-hidden shadow-[0_0_30px_rgba(0,0,0,0.5)]">
      {/* Feed Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-800 bg-dark-900/90">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-cyber-cyan animate-ping" />
          <Terminal className="h-4 w-4 text-cyber-cyan" />
          <span className="font-mono text-xs font-bold uppercase tracking-wider text-slate-200">
            Agent Execution Stream
          </span>
          {isStreaming && (
            <span className="text-[10px] font-mono text-cyan-400 animate-pulse">
              [ANALYZING...]
            </span>
          )}
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 bg-dark-950/80 p-0.5 rounded-lg border border-slate-800 text-xs font-mono">
          <button
            onClick={() => setActiveTab('timeline')}
            className={`px-2 py-0.5 rounded-md transition ${
              activeTab === 'timeline'
                ? 'bg-cyan-500/20 text-cyber-cyan border border-cyan-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Logs ({steps.length})
          </button>
          <button
            onClick={() => setActiveTab('email')}
            className={`px-2 py-0.5 rounded-md transition flex items-center gap-1 ${
              activeTab === 'email'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : emailDispatched
                ? 'text-emerald-400 font-bold animate-pulse'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Mail className="h-3 w-3" />
            <span>Email</span>
            {emailDispatched && <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />}
          </button>
          <button
            onClick={() => setActiveTab('state')}
            className={`px-2 py-0.5 rounded-md transition ${
              activeTab === 'state'
                ? 'bg-cyan-500/20 text-cyber-cyan border border-cyan-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            State
          </button>
        </div>
      </div>

      {/* Main Stream Area */}
      <div className="flex-1 overflow-y-auto p-3.5 font-mono text-xs space-y-2.5 relative">
        {activeTab === 'timeline' && (
          <>
            {/* Stakeholder Email Banner (if recently dispatched) */}
            {emailDispatched && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="rounded-xl border border-emerald-500/60 bg-emerald-950/40 p-3 shadow-[0_0_15px_rgba(16,185,129,0.3)]"
              >
                <div className="flex items-center justify-between text-emerald-400 font-bold mb-1">
                  <div className="flex items-center gap-1.5">
                    <Send className="h-3.5 w-3.5" />
                    <span>AUTONOMOUS STAKEHOLDER EMAIL DISPATCHED</span>
                  </div>
                  <span className="text-[10px] bg-emerald-900/80 px-1.5 py-0.5 rounded border border-emerald-700/60">
                    SENT
                  </span>
                </div>
                <p className="text-[11px] text-slate-200">
                  <span className="text-slate-400">To:</span> warehouse.manager@odisha-logistics.com, client.relations@iitbbs.ac.in
                </p>
                <p className="text-[11px] text-emerald-300 mt-1">
                  &ldquo;Rerouted via {emailDispatched.alternative_route}. Updated ETA: {emailDispatched.new_eta}&rdquo;
                </p>
              </motion.div>
            )}

            {steps.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-slate-500 space-y-2">
                <Sparkles className="h-6 w-6 text-slate-600 animate-pulse" />
                <p>Awaiting user route parameters or disruption webhook...</p>
              </div>
            ) : (
              steps.map((step, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: 15 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2, delay: idx * 0.04 }}
                  className="rounded-xl border border-slate-800/80 bg-dark-900/60 p-2.5 hover:border-cyan-500/30 transition shadow-sm"
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      {getNodeBadge(step.node, step.type)}
                      {step.toolName && (
                        <span className="text-[10px] font-bold text-amber-300 bg-amber-950/40 px-1.5 py-0.5 rounded border border-amber-800/40">
                          {step.toolName}()
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-500">{step.timestamp}</span>
                  </div>

                  <p className="text-slate-300 leading-relaxed text-[11px]">
                    {step.content}
                  </p>

                  {/* Tool Call Arguments / Result Box */}
                  {step.args && (
                    <div className="mt-1.5 rounded bg-dark-950/90 p-2 border border-slate-800 text-[10px]">
                      <div className="text-slate-400 font-bold mb-0.5 flex items-center justify-between">
                        <span>Tool Arguments:</span>
                        <span
                          className={
                            step.result === 'error'
                              ? 'text-rose-400 font-bold'
                              : 'text-emerald-400 font-bold'
                          }
                        >
                          Status: {step.result ? step.result.toUpperCase() : 'EXECUTED'}
                        </span>
                      </div>
                      <pre className="text-slate-300 overflow-x-auto">
                        {JSON.stringify(step.args, null, 2)}
                      </pre>
                    </div>
                  )}
                </motion.div>
              ))
            )}

            {isStreaming && (
              <div className="flex items-center gap-2 text-cyan-400 text-xs p-2 animate-pulse font-mono">
                <ChevronRight className="h-4 w-4" />
                <span>LangGraph Strategist synthesizing contingency vector...</span>
              </div>
            )}
            <div ref={bottomRef} />
          </>
        )}

        {/* Dedicated Email Tab */}
        {activeTab === 'email' && (
          <div className="h-full space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-[11px]">Autonomous Email Dispatch Log:</span>
              <span className="text-[10px] text-emerald-400 font-bold">STMP / SendGrid Mock</span>
            </div>

            {emailDispatched ? (
              <div className="rounded-xl border border-slate-700 bg-dark-950/90 p-3 space-y-2 text-[11px] leading-relaxed">
                <div className="border-b border-slate-800 pb-2 space-y-1">
                  <div><span className="text-slate-500">FROM:</span> <span className="text-cyan-400">autonomous-agent@nexus-supply-chain.ai</span></div>
                  <div><span className="text-slate-500">TO:</span> <span className="text-slate-300">warehouse.manager@odisha-logistics.com, client.relations@iitbbs.ac.in</span></div>
                  <div><span className="text-slate-500">SUBJECT:</span> <span className="text-amber-400 font-bold">🚨 Urgent Reroute: Consignment En Route to IIT Bhubaneswar</span></div>
                </div>
                <div className="text-slate-300 font-mono space-y-2 py-1">
                  <p>Dear Warehouse Logistics & IIT Bhubaneswar Delivery Team,</p>
                  <p>Our autonomous sensor network detected an active disruption: <span className="text-rose-400">{emailDispatched.reason}</span>.</p>
                  <p>Carrier TRK-8821 has been autonomously redirected onto: <span className="text-emerald-400 font-bold">{emailDispatched.alternative_route}</span>.</p>
                  <p>Updated Expected Delivery Window: <span className="text-cyan-300 font-bold">{emailDispatched.new_eta}</span>.</p>
                  <p className="text-slate-500 text-[10px] pt-2">Authorized autonomously by LangGraph Strategist Node (Gemini 3.7 Flash).</p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-44 text-slate-500 space-y-2">
                <Mail className="h-6 w-6 text-slate-600" />
                <p>No stakeholder email drafted yet.</p>
                <span className="text-[10px]">Trigger Phase 2 disruption to see the agent draft and dispatch the notification email.</span>
              </div>
            )}
          </div>
        )}

        {/* State Inspector Tab */}
        {activeTab === 'state' && (
          <div className="relative h-full">
            <div className="flex justify-between items-center mb-2">
              <span className="text-slate-400 text-[11px]">LangGraph SupplyChainState:</span>
              <button
                onClick={copyState}
                className="flex items-center gap-1 rounded bg-dark-800 px-2 py-1 text-[10px] text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/20"
              >
                {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                {copied ? 'Copied' : 'Copy JSON'}
              </button>
            </div>
            <pre className="rounded-xl bg-dark-950/90 p-3 text-cyan-300 overflow-x-auto text-[11px] leading-relaxed border border-slate-800">
              {JSON.stringify(currentState, null, 2)}
            </pre>
          </div>
        )}
      </div>

      {/* Terminal Footer Bar */}
      <div className="px-4 py-2 border-t border-slate-800 bg-dark-950/90 flex items-center justify-between text-[10px] font-mono text-slate-500">
        <div className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          <span>Agent Node: connected</span>
        </div>
        <span>POST /api/orchestrate &bull; /api/report_hazard</span>
      </div>
    </div>
  );
}
