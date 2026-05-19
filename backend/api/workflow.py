from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict
from planner.workflow_builder import get_workflow_specs, analyze_custom_workflow, q

workflow_router = APIRouter()

class AnalyzeRequest(BaseModel):
    steps: List[str]
    targetStage: Optional[str] = "published"

class AnalyzeResponse(BaseModel):
    steps: List[str]
    effectiveStage: str
    comparisons: Dict[str, str]
    residuals: Dict[str, str]
    isValidChain: bool

@workflow_router.get("/api/workflow-specs")
async def specs():
    return get_workflow_specs()

@workflow_router.post("/api/analyze", response_model=AnalyzeResponse)
async def analyze(req: AnalyzeRequest):
    # Validate that all requested stages exist in the quantale base
    for step in req.steps:
        if step not in q.base:
            raise HTTPException(status_code=400, detail=f"Invalid stage name: {step}")
            
    if req.targetStage not in q.base:
        raise HTTPException(status_code=400, detail=f"Invalid target stage name: {req.targetStage}")

    return analyze_custom_workflow(req.steps, req.targetStage)
