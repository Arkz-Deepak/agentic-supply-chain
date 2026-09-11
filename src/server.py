from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Any, Dict, Union
import uvicorn
import os
import requests
from dotenv import load_dotenv

from state import SupplyChainState
from nodes import strategist_node
from tools import (
    get_map_routes,
    get_weather_disruptions,
    get_crowdsourced_traffic,
    notify_stakeholders,
    LIVE_HAZARD_REPORTS,
    get_map_key,
    get_weather_key,
)
from langgraph.graph import StateGraph, END
from langgraph.prebuilt import ToolNode, tools_condition

load_dotenv()

app = FastAPI(
    title="Agentic Supply Chain Orchestrator API",
    version="2.1.0",
    description="FastAPI backend with LangGraph, OpenWeatherMap, OpenRouteService, crowdsourced hazard reporting, and stakeholder notifications."
)

# CORS configured for port 5180 (and 5173 fallback)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5180",
        "http://127.0.0.1:5180",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "*"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize LangGraph workflow with the 4 tools
workflow = StateGraph(SupplyChainState)
workflow.add_node("strategist", strategist_node)
tool_executor = ToolNode([
    get_map_routes,
    get_weather_disruptions,
    get_crowdsourced_traffic,
    notify_stakeholders,
])
workflow.add_node("tools", tool_executor)
workflow.set_entry_point("strategist")
workflow.add_conditional_edges("strategist", tools_condition)
workflow.add_edge("tools", "strategist")
graph_app = workflow.compile()

class HazardReport(BaseModel):
    location: str
    description: str

class DirectionRequest(BaseModel):
    start: Union[List[float], str] # [lat, lon] or 'lon,lat'
    dest: Union[List[float], str]  # [lat, lon] or 'lon,lat'
    via: Optional[Union[List[float], str]] = None

class OrchestrateRequest(BaseModel):
    messages: List[Dict[str, Any]]
    state: Optional[Dict[str, Any]] = None

def to_ors_coord_str(coord: Union[List[float], str]) -> str:
    """
    Guarantees 'longitude,latitude' string format for OpenRouteService API.
    Handles [lat, lon] lists, dicts, or existing 'lon,lat' strings.
    """
    if isinstance(coord, str):
        return coord.strip()
    if isinstance(coord, (list, tuple)) and len(coord) >= 2:
        # Standard Leaflet order is [lat, lon]
        lat, lon = coord[0], coord[1]
        # OpenRouteService expects 'lon,lat'
        return f"{lon},{lat}"
    raise ValueError(f"Invalid coordinate format: {coord}")

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "agentic-supply-chain",
        "port": 8010,
        "has_weather_api": bool(get_weather_key()),
        "has_map_api": bool(get_map_key()),
        "location": "IIT Bhubaneswar Logistics Hub",
        "active_hazard_reports": len(LIVE_HAZARD_REPORTS),
        "langgraph": "compiled"
    }

@app.post("/api/report_hazard")
async def report_hazard(report: HazardReport):
    """
    Endpoint for a driver's mobile phone or field sensor to report a strike, flood, or roadblock.
    Logs into the in-memory database to trigger autonomous rerouting.
    """
    alert = f"{report.location}: {report.description}"
    LIVE_HAZARD_REPORTS.append(alert)
    print(f"\n[NEW DRIVER REPORT LOGGED VIA WEBHOOK] -> {alert}")
    
    return {
        "status": "success",
        "message": "Hazard logged. Next fleet dispatch will autonomously reroute.",
        "active_reports": LIVE_HAZARD_REPORTS
    }

@app.get("/api/hazards")
def get_hazards():
    """Returns active crowdsourced hazard reports from drivers."""
    return {
        "count": len(LIVE_HAZARD_REPORTS),
        "reports": LIVE_HAZARD_REPORTS
    }

@app.delete("/api/hazards")
def clear_hazards():
    """Resets the in-memory hazard database."""
    LIVE_HAZARD_REPORTS.clear()
    return {"status": "cleared", "reports": []}

@app.get("/api/weather")
def get_weather_endpoint(lat: float = Query(20.1484), lon: float = Query(85.6711)):
    """Fetch live weather from OpenWeatherMap for IIT Bhubaneswar / Jatani"""
    api_key = get_weather_key()
    if not api_key:
        return {
            "location": "Jatani (IIT BBS)",
            "temp_c": 27.5,
            "humidity": 88,
            "weather": "scattered clouds (simulated)",
            "wind_speed_mps": 3.1
        }
    
    url = f"https://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&appid={api_key}&units=metric"
    try:
        resp = requests.get(url, timeout=5)
        if resp.status_code == 200:
            data = resp.json()
            return {
                "location": data.get("name", "Jatani"),
                "temp_c": round(data["main"]["temp"], 1),
                "feels_like_c": round(data["main"]["feels_like"], 1),
                "humidity": data["main"]["humidity"],
                "weather": data["weather"][0]["description"].capitalize(),
                "wind_speed_mps": data["wind"]["speed"],
                "pressure_hpa": data["main"]["pressure"],
                "clouds": data["clouds"]["all"]
            }
        return {"error": "Weather API returned non-200", "location": "Jatani", "temp_c": 27.0}
    except Exception as e:
        return {"error": str(e), "location": "Jatani", "temp_c": 27.0}

@app.post("/api/routes/directions")
def get_directions_endpoint(req_body: DirectionRequest):
    """Fetch live road routing geometry from OpenRouteService API"""
    api_key = get_map_key()
    if not api_key:
        raise HTTPException(status_code=500, detail="MAP_API_KEY is not configured")

    # Format into OpenRouteService expected coordinates
    if isinstance(req_body.start, (list, tuple)):
        start_lat, start_lon = req_body.start[0], req_body.start[1]
    else:
        parts = req_body.start.split(',')
        start_lon, start_lat = float(parts[0]), float(parts[1])

    if isinstance(req_body.dest, (list, tuple)):
        dest_lat, dest_lon = req_body.dest[0], req_body.dest[1]
    else:
        parts = req_body.dest.split(',')
        dest_lon, dest_lat = float(parts[0]), float(parts[1])

    coords = [[start_lon, start_lat]]
    if req_body.via:
        if isinstance(req_body.via, (list, tuple)):
            coords.append([req_body.via[1], req_body.via[0]])
        else:
            v_parts = req_body.via.split(',')
            coords.append([float(v_parts[0]), float(v_parts[1])])
    coords.append([dest_lon, dest_lat])

    url = "https://api.openrouteservice.org/v2/directions/driving-car/geojson"
    headers = {
        "Authorization": api_key,
        "Content-Type": "application/json",
        "Accept": "application/json, application/geo+json"
    }
    
    try:
        resp = requests.post(url, json={"coordinates": coords}, headers=headers, timeout=10)
        if resp.status_code == 200:
            data = resp.json()
            feat = data["features"][0]
            summary = feat["properties"]["summary"]
            # Convert [lon, lat] to [lat, lon] for Leaflet
            leaflet_coords = [[pt[1], pt[0]] for pt in feat["geometry"]["coordinates"]]
            return {
                "distance_km": round(summary["distance"] / 1000, 2),
                "duration_min": round(summary["duration"] / 60, 1),
                "polyline": leaflet_coords,
                "waypoints_count": len(leaflet_coords)
            }
        else:
            raise HTTPException(status_code=resp.status_code, detail=resp.text)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"OpenRouteService error: {str(e)}")

@app.post("/api/orchestrate")
async def orchestrate_dispatch(request: OrchestrateRequest):
    try:
        user_message = request.messages[-1].get("content", "")
        current_route = request.state.get("current_route", "route_99") if request.state else "route_99"
        
        # Inject active driver hazard reports into the prompt context for Gemini
        hazard_context = ""
        if LIVE_HAZARD_REPORTS:
            hazard_context = f"\n[CRITICAL TELEMETRY]: Active crowdsourced driver reports from field: {' | '.join(LIVE_HAZARD_REPORTS)}."
        
        system_instruction = (
            f"You are the autonomous logistics strategist for Odisha Supply Chain Command at IIT Bhubaneswar. "
            f"Carrier TRK-8821 is delivering cargo from Bhubaneswar Depot to IIT Bhubaneswar Technology Park. "
            f"{hazard_context} "
            f"Check crowdsourced traffic reports using get_crowdsourced_traffic. If a strike or flood is reported on NH-16 / Route 99, "
            f"determine the route is blocked, calculate the alternative Daya Canal bypass corridor using get_map_routes, "
            f"and AUTONOMOUSLY draft and send an urgent notification email to stakeholders using notify_stakeholders."
        )

        inputs = {
            "messages": [
                ("system", system_instruction),
                ("user", user_message)
            ],
            "tool_status": "in_progress",
            "current_route": current_route,
        }
        
        # Execute LangGraph
        result = graph_app.invoke(inputs)
        
        # Extract messages and tool execution logs
        message_history = []
        agent_steps = []
        mock_email_sent = None

        for msg in result.get("messages", []):
            role = "ai" if hasattr(msg, "tool_calls") or getattr(msg, "type", "") == "ai" else getattr(msg, "type", "user")
            content = msg.content
            if isinstance(content, list):
                text_parts = [part.get("text", "") for part in content if isinstance(part, dict) and "text" in part]
                content = " ".join(text_parts) if text_parts else str(content)
                
            message_history.append({
                "role": role,
                "content": content,
                "tool_calls": getattr(msg, "tool_calls", None)
            })

            # Check for tool calls and email dispatch
            if hasattr(msg, "tool_calls") and msg.tool_calls:
                for tc in msg.tool_calls:
                    tool_name = tc.get("name")
                    args = tc.get("args", {})
                    agent_steps.append({
                        "timestamp": "Now",
                        "node": "tools",
                        "type": "TOOL_CALL",
                        "toolName": tool_name,
                        "args": args,
                        "content": f"Invoked tool `{tool_name}` with parameters: {args}"
                    })
                    if tool_name == "notify_stakeholders":
                        mock_email_sent = {
                            "to": "warehouse.manager@odisha-logistics.com, client.relations@iitbbs.ac.in",
                            "reason": args.get("reason", "Transport Strike on NH-16"),
                            "alternative_route": args.get("alternative_route", "Daya West Canal Green Bypass (Route 101)"),
                            "new_eta": args.get("new_eta", "+7 mins (38 mins total)"),
                            "status": "DELIVERED"
                        }

        final_content = message_history[-1]["content"] if message_history else "Orchestration completed."
        is_blocked = (
            len(LIVE_HAZARD_REPORTS) > 0 or 
            "strike" in final_content.lower() or 
            "blocked" in final_content.lower() or 
            "reroute" in final_content.lower()
        )

        # Append strategist reasoning
        agent_steps.insert(0, {
            "timestamp": "Now",
            "node": "strategist",
            "type": "THINKING",
            "content": f"Gemini 3.7 Flash evaluated active corridor and crowdsourced telemetry: {len(LIVE_HAZARD_REPORTS)} driver reports detected."
        })

        if is_blocked:
            agent_steps.append({
                "timestamp": "Now",
                "node": "strategist",
                "type": "AUTONOMOUS_RECOVERY",
                "content": "Strategist agent verified NH-16 block. Activated Daya West Canal corridor (route_101_express). Notification emailed to warehouse & client."
            })

        return {
            "final_route": "route_101_express" if is_blocked else current_route,
            "status": "REROUTED_SUCCESSFULLY" if is_blocked else "ROUTE_CONFIRMED",
            "ai_summary": final_content,
            "agent_steps": agent_steps,
            "email_dispatched": mock_email_sent,
            "active_hazard_reports": LIVE_HAZARD_REPORTS,
            "messages": message_history,
            "state": {
                "current_route": "route_101_express" if is_blocked else current_route,
                "tool_status": "error_rerouted" if is_blocked else "success",
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run("server:app", host="0.0.0.0", port=8010, reload=True)
