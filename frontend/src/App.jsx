import React, { useState } from "react";
import BackgroundGlow from "./components/BackgroundGlow";
import Header from "./components/Header";
import GoalForm from "./components/GoalForm";
import ConstraintPanel from "./components/ConstraintPanel";
import WorkflowCard from "./components/WorkflowCard";
import QuantaleLab from "./components/QuantaleLab";
import ExecutionConsole from "./components/ExecutionConsole";
import ResultViewer from "./components/ResultViewer";

const API_BASE_URL = "http://127.0.0.1:8000";

export default function QuantFlowDashboard() {
  const [goal, setGoal] = useState("");
  const [quality, setQuality] = useState(3);
  const [speed, setSpeed] = useState(3);
  const [cost, setCost] = useState(3);
  const [workflows, setWorkflows] = useState([]);
  const [generated, setGenerated] = useState(false);
  const [bestWorkflowKey, setBestWorkflowKey] = useState(null);
  const [selectedWorkflow, setSelectedWorkflow] = useState(null);
  const [executionLogs, setExecutionLogs] = useState([]);
  const [finalResult, setFinalResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [executing, setExecuting] = useState(false);

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

      const best = data.reduce((bestSoFar, wf) => {
        if (!bestSoFar) return wf;
        return Number(wf.matchScore) > Number(bestSoFar.matchScore)
          ? wf
          : bestSoFar;
      }, null);

      setWorkflows(data);
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
      fetchRecommendations();
    }
  };

  const handleExecuteWorkflow = async (workflow) => {
    if (!goal.trim() || !workflow) return;
    setSelectedWorkflow(workflow);

    try {
      setExecuting(true);
      setExecutionLogs([]);
      setFinalResult("");

      setExecutionLogs((logs) => [
        ...logs,
        `[Workflow] Starting ${workflow.name}...`,
      ]);

      const response = await fetch(`${API_BASE_URL}/api/execute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workflowName: workflow.key,
          steps: workflow.steps,
          topic: goal,
        }),
      });

      if (!response.ok) throw new Error("Execution failed");

      const result = await response.json();

      result.steps.forEach((step) => {
        setExecutionLogs((logs) => [
          ...logs,
          `[${step.step}] ${step.output.substring(0, 50)}...`,
        ]);
      });

      setFinalResult(result.finalResult);
      setExecutionLogs((logs) => [
        ...logs,
        `[Complete] Workflow execution finished successfully.`,
      ]);
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
    <div className="min-h-screen bg-orange-50 text-slate-900">
      {/* BackgroundGlow is rendered but returns null */}
      <BackgroundGlow />

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-8 py-10">
        
        {/* Header */}
        <Header />

        {/* Goal Input Form */}
        <GoalForm
          goal={goal}
          setGoal={setGoal}
          loading={loading}
          onSubmit={handleGenerateClick}
        />

        {/* Constraints Controls */}
        <ConstraintPanel
          quality={quality}
          setQuality={setQuality}
          speed={speed}
          setSpeed={setSpeed}
          cost={cost}
          setCost={setCost}
        />

        {/* Recommended Workflows Section */}
        <div className="mt-12">
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-bold text-slate-900">
              Recommended Workflows
            </h2>

            <button className="text-orange-600 font-medium cursor-pointer">
              View All
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
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
              <div className="col-span-1 md:col-span-3 text-center py-12 text-slate-500">
                {generated
                  ? "No workflows were returned. Try different constraints or reload."
                  : "Click Generate to fetch recommended workflows from the backend."}
              </div>
            )}
          </div>
        </div>

        {/* Quantale Sandbox Laboratory */}
        <QuantaleLab />

        {/* Execution Console */}
        <ExecutionConsole
          selectedWorkflow={selectedWorkflow}
          executing={executing}
          executionLogs={executionLogs}
          onExecute={() => handleExecuteWorkflow(selectedWorkflow)}
        />

        {/* Result Viewer */}
        <ResultViewer finalResult={finalResult} />

      </div>
    </div>
  );
}