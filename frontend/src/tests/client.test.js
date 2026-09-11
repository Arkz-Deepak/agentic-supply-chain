import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  fetchLiveWeather,
  fetchLiveDirections,
  reportVoiceHazard,
  orchestrateRoute,
  clearLiveHazards,
  apiClient,
} from '../api/client';

describe('Frontend API Client & Resilience Fallbacks', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('fetchLiveWeather returns fallback payload when backend fails', async () => {
    vi.spyOn(apiClient, 'get').mockRejectedValueOnce(new Error('Network error'));
    const weather = await fetchLiveWeather(20.14, 85.67);
    expect(weather).toBeDefined();
    expect(weather.location).toContain('Jatani');
    expect(weather.temp_c).toBeDefined();
    expect(weather.humidity).toBeDefined();
  });

  it('fetchLiveWeather returns live data when backend succeeds', async () => {
    const mockData = {
      location: 'Bhubaneswar Airport',
      temp_c: 28.5,
      humidity: 85,
      weather: 'Scattered clouds',
      wind_speed_mps: 3.1,
    };
    vi.spyOn(apiClient, 'get').mockResolvedValueOnce({ data: mockData });
    const weather = await fetchLiveWeather();
    expect(weather).toEqual(mockData);
  });

  it('fetchLiveDirections returns null fallback on error', async () => {
    vi.spyOn(apiClient, 'post').mockRejectedValueOnce(new Error('500 Server Error'));
    const res = await fetchLiveDirections([20.3, 85.8], [20.1, 85.6]);
    expect(res).toBeNull();
  });

  it('reportVoiceHazard calls backend and returns data on success', async () => {
    const mockResponse = {
      status: 'success',
      parsed: {
        location: 'Khandagiri Square',
        incident_type: 'ROAD_PROTEST',
        description: 'Large strike blocking highway',
      },
    };
    vi.spyOn(apiClient, 'post').mockResolvedValueOnce({ data: mockResponse });
    const result = await reportVoiceHazard('Truck halted near Khandagiri protest');
    expect(result.status).toBe('success');
    expect(result.parsed.location).toBe('Khandagiri Square');
  });

  it('reportVoiceHazard falls back gracefully on double network error', async () => {
    vi.spyOn(apiClient, 'post')
      .mockRejectedValueOnce(new Error('Voice endpoint error'))
      .mockRejectedValueOnce(new Error('Fallback endpoint error'));

    const result = await reportVoiceHazard('Emergency flood on highway');
    expect(result.status).toBe('offline_logged');
    expect(result.parsed.description).toContain('Emergency flood');
  });

  it('orchestrateRoute executes simulated fallback when backend offline (nominal)', async () => {
    vi.spyOn(apiClient, 'post').mockRejectedValueOnce(new Error('Connection refused'));

    const res = await orchestrateRoute({
      startPoint: { name: 'Origin Hub', coords: [20.301, 85.864] },
      destination: { name: 'IIT Bhubaneswar', coords: [20.148, 85.671] },
      currentRouteId: 'route_99',
      disruptionType: null,
    });

    expect(res.success).toBe(true);
    expect(res.source).toBe('simulation');
    expect(res.data.status).toBe('ROUTE_ACTIVE');
    expect(res.data.eta_minutes).toBe(34);
    expect(res.data.agent_steps.length).toBeGreaterThan(0);
  });

  it('orchestrateRoute executes simulated fallback with rerouting when disrupted', async () => {
    vi.spyOn(apiClient, 'post').mockRejectedValueOnce(new Error('Connection refused'));

    const res = await orchestrateRoute({
      startPoint: { name: 'Rasulgarh Depot', coords: [20.301, 85.864] },
      destination: { name: 'IIT Bhubaneswar', coords: [20.148, 85.671] },
      currentRouteId: 'route_99',
      disruptionType: 'FLASH_FLOOD_WATERLOG',
    });

    expect(res.success).toBe(true);
    expect(res.source).toBe('simulation');
    expect(res.data.status).toBe('REROUTED_SUCCESSFULLY');
    expect(res.data.final_route).toBe('route_101_express');
    expect(res.data.email_dispatched).toBeDefined();
    expect(res.data.email_dispatched.to).toContain('warehouse.manager@odisha-logistics.com');
  });

  it('clearLiveHazards returns success on call or offline fallback', async () => {
    vi.spyOn(apiClient, 'delete').mockResolvedValueOnce({ data: { status: 'cleared', count: 0 } });
    const res1 = await clearLiveHazards();
    expect(res1.status).toBe('cleared');

    vi.spyOn(apiClient, 'delete').mockRejectedValueOnce(new Error('Network error'));
    const res2 = await clearLiveHazards();
    expect(res2.status).toBe('cleared');
  });
});
