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
} from '../data/mockRoutes';

describe('mockRoutes Data and Geometry Utilities', () => {
  it('should define preset hubs with valid lat/lon coordinates', () => {
    expect(PRESET_HUBS.length).toBeGreaterThanOrEqual(4);
    PRESET_HUBS.forEach((hub) => {
      expect(hub.id).toBeDefined();
      expect(hub.coords).toHaveLength(2);
      expect(hub.coords[0]).toBeGreaterThan(18);
      expect(hub.coords[0]).toBeLessThan(23);
      expect(hub.coords[1]).toBeGreaterThan(80);
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
    expect(DISRUPTION_ZONES[0].affectedRoute).toBe('route_99');
    expect(DISRUPTION_ZONES[1].affectedRoute).toBe('route_101_express');
  });

  it('should calculate realistic haversine distance between hubs', () => {
    const bbi = PRESET_HUBS[0].coords;
    const iit = PRESET_HUBS[1].coords;
    const distance = calculateHaversineDistanceKm(bbi, iit);
    expect(distance).toBeGreaterThan(15);
    expect(distance).toBeLessThan(60);
  });

  it('should handle invalid or identical inputs safely in calculateHaversineDistanceKm', () => {
    expect(calculateHaversineDistanceKm(null, null)).toBe(33.8);
    expect(calculateHaversineDistanceKm([20.14, 85.67], [20.14, 85.67])).toBeGreaterThanOrEqual(1.0);
  });

  it('should generate curved route polylines', () => {
    const p1 = [20.301, 85.864];
    const p2 = [20.148, 85.671];
    const curved = generateCurvedRoute(p1, p2);
    expect(curved.length).toBe(7);
    expect(curved[0]).toEqual(p1);
    expect(curved[curved.length - 1]).toEqual(p2);

    const detoured = generateCurvedRoute(p1, p2, [20.25, 85.80]);
    expect(detoured.length).toBe(5);
  });
});
