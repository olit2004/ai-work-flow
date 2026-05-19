import React from "react";
import { Play } from "lucide-react";

export default function ExecutionConsole({
  selectedWorkflow,
  executing,
  executionLogs,
  onExecute,
}) {
  return (
    <div className="mt-12 bg-white border border-orange-100 rounded-3xl p-8 shadow-sm text-slate-900">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">
            Execution Console
          </h2>

          <p className="text-slate-500 mt-2">
            Live workflow execution and AI service logs.
          </p>
        </div>

        <button 
          disabled={!selectedWorkflow || executing}
          onClick={onExecute}
          className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 transition text-white px-5 py-3 rounded-2xl font-semibold cursor-pointer"
        >
          <Play size={18} />
          {executing ? "Executing..." : "Execute"}
        </button>
      </div>

      <div className="mt-6 bg-slate-950 rounded-2xl p-6 text-sm text-green-400 font-mono h-64 overflow-auto">
        {executionLogs.length > 0 ? (
          executionLogs.map((log, idx) => (
            <p key={idx} className="mt-2">
              {log}
            </p>
          ))
        ) : (
          <p className="text-slate-500">
            Select a workflow and click Execute to see logs here...
          </p>
        )}
      </div>
    </div>
  );
}
