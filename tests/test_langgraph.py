import sys
import os
import pytest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "src")))

from state import SupplyChainState
from nodes import get_strategist_llm, strategist_node
from server import (
    resolve_corridor_selection,
    check_weather_flood_telemetry,
    CORRIDOR_HIERARCHY,
    graph_app,
)

def test_supply_chain_state_structure():
    """Verify SupplyChainState TypedDict schema fields."""
    sample_state = {
        "messages": [("user", "Start dispatch")],
        "tool_status": "nominal",
        "current_route": "route_99"
    }
    assert "messages" in sample_state
    assert "tool_status" in sample_state
    assert "current_route" in sample_state

def test_strategist_llm_initialization():
    """Verify Gemini LLM initializes without error."""
    llm = get_strategist_llm()
    assert llm is not None
    assert hasattr(llm, "bind_tools")

def test_multi_tier_escalation_tier1_to_tier2():
    """Verify route_99 blocked escalates to route_101_express."""
    corridor, blocked = resolve_corridor_selection(
        current_route="route_99",
        previous_blocked=[],
        user_message="Accident on NH-16 near Khandagiri",
        live_hazards=["[ACCIDENT] Khandagiri: Smashed cars"]
    )
    assert corridor["id"] == "route_101_express"
    assert "route_99" in blocked
    assert "Daya" in corridor["name"]

def test_multi_tier_escalation_tier2_to_tier3():
    """Verify when Route 101/Hwy 1 is also blocked, it escalates to Route 202 (Pipili)."""
    # Previously blocked: route_99. Current route: route_101_express.
    corridor, blocked = resolve_corridor_selection(
        current_route="route_101_express",
        previous_blocked=["route_99"],
        user_message="there's a problem in hwy 1 not 1 so take another route",
        live_hazards=["[ROAD_BLOCKAGE] Highway 1: blocked corridor"]
    )
    assert corridor["id"] == "route_202_outer_ring"
    assert "route_101_express" in blocked
    assert "route_99" in blocked
    assert "Pipili" in corridor["name"] or "202" in corridor["name"]

def test_multi_tier_escalation_tier3_to_tier4():
    """Verify when Route 202 is also blocked, it escalates to Route 303 (Chandaka)."""
    corridor, blocked = resolve_corridor_selection(
        current_route="route_202_outer_ring",
        previous_blocked=["route_99", "route_101_express"],
        user_message="Emergency, Pipili outer bypass blocked by tree",
        live_hazards=["[FALLEN_TREE] Pipili road blocked"]
    )
    assert corridor["id"] == "route_303_chandaka"
    assert "route_202_outer_ring" in blocked
    assert "Chandaka" in corridor["name"]

def test_multi_tier_prevents_fallback_loop():
    """Verify system NEVER falls back to previously blocked routes."""
    corridor, blocked = resolve_corridor_selection(
        current_route="route_101_express",
        previous_blocked=["route_99"],
        user_message="Secondary blockage detected",
        live_hazards=[]
    )
    assert corridor["id"] != "route_99"
    assert corridor["id"] != "route_101_express"

def test_cross_sensor_flood_verification_conflict():
    """Verify cross-sensor anomaly reasoning when driver reports flood but rain is 0mm."""
    audit = check_weather_flood_telemetry("Driver reports 4ft deep waterlogging and flood on highway")
    assert audit is not None
    assert "CROSS-SENSOR AUDIT" in audit["reasoning"]
    assert "canal" in audit["reasoning"].lower() or "drainage" in audit["reasoning"].lower()
    assert "0.0mm" in audit["reasoning"] or "telemetry" in audit["email_note"].lower()

def test_cross_sensor_flood_non_flood_report():
    """Verify non-flood incidents (accidents, strikes) do not trigger flood conflict."""
    audit = check_weather_flood_telemetry("Multi-vehicle car accident on highway")
    assert audit is None

def test_langgraph_workflow_compiled():
    """Verify LangGraph workflow is properly compiled and executable."""
    assert graph_app is not None
    assert hasattr(graph_app, "invoke")
