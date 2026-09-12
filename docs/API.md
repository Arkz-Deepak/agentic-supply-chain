# 📡 LogiPulse REST API Reference & Webhook Specifications

The LogiPulse FastAPI backend runs on dedicated port **`8010`**. Interactive Swagger UI documentation is available at `http://localhost:8010/docs`.

---

## 1. System Telemetry & Health

### `GET /api/health`
Returns backend health status, API key availability, and LangGraph workflow compilation state.

#### Response:
```json
{
  "status": "healthy",
  "service": "agentic-supply-chain",
  "port": 8010,
  "has_weather_api": true,
  "has_map_api": true,
  "location": "IIT Bhubaneswar Logistics Hub",
  "active_hazard_reports": 0,
  "voice_nlp": "active",
  "langgraph": "compiled"
}
```

---

## 2. Weather & Environmental Telemetry

### `GET /api/weather`
Queries live meteorological telemetry for any latitude/longitude via OpenWeatherMap.

#### Parameters:
- `lat` (float, optional): Latitude (defaults to `20.1484` or active corridor origin)
- `lon` (float, optional): Longitude (defaults to `85.6711` or active corridor origin)

#### cURL Example:
```bash
curl "http://localhost:8010/api/weather?lat=13.0838&lon=80.2980"
```

#### Response:
```json
{
  "location": "Chennai",
  "temp_c": 31.2,
  "humidity": 78,
  "weather": "Scattered clouds",
  "raw_data": {
    "coord": { "lon": 80.298, "lat": 13.0838 },
    "weather": [{ "id": 802, "main": "Clouds", "description": "scattered clouds" }],
    "main": { "temp": 31.2, "humidity": 78, "pressure": 1011 }
  }
}
```

---

## 3. Topographic Driving Directions

### `POST /api/routes/directions`
Fetches real driving geometry from OpenRouteService. If external APIs fail or are unconfigured, automatically returns a high-fidelity curved geodesic polyline.

#### Request Body:
```json
{
  "start": [13.0838, 80.2980],
  "dest": [12.8350, 79.9500],
  "via": [13.0120, 80.1150]
}
```

#### Response:
```json
{
  "status": "success",
  "distance_km": 44.8,
  "duration_min": 48.2,
  "polyline": [
    [13.0838, 80.2980],
    [13.0750, 80.2710],
    [13.0420, 80.2010],
    [12.8350, 79.9500]
  ]
}
```

---

## 4. Crowdsourced Hazard Reporting

### `POST /api/report_hazard`
Direct structured incident webhook for IoT telemetry sensors or manual reporting.

#### Request Body:
```json
{
  "location": "Maduravoyal Junction, Chennai",
  "description": "Multi-vehicle container collision blocking highway lanes",
  "severity": "CRITICAL"
}
```

---

## 5. Natural Language Voice NLP Webhook

### `POST /api/report_hazard_voice`
Accepts conversational field voice transmissions (speech-to-text) and invokes Google Gemini to extract structured incident attributes.

#### Request Body:
```json
{
  "raw_transcript": "Emergency dispatch! Major container truck accident on Chennai Port Corridor near Maduravoyal, both lanes blocked!"
}
```

#### Response:
```json
{
  "status": "success",
  "parsed": {
    "incident_type": "ACCIDENT",
    "location": "Maduravoyal, Chennai Port Corridor",
    "description": "Major container truck collision blocking both lanes",
    "severity": "CRITICAL"
  },
  "active_reports": [
    "Maduravoyal, Chennai Port Corridor: Major container truck collision blocking both lanes"
  ]
}
```

---

## 6. LangGraph Agentic Orchestrator

### `POST /api/orchestrate`
Executes the autonomous LangGraph reasoning loop across the multi-sensor toolset.

#### Request Body:
```json
{
  "start": [13.0838, 80.2980],
  "dest": [12.8350, 79.9500],
  "current_route_id": "chennai_port_arterial",
  "blocked_corridors": ["chennai_port_arterial"],
  "disruption_type": "Container truck accident near Maduravoyal",
  "prompt": "Emergency reroute required. Calculate alternative arterial corridor."
}
```

#### Response:
```json
{
  "status": "success",
  "final_route": "chennai_orr_bypass",
  "agent_steps": [
    {
      "timestamp": "21:30:15",
      "node": "strategist",
      "type": "REASONING",
      "content": "Primary arterial compromised. Evaluating Outer Ring Road (ORR Green Bypass)..."
    }
  ],
  "email_dispatched": {
    "to": "warehouse.manager@odisha-logistics.com, client.relations@iitbbs.ac.in",
    "reason": "Container truck accident near Maduravoyal",
    "alternative_route": "Chennai Outer Ring Road (ORR Green Express Bypass)",
    "new_eta": "+8 mins (52 mins total)"
  }
}
```

---

## 7. Hazard Clearing

### `DELETE /api/hazards`
Clears in-memory active hazard reports upon simulation reset.