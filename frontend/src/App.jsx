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
  // Hubs & Routing Coordinates
  const [startPoint, setStartPoint] = useState(PRESET_HUBS[0]); // Bhubaneswar Depot
  const [destinationPoint, setDestinationPoint] = useState(PRESET_HUBS[1]); // IIT BBS
  const [primaryPolyline, setPrimaryPolyline] = useState(DEFAULT_PRIMARY_ROUTE);
  const [reroutePolyline, setReroutePolyline] = useState(null);

  // Live real data state
  const [liveWeather, setLiveWeather] = useState(null);
  const [routeStats, setRouteStats] = useState({
    distanceKm: 33.8,
    etaMinutes: 34,
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
      timestamp: '19:45:00',
      node: 'system',
      type: 'INFO',
      content:
        'LogiPulse Autonomous Command Center online for Tech Zephyr 4.0 (IIT BBS). Dedicated ports active (UI: 5180, API: 8010). Live Voice Webhook & Gemini NLP ready.',
    },
  ]);

  // Graph state mirroring LangGraph SupplyChainState
  const [graphState, setGraphState] = useState({
    messages: [
      {
        role: 'system',
        content:
          'LangGraph Orchestrator initialized with Gemini 2.5 Flash. 4 tools bound: OpenRouteService, OpenWeatherMap, Crowdsourced Traffic, Stakeholder Email.',
      },
    ],
    tool_status: 'nominal',
    current_route: 'route_99',
    phase: 1,
  });

  // Fetch real weather and initial route on mount
  useEffect(() => {
    async function initData() {
      // 1. Fetch live weather for IIT Bhubaneswar
      const weather = await fetchLiveWeather(20.1484, 85.6711);
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

      // 2. Fetch real OpenRouteService highway driving polyline
      const dirData = await fetchLiveDirections(startPoint.coords, destinationPoint.coords);
      if (dirData && dirData.polyline && dirData.polyline.length > 5) {
        setPrimaryPolyline(dirData.polyline);
        setRouteStats({
          distanceKm: dirData.distance_km,
          etaMinutes: Math.round(dirData.duration_min),
        });
      }
    }
    initData();
  }, []);

  // Handle map click to set Start or End point
  const handlePointSelected = async (type, coords) => {
    playMechanicalClick();
    if (type === 'start') {
      const newStart = {
        id: 'CUSTOM_START',
        name: `Custom Origin (${coords[0].toFixed(3)}, ${coords[1].toFixed(3)})`,
        shortName: 'Custom Start',
        coords,
      };
      setStartPoint(newStart);
      setSettingPointType(null);

      if (destinationPoint) {
        const dirData = await fetchLiveDirections(coords, destinationPoint.coords);
        if (dirData && dirData.polyline && dirData.polyline.length > 1) {
          setPrimaryPolyline(dirData.polyline);
          setRouteStats({
            distanceKm: dirData.distance_km,
            etaMinutes: Math.round(dirData.duration_min),
          });
        } else {
          const fallback = generateCurvedRoute(coords, destinationPoint.coords);
          const dist = calculateHaversineDistanceKm(coords, destinationPoint.coords);
          setPrimaryPolyline(fallback);
          setRouteStats({
            distanceKm: dist,
            etaMinutes: Math.max(5, Math.round((dist / 45) * 60)),
          });
        }
      }
    } else if (type === 'dest') {
      const newDest = {
        id: 'CUSTOM_DEST',
        name: `Custom Destination (${coords[0].toFixed(3)}, ${coords[1].toFixed(3)})`,
        shortName: 'Custom Dest',
        coords,
      };
      setDestinationPoint(newDest);
      setSettingPointType(null);

      if (startPoint) {
        const dirData = await fetchLiveDirections(startPoint.coords, coords);
        if (dirData && dirData.polyline && dirData.polyline.length > 1) {
          setPrimaryPolyline(dirData.polyline);
          setRouteStats({
            distanceKm: dirData.distance_km,
            etaMinutes: Math.round(dirData.duration_min),
          });
        } else {
          const fallback = generateCurvedRoute(startPoint.coords, coords);
          const dist = calculateHaversineDistanceKm(startPoint.coords, coords);
          setPrimaryPolyline(fallback);
          setRouteStats({
            distanceKm: dist,
            etaMinutes: Math.max(5, Math.round((dist / 45) * 60)),
          });
        }
      }
    }
  };

  // Preset Hub Selector
  const handleSelectPreset = async (startHub, destHub) => {
    setStartPoint(startHub);
    setDestinationPoint(destHub);
    setReroutePolyline(null);
    setDisruptionState('idle');
    setEmailDispatched(null);

    const dirData = await fetchLiveDirections(startHub.coords, destHub.coords);
    if (dirData && dirData.polyline && dirData.polyline.length > 1) {
      setPrimaryPolyline(dirData.polyline);
      setRouteStats({
        distanceKm: dirData.distance_km,
        etaMinutes: Math.round(dirData.duration_min),
      });
    } else {
      setPrimaryPolyline(DEFAULT_PRIMARY_ROUTE);
      setRouteStats({ distanceKm: 33.8, etaMinutes: 34 });
    }

    setAgentSteps((prev) => [
      ...prev,
      {
        timestamp: new Date().toLocaleTimeString(),
        node: 'strategist',
        type: 'ROUTING_UPDATE',
        content: `Waypoints selected: [${startHub.name}] &rarr; [${destHub.name}]. Loaded live highway route.`,
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
      currentRouteId: 'route_primary',
      prompt: `Calculate primary cargo corridor from [${startPoint.name}] to [${destinationPoint.name}]. Check routing status.`,
    });

    if (result.data?.agent_steps) {
      setAgentSteps((prev) => [...prev, ...result.data.agent_steps]);
    }

    setGraphState((prev) => ({
      ...prev,
      current_route: 'route_primary',
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

    // 2. Call backend Voice NLP endpoint
    const voiceRes = await reportVoiceHazard(rawTranscript);
    const parsedData = voiceRes.parsed || {
      incident_type: 'ROAD_BLOCKAGE',
      location: 'Khandagiri Junction NH-16',
      description: rawTranscript,
      severity: 'CRITICAL',
    };

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
    handleVoiceReportSubmitted("Emergency dispatch! Major multi-vehicle car accident at Khandagiri junction on NH-16, lanes are completely blocked!");
  };

  // Phase 2 Resolution: Autonomous Agent Reroute & Email Stakeholders
  const handleAutonomousReroute = async () => {
    setIsProcessing(true);
    setDisruptionState('rerouting');

    // Multi-tier escalation check: If Route 101 / Highway 1 is already active or reported blocked
    const hazardStr = activeHazard ? `${activeHazard.location} ${activeHazard.description}` : '';
    const isCurrent101 = graphState.current_route === 'route_101_express';
    const mentions101 = /hwy 1|sh 1|highway 1|daya|canal|route 101/i.test(hazardStr);
    const is101Blocked = isCurrent101 || mentions101 || graphState.blocked_corridors?.includes('route_101_express');

    let targetRouteId = 'route_101_express';
    let targetRouteName = 'Route 101 (Daya Canal Bypass)';
    let bypassVia = [20.1980, 85.7950];
    let fallbackPolyline = DEFAULT_REROUTE_CORRIDOR;

    if (is101Blocked) {
      targetRouteId = 'route_202_outer_ring';
      targetRouteName = 'Route 202 (Pipili Outer Bypass)';
      bypassVia = [20.1700, 85.8200];
      fallbackPolyline = DEFAULT_TERTIARY_CORRIDOR;
    }

    const isNearBhubaneswar = startPoint.coords[1] > 85.7 && destinationPoint.coords[1] > 85.6;
    const finalBypassVia = isNearBhubaneswar
      ? bypassVia
      : [
          (startPoint.coords[0] + destinationPoint.coords[0]) / 2 + (is101Blocked ? 0.028 : 0.018),
          (startPoint.coords[1] + destinationPoint.coords[1]) / 2 + (is101Blocked ? 0.038 : 0.024),
        ];

    // Query real OpenRouteService bypass road geometry
    const bypassData = await fetchLiveDirections(
      startPoint.coords,
      destinationPoint.coords,
      finalBypassVia
    );

    const incidentTitle = activeHazard?.incident_type ? activeHazard.incident_type.replace(/_/g, ' ') : 'Roadblock & Disruption';
    const hazardDesc = activeHazard 
      ? `${incidentTitle} at ${activeHazard.location}: ${activeHazard.description}`
      : 'Driver hazard report on active corridor';

    const currentBlockedList = Array.from(new Set([
      ...(graphState.blocked_corridors || ['route_99']),
      graphState.current_route || 'route_99'
    ]));

    // Call orchestrator
    const response = await orchestrateRoute({
      startPoint,
      destination: destinationPoint,
      currentRouteId: graphState.current_route || 'route_99',
      blockedCorridors: currentBlockedList,
      disruptionType: hazardDesc,
      prompt:
        `Emergency reroute from ${startPoint.name} to ${destinationPoint.name}. Current corridor compromised (${hazardDesc}). Blocked corridors: [${currentBlockedList.join(', ')}]. Calculate next available bypass arterial without looping back to blocked corridors.`,
    });

    setTimeout(() => {
      const backendFinal = response.data?.final_route;
      const finalRouteId = backendFinal || targetRouteId;
      const backendEmail = response.data?.email_dispatched;
      const finalRouteName = backendEmail?.alternative_route || targetRouteName;
      const nextBlocked = response.data?.state?.blocked_corridors || [...currentBlockedList, finalRouteId];

      if (bypassData && bypassData.polyline && bypassData.polyline.length > 1) {
        setReroutePolyline(bypassData.polyline);
        setRouteStats({
          distanceKm: bypassData.distance_km,
          etaMinutes: Math.round(bypassData.duration_min),
        });
      } else {
        const poly = fallbackPolyline || generateCurvedRoute(startPoint.coords, destinationPoint.coords, finalBypassVia);
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
        new_eta: is101Blocked ? '+13 mins (47 mins total)' : '+7 mins (38 mins total)',
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
    setPrimaryPolyline(DEFAULT_PRIMARY_ROUTE);
    setRouteStats({ distanceKm: 33.8, etaMinutes: 34 });
    setEmailDispatched(null);
    setAgentSteps([
      {
        timestamp: new Date().toLocaleTimeString(),
        node: 'system',
        type: 'INFO',
        content: 'System telemetry reset. Corridor cleared for new dispatch mission.',
      },
    ]);
    setGraphState({
      messages: [],
      tool_status: 'nominal',
      current_route: 'route_99',
      current_route_name: 'NH-16 (Route 99)',
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
          disruptedRoute="NH-16 (Route 99)"
          resolvedRoute={graphState.current_route_name || "Route 101 (Daya Canal Bypass)"}
          activeHazard={activeHazard}
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
