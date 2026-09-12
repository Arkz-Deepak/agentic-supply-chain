import React, { useState, useEffect } from 'react';
import ThreeBackground from './components/ThreeBackground';
import Header from './components/Header';
import MapView from './components/MapView';
import AgentFeed from './components/AgentFeed';
import DisruptionBanner from './components/DisruptionBanner';
import ControlPanel from './components/ControlPanel';
import RouteStatsCard from './components/RouteStatsCard';
import {
  PRESET_HUBS,
  DEFAULT_PRIMARY_ROUTE,
  DEFAULT_REROUTE_CORRIDOR,
  DEFAULT_TERTIARY_CORRIDOR,
  DEFAULT_QUATERNARY_CORRIDOR,
  DISRUPTION_ZONES,
  generateCurvedRoute,
  calculateHaversineDistanceKm,
  calculateOrthogonalBypassPoint,
  interpolatePolylineCoordinate,
} from './data/mockRoutes';
import {
  orchestrateRoute,
  fetchLiveWeather,
  fetchLiveDirections,
  reportVoiceHazard,
  clearLiveHazards,
} from './api/client';
import {
  playDispatchAlert,
  playMechanicalClick,
  playSuccessChime,
} from './utils/soundEffects';

export default function App() {
  // Hubs & Routing Coordinates (Defaults to Chennai Port -> Oragadam Industrial Corridor)
  const [startPoint, setStartPoint] = useState(PRESET_HUBS[0]);
  const [destinationPoint, setDestinationPoint] = useState(PRESET_HUBS[1]);
  const [primaryPolyline, setPrimaryPolyline] = useState(null); // Initialized to null: Only Point A and Point B shown until Phase 1 button is pressed!
  const [reroutePolyline, setReroutePolyline] = useState(null);

  // Live real data state
  const [liveWeather, setLiveWeather] = useState(null);
  const [routeStats, setRouteStats] = useState({
    distanceKm: 0,
    etaMinutes: 0,
  });

  // Map interactive point placement state
  const [settingPointType, setSettingPointType] = useState(null);

  // Disruption & Agent State: 'idle' | 'detected' | 'rerouting' | 'resolved'
  const [disruptionState, setDisruptionState] = useState('idle');
  const [activeHazard, setActiveHazard] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [emailDispatched, setEmailDispatched] = useState(null);

  // Agent activity logs
  const [agentSteps, setAgentSteps] = useState([
    {
      timestamp: new Date().toLocaleTimeString(),
      node: 'system',
      type: 'INFO',
      content:
        'LogiPulse Command Center online. Origin Point A (Chennai Port) & Destination Point B (Oragadam) pinned. Press "Phase 1: Calculate Route" to create the freight path.',
    },
  ]);

  // Graph state mirroring LangGraph SupplyChainState
  const [graphState, setGraphState] = useState({
    messages: [
      {
        role: 'system',
        content:
          'LangGraph Orchestrator initialized with Gemini Flash. 4 tools bound: OpenRouteService, OpenWeatherMap, Crowdsourced Traffic, Stakeholder Email.',
      },
    ],
    tool_status: 'nominal',
    current_route: 'chennai_port_arterial',
    current_route_name: 'Chennai Port Express Arterial',
    blocked_corridors: [],
    phase: 1,
  });

  // Fetch real weather for origin on mount (route generation is triggered ONLY via Phase 1 button)
  useEffect(() => {
    async function initData() {
      // Fetch live weather for active start point
      const weather = await fetchLiveWeather(startPoint.coords[0], startPoint.coords[1]);
      if (weather) {
        setLiveWeather(weather);
        setAgentSteps((prev) => [
          ...prev,
          {
            timestamp: new Date().toLocaleTimeString(),
            node: 'telemetry_sensor',
            type: 'INFO',
            content: `Live OpenWeatherMap: ${weather.location} | Temp: ${weather.temp_c}°C, Humidity: ${weather.humidity}%, "${weather.weather}".`,
          },
        ]);
      }
    }
    initData();
  }, []);

  // Handle map click to set Start or End point dynamically anywhere on map
  const handlePointSelected = async (type, coords) => {
    playMechanicalClick();
    if (type === 'start') {
      const newStart = {
        id: 'CUSTOM_START',
        name: `Custom Origin (${coords[0].toFixed(3)}, ${coords[1].toFixed(3)})`,
        shortName: `Origin (${coords[0].toFixed(2)}, ${coords[1].toFixed(2)})`,
        coords,
      };
      setStartPoint(newStart);
      setSettingPointType(null);
      setDisruptionState('idle');
      setPrimaryPolyline(null); // Clear route: awaits Phase 1 button
      setReroutePolyline(null);
      setActiveHazard(null);
      setRouteStats({ distanceKm: 0, etaMinutes: 0 });

      // Refresh weather for new start coordinate
      fetchLiveWeather(coords[0], coords[1]).then((w) => w && setLiveWeather(w));

      setAgentSteps((prev) => [
        ...prev,
        {
          timestamp: new Date().toLocaleTimeString(),
          node: 'system',
          type: 'INFO',
          content: `Origin (Point A) set to [${coords[0].toFixed(3)}, ${coords[1].toFixed(3)}]. Press "Phase 1: Calculate Route" to create the path.`,
        },
      ]);
    } else if (type === 'dest') {
      const newDest = {
        id: 'CUSTOM_DEST',
        name: `Custom Destination (${coords[0].toFixed(3)}, ${coords[1].toFixed(3)})`,
        shortName: `Dest (${coords[0].toFixed(2)}, ${coords[1].toFixed(2)})`,
        coords,
      };
      setDestinationPoint(newDest);
      setSettingPointType(null);
      setDisruptionState('idle');
      setPrimaryPolyline(null); // Clear route: awaits Phase 1 button
      setReroutePolyline(null);
      setActiveHazard(null);
      setRouteStats({ distanceKm: 0, etaMinutes: 0 });

      setAgentSteps((prev) => [
        ...prev,
        {
          timestamp: new Date().toLocaleTimeString(),
          node: 'system',
          type: 'INFO',
          content: `Destination (Point B) set to [${coords[0].toFixed(3)}, ${coords[1].toFixed(3)}]. Press "Phase 1: Calculate Route" to create the path.`,
        },
      ]);
    }
  };

  // Preset Hub Selector
  const handleSelectPreset = async (startHub, destHub) => {
    setStartPoint(startHub);
    setDestinationPoint(destHub);
    setPrimaryPolyline(null); // Clear route: awaits Phase 1 button
    setReroutePolyline(null);
    setDisruptionState('idle');
    setActiveHazard(null);
    setEmailDispatched(null);
    setRouteStats({ distanceKm: 0, etaMinutes: 0 });

    fetchLiveWeather(startHub.coords[0], startHub.coords[1]).then((w) => w && setLiveWeather(w));

    setAgentSteps((prev) => [
      ...prev,
      {
        timestamp: new Date().toLocaleTimeString(),
        node: 'system',
        type: 'ROUTING_UPDATE',
        content: `Active Freight Corridor selected: [${startHub.name}] → [${destHub.name}]. Point A & Point B pinned. Press "Phase 1: Calculate Route" to create the route.`,
      },
    ]);
  };

  // Phase 1: Compute Initial Route
  const handleComputePhase1 = async () => {
    setIsProcessing(true);
    setDisruptionState('idle');
    setReroutePolyline(null);
    setEmailDispatched(null);

    const dirData = await fetchLiveDirections(startPoint.coords, destinationPoint.coords);
    if (dirData && dirData.polyline && dirData.polyline.length > 1) {
      setPrimaryPolyline(dirData.polyline);
      setRouteStats({
        distanceKm: dirData.distance_km,
        etaMinutes: Math.round(dirData.duration_min),
      });
    } else {
      const fallback = generateCurvedRoute(startPoint.coords, destinationPoint.coords);
      const dist = calculateHaversineDistanceKm(startPoint.coords, destinationPoint.coords);
      setPrimaryPolyline(fallback);
      setRouteStats({
        distanceKm: dist,
        etaMinutes: Math.max(5, Math.round((dist / 45) * 60)),
      });
    }

    const result = await orchestrateRoute({
      startPoint,
      destination: destinationPoint,
      currentRouteId: graphState.current_route || 'route_primary',
      prompt: `Calculate primary cargo corridor from [${startPoint.name}] to [${destinationPoint.name}]. Check routing status.`,
    });

    if (result.data?.agent_steps) {
      setAgentSteps((prev) => [...prev, ...result.data.agent_steps]);
    }

    setGraphState((prev) => ({
      ...prev,
      current_route: result.data?.final_route || 'route_primary',
      current_route_name: `${startPoint.shortName} Express Arterial`,
      tool_status: 'nominal',
      phase: 1,
    }));

    setIsProcessing(false);
  };

  // Phase 2: Live Voice Report Submission
  const handleVoiceReportSubmitted = async (rawTranscript) => {
    setIsProcessing(true);
    playDispatchAlert();
    setDisruptionState('detected');

    // 1. Log voice input
    const voiceStep = {
      timestamp: new Date().toLocaleTimeString(),
      node: 'telemetry_sensor',
      type: 'INCOMING_ALERT',
      content: `🎙️ Driver Voice Transmission: "${rawTranscript}"`,
    };
    setAgentSteps((prev) => [...prev, voiceStep]);

    // Ensure active primary polyline exists if user submitted report directly
    let activePoly = primaryPolyline;
    if (!activePoly || activePoly.length < 2) {
      const dirData = await fetchLiveDirections(startPoint.coords, destinationPoint.coords);
      if (dirData && dirData.polyline && dirData.polyline.length > 1) {
        activePoly = dirData.polyline;
        setRouteStats({
          distanceKm: dirData.distance_km,
          etaMinutes: Math.round(dirData.duration_min),
        });
      } else {
        activePoly = generateCurvedRoute(startPoint.coords, destinationPoint.coords);
        const dist = calculateHaversineDistanceKm(startPoint.coords, destinationPoint.coords);
        setRouteStats({
          distanceKm: dist,
          etaMinutes: Math.max(5, Math.round((dist / 45) * 60)),
        });
      }
      setPrimaryPolyline(activePoly);
    }

    // 2. Call backend Voice NLP endpoint
    const voiceRes = await reportVoiceHazard(rawTranscript);
    const parsedData = voiceRes.parsed || {
      incident_type: 'ROAD_BLOCKAGE',
      location: `${startPoint.shortName} Freight Corridor`,
      description: rawTranscript,
      severity: 'CRITICAL',
    };

    // 3. Dynamically place hazard on active polyline ~38% along the route
    const dynamicHazardCoords = interpolatePolylineCoordinate(activePoly, 0.38);
    parsedData.coords = dynamicHazardCoords;
    parsedData.progressFraction = 0.38;

    setActiveHazard(parsedData);

    const incidentName = (parsedData.incident_type || 'HAZARD').replace(/_/g, ' ');
    const nlpStep = {
      timestamp: new Date().toLocaleTimeString(),
      node: 'strategist',
      type: 'THINKING',
      content: `Gemini Flash NLP Parsed Transmission &rarr; Category: [${incidentName}] | Location: "${parsedData.location}" | Details: "${parsedData.description}" | Severity: ${parsedData.severity || 'CRITICAL'}`,
    };
    setAgentSteps((prev) => [...prev, nlpStep]);

    setGraphState((prev) => ({
      ...prev,
      tool_status: 'error_blocked',
      phase: 2,
    }));

    setIsProcessing(false);
  };

  // Fallback direct trigger
  const handleTriggerDisruption = () => {
    const isChennai = startPoint?.shortName?.includes('Chennai') || (startPoint?.coords && startPoint.coords[0] < 16);
    const defaultMsg = isChennai
      ? `Emergency dispatch! Major container truck collision on Chennai Port Corridor near Maduravoyal, both lanes blocked!`
      : `Emergency dispatch! Road hazard and multi-vehicle accident between ${startPoint.shortName} and ${destinationPoint.shortName}, lanes blocked!`;
    handleVoiceReportSubmitted(defaultMsg);
  };

  // Phase 2 Resolution: Autonomous Agent Reroute & Email Stakeholders
  const handleAutonomousReroute = async () => {
    setIsProcessing(true);
    setDisruptionState('rerouting');

    // Dynamic orthogonal detour calculation for ANY start and destination!
    const is101Blocked = graphState.blocked_corridors?.includes('route_101_express');
    const detourRatio = is101Blocked ? 0.065 : 0.040;
    const dynamicBypassVia = calculateOrthogonalBypassPoint(
      startPoint.coords,
      destinationPoint.coords,
      activeHazard?.coords || null,
      detourRatio
    );

    // Query real OpenRouteService bypass road geometry
    const bypassData = await fetchLiveDirections(
      startPoint.coords,
      destinationPoint.coords,
      dynamicBypassVia
    );

    const incidentTitle = activeHazard?.incident_type ? activeHazard.incident_type.replace(/_/g, ' ') : 'Roadblock & Disruption';
    const hazardDesc = activeHazard 
      ? `${incidentTitle} at ${activeHazard.location}: ${activeHazard.description}`
      : 'Driver hazard report on active corridor';

    const currentBlockedList = Array.from(new Set([
      ...(graphState.blocked_corridors || ['route_primary']),
      graphState.current_route || 'route_primary'
    ]));

    // Call orchestrator
    const response = await orchestrateRoute({
      startPoint,
      destination: destinationPoint,
      currentRouteId: graphState.current_route || 'route_primary',
      blockedCorridors: currentBlockedList,
      disruptionType: hazardDesc,
      prompt:
        `Emergency reroute from ${startPoint.name} to ${destinationPoint.name}. Current corridor compromised (${hazardDesc}). Blocked corridors: [${currentBlockedList.join(', ')}]. Calculate next available bypass arterial without looping back to blocked corridors.`,
    });

    setTimeout(() => {
      const isChennai = startPoint?.shortName?.includes('Chennai') || (startPoint?.coords && startPoint.coords[0] < 16);
      const defaultBypassName = isChennai
        ? 'Chennai Outer Ring Road (ORR Green Express Bypass)'
        : `${startPoint.shortName} → ${destinationPoint.shortName} (Green Corridor Bypass)`;

      const backendFinal = response.data?.final_route;
      const finalRouteId = backendFinal || 'route_101_express';
      const backendEmail = response.data?.email_dispatched;
      const finalRouteName = backendEmail?.alternative_route || defaultBypassName;
      const nextBlocked = response.data?.state?.blocked_corridors || [...currentBlockedList, finalRouteId];

      if (bypassData && bypassData.polyline && bypassData.polyline.length > 1) {
        setReroutePolyline(bypassData.polyline);
        setRouteStats({
          distanceKm: bypassData.distance_km,
          etaMinutes: Math.round(bypassData.duration_min),
        });
      } else {
        const poly = generateCurvedRoute(startPoint.coords, destinationPoint.coords, dynamicBypassVia);
        const distKm = Math.round(calculateHaversineDistanceKm(startPoint.coords, destinationPoint.coords) * (is101Blocked ? 1.25 : 1.15) * 10) / 10;
        setReroutePolyline(poly);
        setRouteStats({
          distanceKm: distKm,
          etaMinutes: Math.max(10, Math.round((distKm / 42) * 60)),
        });
      }

      setDisruptionState('resolved');
      setIsProcessing(false);

      const fallbackEmailReason = activeHazard 
        ? `${incidentTitle}: ${activeHazard.description} (${activeHazard.location})`
        : 'Driver Reported Road Disruption on Active Corridor';

      const email = backendEmail || {
        to: 'warehouse.manager@odisha-logistics.com, client.relations@iitbbs.ac.in',
        reason: fallbackEmailReason,
        alternative_route: finalRouteName,
        new_eta: is101Blocked ? '+13 mins (57 mins total)' : '+7 mins (51 mins total)',
      };
      setEmailDispatched(email);

      playSuccessChime();

      if (response.data?.agent_steps) {
        setAgentSteps((prev) => [...prev, ...response.data.agent_steps]);
      }

      setGraphState((prev) => ({
        ...prev,
        current_route: finalRouteId,
        current_route_name: finalRouteName,
        blocked_corridors: nextBlocked,
        tool_status: 'success_rerouted',
        phase: 2,
      }));
    }, 1200);
  };

  // Reset to initial baseline
  const handleReset = () => {
    setDisruptionState('idle');
    setActiveHazard(null);
    clearLiveHazards();
    setReroutePolyline(null);
    setPrimaryPolyline(null); // Clear route: awaits Phase 1 button
    setRouteStats({ distanceKm: 0, etaMinutes: 0 });
    setEmailDispatched(null);
    setAgentSteps([
      {
        timestamp: new Date().toLocaleTimeString(),
        node: 'system',
        type: 'INFO',
        content: 'System telemetry reset. Point A (Origin) & Point B (Destination) pinned. Press "Phase 1: Calculate Route" to create the path.',
      },
    ]);
    setGraphState({
      messages: [],
      tool_status: 'nominal',
      current_route: 'chennai_port_arterial',
      current_route_name: 'Chennai Port Express Arterial',
      blocked_corridors: [],
      phase: 1,
    });
  };

  return (
    <div className="relative min-h-screen w-full bg-gradient-to-br from-slate-50 via-sky-50/60 to-blue-50/40 text-slate-900 flex flex-col selection:bg-sky-500/20 selection:text-sky-900">
      {/* 3D Particle Constellation & Cyber Grid Background */}
      <ThreeBackground />

      {/* Top Telemetry Header with Live Weather & Port Badges */}
      <Header
        activePhase={graphState.phase}
        agentActive={isProcessing}
        liveWeather={liveWeather}
      />

      {/* Main Command Center Dashboard */}
      <main className="relative z-10 flex-1 p-3 md:p-5 flex flex-col space-y-3 max-w-[1700px] mx-auto w-full">
        {/* Urgent Pulsing Alert Banner */}
        <DisruptionBanner
          disruptionState={disruptionState}
          onTriggerReroute={handleAutonomousReroute}
          disruptedRoute={`${startPoint?.shortName || 'Origin'} Primary Arterial`}
          resolvedRoute={graphState.current_route_name || "Green Corridor Bypass"}
          activeHazard={activeHazard}
          startPoint={startPoint}
          destinationPoint={destinationPoint}
        />

        {/* Split Layout: Map (Left) / Agent Feed (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 min-h-[620px]">
          {/* Left Column (7 Cols) */}
          <div className="lg:col-span-7 flex flex-col space-y-3">
            {/* Interactive Leaflet Map with Smooth Live GPS Tracking */}
            <div className="h-[460px] md:h-[500px] w-full">
              <MapView
                startPoint={startPoint}
                destinationPoint={destinationPoint}
                primaryPolyline={primaryPolyline}
                reroutePolyline={reroutePolyline}
                disruptionState={disruptionState}
                disruptionZones={DISRUPTION_ZONES}
                settingPointType={settingPointType}
                setSettingPointType={setSettingPointType}
                onPointSelected={handlePointSelected}
                activeHazard={activeHazard}
              />
            </div>

            {/* Real-time Telemetry Stats Card */}
            <RouteStatsCard
              activeRouteName={graphState.current_route}
              disruptionState={disruptionState}
              distanceKm={routeStats.distanceKm}
              etaMinutes={routeStats.etaMinutes}
              startPoint={startPoint}
              destinationPoint={destinationPoint}
              activeHazard={activeHazard}
              targetBypassName={graphState.current_route_name}
              hasActiveRoute={Boolean(primaryPolyline && primaryPolyline.length > 1)}
            />

            {/* Control Panel with Voice Modal Trigger */}
            <ControlPanel
              onComputeRoute={handleComputePhase1}
              onTriggerDisruption={handleTriggerDisruption}
              onAutonomousReroute={handleAutonomousReroute}
              onReset={handleReset}
              disruptionState={disruptionState}
              isProcessing={isProcessing}
              startPoint={startPoint}
              destinationPoint={destinationPoint}
              onSelectPreset={handleSelectPreset}
              onVoiceReportSubmitted={handleVoiceReportSubmitted}
              hasActiveRoute={Boolean(primaryPolyline && primaryPolyline.length > 1)}
            />
          </div>

          {/* Right Column: Sleek Agent Activity Feed (5 Cols) */}
          <div className="lg:col-span-5 h-[580px] lg:h-auto flex flex-col">
            <AgentFeed
              steps={agentSteps}
              currentState={graphState}
              isStreaming={isProcessing}
              emailDispatched={emailDispatched}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
