import React, { useEffect, useState, useRef, useMemo } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  Circle,
  useMapEvents,
  useMap,
} from 'react-leaflet';
import L from 'leaflet';
import { Crosshair, MapPin, Navigation, Compass, Layers } from 'lucide-react';

// Custom SVG HTML Icons for Leaflet (Light Theme Optimized)
const createCustomIcon = (color, label, pulse = false) => {
  return L.divIcon({
    className: 'custom-leaflet-marker',
    html: `
      <div style="position: relative; display: flex; flex-direction: column; align-items: center;">
        ${
          pulse
            ? `<div style="position: absolute; top: 0; width: 36px; height: 36px; border-radius: 50%; background: ${color}; opacity: 0.35; animation: sky-pulse 2s infinite;"></div>`
            : ''
        }
        <div style="
          width: 32px; 
          height: 32px; 
          border-radius: 50%; 
          background: #FFFFFF; 
          border: 2.5px solid ${color}; 
          box-shadow: 0 4px 14px rgba(0,0,0,0.18), 0 0 10px ${color}40; 
          display: flex; 
          align-items: center; 
          justify-content: center;
          color: ${color};
          font-weight: 800;
          font-size: 12px;
          font-family: 'Inter', sans-serif;
          z-index: 2;
        ">
          ${label}
        </div>
        <div style="width: 3px; height: 10px; background: ${color}; border-radius: 1px;"></div>
      </div>
    `,
    iconSize: [36, 44],
    iconAnchor: [18, 44],
    popupAnchor: [0, -42],
  });
};

// Custom Truck Marker with forward-pointing navigation chevron and stable status badge
const createTruckIcon = (isHalted = false, isBypass = false) => {
  const borderColor = isHalted ? '#E11D48' : isBypass ? '#059669' : '#0284C7';
  const shadowColor = isHalted
    ? 'rgba(225, 29, 72, 0.45)'
    : isBypass
    ? 'rgba(5, 150, 105, 0.45)'
    : 'rgba(2, 132, 199, 0.45)';

  return L.divIcon({
    className: 'truck-marker',
    html: `
      <div style="position: relative; display: flex; flex-direction: column; align-items: center; pointer-events: auto;">
        ${
          isHalted
            ? `<div style="position: absolute; top: -5px; width: 46px; height: 46px; border-radius: 50%; border: 2px solid #E11D48; animation: radar-pulse 1.2s infinite;"></div>`
            : ''
        }
        <!-- Directional Vehicle Puck (Rotated smoothly along track) -->
        <div class="truck-heading-puck" style="
          width: 38px;
          height: 38px;
          background: #FFFFFF;
          border: 2.5px solid ${borderColor};
          border-radius: 50%;
          box-shadow: 0 4px 14px ${shadowColor};
          display: flex;
          align-items: center;
          justify-content: center;
          transform: rotate(0deg);
          transition: transform 0.1s linear;
          position: relative;
        ">
          <!-- Forward navigation chevron pointing along track -->
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style="transform: translateY(-1px);">
            <path d="M12 2.5L4 19.5L12 15.5L20 19.5L12 2.5Z" fill="${borderColor}" stroke="#FFFFFF" stroke-width="1.5" stroke-linejoin="round"/>
          </svg>
        </div>

        <!-- Stable Horizontal Status Pill (Does NOT spin) -->
        <div style="
          margin-top: 3px;
          background: #FFFFFF;
          border: 1.5px solid ${borderColor};
          border-radius: 5px;
          padding: 1px 6px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 9px;
          font-weight: 700;
          color: ${borderColor};
          white-space: nowrap;
          box-shadow: 0 2px 6px rgba(0,0,0,0.12);
        ">
          ${isHalted ? '⚠️ HALTED' : isBypass ? 'BYPASS 101' : 'TRK-8821'}
        </div>
      </div>
    `,
    iconSize: [44, 56],
    iconAnchor: [22, 19],
  });
};

// Map click handler to set Start and End points
function MapClickHandler({ settingPointType, onPointSelected }) {
  useMapEvents({
    click(e) {
      if (settingPointType) {
        onPointSelected(settingPointType, [e.latlng.lat, e.latlng.lng]);
      }
    },
  });
  return null;
}

// Auto-fitter to pan/zoom smoothly with strict bounds sanitization
function RouteBoundsFitter({ points }) {
  const map = useMap();
  useEffect(() => {
    if (!points || !Array.isArray(points) || points.length < 2) return;

    try {
      // Sanitize and validate every coordinate pair
      const validPoints = points
        .filter((pt) => Array.isArray(pt) && pt.length >= 2 && !isNaN(pt[0]) && !isNaN(pt[1]))
        .map(([lat, lng]) => {
          // Safeguard: detect inverted [lng, lat] (India is lat ~20, lng ~85)
          if (lat > 50 && lng < 40) {
            return [lng, lat];
          }
          return [lat, lng];
        })
        .filter(([lat, lng]) => lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180);

      if (validPoints.length >= 2) {
        const bounds = L.latLngBounds(validPoints);

        // Sanity check: Ensure bounds span is reasonable for a regional corridor (< 3 degrees)
        const latSpan = Math.abs(bounds.getNorth() - bounds.getSouth());
        const lngSpan = Math.abs(bounds.getEast() - bounds.getWest());

        if (latSpan < 4.0 && lngSpan < 4.0) {
          map.fitBounds(bounds, {
            padding: [50, 50],
            maxZoom: 14,
            animate: true,
          });
        }
      }
    } catch (err) {
      console.warn('Fit bounds error safely caught:', err);
    }
  }, [points, map]);
  return null;
}

// Calculate bearing angle between two coordinates
function calculateBearing(startLat, startLng, destLat, destLng) {
  const startLatRad = (startLat * Math.PI) / 180;
  const startLngRad = (startLng * Math.PI) / 180;
  const destLatRad = (destLat * Math.PI) / 180;
  const destLngRad = (destLng * Math.PI) / 180;

  const y = Math.sin(destLngRad - startLngRad) * Math.cos(destLatRad);
  const x =
    Math.cos(startLatRad) * Math.sin(destLatRad) -
    Math.sin(startLatRad) * Math.cos(destLatRad) * Math.cos(destLngRad - startLngRad);

  let brng = (Math.atan2(y, x) * 180) / Math.PI;
  return (brng + 360) % 360;
}

// Continuous angle unwrapping to prevent 360° reverse spin
function unwrapAngle(target, current) {
  let diff = (target - current) % 360;
  if (diff < -180) diff += 360;
  if (diff > 180) diff -= 360;
  return current + diff;
}

export default function MapView({
  startPoint,
  destinationPoint,
  primaryPolyline,
  reroutePolyline,
  disruptionState, // 'idle' | 'detected' | 'rerouting' | 'resolved'
  disruptionZones,
  settingPointType,
  setSettingPointType,
  onPointSelected,
  activeHazard = null,
}) {
  const startIcon = useMemo(() => createCustomIcon('#059669', 'A', true), []);
  const destIcon = useMemo(() => createCustomIcon('#0284C7', 'B', true), []);

  // Center around Bhubaneswar & IIT Bhubaneswar
  const defaultCenter = [20.22, 85.76];

  // Active path for the truck animation
  const activePath = useMemo(() => {
    if (disruptionState === 'resolved' && reroutePolyline && reroutePolyline.length > 1) {
      return reroutePolyline;
    }
    return primaryPolyline;
  }, [disruptionState, reroutePolyline, primaryPolyline]);

  // Animated truck state & direct marker ref for jitter-free 60fps tracking
  const [truckPos, setTruckPos] = useState(null);
  const truckMarkerRef = useRef(null);
  const currentHeadingRef = useRef(0);
  const progressRef = useRef(0.0);
  const animFrameRef = useRef(null);

  // Initialize truck position
  useEffect(() => {
    if (activePath && activePath.length > 0) {
      setTruckPos(activePath[0]);
    }
  }, [activePath]);

  // Smooth, Realistic GPS Animation Loop along active road polyline
  useEffect(() => {
    if (!activePath || activePath.length < 2) return;

    let lastTime = performance.now();

    const animateTruck = (currentTime) => {
      const delta = (currentTime - lastTime) / 1000;
      lastTime = currentTime;

      // Realistic relaxed driving speed
      const baseSpeed = disruptionState === 'resolved' ? 0.011 : 0.0085;

      if (disruptionState === 'detected') {
        // Truck halts smoothly before the Khandagiri hazard zone (~35% into primary route)
        const haltTarget = 0.35;
        if (progressRef.current < haltTarget) {
          progressRef.current = Math.min(haltTarget, progressRef.current + delta * 0.03);
        } else if (progressRef.current > haltTarget + 0.05) {
          progressRef.current = haltTarget;
        }
      } else {
        progressRef.current = (progressRef.current + delta * baseSpeed) % 1.0;
      }

      // Compute position along polyline segments
      const totalSegments = activePath.length - 1;
      const exactIndex = progressRef.current * totalSegments;
      const segmentIdx = Math.floor(exactIndex);
      const segmentProgress = exactIndex - segmentIdx;

      const p1 = activePath[segmentIdx] || activePath[0];
      const p2 = activePath[segmentIdx + 1] || activePath[activePath.length - 1];

      if (p1 && p2) {
        const curLat = p1[0] + (p2[0] - p1[0]) * segmentProgress;
        const curLng = p1[1] + (p2[1] - p1[1]) * segmentProgress;

        // Sample lookahead point 3-4 waypoints down the active road for smooth stable trajectory
        const lookAheadIdx = Math.min(activePath.length - 1, segmentIdx + 4);
        const pAhead = activePath[lookAheadIdx] || p2;
        const targetBearing = calculateBearing(curLat, curLng, pAhead[0], pAhead[1]);

        // Unwrapped angle + exponential moving average filter (no jitter, no wild 360 spin)
        const unwrappedTarget = unwrapAngle(targetBearing, currentHeadingRef.current);
        currentHeadingRef.current += (unwrappedTarget - currentHeadingRef.current) * 0.12;

        // Direct DOM update for 60fps silky smooth glide without Leaflet DOM destruction
        if (truckMarkerRef.current) {
          truckMarkerRef.current.setLatLng([curLat, curLng]);
          const el = truckMarkerRef.current.getElement();
          if (el) {
            const puck = el.querySelector('.truck-heading-puck');
            if (puck) {
              puck.style.transform = `rotate(${Math.round(currentHeadingRef.current)}deg)`;
            }
          }
        }
      }

      animFrameRef.current = requestAnimationFrame(animateTruck);
    };

    animFrameRef.current = requestAnimationFrame(animateTruck);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [activePath, disruptionState]);

  const isHalted = disruptionState === 'detected';
  const isBypass = disruptionState === 'resolved';

  // Recreated ONLY on phase status changes, not 60 times/second
  const truckMarkerIcon = useMemo(() => {
    return createTruckIcon(isHalted, isBypass);
  }, [isHalted, isBypass]);

  return (
    <div className="relative w-full h-full min-h-[500px] rounded-2xl overflow-hidden glass-panel border border-sky-200/80 shadow-[0_8px_30px_rgba(14,165,233,0.12)]">
      {/* Top Floating Control Overlay */}
      <div className="absolute top-3 left-3 right-3 z-[400] flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        <div className="flex items-center gap-2 pointer-events-auto bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-xl border border-sky-200 text-xs font-sans shadow-md">
          <Crosshair className="h-4 w-4 text-sky-600 animate-pulse" />
          <span className="text-slate-600 font-medium">Click Map to set:</span>
          <button
            onClick={() => setSettingPointType(settingPointType === 'start' ? null : 'start')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition flex items-center gap-1 ${
              settingPointType === 'start'
                ? 'bg-emerald-600 text-white shadow-[0_0_12px_rgba(5,150,105,0.4)]'
                : 'bg-emerald-50 text-emerald-700 border border-emerald-300 hover:bg-emerald-100'
            }`}
          >
            <span>🟢 Origin (A)</span>
          </button>
          <button
            onClick={() => setSettingPointType(settingPointType === 'dest' ? null : 'dest')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition flex items-center gap-1 ${
              settingPointType === 'dest'
                ? 'bg-sky-600 text-white shadow-[0_0_12px_rgba(2,132,199,0.4)]'
                : 'bg-sky-50 text-sky-700 border border-sky-300 hover:bg-sky-100'
            }`}
          >
            <span>🔵 Destination (B)</span>
          </button>
        </div>

        {/* Tactical Route Legend in White & Sky Blue */}
        <div className="hidden sm:flex items-center gap-3 pointer-events-auto bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-sans shadow-md">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-4 rounded bg-sky-500 inline-block shadow-sm"></span>
            <span className="text-slate-700 font-medium">NH-16 Route 99</span>
          </div>
          {disruptionState !== 'idle' && (
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-4 rounded bg-emerald-500 inline-block shadow-[0_0_8px_rgba(16,185,129,0.4)]"></span>
              <span className="text-emerald-700 font-medium">Daya Canal Bypass</span>
            </div>
          )}
          {disruptionState === 'detected' && (
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-rose-500 animate-ping"></span>
              <span className="text-rose-600 font-bold uppercase">
                {activeHazard?.incident_type ? `${activeHazard.incident_type.replace(/_/g, ' ')} ALERT` : 'Khandagiri Blockade'}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Google Maps Light Mode Tile Layer - Clean, Zero Watermarks */}
      <MapContainer
        center={defaultCenter}
        zoom={12}
        scrollWheelZoom={true}
        className="w-full h-full"
      >
        <MapClickHandler
          settingPointType={settingPointType}
          onPointSelected={onPointSelected}
        />

        {/* Clean Google Maps Street Layer (Zero Watermarks) */}
        <TileLayer
          attribution='&copy; <a href="https://maps.google.com">Google Maps</a>'
          url="https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
          maxZoom={20}
        />

        {/* Start Point Marker (A) */}
        {startPoint && (
          <Marker position={startPoint.coords} icon={startIcon}>
            <Popup>
              <div className="p-1 font-sans text-xs">
                <span className="font-bold text-emerald-700">ORIGIN (A):</span>
                <p className="text-slate-900 font-semibold">{startPoint.name}</p>
                <p className="text-[10px] text-slate-500 font-mono">
                  [{startPoint.coords[0].toFixed(4)}, {startPoint.coords[1].toFixed(4)}]
                </p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Destination Marker (B - IIT Bhubaneswar) */}
        {destinationPoint && (
          <Marker position={destinationPoint.coords} icon={destIcon}>
            <Popup>
              <div className="p-1 font-sans text-xs">
                <span className="font-bold text-sky-700">DESTINATION (B):</span>
                <p className="text-slate-900 font-semibold">{destinationPoint.name}</p>
                <p className="text-[10px] text-slate-500 font-mono">
                  [{destinationPoint.coords[0].toFixed(4)}, {destinationPoint.coords[1].toFixed(4)}]
                </p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Primary Route Polyline (Google Maps Style Blue) */}
        {primaryPolyline && primaryPolyline.length > 1 && (
          <>
            <Polyline
              positions={primaryPolyline}
              pathOptions={{
                color: isHalted ? '#F43F5E' : '#0284C7',
                weight: 8,
                opacity: 0.35,
                lineCap: 'round',
                lineJoin: 'round',
              }}
            />
            <Polyline
              positions={primaryPolyline}
              pathOptions={{
                color: isHalted ? '#E11D48' : '#0EA5E9',
                weight: 4.5,
                opacity: 0.95,
                dashArray: isHalted ? '6, 8' : undefined,
              }}
            />
          </>
        )}

        {/* Autonomous Reroute Polyline (Google Maps Style Emerald Green) */}
        {(disruptionState === 'rerouting' || disruptionState === 'resolved') &&
          reroutePolyline &&
          reroutePolyline.length > 1 && (
            <>
              <Polyline
                positions={reroutePolyline}
                pathOptions={{
                  color: '#059669',
                  weight: 9,
                  opacity: 0.35,
                  lineCap: 'round',
                  lineJoin: 'round',
                }}
              />
              <Polyline
                positions={reroutePolyline}
                pathOptions={{
                  color: '#10B981',
                  weight: 5,
                  opacity: 0.95,
                  dashArray: disruptionState === 'rerouting' ? '8, 8' : undefined,
                }}
              />
            </>
          )}

        {/* Disruption Hazard Zone (NH-16 Khandagiri Blockade) */}
        {disruptionState !== 'idle' &&
          disruptionZones?.map((zone) => (
            <React.Fragment key={zone.id}>
              <Circle
                center={zone.center}
                radius={zone.radiusMeters}
                pathOptions={{
                  color: '#E11D48',
                  fillColor: '#F43F5E',
                  fillOpacity: 0.18,
                  weight: 2,
                  dashArray: '4, 6',
                }}
              />
              <Circle
                center={zone.center}
                radius={zone.radiusMeters * 0.45}
                pathOptions={{
                  color: '#BE123C',
                  fillColor: '#E11D48',
                  fillOpacity: 0.4,
                  weight: 2,
                }}
              >
                <Popup>
                  <div className="font-sans text-xs">
                    <span className="font-bold text-rose-700 uppercase">
                      DISRUPTION ZONE &bull; {activeHazard?.incident_type ? activeHazard.incident_type.replace(/_/g, ' ') : 'ACTIVE HAZARD'}
                    </span>
                    <p className="font-semibold text-slate-900">{activeHazard?.location || zone.name}</p>
                    <p className="text-[10px] text-rose-700">{activeHazard?.description || zone.details}</p>
                  </div>
                </Popup>
              </Circle>
            </React.Fragment>
          ))}

        {/* Live Animated Truck Marker (Controlled Calm Pace) */}
        {truckPos && (
          <Marker ref={truckMarkerRef} position={truckPos} icon={truckMarkerIcon}>
            <Popup>
              <div className="font-sans text-xs">
                <span className="font-bold text-sky-700">CARRIER UNIT TRK-8821</span>
                <p className="text-slate-800 font-medium">
                  Destination: {destinationPoint?.shortName || 'IIT Bhubaneswar'}
                </p>
                <p className="text-slate-600 text-[11px] mt-0.5">
                  Status:{' '}
                  {isHalted
                    ? `⚠️ EMERGENCY STOP - ${activeHazard?.incident_type ? activeHazard.incident_type.replace(/_/g, ' ') : 'NH-16 BLOCKED'}`
                    : isBypass
                    ? '🚀 NAVIGATING DAYA CANAL BYPASS'
                    : 'EN ROUTE'}
                </p>
              </div>
            </Popup>
          </Marker>
        )}

        <RouteBoundsFitter
          points={
            disruptionState === 'resolved' && reroutePolyline
              ? reroutePolyline
              : primaryPolyline
          }
        />
      </MapContainer>
    </div>
  );
}
