from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.workflow import workflow_router
from api.execution import execution_router

app = FastAPI(
    title="QuantFlow API",
    description="Mathematical Content Pipeline Planner & Executor",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(workflow_router)
app.include_router(execution_router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
