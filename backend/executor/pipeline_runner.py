from .mock_service import (
    research,
    structure,
    draft,
    refine,
    publish
)


SERVICE_MAP = {

    "researched": research,
    "structured": structure,
    "drafted": draft,
    "refined": refine,
    "published": publish
}


def execute_workflow(workflow_name, workflow_steps, topic):

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