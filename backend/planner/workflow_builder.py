from quantale.quantflow import build_quantflow_quantale

# Initialize quantale object
q = build_quantflow_quantale()

# Predefined workflow templates
WORKFLOWS = {
    "fast": [
        "researched",
        "drafted",
        "published"
    ],
    "quality": [
        "researched",
        "structured",
        "drafted",
        "refined",
        "published"
    ],
    "balanced": [
        "researched",
        "structured",
        "drafted",
        "published"
    ]
}

def effective_stage(stages):
    """
    Computes the shared guaranteed processing stage
    across a workflow.
    """
    return q.big_meet(stages)

def safe_extension(current_stage, target_stage):
    """
    Computes the maximum safe workflow extension
    allowed under the target stage.
    """
    return q.right_residual(current_stage, target_stage)

def get_workflow_specs():
    """
    Returns available stages, standard workflow templates, Hasse cover edges,
    and bottom/top elements of the residuated quantale.
    """
    # Cover relations as list of dicts
    hasse_covers = [{"from_node": edge[0], "to_node": edge[1]} for edge in q.hasse_edges()]
    
    # All stages sorted by chain order: raw < researched < structured < drafted < refined < published
    stages = []
    curr = q.bottom
    stages.append(curr)
    
    covers = dict(q.hasse_edges())
    while curr in covers:
        curr = covers[curr]
        stages.append(curr)

    return {
        "stages": stages,
        "templates": WORKFLOWS,
        "bottom": q.bottom,
        "top": q.top,
        "hasseCovers": hasse_covers,
        "quantaleProperties": {
            "is_commutative": q.is_commutative(),
            "is_idempotent": q.is_idempotent(),
            "is_integral": q.is_integral()
        }
    }

def analyze_custom_workflow(steps: list[str], target_stage: str = "published") -> dict:
    """
    Analyzes a sequence of stages to compute its effective processing level,
    compares it with predefined templates, and calculates safe extensions.
    """
    # Compute effective stage
    eff_stage = effective_stage(steps) if steps else q.top
    
    # Check if steps are ordered in a valid processing chain (increasing/non-decreasing)
    is_valid_chain = True
    for i in range(len(steps) - 1):
        if not q.le(steps[i], steps[i+1]):
            is_valid_chain = False
            break

    # Compare with standard templates
    comparisons = {}
    for name, template in WORKFLOWS.items():
        template_eff = effective_stage(template)
        if q.le(eff_stage, template_eff) and eff_stage != template_eff:
            comparisons[name] = f"Less refined than {name}"
        elif q.le(template_eff, eff_stage) and eff_stage != template_eff:
            comparisons[name] = f"More refined than {name}"
        elif eff_stage == template_eff:
            comparisons[name] = f"Equivalently refined to {name}"
        else:
            comparisons[name] = f"Incomparable to {name}"

    # Compute residuals
    residuals = {}
    for s in q.base:
        residuals[s] = safe_extension(s, target_stage)

    return {
        "steps": steps,
        "effectiveStage": eff_stage,
        "comparisons": comparisons,
        "residuals": residuals,
        "isValidChain": is_valid_chain
    }

# Compare Two Workflows (legacy CLI helper)
def compare_workflows(name_a, name_b):
    workflow_a = WORKFLOWS[name_a]
    workflow_b = WORKFLOWS[name_b]

    stage_a = effective_stage(workflow_a)
    stage_b = effective_stage(workflow_b)

    print(f"\n{name_a} workflow stage: {stage_a}")
    print(f"{name_b} workflow stage: {stage_b}")

    if q.le(stage_a, stage_b):
        print(f"{name_a} is less refined than {name_b}")
    elif q.le(stage_b, stage_a):
        print(f"{name_b} is less refined than {name_a}")
    else:
        print("Workflows are incomparable")