import os
import requests
from langchain_core.tools import tool
from dotenv import load_dotenv

load_dotenv()

# In-memory database to store live reports from the phone/website
LIVE_HAZARD_REPORTS = []

# Support both OPENROUTE_API_KEY and MAP_API_KEY from .env
def get_map_key():
    return os.getenv("OPENROUTE_API_KEY") or os.getenv("MAP_API_KEY")

# Support both OPENWEATHER_API_KEY and WEATHER_API_KEY from .env
def get_weather_key():
    return os.getenv("OPENWEATHER_API_KEY") or os.getenv("WEATHER_API_KEY")

@tool
def get_map_routes(start_coords: str, end_coords: str) -> dict:
    """
    Fetches real driving routes using OpenRouteService.
    Input coordinates as 'longitude,latitude' (e.g. '85.8640,20.3010').
    """
    api_key = get_map_key()
    headers = {
        'Accept': 'application/json, application/geo+json',
        'Authorization': api_key
    }
    url = f"https://api.openrouteservice.org/v2/directions/driving-car?api_key={api_key}&start={start_coords}&end={end_coords}"
    
    try:
        response = requests.get(url, headers=headers, timeout=8)
        if response.status_code == 200:
            data = response.json()
            summary = data['features'][0]['properties']['summary']
            # Coordinates in [lat, lon] for Leaflet map display
            raw_coords = data['features'][0]['geometry']['coordinates']
            leaflet_coords = [[pt[1], pt[0]] for pt in raw_coords]
            return {
                "status": "success",
                "distance_meters": summary['distance'],
                "distance_km": round(summary['distance'] / 1000, 2),
                "duration_seconds": summary['duration'],
                "duration_minutes": round(summary['duration'] / 60, 1),
                "polyline": leaflet_coords
            }
        else:
            return {"status": "error", "message": f"Failed to fetch route. Code: {response.status_code}"}
    except Exception as e:
        return {"status": "error", "message": str(e)}

@tool
def get_weather_disruptions(lat: str, lon: str) -> str:
    """
    Checks the OpenWeatherMap API for severe weather at the given coordinates.
    """
    api_key = get_weather_key()
    url = f"https://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&appid={api_key}&units=metric"
    
    try:
        response = requests.get(url, timeout=5)
        if response.status_code == 200:
            data = response.json()
            weather_desc = data['weather'][0]['description']
            temp = data['main']['temp']
            humidity = data['main']['humidity']
            return f"Current weather at ({lat}, {lon}): {weather_desc}, Temp: {temp}°C, Humidity: {humidity}%"
        return "Weather data unavailable."
    except Exception as e:
        return f"Weather API error: {str(e)}"

@tool
def get_crowdsourced_traffic() -> str:
    """
    Checks the live database for unstructured driver reports (e.g., strikes, accidents, floods).
    """
    if not LIVE_HAZARD_REPORTS:
        return "No community hazard reports at this time. All corridors reported nominal."
    
    # Return all active reports for the AI to analyze
    return "WARNING! Active crowdsourced driver reports: " + " | ".join(LIVE_HAZARD_REPORTS)

@tool
def notify_stakeholders(reason: str, new_eta: str, alternative_route: str) -> str:
    """
    Autonomously drafts and sends an email to the warehouse manager and the shipping client 
    explaining the delay and the new route.
    """
    email_body = (
        f"\n=======================================================\n"
        f"🚨 URGENT AUTOMATED DISPATCH NOTIFICATION\n"
        f"To: warehouse.manager@odisha-logistics.com, client.relations@iitbbs.ac.in\n"
        f"From: autonomous-agent@nexus-supply-chain.ai\n"
        f"Subject: Immediate Route Divert: Consignment En Route to IIT Bhubaneswar\n"
        f"-------------------------------------------------------\n"
        f"Reason for Reroute: {reason}\n"
        f"Corridor Action: Diverting carrier fleet via {alternative_route}.\n"
        f"Updated ETA: {new_eta}\n"
        f"Safety Protocol: Autonomous resolution verified by LangGraph Strategist Core.\n"
        f"=======================================================\n"
    )
    print("\n[MOCK EMAIL SENT] -> warehouse@odisha-logistics.com, client@iitbbs.ac.in")
    print(email_body)
    return f"Email successfully dispatched to stakeholders: Warehouse Manager and Client. New ETA: {new_eta} via {alternative_route}."