from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import os

# Import your compiled LangGraph app
from main import app as agent_app

app = FastAPI(title="Agentic Supply Chain Orchestrator")

# Allow the Vite frontend (port 5173) to talk to this backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class RouteRequest(BaseModel):
    start_point: str
    end_point: str

@app.post("/api/orchestrate")
async def orchestrate_route(request: RouteRequest):
    try:
        # Formulate the initial prompt for the Strategist Agent
        initial_prompt = (
            f"Calculate the safest and most efficient cargo route from {request.start_point} "
            f"to {request.end_point}. You must check the maps, the weather, and real-time "
            f"driver community reports before finalizing the decision."
        )
        
        # Trigger the LangGraph state machine
        inputs = {"messages": [("user", initial_prompt)]}
        result = agent_app.invoke(inputs)
        
        # Extract the AI's final response
        final_message = result["messages"][-1].content
        
        return {"status": "success", "agent_response": final_message}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))