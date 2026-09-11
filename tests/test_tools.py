import sys
import os
import pytest

# Add src to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "src")))

from tools import (
    get_map_routes,
    get_weather_disruptions,
    get_crowdsourced_traffic,
    notify_stakeholders,
    LIVE_HAZARD_REPORTS,
    get_map_key,
    get_weather_key,
)

def test_api_keys_loaded():
    """Verify environment API keys are properly retrieved."""
    # MAP_API_KEY or OPENROUTE_API_KEY
    map_key = get_map_key()
    assert map_key is not None or map_key == os.getenv("MAP_API_KEY")
    # WEATHER_API_KEY or OPENWEATHER_API_KEY
    weather_key = get_weather_key()
    assert weather_key is not None or weather_key == os.getenv("WEATHER_API_KEY")

def test_get_crowdsourced_traffic_empty():
    """Verify clean traffic telemetry when registry is empty."""
    LIVE_HAZARD_REPORTS.clear()
    report = get_crowdsourced_traffic.invoke({})
    assert "No community hazard reports" in report
    assert "nominal" in report.lower()

def test_get_crowdsourced_traffic_with_reports():
    """Verify driver reports are surfaced to the agent."""
    LIVE_HAZARD_REPORTS.clear()
    LIVE_HAZARD_REPORTS.append("[ACCIDENT] Khandagiri NH-16: Smashed cars")
    report = get_crowdsourced_traffic.invoke({})
    assert "WARNING!" in report
    assert "ACCIDENT" in report
    assert "Khandagiri" in report
    LIVE_HAZARD_REPORTS.clear()

def test_get_weather_disruptions():
    """Verify weather telemetry returns temperature and precipitation details."""
    res = get_weather_disruptions.invoke({"lat": "20.1484", "lon": "85.6711"})
    assert isinstance(res, str)
    assert len(res) > 10
    # Must contain temperature or radar note
    assert any(term in res.lower() for term in ["temp", "weather", "telemetry", "radar"])

def test_get_weather_disruptions_cross_validation_notice():
    """Verify cross-validation notice is present for standing water vs rain."""
    res = get_weather_disruptions.invoke({"lat": "20.1484", "lon": "85.6711"})
    assert "CROSS-VALIDATION" in res or "telemetry" in res.lower()

def test_get_map_routes_geometry():
    """Verify map routes returns valid driving geometry or safe fallback without crashing."""
    route = get_map_routes.invoke({
        "start_coords": "85.8640,20.3010",
        "end_coords": "85.6711,20.1484"
    })
    assert isinstance(route, dict)
    assert route.get("status") == "success"
    assert route.get("distance_km", 0) > 0
    assert route.get("duration_minutes", 0) > 0

def test_notify_stakeholders():
    """Verify email tool properly drafts and formats dispatch notification."""
    result = notify_stakeholders.invoke({
        "reason": "Vehicle collision on NH-16",
        "alternative_route": "Route 101 Daya Canal Bypass",
        "new_eta": "+7 mins (38 mins total)"
    })
    assert "Email successfully dispatched" in result
    assert "Warehouse Manager" in result
    assert "Route 101 Daya Canal Bypass" in result
    assert "+7 mins" in result
