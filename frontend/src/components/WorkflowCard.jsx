import React from "react";
import { Zap, Scale, Gem, Sparkles, HelpCircle, ArrowRight } from "lucide-react";

export default function WorkflowCard({ workflow, onExecute, isBest, isSelected, isExecuting }) {
  const iconMap = {
    fast: <Zap className="w-6 h-6" />,
    balanced: <Scale className="w-6 h-6" />,
    quality: <Gem className="w-6 h-6" />,
  };

  const icon = iconMap[workflow.key] || <Sparkles className="w-6 h-6" />;

  const iconBg = isBest
    ? "bg-orange-100 text-orange-600"
    : workflow.key === "fast"
    ? "bg-emerald-100 text-emerald-600"
    : workflow.key === "balanced"
    ? "bg-sky-100 text-sky-600"
    : "bg-violet-100 text-violet-600";

  const cardBorder = isBest
    ? "border-orange-400 ring-2 ring-orange-100 bg-orange-50 shadow-lg"
    : "border-orange-100 bg-white shadow-sm hover:-translate-y-1";

  return (
    <div
      className={`rounded-3xl border p-6 transition transform ${cardBorder} text-slate-900 flex flex-col justify-between`}
    >
      <div>
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className={`w-14 h-14 rounded-2xl ${iconBg} flex items-center justify-center`}>
            {icon}
          </div>

          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-100 text-slate-700">
            {workflow.tag}
          </span>
        </div>

        {/* Title */}
        <div className="flex items-center justify-between gap-4 mt-6">
          <h3 className="text-2xl font-bold text-slate-900">
            {workflow.name}
          </h3>

          {isBest ? (
            <span className="inline-flex items-center rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-700">
              Best Match
            </span>
          ) : (
            <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
              {workflow.key === "fast" ? "Fast Choice" : workflow.key === "balanced" ? "Balanced" : "Quality Focus"}
            </span>
          )}
        </div>

        {/* Visual Pipeline Steps Flow */}
        <div className="mt-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Pipeline Flow
          </p>
          <div className="flex flex-wrap items-center gap-1.5 bg-orange-50/50 border border-orange-100/55 p-3 rounded-2xl">
            {workflow.steps.map((step, idx) => (
              <React.Fragment key={idx}>
                <span className="bg-white border border-orange-100 text-orange-700 px-2.5 py-1.5 rounded-xl text-xs font-medium">
                  {step}
                </span>
                {idx < workflow.steps.length - 1 && (
                  <ArrowRight size={12} className="text-orange-400" />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Quantale Mathematics & Residuals Analysis */}
        <div className="mt-6 border-t border-slate-100 pt-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Quantale Analysis
            </span>
            <div className="group relative">
              <HelpCircle size={14} className="text-slate-400 cursor-help" />
              <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block w-56 bg-slate-900 text-white text-[10px] p-2.5 rounded-lg shadow-xl leading-relaxed z-25">
                <strong>Residual (a → c):</strong> Represents the largest downstream stage allowed when composing with stage 'a' to remain within the target stage limit (published).
              </div>
            </div>
          </div>

          {/* Bottleneck indicator */}
          <div className="mt-2.5 flex items-center justify-between bg-slate-50 border border-slate-100 px-3.5 py-2 rounded-xl text-xs">
            <span className="text-slate-500 font-medium">Effective Bottleneck:</span>
            <span className="font-bold text-orange-600 uppercase tracking-wide bg-orange-100/50 px-2 py-0.5 rounded-md border border-orange-100">
              {workflow.effectiveStage}
            </span>
          </div>

          {/* Residuals Table mapping */}
          <div className="mt-3">
            <p className="text-[10px] font-semibold text-slate-400 mb-1.5">
              Residual Limits (Stage → Target)
            </p>
            <div className="bg-slate-50 border border-slate-100 rounded-xl overflow-hidden text-xs">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-500 bg-slate-100/50">
                    <th className="py-1.5 px-3 font-semibold text-[10px]">Workflow Stage</th>
                    <th className="py-1.5 px-3 font-semibold text-[10px] text-right">Max Safe Extension</th>
                  </tr>
                </thead>
                <tbody>
                  {workflow.steps.map((step, idx) => (
                    <tr key={idx} className="border-b border-slate-100/60 last:border-b-0 hover:bg-slate-100/20">
                      <td className="py-1.5 px-3 font-medium text-slate-600">{step}</td>
                      <td className="py-1.5 px-3 text-right font-bold text-emerald-600">
                        {workflow.residuals && workflow.residuals[step] ? workflow.residuals[step] : "published"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-3 gap-4 mt-6 text-center border-t border-slate-100 pt-4">
          <div>
            <p className="text-xs text-slate-400 font-medium">
              Time
            </p>

            <p className="font-bold mt-1 text-slate-900 text-sm">
              {workflow.estimatedTime || "~5 min"}
            </p>
          </div>

          <div>
            <p className="text-xs text-slate-400 font-medium">
              Cost
            </p>

            <p className="font-bold mt-1 text-slate-900 text-sm">
              {workflow.estimatedCost}
            </p>
          </div>

          <div>
            <p className="text-xs text-slate-400 font-medium">
              Score
            </p>

            <p className="font-bold mt-1 text-slate-900 text-sm">
              {workflow.matchScore || "7.5"}
            </p>
          </div>
        </div>
      </div>

      {/* Button */}
      <button 
        onClick={onExecute}
        disabled={isExecuting}
        className="w-full mt-6 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 transition text-white py-3.5 rounded-2xl font-semibold cursor-pointer text-sm"
      >
        Use Workflow
      </button>
    </div>
  );
}
