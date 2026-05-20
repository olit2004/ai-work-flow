import React, { useState, useMemo } from "react";
import { Sliders, HelpCircle, RefreshCw, Cpu, Brain, Terminal, BarChart2, FileText } from "lucide-react";
import BackgroundGlow from "./components/BackgroundGlow";
import Header from "./components/Header";
import GoalForm from "./components/GoalForm";
import ConstraintPanel from "./components/ConstraintPanel";
import WorkflowCard from "./components/WorkflowCard";
import QuantaleLab from "./components/QuantaleLab";
import ExecutionConsole from "./components/ExecutionConsole";
import ResultViewer from "./components/ResultViewer";
import { buildQuantale } from "./utils/quantaleEngine";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

const DEFAULT_NODES = ["raw", "researched", "structured", "drafted", "refined", "published"];
const DEFAULT_EDGES = [
  ["raw", "researched"],
  ["researched", "structured"],
  ["structured", "drafted"],
  ["drafted", "refined"],
  ["refined", "published"]
];

export default function QuantFlowDashboard() {
  // Navigation State
  const [activeTab, setActiveTab] = useState("planner"); // "planner" | "lab" | "execution"

  // Custom Poset / Quantale State
  const [customPoset, setCustomPoset] = useState({
    nodes: DEFAULT_NODES,
    edges: DEFAULT_EDGES
  });

  // Rebuild the ResiduatedQuantale engine instance whenever nodes/edges change
  const quantale = useMemo(() => {
    try {
      return buildQuantale(customPoset.nodes, customPoset.edges);
    } catch (e) {
      console.error("Failed to build quantale from custom poset:", e);
      return null;
    }
  }, [customPoset]);

  // AI Planner States
  const [goal, setGoal] = useState("");
  const [quality, setQuality] = useState(3);
  const [speed, setSpeed] = useState(3);
  const [cost, setCost] = useState(3);
  const [workflows, setWorkflows] = useState([]);
  const [generated, setGenerated] = useState(false);
  const [bestWorkflowKey, setBestWorkflowKey] = useState(null);

  // Execution States
  const [selectedWorkflow, setSelectedWorkflow] = useState(null);
  const [executionLogs, setExecutionLogs] = useState([]);
  const [executing, setExecuting] = useState(false);
  const [finalResult, setFinalResult] = useState("");
  const [executionMetrics, setExecutionMetrics] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchRecommendations = async () => {
    if (!goal.trim()) return;

    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/recommend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          goal: goal,
          quality: quality,
          speed: speed,
          cost: cost,
        }),
      });

      if (!response.ok) throw new Error("Failed to fetch recommendations");

      const data = await response.json();

      // Align backend recommendations with the current client-side quantale residuals
      const updatedData = data.map(wf => {
        if (!quantale) return wf;
        const res = {};
        wf.steps.forEach(step => {
          if (quantale.base.contains(step)) {
            res[step] = quantale.rightResidual(step, quantale.top);
          } else {
            res[step] = "published";
          }
        });
        return {
          ...wf,
          effectiveStage: quantale.bigMeet(wf.steps.filter(s => quantale.base.contains(s))) || "raw",
          residuals: res
        };
      });

      const best = updatedData.reduce((bestSoFar, wf) => {
        if (!bestSoFar) return wf;
        return Number(wf.matchScore) > Number(bestSoFar.matchScore) ? wf : bestSoFar;
      }, null);

      setWorkflows(updatedData);
      setBestWorkflowKey(best?.key ?? null);
      setSelectedWorkflow(best ?? null);
      setGenerated(true);
    } catch (error) {
      console.error("Error fetching recommendations:", error);
      setExecutionLogs((logs) => [
        ...logs,
        `[Error] Failed to fetch recommendations: ${error.message}`,
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateClick = () => {
    if (goal.trim()) {
      setGenerated(false);
      setSelectedWorkflow(null);
      setFinalResult("");
      setExecutionLogs([]);
      setExecutionMetrics(null);
      fetchRecommendations();
    }
  };

  const handleExecuteWorkflow = async (workflow) => {
    if (!goal.trim() || !workflow) return;
    setSelectedWorkflow(workflow);
    setActiveTab("execution"); // Auto-switch to execution log view

    try {
      setExecuting(true);
      setExecutionLogs([]);
      setFinalResult("");
      setExecutionMetrics(null);

      setExecutionLogs((logs) => [
        ...logs,
        `[Workflow] Initializing pipeline "${workflow.name}"...`,
        `[Quantale Check] Current algebraic bottleneck: ⋀ steps = "${workflow.effectiveStage}"`,
      ]);

      console.log("Sending execution request for workflow:", workflow, "with topic:", goal);
      const response = await fetch(`${API_BASE_URL}/api/execute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workflowName: workflow.key,
          steps: workflow.steps,
          topic: goal,
        }),
      });

      console.log("Execution raw response received:", response);
      if (!response.ok) throw new Error("Execution failed");

      const result = await response.json();
      console.log("Execution parsed result json:", result);

      // Stream logs sequentially for better UX visual effect
      for (const step of result.steps) {
        await new Promise((resolve) => setTimeout(resolve, 800));
        setExecutionLogs((logs) => [
          ...logs,
          `[${step.step.toUpperCase()}] status: ${step.status} (${step.duration}s)`,
          `[Output] ${step.output.substring(0, 100)}...`
        ]);
      }

      console.log("Setting finalResult state to:", result.finalResult);
      setFinalResult(result.finalResult);
      setExecutionMetrics(result.metrics);
      setExecutionLogs((logs) => [
        ...logs,
        `[Complete] Pipeline finished successfully in ${result.metrics.totalDuration}s.`,
      ]);

      // Auto-switch to result tab after a small delay to let user see completion message
      setTimeout(() => {
        setActiveTab("result");
      }, 1500);
    } catch (error) {
      console.error("Execution error:", error);
      setExecutionLogs((logs) => [
        ...logs,
        `[Error] Execution failed: ${error.message}`,
      ]);
    } finally {
      setExecuting(false);
    }
  };

  return (
    <div className="min-h-screen text-slate-900 relative pb-20">
      <BackgroundGlow />

      <div className="max-w-7xl mx-auto px-6 pt-8">
        {/* Header Banner */}
        <Header />

        {/* Dynamic Tab Navigation Bar */}
        <div className="flex items-center gap-1.5 mt-8 p-1.5 bg-slate-200/50 backdrop-blur-md rounded-2xl border border-slate-200/60 max-w-2xl">
          <button
            onClick={() => setActiveTab("planner")}
            className={`flex-1 flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl text-sm font-semibold transition-all duration-300 ${activeTab === "planner"
                ? "bg-white text-orange-600 shadow-md scale-102"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/50 cursor-pointer"
              }`}
          >
            <Brain className="w-4 h-4" />
            <span>AI Planner</span>
          </button>

          <button
            onClick={() => setActiveTab("lab")}
            className={`flex-1 flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl text-sm font-semibold transition-all duration-300 ${activeTab === "lab"
                ? "bg-white text-orange-600 shadow-md scale-102"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/50 cursor-pointer"
              }`}
          >
            <Cpu className="w-4 h-4" />
            <span>Quantale Sandbox</span>
          </button>

          <button
            onClick={() => setActiveTab("execution")}
            className={`flex-1 flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl text-sm font-semibold transition-all duration-300 ${activeTab === "execution"
                ? "bg-white text-orange-600 shadow-md scale-102"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/50 cursor-pointer"
              }`}
          >
            <Terminal className="w-4 h-4" />
            <span>Execution Center</span>
          </button>

          <button
            onClick={() => finalResult && setActiveTab("result")}
            disabled={!finalResult}
            className={`flex-1 flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl text-sm font-semibold transition-all duration-300 ${!finalResult
                ? "text-slate-450 cursor-not-allowed opacity-50"
                : activeTab === "result"
                  ? "bg-white text-orange-600 shadow-md scale-102"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/50 cursor-pointer"
              }`}
          >
            <FileText className="w-4 h-4" />
            <span>Generated Result</span>
          </button>
        </div>

        {/* Tab Contents */}
        <div className="mt-8 transition-all duration-500">
          {activeTab === "planner" && (
            <div className="space-y-8 animate-fadeIn">
              {/* Form Input Card */}
              <div className="bg-white/80 backdrop-blur-xl border border-slate-100 rounded-3xl p-6 shadow-sm">
                <GoalForm
                  goal={goal}
                  setGoal={setGoal}
                  loading={loading}
                  onSubmit={handleGenerateClick}
                />

                <div className="mt-6 pt-6 border-t border-slate-100">
                  <ConstraintPanel
                    quality={quality}
                    setQuality={setQuality}
                    speed={speed}
                    setSpeed={setSpeed}
                    cost={cost}
                    setCost={setCost}
                  />
                </div>
              </div>

              {/* Recommended Pipelines */}
              <div>
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                    <BarChart2 className="text-orange-500 w-6 h-6" />
                    Recommended Workflows
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                  {workflows.length > 0 ? (
                    workflows.map((workflow, idx) => (
                      <WorkflowCard
                        key={idx}
                        workflow={workflow}
                        onExecute={() => handleExecuteWorkflow(workflow)}
                        isBest={workflow.key === bestWorkflowKey}
                        isSelected={selectedWorkflow?.key === workflow.key}
                        isExecuting={executing}
                      />
                    ))
                  ) : (
                    <div className="col-span-1 md:col-span-3 text-center py-16 bg-white/50 border border-dashed border-slate-200 rounded-3xl text-slate-400 text-sm">
                      {generated
                        ? "No workflows matched the chosen constraints."
                        : "Describe your goal and click Generate to see optimal pipelines."}
                    </div>
                  )}
                </div>
              </div>

            </div>
          )}

          {activeTab === "lab" && (
            <div className="animate-fadeIn">
              <QuantaleLab
                customPoset={customPoset}
                setCustomPoset={setCustomPoset}
                quantale={quantale}
                onExecuteCustom={(steps) => {
                  const mockWorkflow = {
                    name: "Custom Lab Workflow",
                    key: "custom",
                    steps: steps,
                    effectiveStage: quantale?.bigMeet(steps) || "raw",
                    residuals: steps.reduce((acc, step) => {
                      acc[step] = quantale?.rightResidual(step, quantale.top) || "published";
                      return acc;
                    }, {})
                  };
                  handleExecuteWorkflow(mockWorkflow);
                }}
              />
            </div>
          )}

          {activeTab === "execution" && (
            <div className="space-y-6 animate-fadeIn">
              <ExecutionConsole
                selectedWorkflow={selectedWorkflow}
                executing={executing}
                executionLogs={executionLogs}
                metrics={executionMetrics}
                quantale={quantale}
                onExecute={() => handleExecuteWorkflow(selectedWorkflow)}
              />

            </div>
          )}

          {activeTab === "result" && (
            <div className="animate-fadeIn">
              <ResultViewer finalResult={finalResult} workflow={selectedWorkflow} topic={goal} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
















