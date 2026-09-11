// Logistics Hubs and Corridors centered around IIT Bhubaneswar, Odisha
export const PRESET_HUBS = [
  {
    id: 'BBI_DEPOT',
    name: 'Bhubaneswar Central Freight Hub (Rasulgarh NH-16)',
    shortName: 'Bhubaneswar Depot',
    coords: [20.3010, 85.8640],
  },
  {
    id: 'IIT_BBS',
    name: 'IIT Bhubaneswar Technology & Research Park (Argul Campus)',
    shortName: 'IIT Bhubaneswar',
    coords: [20.1484, 85.6711],
  },
  {
    id: 'PARADIP_PORT',
    name: 'Paradip Port International Maritime Cargo Terminal',
    shortName: 'Paradip Port',
    coords: [20.2644, 86.6698],
  },
  {
    id: 'KHURDA_JUNCTION',
    name: 'Khurda Road Intermodal Freight Terminal',
    shortName: 'Khurda Hub',
    coords: [20.1820, 85.6200],
  },
  {
    id: 'CUTTACK_CHOUDWAR',
    name: 'Cuttack-Choudwar Heavy Industrial Logistics Zone',
    shortName: 'Cuttack Terminal',
    coords: [20.5050, 85.8850],
  },
];

// Primary corridor: Route 99 (Via NH-16 through Khandagiri & Pitapalli)
export const DEFAULT_PRIMARY_ROUTE = [
  [20.3010, 85.8640], // Rasulgarh Hub
  [20.2920, 85.8450], // Vani Vihar Square
  [20.2780, 85.8150], // Jayadev Vihar / Baramunda
  [20.2580, 85.7850], // Khandagiri Square (Route 99 bottleneck)
  [20.2350, 85.7450], // Tamando Junction
  [20.2100, 85.7000], // Pitapalli NH-16 Intersection
  [20.1700, 85.6800], // Jatni Outer Ring Road
  [20.1484, 85.6711], // IIT Bhubaneswar Main Campus (Argul)
];

// Reroute corridor: Route 101 Express (Daya Canal / Sundarpada Southern Green Bypass)
export const DEFAULT_REROUTE_CORRIDOR = [
  [20.3010, 85.8640], // Rasulgarh Hub
  [20.2650, 85.8550], // Cuttack-Puri Bypass Junction
  [20.2350, 85.8350], // Daya West Canal Highway Link
  [20.1980, 85.7950], // Sundarpada Logistics Arterial
  [20.1680, 85.7450], // Harirajpur - Jatni Eastern Arterial
  [20.1550, 85.7050], // Jatni South Agricultural Bypass
  [20.1484, 85.6711], // IIT Bhubaneswar Main Campus (Argul)
];

// Tertiary corridor: Route 202 (Cuttack-Puri Outer Expressway & Pipili Bypass)
export const DEFAULT_TERTIARY_CORRIDOR = [
  [20.3010, 85.8640], // Rasulgarh Hub
  [20.2450, 85.8650], // Uttara Junction
  [20.1900, 85.8500], // Pipili Outer Link
  [20.1700, 85.8200], // Pipili - Jatni Freight Corridor
  [20.1550, 85.7400], // Jatni Eastern Bypass
  [20.1484, 85.6711], // IIT Bhubaneswar Main Campus (Argul)
];

// Quaternary corridor: Route 303 (Chandaka Forest Logistics Corridor)
export const DEFAULT_QUATERNARY_CORRIDOR = [
  [20.3010, 85.8640], // Rasulgarh Hub
  [20.3200, 85.8200], // Infocity / Patia Arterial
  [20.2950, 85.7500], // Chandaka Perimeter Waypoint
  [20.2500, 85.7100], // Western Forest Arterial
  [20.1900, 85.6800], // Jatni North Link
  [20.1484, 85.6711], // IIT Bhubaneswar Main Campus (Argul)
];

// Disruption Zone coordinates (Flash flood & highway strike on NH-16 Route 99)
export const DISRUPTION_ZONES = [
  {
    id: 'monsoon_block_99',
    center: [20.2450, 85.7650], // Near Khandagiri / Tamando NH-16 Sector
    radiusMeters: 2800,
    severity: 'CRITICAL',
    name: 'NH-16 Khandagiri Sector Strike & Roadblock',
    affectedRoute: 'route_99',
    details: 'Multi-vehicle collision & transport strike. NH-16 westbound carriageway impassable.',
  },
  {
    id: 'block_101',
    center: [20.2100, 85.8150], // Daya Canal / State Highway 1 Link
    radiusMeters: 2200,
    severity: 'CRITICAL',
    name: 'Daya Canal / SH-1 Secondary Disruption',
    affectedRoute: 'route_101_express',
    details: 'Reported secondary obstruction on State Highway 1 / Daya Canal route.',
  },
];

/**
 * Calculate approximate driving distance using Haversine formula with road winding factor.
 */
export function calculateHaversineDistanceKm(coord1, coord2) {
  if (!coord1 || !coord2) return 33.8;
  let [lat1, lon1] = coord1;
  let [lat2, lon2] = coord2;
  if (lat1 > 50 && lon1 < 40) [lat1, lon1] = [lon1, lat1];
  if (lat2 > 50 && lon2 < 40) [lat2, lon2] = [lon2, lat2];

  const R = 6371; // km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const roadFactor = 1.28; // road curvature multiplier
  const dist = Math.max(1.0, Math.round(R * c * roadFactor * 10) / 10);
  return dist;
}

/**
 * Generate an interpolated polyline path between any two [lat, lng] points
 * with realistic curvature for mapping.
 */
export function generateCurvedRoute(start, end, intermediateDetour = null) {
  if (!start || !end) return [];
  let [lat1, lng1] = start;
  let [lat2, lng2] = end;

  // Safeguard: for Odisha/India, lat is ~20, lng is ~85. Fix if inverted.
  if (lat1 > 50 && lng1 < 40) [lat1, lng1] = [lng1, lat1];
  if (lat2 > 50 && lng2 < 40) [lat2, lng2] = [lng2, lat2];

  if (intermediateDetour) {
    let [dLat, dLng] = intermediateDetour;
    if (dLat > 50 && dLng < 40) [dLat, dLng] = [dLng, dLat];
    const p1 = [lat1, lng1];
    const p2 = [(lat1 + dLat) / 2, (lng1 + dLng) / 2];
    const p3 = [dLat, dLng];
    const p4 = [(dLat + lat2) / 2, (dLng + lng2) / 2];
    const p5 = [lat2, lng2];
    return [p1, p2, p3, p4, p5];
  }

  // Smooth 7-point realistic road curve with guaranteed valid coordinates
  const midLat = (lat1 + lat2) / 2 + (lng2 - lng1) * 0.04;
  const midLng = (lng1 + lng2) / 2 - (lat2 - lat1) * 0.04;
  return [
    [lat1, lng1],
    [(lat1 * 2 + midLat) / 3, (lng1 * 2 + midLng) / 3],
    [(lat1 + midLat) / 2, (lng1 + midLng) / 2],
    [midLat, midLng],
    [(midLat + lat2) / 2, (midLng + lng2) / 2],
    [(midLat + lat2 * 2) / 3, (midLng + lng2 * 2) / 3],
    [lat2, lng2],
  ];
}
