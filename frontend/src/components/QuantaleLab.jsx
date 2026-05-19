import React, { useState, useEffect } from "react";
import { Sliders, HelpCircle, RefreshCw, Plus, Trash2, ShieldCheck, ShieldAlert, Cpu } from "lucide-react";
import HasseDiagram from "./HasseDiagram";

const API_BASE_URL = "http://127.0.0.1:8000";

export default function QuantaleLab() {
  const stages = ["raw", "researched", "structured", "drafted", "refined", "published"];

  // States
  const [customSteps, setCustomSteps] = useState(["researched", "drafted", "published"]);
  const [targetStage, setTargetStage] = useState("published");
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  // Galois Calculator State
  const [galoisA, setGaloisA] = useState("drafted");

  // Fetch analysis from FastAPI backend
  const fetchAnalysis = async (steps, target) => {
    try {
      setLoading(true);
      setError("");
      const response = await fetch(`${API_BASE_URL}/api/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          steps: steps,
          targetStage: target,
        }),
      });

      if (!response.ok) throw new Error("Failed to compute algebraic analysis.");

      const data = await response.json();
      setAnalysis(data);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Run analysis when steps or target change
  useEffect(() => {
    fetchAnalysis(customSteps, targetStage);
  }, [customSteps, targetStage]);

  // Toggle stage inclusion
  const handleToggleStage = (stage) => {
    if (customSteps.includes(stage)) {
      setCustomSteps(customSteps.filter((s) => s !== stage));
    } else {
      // Append to the list
      setCustomSteps([...customSteps, stage]);
    }
  };

  // Append stage helper
  const handleAppendStage = (stage) => {
    setCustomSteps([...customSteps, stage]);
  };

  // Clear builder
  const handleClear = () => {
    setCustomSteps([]);
  };

  // Reset to standard templates
  const handleReset = (preset) => {
    const presets = {
      fast: ["researched", "drafted", "published"],
      balanced: ["researched", "structured", "drafted", "published"],
      quality: ["researched", "structured", "drafted", "refined", "published"],
    };
    setCustomSteps(presets[preset] || []);
  };

  return (
    <div className="mt-12 bg-white border border-orange-100 rounded-3xl p-8 shadow-sm text-slate-900">
      
      {/* Title Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-orange-100 text-orange-600 rounded-2xl">
          <Cpu className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-3xl font-bold text-slate-900">
            Quantale Algebraic Laboratory
          </h2>
          <p className="text-slate-500 mt-1 text-sm">
            Model, analyze, and formally verify custom AI workflows using lattice theory and Galois residuals.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-8">
        
        {/* Left: SVG Hasse Diagram (Lattice Poset) */}
        <div className="lg:col-span-4">
          <HasseDiagram 
            activeStages={customSteps} 
            onNodeClick={handleToggleStage} 
          />
        </div>

        {/* Right: Custom Builder & Mathematical Analysis */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Builder Controls */}
          <div className="border border-orange-100 bg-orange-50/20 p-5 rounded-2xl">
            <h4 className="font-bold text-sm text-slate-800 uppercase tracking-wider mb-3">
              1. Custom Workflow Assembly
            </h4>

            {/* Steps display */}
            <div className="flex flex-wrap items-center gap-2 mb-4 bg-white p-3 border border-orange-100 rounded-xl min-h-[50px]">
              {customSteps.length > 0 ? (
                customSteps.map((step, idx) => (
                  <div key={idx} className="flex items-center gap-1 bg-orange-50 border border-orange-200 text-orange-800 px-2 py-1 rounded-lg text-xs font-semibold">
                    <span>{step}</span>
                    <button 
                      onClick={() => setCustomSteps(customSteps.filter((_, i) => i !== idx))}
                      className="text-orange-400 hover:text-orange-600 font-bold ml-1 cursor-pointer"
                    >
                      ×
                    </button>
                  </div>
                ))
              ) : (
                <span className="text-slate-400 text-xs italic">
                  Pipeline is empty. Add stages below or click the Hasse diagram.
                </span>
              )}
            </div>

            {/* Interactive Add Buttons */}
            <div className="flex flex-wrap gap-2">
              {stages.map((stage) => (
                <button
                  key={stage}
                  onClick={() => handleAppendStage(stage)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-white border border-slate-200 hover:bg-orange-50 hover:border-orange-200 text-slate-700 hover:text-orange-700 text-xs font-medium rounded-xl transition cursor-pointer"
                >
                  <Plus size={12} />
                  <span>{stage}</span>
                </button>
              ))}
            </div>

            {/* Presets and clear controls */}
            <div className="flex items-center justify-between border-t border-slate-100 mt-4 pt-4 text-xs">
              <div className="flex gap-2">
                <span className="text-slate-500 font-medium self-center">Presets:</span>
                <button onClick={() => handleReset("fast")} className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg cursor-pointer">Fast</button>
                <button onClick={() => handleReset("balanced")} className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg cursor-pointer">Balanced</button>
                <button onClick={() => handleReset("quality")} className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg cursor-pointer">Quality</button>
              </div>

              <button 
                onClick={handleClear}
                className="flex items-center gap-1 text-slate-500 hover:text-rose-600 transition cursor-pointer"
              >
                <Trash2 size={13} />
                <span>Clear Pipeline</span>
              </button>
            </div>
          </div>

          {/* Target & Galois Adjunction Sandbox */}
          <div className="border border-orange-100 p-5 rounded-2xl bg-white shadow-sm grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Target Select */}
            <div>
              <h4 className="font-bold text-sm text-slate-800 uppercase tracking-wider mb-2">
                2. Target Quality Stage ($c$)
              </h4>
              <p className="text-slate-500 text-xs leading-relaxed mb-3">
                Sets the target refinement threshold for Galois residuation division.
              </p>
              <select
                value={targetStage}
                onChange={(e) => setTargetStage(e.target.value)}
                className="w-full bg-slate-50 border border-orange-200 text-slate-800 py-2.5 px-3 rounded-xl text-sm font-medium outline-none"
              >
                {stages.map((stage) => (
                  <option key={stage} value={stage}>
                    Target stage: {stage}
                  </option>
                ))}
              </select>
            </div>

            {/* Galois Calculator */}
            <div>
              <h4 className="font-bold text-sm text-slate-800 uppercase tracking-wider mb-2">
                3. Galois Calculator ($a \to c$)
              </h4>
              <p className="text-slate-500 text-xs leading-relaxed mb-3">
                Solve delegation divide: what is the max safe downstream step?
              </p>
              
              <div className="flex gap-3">
                <div className="flex-1">
                  <select
                    value={galoisA}
                    onChange={(e) => setGaloisA(e.target.value)}
                    className="w-full bg-slate-50 border border-orange-200 text-slate-800 py-2 px-2.5 rounded-xl text-xs outline-none"
                  >
                    {stages.map((stage) => (
                      <option key={stage} value={stage}>
                        Stage (a): {stage}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex-1 flex items-center justify-center bg-orange-50 border border-orange-100 rounded-xl px-3 py-2 text-xs font-bold text-slate-800">
                  <span>Residual: {analysis?.residuals[galoisA] || "published"}</span>
                </div>
              </div>
            </div>

            {/* Adjunction display */}
            <div className="col-span-1 md:col-span-2 border-t border-slate-100 pt-4 flex flex-col md:flex-row items-start md:items-center justify-between text-xs gap-3">
              <div className="font-mono bg-slate-950 text-orange-400 p-2.5 rounded-xl w-full md:w-auto">
                a ⊗ b ≤ c ⟺ b ≤ (a → c)
              </div>
              <div className="text-slate-500 leading-relaxed max-w-md">
                If current step is <strong>{galoisA}</strong>, downstream agent step <strong>b</strong> can be at most <strong>{analysis?.residuals[galoisA] || "published"}</strong> to prevent falling below target limit <strong>{targetStage}</strong>.
              </div>
            </div>

          </div>

          {/* Validation & Bottleneck Results */}
          {analysis && (
            <div className="border border-orange-100 p-5 rounded-2xl bg-white shadow-sm space-y-4">
              <h4 className="font-bold text-sm text-slate-800 uppercase tracking-wider">
                4. Algebraic Diagnostics
              </h4>

              {/* Chain Monotonicity validation */}
              {analysis.isValidChain ? (
                <div className="flex items-start gap-2 bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-xl text-xs">
                  <ShieldCheck className="w-4 h-4 mt-0.5 text-emerald-600 flex-shrink-0" />
                  <div>
                    <span className="font-bold">Monotonicity Confirmed:</span> Pipeline flows in increasing/non-decreasing refinement stages. Mathematically stable.
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-2 bg-rose-50 border border-rose-200 text-rose-800 p-3 rounded-xl text-xs">
                  <ShieldAlert className="w-4 h-4 mt-0.5 text-rose-600 flex-shrink-0" />
                  <div>
                    <span className="font-bold">Quality Decay Warning!</span> Stages are out of order. In a meet-multiplied quantale, moving from a higher stage (e.g. drafted) back to a lower stage (e.g. researched) causes refinement collapse.
                  </div>
                </div>
              )}

              {/* Meet bottleneck */}
              <div className="flex justify-between items-center bg-slate-50 border border-slate-100 p-3 rounded-xl text-xs">
                <div>
                  <p className="font-semibold text-slate-700">Lattice Meet (Bottleneck)</p>
                  <p className="text-slate-500 text-[10px] mt-0.5">The overall guaranteed content quality limit: ⋀ steps</p>
                </div>
                <span className="font-bold text-orange-600 uppercase tracking-wide bg-orange-100/50 px-3 py-1 rounded-lg border border-orange-200">
                  {analysis.effectiveStage}
                </span>
              </div>

              {/* Template comparisons */}
              <div className="text-xs">
                <p className="font-semibold text-slate-700 mb-2">Preset Comparisons</p>
                <div className="grid grid-cols-3 gap-3">
                  {Object.entries(analysis.comparisons || {}).map(([preset, val]) => (
                    <div key={preset} className="bg-slate-50 border border-slate-100 p-2.5 rounded-lg text-center">
                      <p className="font-bold text-slate-500 text-[10px] uppercase mb-1">{preset}</p>
                      <p className="text-slate-700 font-semibold text-[11px]">{val}</p>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

        </div>

      </div>

    </div>
  );
}
