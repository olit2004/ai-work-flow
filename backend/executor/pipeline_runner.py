import time
from .mock_service import (
    research,
    structure,
    draft,
    refine,
    publish
)
from quantale.quantflow import build_quantflow_quantale
from planner.workflow_builder import effective_stage

# Initialize quantale object
q = build_quantflow_quantale()

SERVICE_MAP = {
    "researched": research,
    "structured": structure,
    "drafted": draft,
    "refined": refine,
    "published": publish
}

def execute_workflow(workflow_name, workflow_steps, topic):
    """Legacy CLI execution wrapper."""
    print("=" * 60)
    print(f"Executing workflow: {workflow_name}")
    print("=" * 60)

    data = topic
    for step in workflow_steps:
        service = SERVICE_MAP.get(step)
        if service:
            data = service(data)

    print("\nExecution complete.")
    return data

def run_executor_pipeline(workflow_name: str, steps: list[str], topic: str) -> dict:
    """Executes the pipeline steps sequentially and returns structured metrics and outputs."""
    steps_results = []
    current_data = topic
    
    start_time = time.time()
    for step in steps:
        service = SERVICE_MAP.get(step)
        if not service:
            continue
            
        step_start = time.time()
        try:
            current_data = service(current_data)
            status = "success"
        except Exception as e:
            status = "error"
            current_data = f"Error during {step}: {str(e)}"
            
        step_duration = round(time.time() - step_start, 2)
        
        steps_results.append({
            "step": step,
            "status": status,
            "output": current_data,
            "duration": step_duration
        })
        
        if status == "error":
            break

    total_duration = round(time.time() - start_time, 2)
    eff_stage = effective_stage(steps) if steps else q.top
    
    safety_rating = "High" if q.le("structured", eff_stage) else "Low (unstructured)"
    
    metrics = {
        "effectiveStage": eff_stage,
        "totalSteps": len(steps),
        "totalDuration": total_duration,
        "safetyRating": safety_rating
    }

    return {
        "workflowName": workflow_name,
        "topic": topic,
        "steps": steps_results,
        "finalResult": current_data,
        "metrics": metrics
    }