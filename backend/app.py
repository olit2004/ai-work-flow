from planner.workflow_builder import WORKFLOWS
from executor.pipeline_runner import execute_workflow


def main():

    topic = "Operating Systems"

    workflow_name = "quality"

    workflow = WORKFLOWS[workflow_name]

    result = execute_workflow(
        workflow_name,
        workflow,
        topic
    )

    print("\n" + "=" * 60)
    print("FINAL RESULT")
    print("=" * 60)

    print(result)


if __name__ == "__main__":
    main()