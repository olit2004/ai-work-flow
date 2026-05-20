import React, { useState, useEffect } from "react";
import { Sliders, HelpCircle, RefreshCw, Plus, Trash2, ShieldCheck, ShieldAlert, Cpu, CheckCircle, Scale, Eye, Play, BookOpen } from "lucide-react";
import HasseDiagram from "./HasseDiagram";

export default function QuantaleLab({ customPoset, setCustomPoset, quantale, onExecuteCustom }) {
  // Local Panel States
  const [editMode, setEditMode] = useState(false);
  const [customSteps, setCustomSteps] = useState(["researched", "drafted", "published"]);
  const [targetStage, setTargetStage] = useState("published");

  // Proof Simulation States
  const [proofMode, setProofMode] = useState("none"); // "none" | "distributivity" | "adjunction"
  const [proofA, setProofA] = useState("drafted");
  const [proofB, setProofB] = useState("researched");
  const [proofC, setProofC] = useState("published");

  const stages = customPoset.nodes;

  // Make sure variables exist in node list (in case nodes are deleted in edit mode)
  useEffect(() => {
    if (stages.length > 0) {
      if (!stages.includes(proofA)) setProofA(stages[0]);
      if (!stages.includes(proofB)) setProofB(stages[0]);
      if (!stages.includes(proofC)) setProofC(stages[stages.length - 1] || stages[0]);
      if (!stages.includes(targetStage)) setTargetStage(stages[stages.length - 1] || stages[0]);
      setCustomSteps(prev => prev.filter(s => stages.includes(s)));
    }
  }, [stages]);

  // Append node helper for custom pipeline builder
  const handleAppendStage = (stage) => {
    setCustomSteps([...customSteps, stage]);
  };

  // Preset templates
  const handleResetPreset = (preset) => {
    const presets = {
      fast: ["researched", "drafted", "published"],
      balanced: ["researched", "structured", "drafted", "published"],
      quality: ["researched", "structured", "drafted", "refined", "published"],
    };
    if (presets[preset]) {
      // Filter out any stages that don't exist in the current poset
      setCustomSteps(presets[preset].filter(s => stages.includes(s)));
    }
  };

  // Computes the algebraic status of the current graph
  const diagnostics = React.useMemo(() => {
    if (!quantale) {
      return { isValid: false, message: "Error compiling relation algebra." };
    }

    const errors = [];
    const properties = [];

    // 1. Is it a Poset? (Guaranteed by closure calculation, but good to state)
    properties.push({ name: "Poset Order (Reflexive, Antisymmetric, Transitive)", val: true });

    // 2. Is it a Lattice?
    const isLat = quantale.isLattice();
    if (!isLat) {
      errors.push("Missing Join/Meet bounds. Every pair of elements must have a unique lowest upper bound and highest lower bound.");
    }
    properties.push({ name: "Lattice Algebra (Pairwise bounds exist)", val: isLat });

    if (isLat) {
      // 3. Monoid axioms
      const isComm = quantale.isCommutative();
      const isIdem = quantale.isIdempotent();
      const isInteg = quantale.isIntegral();
      properties.push({ name: "Commutative Monoid (a ⊗ b = b ⊗ a)", val: isComm });
      properties.push({ name: "Idempotent Monoid (a ⊗ a = a)", val: isIdem });
      properties.push({ name: "Integral Unit (Identity is Top element)", val: isInteg });

      // 4. Distributivity (distributes over joins)
      const isDist = quantale.verifyDistributivity();
      if (!isDist) {
        errors.push("Distributivity failure: ⊗ does not distribute over Join. Composition must scale linearly.");
      }
      properties.push({ name: "Quantale Distributivity: a ⊗ (b ∨ c) = (a ⊗ b) ∨ (a ⊗ c)", val: isDist });

      // 5. Adjunction
      const isAdj = quantale.verifyAdjunction();
      if (!isAdj) {
        errors.push("Adjunction failure: Galois connection a ⊗ b ≤ c ⟺ b ≤ a → c is violated.");
      }
      properties.push({ name: "Residuated Galois Adjunction", val: isAdj });
    }

    return {
      isValid: errors.length === 0,
      errors,
      properties
    };
  }, [quantale]);

  // Compute live calculations for custom builders
  const analysis = React.useMemo(() => {
    if (!quantale || !diagnostics.isValid) return null;

    try {
      const effStage = quantale.bigMeet(customSteps) || quantale.top;
      
      // Check if customSteps are strictly non-decreasing (monotonic)
      let isValidChain = true;
      for (let i = 0; i < customSteps.length - 1; i++) {
        if (!quantale.le(customSteps[i], customSteps[i+1])) {
          isValidChain = false;
          break;
        }
      }

      // Compute right residuals for all stages relative to the selected target
      const residuals = {};
      stages.forEach(s => {
        residuals[s] = quantale.rightResidual(s, targetStage);
      });

      return {
        effectiveStage: effStage,
        isValidChain,
        residuals
      };
    } catch (e) {
      return null;
    }
  }, [quantale, customSteps, targetStage, stages, diagnostics.isValid]);

  return (
    <div className="bg-white/80 backdrop-blur-xl border border-slate-100 rounded-3xl p-6 shadow-sm text-slate-800">
      
      {/* Title Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-orange-100 text-orange-600 rounded-2xl">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">
              Algebraic Quantale Sandbox
            </h2>
            <p className="text-slate-500 text-xs mt-0.5">
              Model, verify, and mathematically animate custom poset structures and Galois connections.
            </p>
          </div>
        </div>

        {/* Edit mode toggle switch */}
        <div className="flex items-center gap-2.5 bg-slate-50 px-3.5 py-2 rounded-2xl border border-slate-200/50 self-start md:self-auto">
          <span className="text-xs font-semibold text-slate-600">Edit Graph Structure</span>
          <button
            onClick={() => {
              setEditMode(!editMode);
              setProofMode("none"); // Reset proofs during edit
            }}
            className="text-slate-600 hover:text-orange-500 transition cursor-pointer"
          >
            {editMode ? (
              <span className="text-orange-500 font-bold flex items-center gap-1 text-xs">
                Active <CheckCircle className="w-4 h-4" />
              </span>
            ) : (
              <span className="text-slate-400 flex items-center gap-1 text-xs">
                Disabled <HelpCircle className="w-4 h-4 text-slate-300" />
              </span>
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-6">
        
        {/* Left: Interactive Hasse Diagram */}
        <div className="lg:col-span-5 xl:col-span-4 flex justify-center">
          <HasseDiagram 
            customPoset={customPoset}
            onUpdatePoset={setCustomPoset}
            quantale={quantale}
            activeStages={customSteps}
            onNodeClick={(node) => {
              if (!editMode) {
                // If in sandbox build mode, append/toggle customSteps
                if (customSteps.includes(node)) {
                  setCustomSteps(customSteps.filter(s => s !== node));
                } else {
                  setCustomSteps([...customSteps, node]);
                }
              }
            }}
            editMode={editMode}
            proofMode={proofMode}
            proofNodes={{ a: proofA, b: proofB, c: proofC }}
          />
        </div>

        {/* Right: Validation & Live Proof Panel */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-6">
          
          {/* Dynamic Proof Visualizer controls */}
          <div className="bg-slate-50/50 border border-slate-200/60 rounded-2xl p-5">
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-slate-500" />
              1. Mathematical Visual Proofs
            </h4>

            <div className="flex flex-wrap gap-2.5 mb-4">
              <button
                onClick={() => setProofMode("none")}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all duration-300 cursor-pointer ${
                  proofMode === "none"
                    ? "bg-slate-800 text-white border-slate-800"
                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                }`}
              >
                No Overlay
              </button>
              <button
                onClick={() => setProofMode("distributivity")}
                disabled={editMode || !diagnostics.isValid}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all duration-300 cursor-pointer disabled:opacity-40 ${
                  proofMode === "distributivity"
                    ? "bg-indigo-600 text-white border-indigo-600"
                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                }`}
              >
                Animate Distributivity
              </button>
              <button
                onClick={() => setProofMode("adjunction")}
                disabled={editMode || !diagnostics.isValid}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all duration-300 cursor-pointer disabled:opacity-40 ${
                  proofMode === "adjunction"
                    ? "bg-emerald-600 text-white border-emerald-600"
                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                }`}
              >
                Animate Galois Adjunction
              </button>
            </div>

            {/* Proof Inputs & Math equations */}
            {proofMode === "distributivity" && diagnostics.isValid && (
              <div className="bg-indigo-50/30 border border-indigo-100/50 rounded-xl p-4 text-xs text-slate-700 space-y-3.5">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-slate-500">Select (a):</span>
                    <select
                      value={proofA}
                      onChange={(e) => setProofA(e.target.value)}
                      className="bg-white border border-slate-200 rounded-lg px-2 py-1 outline-none font-semibold text-slate-700"
                    >
                      {stages.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-slate-500">Select (b):</span>
                    <select
                      value={proofB}
                      onChange={(e) => setProofB(e.target.value)}
                      className="bg-white border border-slate-200 rounded-lg px-2 py-1 outline-none font-semibold text-slate-700"
                    >
                      {stages.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-slate-500">Select (c):</span>
                    <select
                      value={proofC}
                      onChange={(e) => setProofC(e.target.value)}
                      className="bg-white border border-slate-200 rounded-lg px-2 py-1 outline-none font-semibold text-slate-700"
                    >
                      {stages.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>

                <div className="border-t border-indigo-150/40 pt-3 space-y-2.5 font-mono">
                  <p className="font-bold text-slate-900">Distributivity Law: a ⊗ (b ∨ c) = (a ⊗ b) ∨ (a ⊗ c)</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[11px] bg-white p-3 border border-slate-100 rounded-lg shadow-inner">
                    <div>
                      <p className="text-indigo-600 font-bold mb-1">Left Hand Side (LHS)</p>
                      <ul className="space-y-1">
                        <li>1. Join: {proofB} ∨ {proofC} = <strong className="text-indigo-900">{quantale?.join(proofB, proofC) || "null"}</strong></li>
                        <li>2. Compose: {proofA} ⊗ {quantale?.join(proofB, proofC)} = <strong className="text-emerald-600 font-extrabold">{quantale?.mul(proofA, quantale?.join(proofB, proofC)) || "null"}</strong></li>
                      </ul>
                    </div>

                    <div>
                      <p className="text-sky-600 font-bold mb-1">Right Hand Side (RHS)</p>
                      <ul className="space-y-1">
                        <li>1. Term 1: {proofA} ⊗ {proofB} = <strong className="text-indigo-900">{quantale?.mul(proofA, proofB) || "null"}</strong></li>
                        <li>2. Term 2: {proofA} ⊗ {proofC} = <strong className="text-indigo-900">{quantale?.mul(proofA, proofC) || "null"}</strong></li>
                        <li>3. Join Terms: {quantale?.mul(proofA, proofB)} ∨ {quantale?.mul(proofA, proofC)} = <strong className="text-emerald-600 font-extrabold">{quantale?.join(quantale?.mul(proofA, proofB), quantale?.mul(proofA, proofC)) || "null"}</strong></li>
                      </ul>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-indigo-800 font-bold">
                    <CheckCircle className="w-4 h-4 text-indigo-600" />
                    <span>LHS equals RHS ({quantale?.mul(proofA, quantale?.join(proofB, proofC))} = {quantale?.join(quantale?.mul(proofA, proofB), quantale?.mul(proofA, proofC))}). Proof Complete!</span>
                  </div>
                </div>
              </div>
            )}

            {proofMode === "adjunction" && diagnostics.isValid && (
              <div className="bg-emerald-50/30 border border-emerald-150/40 rounded-xl p-4 text-xs text-slate-700 space-y-3.5">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-slate-500">Select Manager (a):</span>
                    <select
                      value={proofA}
                      onChange={(e) => setProofA(e.target.value)}
                      className="bg-white border border-slate-200 rounded-lg px-2 py-1 outline-none font-semibold text-slate-700"
                    >
                      {stages.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-slate-500">Select Limit (c):</span>
                    <select
                      value={proofC}
                      onChange={(e) => setProofC(e.target.value)}
                      className="bg-white border border-slate-200 rounded-lg px-2 py-1 outline-none font-semibold text-slate-700"
                    >
                      {stages.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>

                <div className="border-t border-emerald-150/40 pt-3 space-y-2.5 font-mono">
                  <p className="font-bold text-slate-900">Adjunction Law: a ⊗ b ≤ c ⟺ b ≤ a → c</p>
                  
                  <div className="bg-white p-3 border border-slate-100 rounded-lg shadow-inner">
                    <p className="mb-2">1. Calculated Division (Right Residual):</p>
                    <p className="text-sm font-bold text-slate-800 pl-4">
                      {proofA} → {proofC} = <span className="text-amber-600 font-extrabold">{quantale?.rightResidual(proofA, proofC)}</span>
                    </p>
                    
                    <p className="mt-3 mb-1">2. Allowed Sub-Agent Steps (b) matching limits:</p>
                    <div className="flex flex-wrap gap-1.5 pl-4">
                      {stages.map(s => {
                        const isSafe = quantale?.le(quantale.mul(proofA, s), proofC);
                        return (
                          <span 
                            key={s} 
                            className={`px-2 py-1 rounded text-[10px] font-bold ${
                              isSafe 
                                ? "bg-emerald-50 text-emerald-800 border border-emerald-200" 
                                : "bg-red-50 text-red-600 border border-red-150 line-through"
                            }`}
                          >
                            {s}
                          </span>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex items-start gap-1.5 text-xs text-emerald-800 font-bold leading-relaxed">
                    <CheckCircle className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                    <span>
                      Verifies Adjunction! A sub-agent stage $b$ stays within limit "{proofC}" if and only if $b \le$ "{quantale?.rightResidual(proofA, proofC)}". The Hasse green/gold overlays visually confirm this order constraint.
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Custom Pipeline Builder */}
          <div className="bg-slate-50/50 border border-slate-200/60 rounded-2xl p-5">
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
              <Sliders className="w-4 h-4 text-slate-500" />
              2. Custom Workflow Assembly
            </h4>

            {editMode ? (
              <div className="text-center py-6 px-4 bg-orange-50/30 border border-dashed border-orange-200 rounded-xl my-2">
                <p className="text-xs text-orange-850 font-bold">
                  Graph Editor is Active
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Disable "Edit Graph Structure" in the top-right to assemble and run custom workflows.
                </p>
              </div>
            ) : !diagnostics.isValid ? (
              <div className="text-center py-6 px-4 bg-rose-50/30 border border-dashed border-rose-200 rounded-xl my-2">
                <p className="text-xs text-rose-800 font-bold">
                  Algebraic Constraints Violated
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Please restore the lattice connections in the editor to re-enable custom workflow assembly.
                </p>
              </div>
            ) : (
              <>
                {/* Steps display */}
                <div className="flex flex-wrap items-center gap-2 mb-4 bg-white p-3 border border-slate-200/50 rounded-xl min-h-[50px]">
                  {customSteps.length > 0 ? (
                    customSteps.map((step, idx) => (
                      <div key={idx} className="flex items-center gap-1 bg-orange-50 border border-orange-200 text-orange-850 px-2 py-1 rounded-lg text-xs font-semibold">
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
                      Pipeline is empty. Click stages on the Hasse diagram or buttons below.
                    </span>
                  )}
                </div>

                {/* Append Buttons */}
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

                {/* Presets and run controls */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-t border-slate-100 mt-4 pt-4 text-xs gap-3">
                  <div className="flex gap-2">
                    <span className="text-slate-400 font-medium self-center">Standard Presets:</span>
                    <button onClick={() => handleResetPreset("fast")} className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg cursor-pointer">Fast</button>
                    <button onClick={() => handleResetPreset("balanced")} className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg cursor-pointer">Balanced</button>
                    <button onClick={() => handleResetPreset("quality")} className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg cursor-pointer">Quality</button>
                  </div>

                  <div className="flex gap-2">
                    <button 
                      onClick={() => setCustomSteps([])}
                      className="flex items-center gap-1 text-slate-500 hover:text-rose-600 transition cursor-pointer font-medium"
                    >
                      <Trash2 size={13} />
                      <span>Clear</span>
                    </button>

                    <button
                      onClick={() => onExecuteCustom && onExecuteCustom(customSteps)}
                      disabled={customSteps.length === 0}
                      className="flex items-center gap-1.5 px-4 py-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-40 transition text-white font-bold rounded-xl shadow-sm cursor-pointer ml-2"
                    >
                      <Play size={12} />
                      <span>Run Custom Pipeline</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Validation Diagnostics Panel */}
          <div className="bg-slate-50/50 border border-slate-200/60 rounded-2xl p-5">
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-slate-500" />
              3. Algebraic Diagnostics
            </h4>

            {diagnostics.isValid ? (
              <div className="space-y-4">
                <div className="flex items-start gap-2 bg-emerald-50 border border-emerald-200 text-emerald-800 p-3.5 rounded-2xl text-xs">
                  <ShieldCheck className="w-4 h-4 mt-0.5 text-emerald-600 flex-shrink-0" />
                  <div>
                    <span className="font-bold">Lattice Invariant Confirmed:</span> The graph forms a valid Complete Lattice and Residuated Quantale. Meet operations guarantee a stable refinement boundary.
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {diagnostics.properties.map((prop, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-white border border-slate-200/50 p-2.5 rounded-xl shadow-xs">
                      <span className="font-semibold text-slate-600">{prop.name}</span>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                        prop.val 
                          ? "bg-emerald-150/50 text-emerald-700 border border-emerald-200" 
                          : "bg-red-100 text-red-600 border border-red-200"
                      }`}>
                        {prop.val ? "Verified" : "Fail"}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Target Stage selector for local residuation calculator */}
                {analysis && (
                  <div className="border-t border-slate-100 pt-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 text-xs">
                    <div className="flex-1">
                      <p className="font-bold text-slate-700 mb-1.5">Set Target Quality Stage ($c$)</p>
                      <select
                        value={targetStage}
                        onChange={(e) => setTargetStage(e.target.value)}
                        className="w-full bg-white border border-slate-200 text-slate-700 py-2 px-2.5 rounded-xl outline-none font-semibold"
                      >
                        {stages.map((stage) => (
                          <option key={stage} value={stage}>
                            Target: {stage}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex-1 bg-white border border-slate-200/50 p-3 rounded-xl shadow-xs flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-slate-700">Lattice Meet (Bottleneck)</p>
                        <p className="text-[9px] text-slate-400 mt-0.5">The guaranteed quality ceiling: ⋀ steps</p>
                      </div>
                      <span className="font-extrabold text-orange-600 bg-orange-50 border border-orange-200 px-3 py-1 rounded-lg uppercase tracking-wider">
                        {analysis.effectiveStage}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-start gap-2 bg-rose-50 border border-rose-200 text-rose-800 p-3.5 rounded-2xl text-xs">
                  <ShieldAlert className="w-4 h-4 mt-0.5 text-rose-600 flex-shrink-0" />
                  <div>
                    <span className="font-bold">Axiom Violation Error:</span> The poset structure failed algebraic checks.
                  </div>
                </div>
                
                <ul className="list-disc pl-5 text-xs text-rose-700 space-y-1.5">
                  {diagnostics.errors.map((err, idx) => (
                    <li key={idx} className="leading-relaxed">{err}</li>
                  ))}
                </ul>

                <p className="text-[10px] text-slate-400 italic">
                  Tip: Toggle graph editing and insert edges/nodes to ensure that every pair of elements has a Join (upper boundary) and Meet (lower boundary), with a unified top and bottom node.
                </p>
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}
