from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any
from executor.pipeline_runner import run_executor_pipeline, q

execution_router = APIRouter()

class ExecuteRequest(BaseModel):
    workflowName: str
    steps: List[str]
    topic: str

class StepResult(BaseModel):
    step: str
    status: str
    output: str
    duration: float

class ExecuteResponse(BaseModel):
    workflowName: str
    topic: str
    steps: List[StepResult]
    finalResult: str
    metrics: Dict[str, Any]

@execution_router.post("/api/execute", response_model=ExecuteResponse)
async def execute(req: ExecuteRequest):
    # Validate stages
    for step in req.steps:
        if step not in q.base:
            raise HTTPException(status_code=400, detail=f"Invalid stage name: {step}")
            
    return run_executor_pipeline(req.workflowName, req.steps, req.topic)
