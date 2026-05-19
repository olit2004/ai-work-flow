from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict
from planner.workflow_builder import get_workflow_specs, analyze_custom_workflow, q, WORKFLOWS

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

class RecommendRequest(BaseModel):
    goal: str
    quality: int  # 1 to 5
    speed: int    # 1 to 5
    cost: int     # 1 to 5

class RecommendResponse(BaseModel):
    name: str
    key: str
    steps: List[str]
    quality: str
    speed: str
    cost: str
    estimatedCost: str
    refinementDepth: int
    matchScore: int
    effectiveStage: str
    residuals: Dict[str, str]

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

@workflow_router.post("/api/recommend", response_model=List[RecommendResponse])
async def recommend(req: RecommendRequest):
    # QuantFlow pre-defined workflows with metadata profiles
    templates_meta = [
        {
            "name": "Fast Workflow",
            "key": "fast",
            "steps": WORKFLOWS["fast"],
            "quality": "Low",
            "speed": "Fast",
            "cost": "Low",
            "estimatedCost": "$0.02",
            "refinementDepth": 3,
            "profile": {"quality": 2, "speed": 5, "cost": 2}
        },
        {
            "name": "Balanced Workflow",
            "key": "balanced",
            "steps": WORKFLOWS["balanced"],
            "quality": "Medium",
            "speed": "Medium",
            "cost": "Medium",
            "estimatedCost": "$0.04",
            "refinementDepth": 4,
            "profile": {"quality": 4, "speed": 3, "cost": 3}
        },
        {
            "name": "High-Quality Workflow",
            "key": "quality",
            "steps": WORKFLOWS["quality"],
            "quality": "High",
            "speed": "Slow",
            "cost": "High",
            "estimatedCost": "$0.06",
            "refinementDepth": 5,
            "profile": {"quality": 5, "speed": 2, "cost": 5}
        }
    ]
    
    recommendations = []
    for t in templates_meta:
        # Calculate matching score using Manhattan distance
        diff_q = abs(t["profile"]["quality"] - req.quality)
        diff_s = abs(t["profile"]["speed"] - req.speed)
        diff_c = abs(t["profile"]["cost"] - req.cost)
        total_diff = diff_q + diff_s + diff_c
        
        # Max possible difference: (5-2) + (5-2) + (5-2) = 9
        match_percentage = int(max(0, (1 - total_diff / 9.0) * 100))
        
        # Analyze workflow to fetch effective stage and residuals
        analysis = analyze_custom_workflow(t["steps"])
        
        recommendations.append({
            "name": t["name"],
            "key": t["key"],
            "steps": t["steps"],
            "quality": t["quality"],
            "speed": t["speed"],
            "cost": t["cost"],
            "estimatedCost": t["estimatedCost"],
            "refinementDepth": t["refinementDepth"],
            "matchScore": match_percentage,
            "effectiveStage": analysis["effectiveStage"],
            "residuals": analysis["residuals"]
        })
    
    # Sort recommendations by matchScore descending
    recommendations.sort(key=lambda x: x["matchScore"], reverse=True)
    return recommendations

