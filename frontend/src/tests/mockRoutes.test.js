import { describe, it, expect } from 'vitest';
import {
  PRESET_HUBS,
  DEFAULT_PRIMARY_ROUTE,
  DEFAULT_REROUTE_CORRIDOR,
  DEFAULT_TERTIARY_CORRIDOR,
  DEFAULT_QUATERNARY_CORRIDOR,
  DISRUPTION_ZONES,
  calculateHaversineDistanceKm,
  generateCurvedRoute,
  calculateOrthogonalBypassPoint,
  interpolatePolylineCoordinate,
} from '../data/mockRoutes';

describe('mockRoutes Data and Geometry Utilities', () => {
  it('should define preset hubs with valid lat/lon coordinates', () => {
    expect(PRESET_HUBS.length).toBeGreaterThanOrEqual(4);
    PRESET_HUBS.forEach((hub) => {
      expect(hub.id).toBeDefined();
      expect(hub.coords).toHaveLength(2);
      expect(hub.coords[0]).toBeGreaterThan(11);
      expect(hub.coords[0]).toBeLessThan(25);
      expect(hub.coords[1]).toBeGreaterThan(78);
      expect(hub.coords[1]).toBeLessThan(90);
    });
  });

  it('should define all 4 corridor hierarchies with valid coordinates', () => {
    [
      DEFAULT_PRIMARY_ROUTE,
      DEFAULT_REROUTE_CORRIDOR,
      DEFAULT_TERTIARY_CORRIDOR,
      DEFAULT_QUATERNARY_CORRIDOR,
    ].forEach((route) => {
      expect(route.length).toBeGreaterThan(3);
      route.forEach((coord) => {
        expect(coord).toHaveLength(2);
        expect(typeof coord[0]).toBe('number');
        expect(typeof coord[1]).toBe('number');
      });
    });
  });

  it('should define disruption zones on primary corridor', () => {
    expect(DISRUPTION_ZONES.length).toBeGreaterThanOrEqual(2);
    expect(DISRUPTION_ZONES[0].affectedRoute).toBeDefined();
    expect(DISRUPTION_ZONES[1].affectedRoute).toBeDefined();
  });

  it('should calculate realistic haversine distance between hubs', () => {
    const hub1 = PRESET_HUBS[0].coords;
    const hub2 = PRESET_HUBS[1].coords;
    const distance = calculateHaversineDistanceKm(hub1, hub2);
    expect(distance).toBeGreaterThan(15);
    expect(distance).toBeLessThan(80);
  });

  it('should handle invalid or identical inputs safely in calculateHaversineDistanceKm', () => {
    expect(calculateHaversineDistanceKm(null, null)).toBe(33.8);
    expect(calculateHaversineDistanceKm([13.08, 80.29], [13.08, 80.29])).toBeGreaterThanOrEqual(1.0);
  });

  it('should calculate orthogonal bypass points dynamically', () => {
    const start = [13.0838, 80.2980];
    const dest = [12.8350, 79.9500];
    const bypass = calculateOrthogonalBypassPoint(start, dest);
    expect(bypass).toHaveLength(2);
    expect(typeof bypass[0]).toBe('number');
    expect(typeof bypass[1]).toBe('number');
  });

  it('should interpolate coordinates along polyline dynamically', () => {
    const coord = interpolatePolylineCoordinate(DEFAULT_PRIMARY_ROUTE, 0.5);
    expect(coord).toHaveLength(2);
    expect(coord[0]).toBeGreaterThan(12.5);
    expect(coord[0]).toBeLessThan(13.5);
  });

  it('should generate curved route polylines', () => {
    const p1 = [13.0838, 80.2980];
    const p2 = [12.8350, 79.9500];
    const curved = generateCurvedRoute(p1, p2);
    expect(curved.length).toBe(7);
    expect(curved[0]).toEqual(p1);
    expect(curved[curved.length - 1]).toEqual(p2);

    const detoured = generateCurvedRoute(p1, p2, [13.04, 80.05]);
    expect(detoured.length).toBe(5);
  });
});
