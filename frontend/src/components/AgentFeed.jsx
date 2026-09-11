import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Terminal,
  Cpu,
  Wrench,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
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
        <span className="flex items-center gap-1 rounded bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-700 border border-rose-300">
          <AlertTriangle className="h-3 w-3" /> CROWDSOURCED ALERT
        </span>
      );
    }
    if (type === 'TOOL_CALL') {
      return (
        <span className="flex items-center gap-1 rounded bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800 border border-amber-300">
          <Wrench className="h-3 w-3" /> TOOL EXECUTION
        </span>
      );
    }
    if (type === 'AUTONOMOUS_RECOVERY' || type === 'EXECUTION_COMPLETE') {
      return (
        <span className="flex items-center gap-1 rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 border border-emerald-300">
          <CheckCircle2 className="h-3 w-3" /> RECOVERY NODE
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1 rounded bg-sky-100 px-2 py-0.5 text-[10px] font-bold text-sky-800 border border-sky-300">
        <Cpu className="h-3 w-3" /> STRATEGIST AGENT
      </span>
    );
  };

  return (
    <div className="flex flex-col h-full rounded-2xl glass-panel border border-sky-200 overflow-hidden shadow-sm">
      {/* Feed Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-200 bg-white/90">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-sky-500 animate-ping" />
          <Terminal className="h-4 w-4 text-sky-600" />
          <span className="font-mono text-xs font-bold uppercase tracking-wider text-slate-800">
            Agent Execution Stream
          </span>
          {isStreaming && (
            <span className="text-[10px] font-mono text-sky-600 font-bold animate-pulse">
              [ANALYZING...]
            </span>
          )}
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs font-sans">
          <button
            onClick={() => setActiveTab('timeline')}
            className={`px-2.5 py-1 rounded-md transition font-medium ${
              activeTab === 'timeline'
                ? 'bg-white text-sky-700 shadow-sm border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Logs ({steps.length})
          </button>
          <button
            onClick={() => setActiveTab('email')}
            className={`px-2.5 py-1 rounded-md transition flex items-center gap-1 font-medium ${
              activeTab === 'email'
                ? 'bg-white text-emerald-700 shadow-sm border border-slate-200'
                : emailDispatched
                ? 'text-emerald-600 font-bold animate-pulse'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Mail className="h-3.5 w-3.5" />
            <span>Email</span>
            {emailDispatched && <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />}
          </button>
          <button
            onClick={() => setActiveTab('state')}
            className={`px-2.5 py-1 rounded-md transition font-medium ${
              activeTab === 'state'
                ? 'bg-white text-sky-700 shadow-sm border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            State
          </button>
        </div>
      </div>

      {/* Main Stream Area */}
      <div className="flex-1 overflow-y-auto p-3.5 font-mono text-xs space-y-2.5 relative bg-white/50">
        {activeTab === 'timeline' && (
          <>
            {/* Stakeholder Email Banner (if recently dispatched) */}
            {emailDispatched && (
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                className="rounded-xl border border-emerald-300 bg-emerald-50/90 p-3 shadow-sm"
              >
                <div className="flex items-center justify-between text-emerald-800 font-bold mb-1">
                  <div className="flex items-center gap-1.5">
                    <Send className="h-3.5 w-3.5 text-emerald-600" />
                    <span>AUTONOMOUS STAKEHOLDER EMAIL DISPATCHED</span>
                  </div>
                  <span className="text-[10px] bg-emerald-200 px-1.5 py-0.5 rounded border border-emerald-400 font-bold text-emerald-900">
                    SENT
                  </span>
                </div>
                <p className="text-[11px] text-slate-700">
                  <span className="font-semibold text-slate-500">To:</span> warehouse.manager@odisha-logistics.com, client.relations@iitbbs.ac.in
                </p>
                <p className="text-[11px] text-emerald-800 font-semibold mt-1">
                  &ldquo;Rerouted via {emailDispatched.alternative_route}. Updated ETA: {emailDispatched.new_eta}&rdquo;
                </p>
              </motion.div>
            )}

            {steps.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-slate-400 space-y-2">
                <Sparkles className="h-6 w-6 text-slate-300 animate-pulse" />
                <p>Awaiting route calculation or voice transmission...</p>
              </div>
            ) : (
              steps.map((step, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2, delay: idx * 0.03 }}
                  className="rounded-xl border border-slate-200 bg-white p-2.5 hover:border-sky-300 transition shadow-xs"
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      {getNodeBadge(step.node, step.type)}
                      {step.toolName && (
                        <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-300">
                          {step.toolName}()
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400">{step.timestamp}</span>
                  </div>

                  <p className="text-slate-800 leading-relaxed text-[11px] font-medium">
                    {step.content}
                  </p>

                  {/* Tool Call Arguments / Result Box */}
                  {step.args && (
                    <div className="mt-1.5 rounded-lg bg-slate-50 p-2 border border-slate-200 text-[10px]">
                      <div className="text-slate-600 font-bold mb-0.5 flex items-center justify-between">
                        <span>Tool Arguments:</span>
                        <span
                          className={
                            step.result === 'error'
                              ? 'text-rose-600 font-bold'
                              : 'text-emerald-700 font-bold'
                          }
                        >
                          Status: {step.result ? step.result.toUpperCase() : 'EXECUTED'}
                        </span>
                      </div>
                      <pre className="text-slate-700 overflow-x-auto">
                        {JSON.stringify(step.args, null, 2)}
                      </pre>
                    </div>
                  )}
                </motion.div>
              ))
            )}

            {isStreaming && (
              <div className="flex items-center gap-2 text-sky-700 text-xs p-2 animate-pulse font-mono font-semibold">
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
              <span className="text-slate-700 font-bold text-[11px]">Autonomous Email Dispatch Log:</span>
              <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-300 font-bold">
                SMTP / SendGrid Active
              </span>
            </div>

            {emailDispatched ? (
              <div className="rounded-xl border border-slate-200 bg-white p-3.5 space-y-2 text-[11px] leading-relaxed shadow-sm">
                <div className="border-b border-slate-200 pb-2 space-y-1">
                  <div><span className="text-slate-500 font-semibold">FROM:</span> <span className="text-sky-700 font-semibold">autonomous-agent@nexus-supply-chain.ai</span></div>
                  <div><span className="text-slate-500 font-semibold">TO:</span> <span className="text-slate-800 font-medium">warehouse.manager@odisha-logistics.com, client.relations@iitbbs.ac.in</span></div>
                  <div><span className="text-slate-500 font-semibold">SUBJECT:</span> <span className="text-rose-700 font-bold">🚨 Urgent Reroute: Consignment En Route to IIT Bhubaneswar</span></div>
                </div>
                <div className="text-slate-800 font-sans space-y-2 py-1">
                  <p>Dear Warehouse Logistics & IIT Bhubaneswar Delivery Team,</p>
                  <p>Our autonomous sensor network detected an active disruption: <span className="text-rose-700 font-semibold">{emailDispatched.reason}</span>.</p>
                  <p>Carrier TRK-8821 has been autonomously redirected onto: <span className="text-emerald-700 font-bold">{emailDispatched.alternative_route}</span>.</p>
                  <p>Updated Expected Delivery Window: <span className="text-sky-700 font-bold">{emailDispatched.new_eta}</span>.</p>
                  <p className="text-slate-400 text-[10px] font-mono pt-2">Authorized autonomously by LangGraph Strategist Node (Gemini 2.5 Flash).</p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-44 text-slate-400 space-y-2">
                <Mail className="h-6 w-6 text-slate-300" />
                <p>No stakeholder email drafted yet.</p>
                <span className="text-[10px]">Trigger Phase 2 disruption or speak a voice alert to see the agent dispatch the notification email.</span>
              </div>
            )}
          </div>
        )}

        {/* State Inspector Tab */}
        {activeTab === 'state' && (
          <div className="relative h-full">
            <div className="flex justify-between items-center mb-2">
              <span className="text-slate-600 font-semibold text-[11px]">LangGraph SupplyChainState:</span>
              <button
                onClick={copyState}
                className="flex items-center gap-1 rounded-lg bg-white px-2 py-1 text-[10px] text-sky-700 border border-slate-200 hover:bg-sky-50 shadow-xs"
              >
                {copied ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                {copied ? 'Copied' : 'Copy JSON'}
              </button>
            </div>
            <pre className="rounded-xl bg-slate-50 p-3 text-slate-800 overflow-x-auto text-[11px] leading-relaxed border border-slate-200">
              {JSON.stringify(currentState, null, 2)}
            </pre>
          </div>
        )}
      </div>

      {/* Terminal Footer Bar */}
      <div className="px-4 py-2 border-t border-slate-200 bg-white flex items-center justify-between text-[10px] font-mono text-slate-500">
        <div className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          <span>Agent Node: connected</span>
        </div>
        <span>POST /api/orchestrate &bull; /api/report_hazard_voice</span>
      </div>
    </div>
  );
}
