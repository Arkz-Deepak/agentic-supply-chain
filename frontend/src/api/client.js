import axios from 'axios';

// FastAPI backend configuration running on port 8010
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8010';

export const apiClient = axios.create({
  baseURL: BACKEND_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: false,
  timeout: 12000,
});

/**
 * Fetches real-time weather from OpenWeatherMap via the backend
 */
export async function fetchLiveWeather(lat = 20.1484, lon = 85.6711) {
  try {
    const res = await apiClient.get(`/api/weather?lat=${lat}&lon=${lon}`);
    return res.data;
  } catch (err) {
    console.warn('Weather API fallback:', err);
    return {
      location: 'Jatani (IIT BBS)',
      temp_c: 27.1,
      humidity: 93,
      weather: 'Broken clouds (monsoon)',
      wind_speed_mps: 2.6,
    };
  }
}

/**
 * Fetches actual road routing geometry from OpenRouteService via the backend
 */
export async function fetchLiveDirections(start, dest, via = null) {
  try {
    const res = await apiClient.post('/api/routes/directions', {
      start,
      dest,
      via,
    });
    return res.data;
  } catch (err) {
    console.warn('OpenRouteService route fallback:', err);
    return null;
  }
}

/**
 * Orchestrate supply chain decision via FastAPI backend.
 */
export async function orchestrateRoute({
  startPoint,
  destination,
  currentRouteId,
  disruptionType,
  prompt,
  truckTelemetry,
}) {
  const payload = {
    messages: [
      {
        role: 'user',
        content:
          prompt ||
          `Emergency logistics dispatch: Severe disruption detected on ${currentRouteId || 'route_99'}. Cargo is en route from [${startPoint.name || 'Origin'}] to [${destination.name || 'IIT Bhubaneswar'}]. Reason: ${disruptionType || 'Monsoon Waterlog / Strike'}. Re-route cargo immediately.`,
      },
    ],
    state: {
      current_route: currentRouteId || 'route_99',
      tool_status: disruptionType ? 'disrupted' : 'operational',
      start_point: startPoint,
      destination: destination,
      truck_telemetry: truckTelemetry,
    },
  };

  try {
    const response = await apiClient.post('/api/orchestrate', payload);
    return {
      success: true,
      data: response.data,
      source: 'backend',
    };
  } catch (error) {
    console.warn(
      'FastAPI backend at port 8010 unreachable. Engaging high-fidelity agentic fallback simulator.',
      error
    );

    return simulateAgentResponse({
      startPoint,
      destination,
      currentRouteId,
      disruptionType,
    });
  }
}

function simulateAgentResponse({ startPoint, destination, currentRouteId, disruptionType }) {
  const isDisrupted = Boolean(disruptionType || currentRouteId === 'route_99');

  const steps = [
    {
      timestamp: new Date().toLocaleTimeString(),
      node: 'telemetry_sensor',
      type: 'INCOMING_ALERT',
      content: `Sensor alert: Carrier unit TRK-8821 halted near Khandagiri Junction. Event: ${disruptionType || 'Severe Flash Flood (4ft) & Strike'} on NH-16.`,
    },
    {
      timestamp: new Date().toLocaleTimeString(),
      node: 'strategist',
      type: 'THINKING',
      content: `LangGraph Strategist evaluating route [${startPoint?.name || 'Start'} -> ${destination?.name || 'IIT BBS'}]. Querying live weather & corridor status...`,
    },
    {
      timestamp: new Date().toLocaleTimeString(),
      node: 'tools',
      type: 'TOOL_CALL',
      toolName: 'book_cargo_route',
      args: { route_id: currentRouteId || 'route_99' },
      result: isDisrupted ? 'error' : 'success',
      content: isDisrupted
        ? `Execution failed: route '${currentRouteId || 'route_99'}' returned ERROR (NH-16 Khandagiri impassable).`
        : `Execution success: corridor confirmed.`,
    },
  ];

  if (isDisrupted) {
    steps.push({
      timestamp: new Date().toLocaleTimeString(),
      node: 'strategist',
      type: 'AUTONOMOUS_RECOVERY',
      content: `Primary route ${currentRouteId || 'route_99'} failed verification. Activating secondary Daya West Canal green corridor...`,
    });
    steps.push({
      timestamp: new Date().toLocaleTimeString(),
      node: 'tools',
      type: 'TOOL_CALL',
      toolName: 'calculate_road_corridor',
      args: { avoid_sector: 'Khandagiri_NH16', via: 'Daya_West_Canal', dest: 'IIT_Bhubaneswar' },
      result: 'success',
      content: `OpenRouteService computed Route 101 Express via Daya Canal (33.8 km, clear conditions, direct to South Gate).`,
    });
    steps.push({
      timestamp: new Date().toLocaleTimeString(),
      node: 'strategist',
      type: 'EXECUTION_COMPLETE',
      content: `SUCCESS: Autonomous reroute committed. Truck telemetry vector updated to route_101_express. Live navigation updated.`,
    });
  }

  return {
    success: true,
    source: 'simulation',
    data: {
      final_route: isDisrupted ? 'route_101_express' : (currentRouteId || 'route_optimal'),
      status: isDisrupted ? 'REROUTED_SUCCESSFULLY' : 'ROUTE_ACTIVE',
      eta_minutes: isDisrupted ? 44 : 33,
      distance_km: isDisrupted ? 33.8 : 33.7,
      risk_score: isDisrupted ? 3 : 10,
      agent_steps: steps,
      ai_summary: isDisrupted
        ? `Primary route ${currentRouteId || 'route_99'} blocked by Khandagiri flood & strike. Strategist agent autonomously rerouted via Daya West Canal green arterial (+7 min ETA). Delivery to IIT Bhubaneswar guaranteed.`
        : `Initial optimal corridor calculated and locked. Fleet logistics tracking active.`,
    },
  };
}
