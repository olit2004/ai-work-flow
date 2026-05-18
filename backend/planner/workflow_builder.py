from quantale.quantflow import build_quantflow_quantale


q = build_quantflow_quantale()



# Available Workflow Templates

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



# Compute Effective Workflow Stage


def effective_stage(stages):

    """
    Computes the shared guaranteed processing stage
    across a workflow.
    """

    return q.big_meet(stages)



# Compare Two Workflows


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


# Residual-Based Safe Extension


def safe_extension(current_stage, target_stage):

    """
    Computes the maximum safe workflow extension
    allowed under the target stage.
    """

    return q.right_residual(current_stage, target_stage)



# Demo


if __name__ == "__main__":

    print("=" * 60)
    print("QuantFlow Workflow Planner")
    print("=" * 60)

    for name, workflow in WORKFLOWS.items():

        stage = effective_stage(workflow)

        print(f"\n{name} workflow:")
        print(workflow)

        print("effective stage:", stage)

    compare_workflows("fast", "quality")

    print("\nSafe extension examples:")

    print(
        "drafted → published =",
        safe_extension("drafted", "published")
    )

    print(
        "researched → refined =",
        safe_extension("researched", "refined")
    )