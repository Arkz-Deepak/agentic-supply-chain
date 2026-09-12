// Logistics Hubs and Corridors centered on Chennai Port & Regional Hubs
export const PRESET_HUBS = [
  {
    id: 'CHENNAI_PORT',
    name: 'Chennai Port International Container Terminal (Gate 1)',
    shortName: 'Chennai Port',
    coords: [13.0838, 80.2980],
  },
  {
    id: 'ORAGADAM_AUTO',
    name: 'Oragadam Mega Industrial Corridor (SIPCOT Auto Cluster)',
    shortName: 'Oragadam Logistics Park',
    coords: [12.8350, 79.9500],
  },
  {
    id: 'SRI_CITY',
    name: 'Sri City Multi-Modal Integrated SEZ Terminal (North Corridor)',
    shortName: 'Sri City',
    coords: [13.5280, 80.0250],
  },
  {
    id: 'ENNORE_PORT',
    name: 'Kamarajar Ennore Port Maritime Gateway',
    shortName: 'Ennore Port',
    coords: [13.2620, 80.3250],
  },
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
];

// Primary corridor: Chennai Port to Oragadam Industrial Corridor (NH-48 / Chennai Bypass)
export const DEFAULT_PRIMARY_ROUTE = [
  [13.0838, 80.2980], // Chennai Port Container Gate 1 (Rajaji Salai)
  [13.0780, 80.2650], // Chennai Central / Poonamallee High Road
  [13.0710, 80.2150], // Koyambedu Intermodal Hub
  [13.0640, 80.1650], // Maduravoyal Elevated Freight Corridor Link
  [13.0350, 80.1150], // Porur / Chennai Bypass Flyover Junction
  [12.9850, 80.0800], // Tambaram-Mudichur Outer Arterial
  [12.9150, 80.0150], // Padappai Logistics Link
  [12.8350, 79.9500], // Oragadam Mega Auto Cluster (SIPCOT Industrial Zone)
];

// Reroute corridor: Chennai Outer Ring Road (ORR Green Express Bypass)
export const DEFAULT_REROUTE_CORRIDOR = [
  [13.0838, 80.2980], // Chennai Port Container Gate 1
  [13.1250, 80.2650], // Vyasarpadi / Inner Ring Link
  [13.1150, 80.1750], // Puzhal Outer Ring Link
  [13.0450, 80.0550], // Thirumazhisai ORR Expressway Interchange
  [12.9450, 79.9950], // Sriperumbudur Automotive Logistics Link
  [12.8350, 79.9500], // Oragadam Mega Auto Cluster
];

// Tertiary corridor: Minjur - Vandalur Outer Expressway Link
export const DEFAULT_TERTIARY_CORRIDOR = [
  [13.0838, 80.2980], // Chennai Port
  [13.1400, 80.2900], // Tondiarpet Maritime Arterial
  [13.1800, 80.2400], // Manali Industrial Belt
  [13.0900, 80.0800], // Pattabiram Logistics Link
  [12.9900, 79.9800], // Sunguvarchatram Industrial Arterial
  [12.8350, 79.9500], // Oragadam Logistics Park
];

// Quaternary corridor: Red Hills / Kanchipuram Outer Perimeter
export const DEFAULT_QUATERNARY_CORRIDOR = [
  [13.0838, 80.2980], // Chennai Port
  [13.1900, 80.1900], // Red Hills Perimeter
  [13.1000, 80.0100], // Thiruvallur Freight Arterial
  [12.9300, 79.9200], // Walajabad South Link
  [12.8350, 79.9500], // Oragadam Logistics Park
];

// Disruption Zone coordinates
export const DISRUPTION_ZONES = [
  {
    id: 'chennai_maduravoyal_block',
    center: [13.0640, 80.1650], // Maduravoyal Sector
    radiusMeters: 2500,
    severity: 'CRITICAL',
    name: 'Maduravoyal Freight Corridor Multi-Vehicle Collision',
    affectedRoute: 'route_primary',
    details: 'Multi-vehicle collision & freight tanker obstruction on arterial carriageway.',
  },
  {
    id: 'porur_secondary_block',
    center: [13.0350, 80.1150], // Porur Bypass Junction
    radiusMeters: 2000,
    severity: 'CRITICAL',
    name: 'Porur Bypass Arterial Secondary Disruption',
    affectedRoute: 'route_101_express',
    details: 'Reported secondary waterlogging & heavy vehicle breakdown.',
  },
];

/**
 * Calculate approximate driving distance using Haversine formula with road winding factor.
 */
export function calculateHaversineDistanceKm(coord1, coord2) {
  if (!coord1 || !coord2) return 33.8;
  let [lat1, lon1] = coord1;
  let [lat2, lon2] = coord2;

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
 * Calculates a dynamic orthogonal (perpendicular) bypass waypoint offset from the midpoint
 * of two points (or around a hazard). Works anywhere in the world.
 */
export function calculateOrthogonalBypassPoint(start, end, hazard = null, offsetRatio = 0.04) {
  if (!start || !end) return [13.0450, 80.0550];
  const [lat1, lon1] = start;
  const [lat2, lon2] = end;

  const baseLat = hazard ? hazard[0] : (lat1 + lat2) / 2;
  const baseLon = hazard ? hazard[1] : (lon1 + lon2) / 2;

  const dLat = lat2 - lat1;
  const dLon = lon2 - lon1;

  const perpLat = -dLon * offsetRatio;
  const perpLon = dLat * offsetRatio;

  return [
    Math.round((baseLat + perpLat) * 10000) / 10000,
    Math.round((baseLon + perpLon) * 10000) / 10000,
  ];
}

/**
 * Finds the exact interpolated [lat, lon] coordinate along any polyline at fraction (0.0 to 1.0).
 */
export function interpolatePolylineCoordinate(polyline, fraction = 0.35) {
  if (!polyline || polyline.length === 0) return [13.0640, 80.1650];
  if (polyline.length === 1) return polyline[0];

  const clampedFraction = Math.max(0.05, Math.min(0.95, fraction));
  const totalSegments = polyline.length - 1;
  const exactIndex = clampedFraction * totalSegments;
  const segmentIdx = Math.floor(exactIndex);
  const segProgress = exactIndex - segmentIdx;

  const p1 = polyline[segmentIdx] || polyline[0];
  const p2 = polyline[segmentIdx + 1] || polyline[polyline.length - 1];

  const lat = p1[0] + (p2[0] - p1[0]) * segProgress;
  const lon = p1[1] + (p2[1] - p1[1]) * segProgress;
  return [Math.round(lat * 10000) / 10000, Math.round(lon * 10000) / 10000];
}

/**
 * Generate an interpolated polyline path between any two [lat, lng] points
 * with realistic curvature for mapping.
 */
export function generateCurvedRoute(start, end, intermediateDetour = null) {
  if (!start || !end) return [];
  const [lat1, lng1] = start;
  const [lat2, lng2] = end;

  if (intermediateDetour) {
    const [dLat, dLng] = intermediateDetour;
    const p1 = [lat1, lng1];
    const p2 = [(lat1 * 2 + dLat) / 3, (lng1 * 2 + dLng) / 3];
    const p3 = [dLat, dLng];
    const p4 = [(dLat + lat2 * 2) / 3, (dLng + lng2 * 2) / 3];
    const p5 = [lat2, lng2];
    return [p1, p2, p3, p4, p5];
  }

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
