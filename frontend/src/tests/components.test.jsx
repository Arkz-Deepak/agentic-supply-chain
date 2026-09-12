import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import RouteStatsCard from '../components/RouteStatsCard';
import DisruptionBanner from '../components/DisruptionBanner';
import ControlPanel from '../components/ControlPanel';
import { PRESET_HUBS } from '../data/mockRoutes';

describe('RouteStatsCard Component', () => {
  it('renders default route stats correctly in nominal state', () => {
    render(
      <RouteStatsCard
        activeRouteName="NH-16 Route 99"
        disruptionState="idle"
        distanceKm={33.8}
        etaMinutes={34}
      />
    );

    expect(screen.getByText(/Odisha Corridor Telemetry/i)).toBeInTheDocument();
    expect(screen.getByText('CORRIDOR CLEAR')).toBeInTheDocument();
    expect(screen.getByText('NH-16 Route 99')).toBeInTheDocument();
    expect(screen.getByText('34 mins')).toBeInTheDocument();
    expect(screen.getByText('33.8 km')).toBeInTheDocument();
  });

  it('displays halted badge when disruption detected', () => {
    render(
      <RouteStatsCard
        activeRouteName="NH-16 Route 99"
        disruptionState="detected"
        distanceKm={33.8}
        etaMinutes={34}
      />
    );

    expect(screen.getByText('NH-16 HALTED')).toBeInTheDocument();
  });

  it('displays active bypass status when rerouted and resolved', () => {
    render(
      <RouteStatsCard
        activeRouteName="route_101_express"
        disruptionState="resolved"
        distanceKm={33.8}
        etaMinutes={34}
      />
    );

    expect(screen.getByText('DAYA BYPASS ACTIVE')).toBeInTheDocument();
    expect(screen.getByText('route_101_express')).toBeInTheDocument();
    expect(screen.getByText('41 mins')).toBeInTheDocument();
  });
});

describe('DisruptionBanner Component', () => {
  it('renders nothing when disruption state is idle', () => {
    const { container } = render(
      <DisruptionBanner disruptionState="idle" onTriggerReroute={() => {}} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders alert and fires onTriggerReroute on click when detected', () => {
    const mockReroute = vi.fn();
    render(
      <DisruptionBanner
        disruptionState="detected"
        onTriggerReroute={mockReroute}
        disruptedRoute="NH-16 (Route 99)"
        activeHazard={{
          incident_type: 'ROAD_PROTEST',
          location: 'Khandagiri Square',
          description: 'Large transport strike blocking highway',
        }}
      />
    );

    expect(screen.getByText(/LIVE ROADBLOCK DETECTED/i)).toBeInTheDocument();
    expect(screen.getAllByText(/ROAD PROTEST/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/Carrier TRK-8821 Halted/i)).toBeInTheDocument();

    const button = screen.getByRole('button', { name: /TRIGGER AGENT REROUTE/i });
    expect(button).toBeInTheDocument();
    fireEvent.click(button);
    expect(mockReroute).toHaveBeenCalledTimes(1);
  });

  it('renders recalculating state when rerouting', () => {
    render(
      <DisruptionBanner
        disruptionState="rerouting"
        onTriggerReroute={() => {}}
        activeHazard={{
          incident_type: 'FLASH_FLOOD_WATERLOG',
          location: 'Khandagiri Junction',
        }}
      />
    );

    expect(screen.getByText(/LANGGRAPH AGENT RECALCULATING CORRIDOR/i)).toBeInTheDocument();
  });

  it('renders resolution state when resolved', () => {
    render(
      <DisruptionBanner
        disruptionState="resolved"
        onTriggerReroute={() => {}}
        resolvedRoute="Route 101 (Daya Canal Bypass)"
        activeHazard={{
          incident_type: 'ROAD_PROTEST',
          location: 'Khandagiri',
        }}
      />
    );

    expect(screen.getByText(/AUTONOMOUS RESOLUTION CONFIRMED/i)).toBeInTheDocument();
    expect(screen.getByText(/Route 101 \(Daya Canal Bypass\)/i)).toBeInTheDocument();
  });
});

describe('ControlPanel Component', () => {
  it('renders phase buttons and handles compute route click', () => {
    const handleCompute = vi.fn();
    const handlePreset = vi.fn();

    render(
      <ControlPanel
        onComputeRoute={handleCompute}
        onTriggerDisruption={() => {}}
        onAutonomousReroute={() => {}}
        onReset={() => {}}
        disruptionState="idle"
        isProcessing={false}
        startPoint={PRESET_HUBS[0]}
        destinationPoint={PRESET_HUBS[1]}
        onSelectPreset={handlePreset}
      />
    );

    expect(screen.getByText(/LogiPulse Controls/i)).toBeInTheDocument();

    const phase1Btn = screen.getByRole('button', { name: /Phase 1: Calculate Route/i });
    expect(phase1Btn).toBeInTheDocument();
    fireEvent.click(phase1Btn);
    expect(handleCompute).toHaveBeenCalledTimes(1);

    const presetBtn = screen.getByRole('button', { name: /Chennai Port → Oragadam/i });
    expect(presetBtn).toBeInTheDocument();
    fireEvent.click(presetBtn);
    expect(handlePreset).toHaveBeenCalledWith(PRESET_HUBS[0], PRESET_HUBS[1]);
  });
});
