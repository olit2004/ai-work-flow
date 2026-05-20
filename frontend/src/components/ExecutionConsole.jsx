import React, { useEffect, useRef, useMemo } from "react";
import { Play, Terminal, ShieldAlert, ShieldCheck, Clock, Layers, Sparkles, Check, Loader2 } from "lucide-react";

export default function ExecutionConsole({
  selectedWorkflow,
  executing,
  executionLogs,
  metrics,
  quantale,
  onExecute,
}) {
  const terminalEndRef = useRef(null);

  // Auto-scroll terminal logs to bottom
  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [executionLogs]);

  // Determine current active step from logs
  const activeStepIdx = useMemo(() => {
    if (!executing || !selectedWorkflow) return -1;
    
    // Find the last log line that starts with a step name (e.g., "[RESEARCHED]", "[DRAFTED]")
    for (let i = executionLogs.length - 1; i >= 0; i--) {
      const log = executionLogs[i];
      const match = log.match(/^\[([A-Z0-9_-]+)\]/);
      if (match) {
        const stepName = match[1].toLowerCase();
        return selectedWorkflow.steps.indexOf(stepName);
      }
    }
    return 0; // default to first step if starting
  }, [executing, selectedWorkflow, executionLogs]);

  // Check if current pipeline is a valid monotonic chain in the poset
  const isChainValid = useMemo(() => {
    if (!selectedWorkflow || !quantale) return true;
    const steps = selectedWorkflow.steps;
    for (let i = 0; i < steps.length - 1; i++) {
      if (quantale.base.contains(steps[i]) && quantale.base.contains(steps[i+1])) {
        if (!quantale.le(steps[i], steps[i+1])) {
          return false; // out-of-order decay
        }
      }
    }
    return true;
  }, [selectedWorkflow, quantale]);

  const hasExecuted = executionLogs.some(log => log.includes("[Complete]"));

  return (
    <div className="bg-white/80 backdrop-blur-xl border border-slate-100 rounded-3xl p-6 shadow-sm text-slate-800">
      
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-orange-100 text-orange-600 rounded-2xl">
            <Terminal className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">
              Execution Control Center
            </h2>
            <p className="text-slate-500 text-xs mt-0.5">
              Live AI agent runner and algebraic sequence validation console.
            </p>
          </div>
        </div>

        <button 
          disabled={!selectedWorkflow || executing}
          onClick={onExecute}
          className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-40 transition text-white px-5 py-3 rounded-2xl font-bold cursor-pointer text-sm shadow-sm"
        >
          {executing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Executing Pipeline...</span>
            </>
          ) : (
            <>
              <Play size={15} className="fill-white" />
              <span>Execute Workflow</span>
            </>
          )}
        </button>
      </div>

      {selectedWorkflow ? (
        <div className="mt-6 space-y-6">
          
          {/* 1. Monotonicity Chain warnings */}
          {!isChainValid && (
            <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-800 p-4 rounded-2xl text-xs leading-relaxed shadow-sm">
              <ShieldAlert className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block text-sm mb-0.5">Quality Refinement Collapse!</span>
                This workflow composition violates the monotonicity axiom of residuated lattices. Going backward to a lower stage (e.g. from drafted back to researched) resets the algebraic meet limit ($\bigwedge \text{steps}$), collapsing the overall quality output down to the lowest step.
              </div>
            </div>
          )}

          {/* 2. Visual Pipeline Progress bar */}
          <div className="bg-slate-50/50 border border-slate-200/50 rounded-2xl p-5 shadow-xs">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-4">
              Agent Sequence Pipeline progress
            </p>
            
            <div className="flex flex-wrap items-center gap-3">
              {selectedWorkflow.steps.map((step, idx) => {
                const isCompleted = hasExecuted || (executing && idx < activeStepIdx);
                const isActive = executing && idx === activeStepIdx;
                const isPending = !executing && !hasExecuted;
                
                let badgeStyle = "bg-white border-slate-200 text-slate-400";
                let iconEl = <span className="w-4 h-4 rounded-full border-2 border-slate-350 flex items-center justify-center text-[9px] font-bold">{idx + 1}</span>;

                if (isCompleted) {
                  badgeStyle = "bg-emerald-50 border-emerald-250 text-emerald-800 shadow-xs";
                  iconEl = <Check className="w-4 h-4 text-emerald-600 stroke-[3px]" />;
                } else if (isActive) {
                  badgeStyle = "bg-orange-50 border-orange-300 text-orange-850 ring-2 ring-orange-100 shadow-sm";
                  iconEl = <Loader2 className="w-4 h-4 text-orange-600 animate-spin" />;
                }

                return (
                  <React.Fragment key={idx}>
                    <div className={`flex items-center gap-2 border px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all duration-300 ${badgeStyle}`}>
                      {iconEl}
                      <span className="uppercase tracking-wide">{step}</span>
                    </div>

                    {idx < selectedWorkflow.steps.length - 1 && (
                      <span className="text-slate-350 font-bold text-xs">→</span>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>

          {/* 3. Live Terminal Output */}
          <div className="bg-slate-950 rounded-2xl p-5 border border-slate-800 text-xs font-mono h-60 overflow-y-auto flex flex-col justify-between shadow-lg">
            <div className="space-y-2">
              <p className="text-slate-600 border-b border-slate-900 pb-2 flex items-center gap-1.5 select-none font-bold">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-500"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-green-500"></span>
                <span className="ml-2 font-mono">QUANTFLOW WORKFLOW RUNNER v1.0.0</span>
              </p>
              
              {executionLogs.map((log, idx) => {
                let colorClass = "text-slate-300";
                if (log.startsWith("[Error]")) colorClass = "text-red-400 font-bold";
                else if (log.startsWith("[Complete]")) colorClass = "text-emerald-400 font-bold";
                else if (log.startsWith("[Workflow]")) colorClass = "text-orange-400 font-bold";
                else if (log.startsWith("[Quantale Check]")) colorClass = "text-indigo-400";
                else if (log.startsWith("[Output]")) colorClass = "text-slate-500 italic";
                else if (log.startsWith("[")) {
                  // Step output logs (e.g. [RESEARCHED] status: success)
                  colorClass = "text-sky-300";
                }

                return (
                  <p key={idx} className={`${colorClass} leading-relaxed`}>
                    {log}
                  </p>
                );
              })}
              <div ref={terminalEndRef} />
            </div>

            {executionLogs.length === 0 && (
              <p className="text-slate-600 italic select-none py-10 text-center">
                Select a recommended template or custom pipeline and click "Execute Workflow" to view execution traces.
              </p>
            )}
          </div>

          {/* 4. Complete Execution Metrics Grid */}
          {metrics && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50/50 border border-slate-200/50 p-4 rounded-2xl shadow-xs">
              <div className="bg-white border border-slate-100 p-3.5 rounded-xl text-center shadow-xs">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Process Duration</p>
                <div className="flex items-center justify-center gap-1.5 mt-1">
                  <Clock className="w-4 h-4 text-orange-500" />
                  <span className="font-extrabold text-slate-800 text-sm">{metrics.totalDuration}s</span>
                </div>
              </div>

              <div className="bg-white border border-slate-100 p-3.5 rounded-xl text-center shadow-xs">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Stages Traversed</p>
                <div className="flex items-center justify-center gap-1.5 mt-1">
                  <Layers className="w-4 h-4 text-orange-500" />
                  <span className="font-extrabold text-slate-800 text-sm">{metrics.totalSteps}</span>
                </div>
              </div>

              <div className="bg-white border border-slate-100 p-3.5 rounded-xl text-center shadow-xs">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Algebraic Bottleneck</p>
                <div className="flex items-center justify-center gap-1.5 mt-1">
                  <Sparkles className="w-4 h-4 text-orange-500" />
                  <span className="font-extrabold text-slate-800 text-sm uppercase tracking-wide">{metrics.effectiveStage}</span>
                </div>
              </div>

              <div className="bg-white border border-slate-100 p-3.5 rounded-xl text-center shadow-xs">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Safety Rating</p>
                <div className="flex items-center justify-center gap-1.5 mt-1">
                  {metrics.safetyRating.includes("High") ? (
                    <>
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span className="font-extrabold text-emerald-700 text-sm">{metrics.safetyRating}</span>
                    </>
                  ) : (
                    <>
                      <ShieldAlert className="w-4 h-4 text-red-500 animate-pulse" />
                      <span className="font-extrabold text-red-600 text-sm">{metrics.safetyRating}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

        </div>
      ) : (
        <div className="mt-10 py-16 text-center text-slate-450 border border-dashed border-slate-200 rounded-3xl text-sm">
          Please select a recommended workflow from the AI Planner or build a custom workflow in the Quantale Sandbox first.
        </div>
      )}

    </div>
  );
}
