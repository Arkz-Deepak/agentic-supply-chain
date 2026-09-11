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

// Disruption Zone coordinates (Flash flood & highway strike on NH-16 Route 99)
export const DISRUPTION_ZONES = [
  {
    id: 'monsoon_block_99',
    center: [20.2450, 85.7650], // Near Khandagiri / Tamando NH-16 Sector
    radiusMeters: 2800,
    severity: 'CRITICAL',
    name: 'NH-16 Khandagiri Sector Strike & Monsoon Flash Flood',
    affectedRoute: 'route_99',
    details: 'Heavy waterlogging (4ft) & transport strike. NH-16 westbound carriageway impassable.',
  },
];

/**
 * Generate an interpolated polyline path between any two [lat, lng] points
 * with realistic curvature for mapping.
 */
export function generateCurvedRoute(start, end, intermediateDetour = null) {
  if (!start || !end) return [];
  const [lat1, lng1] = start;
  const [lat2, lng2] = end;

  if (intermediateDetour) {
    const p1 = [lat1, lng1];
    const p2 = [(lat1 + intermediateDetour[0]) / 2, (lng1 + intermediateDetour[1]) / 2];
    const p3 = intermediateDetour;
    const p4 = [(intermediateDetour[0] + lat2) / 2, (intermediateDetour[1] + lng2) / 2];
    const p5 = [lat2, lng2];
    return [p1, p2, p3, p4, p5];
  }

  // Smooth 5-point curve
  const midLat = (lat1 + lat2) / 2 + (lng2 - lng1) * 0.08;
  const midLng = (lng1 + lng2) / 2 - (lat2 - lat1) * 0.08;
  return [
    [lat1, lng1],
    [(lat1 + midLat) / 2, (lng1 + midLng) / 2],
    [midLat, midLng],
    [(midLat + lat2) / 2, (midLng + lat2) / 2],
    [lat2, lng2],
  ];
}
