import sys
import os
import pytest
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "src")))

from server import app
from tools import LIVE_HAZARD_REPORTS

client = TestClient(app)

def setup_function():
    """Reset live hazard registry before each test."""
    LIVE_HAZARD_REPORTS.clear()

def teardown_function():
    LIVE_HAZARD_REPORTS.clear()

def test_health_check_endpoint():
    """Verify health endpoint returns 200 and expected status."""
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["service"] == "agentic-supply-chain"
    assert "IIT Bhubaneswar Logistics Hub" in data["location"]

def test_weather_endpoint():
    """Verify live weather endpoint returns realistic temperature and humidity."""
    response = client.get("/api/weather?lat=20.1484&lon=85.6711")
    assert response.status_code == 200
    data = response.json()
    assert "temp_c" in data
    assert "weather" in data
    assert data["temp_c"] > 0

def test_routes_directions_endpoint():
    """Verify OpenRouteService highway directions calculation."""
    payload = {
        "start": [20.3010, 85.8640],
        "dest": [20.1484, 85.6711]
    }
    response = client.post("/api/routes/directions", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["distance_km"] > 10
    assert data["duration_min"] > 5
    assert len(data["polyline"]) > 1

def test_report_hazard_endpoint():
    """Verify standard hazard webhook logs reports properly."""
    payload = {
        "location": "Khandagiri Junction NH-16",
        "description": "Farmers union protest blocking all 4 lanes"
    }
    response = client.post("/api/report_hazard", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert len(data["active_reports"]) == 1
    assert "Khandagiri" in data["active_reports"][0]

def test_report_hazard_voice_accident():
    """Verify voice report parses accidents accurately without defaulting to flood."""
    payload = {
        "raw_transcript": "Emergency dispatch! Major multi-vehicle car accident on NH-16 near Khandagiri, lanes blocked!"
    }
    response = client.post("/api/report_hazard_voice", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    parsed = data["parsed"]
    assert parsed["incident_type"] in ["ACCIDENT", "VEHICLE_COLLISION"]
    assert "accident" in parsed["description"].lower() or "collision" in parsed["description"].lower()

def test_report_hazard_voice_tree_wood():
    """Verify voice report parses fallen trees/wood accurately."""
    payload = {
        "raw_transcript": "Heavy storm knocked down big trees and wood logs blocking the road at Khandagiri"
    }
    response = client.post("/api/report_hazard_voice", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    parsed = data["parsed"]
    assert parsed["incident_type"] == "FALLEN_TREE_WOOD"

def test_report_hazard_voice_flood():
    """Verify voice report parses flood and waterlogging accurately."""
    payload = {
        "raw_transcript": "Severe 4ft monsoon flash flood and waterlogging, all trucks submerged"
    }
    response = client.post("/api/report_hazard_voice", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    parsed = data["parsed"]
    assert parsed["incident_type"] == "WATERLOGGING_FLOOD"

def test_hazards_get_and_delete():
    """Verify hazard registry inspection and clearing endpoints."""
    # 1. Post a hazard
    client.post("/api/report_hazard", json={"location": "Pitapalli", "description": "Road damage"})
    # 2. Get hazards
    res_get = client.get("/api/hazards")
    assert res_get.status_code == 200
    assert res_get.json()["count"] == 1
    # 3. Clear hazards
    res_del = client.delete("/api/hazards")
    assert res_del.status_code == 200
    assert res_del.json()["reports"] == []
    # 4. Verify empty
    res_check = client.get("/api/hazards")
    assert res_check.json()["count"] == 0

def test_orchestrate_nominal_route():
    """Verify initial baseline route calculation without disruption."""
    payload = {
        "messages": [{"role": "user", "content": "Compute nominal logistics corridor"}],
        "state": {
            "current_route": "route_99",
            "start_point": {"name": "Bhubaneswar Depot", "coords": [20.301, 85.864]},
            "destination": {"name": "IIT BBS", "coords": [20.1484, 85.6711]},
        }
    }
    response = client.post("/api/orchestrate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ROUTE_CONFIRMED"
    assert data["final_route"] == "route_99"
    assert len(data["agent_steps"]) > 0

def test_orchestrate_disrupted_reroute():
    """Verify autonomous reroute and stakeholder email when corridor is blocked."""
    # Inject hazard
    client.post("/api/report_hazard", json={"location": "Khandagiri", "description": "Crash on highway"})
    payload = {
        "messages": [{"role": "user", "content": "Emergency reroute: Road blocked"}],
        "state": {
            "current_route": "route_99",
            "start_point": {"name": "Bhubaneswar Depot", "coords": [20.301, 85.864]},
            "destination": {"name": "IIT BBS", "coords": [20.1484, 85.6711]},
        }
    }
    response = client.post("/api/orchestrate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "REROUTED_SUCCESSFULLY"
    assert data["final_route"] == "route_101_express"
    assert data["email_dispatched"] is not None
    assert "warehouse.manager" in data["email_dispatched"]["to"]
    assert "Daya" in data["email_dispatched"]["alternative_route"]
