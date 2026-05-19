import time
import os
from dotenv import load_dotenv
from groq import Groq

from .mock_service import (
    research as mock_research,
    structure as mock_structure,
    draft as mock_draft,
    refine as mock_refine,
    publish as mock_publish
)
from quantale.quantflow import build_quantflow_quantale
from planner.workflow_builder import effective_stage

# Initialize quantale object
q = build_quantflow_quantale()

# Load env variables from backend/.env
dotenv_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env")
load_dotenv(dotenv_path)

api_key = os.getenv("groq_api")
client = None
if api_key:
    try:
        client = Groq(api_key=api_key)
    except Exception as e:
        print(f"Error initializing Groq client: {e}")

def run_groq_completion(prompt: str, system_prompt: str = "You are a helpful AI content writer. Return only the requested content without any conversational filler or intro/outro commentary.") -> str:
    """Helper to run a Chat Completion using Groq llama-3.1-8b-instant."""
    if not client:
        raise ValueError("Groq client not initialized")
        
    completion = client.chat.completions.create(
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": prompt}
        ],
        model="llama-3.1-8b-instant",
        temperature=0.7,
        max_tokens=2048
    )
    result = completion.choices[0].message.content.strip()
    if not result:
        raise ValueError("Empty response from Groq")
    return result

# SEQUENTIAL AI PIPELINE STEPS

def ai_research(topic: str) -> str:
    print(f"\n[AI Research] Gathering information about: {topic}")
    if not client:
        return mock_research(topic)
    try:
        prompt = f"Generate a detailed research brief on the topic: '{topic}'. Focus on key concepts, historical context, modern applications, and future outlook. Use bullet points."
        return run_groq_completion(prompt, "You are an expert research assistant. Return only the structured research notes.")
    except Exception as e:
        print(f"AI Research failed: {e}. Falling back to mock service.")
        return mock_research(topic)

def ai_structure(research_notes: str) -> str:
    print("\n[AI Structure] Organizing outline and ideas")
    if not client:
        return mock_structure(research_notes)
    try:
        prompt = f"Organize the following research findings into a structured, logical article outline. Group related points under clear markdown headings (Introduction, Core Concepts, Analysis, Conclusion) and add brief sub-bullet points for what each section will cover:\n\n{research_notes}"
        return run_groq_completion(prompt, "You are a professional content architect. Return only the markdown outline.")
    except Exception as e:
        print(f"AI Structure failed: {e}. Falling back to mock service.")
        return mock_structure(research_notes)

def ai_draft(outline: str) -> str:
    print("\n[AI Draft] Writing initial draft")
    if not client:
        return mock_draft(outline)
    try:
        prompt = f"Write a comprehensive, engaging article draft based on the following outline. Make the tone informative and professional. Write at least 4 detailed paragraphs:\n\n{outline}"
        return run_groq_completion(prompt, "You are a professional copywriter. Write a full draft article without headers or formatting.")
    except Exception as e:
        print(f"AI Draft failed: {e}. Falling back to mock service.")
        return mock_draft(outline)

def ai_refine(draft_content: str) -> str:
    print("\n[AI Refine] Improving clarity, flow, and style")
    if not client:
        return mock_refine(draft_content)
    try:
        prompt = f"Refine the following article draft to maximize clarity, readability, style, and flow. Polish the prose, correct any passive voice, and improve word choices while keeping the core content intact:\n\n{draft_content}"
        return run_groq_completion(prompt, "You are an editor. Return only the polished article draft.")
    except Exception as e:
        print(f"AI Refine failed: {e}. Falling back to mock service.")
        return mock_refine(draft_content)

def ai_publish(refined_content: str) -> str:
    print("\n[AI Publish] Finalizing formatting for publication")
    if not client:
        return mock_publish(refined_content)
    try:
        prompt = f"Format the following refined article into a publication-ready markdown document. Add a catchy title, a brief 2-sentence executive summary under the title, insert markdown headings, bold key concepts, and end with a conclusion section. Output only the markdown:\n\n{refined_content}"
        return run_groq_completion(prompt, "You are a digital publisher. Return only the formatted markdown document.")
    except Exception as e:
        print(f"AI Publish failed: {e}. Falling back to mock service.")
        return mock_publish(refined_content)

# Update SERVICE_MAP to route to the AI-enabled services
SERVICE_MAP = {
    "researched": ai_research,
    "structured": ai_structure,
    "drafted": ai_draft,
    "refined": ai_refine,
    "published": ai_publish
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