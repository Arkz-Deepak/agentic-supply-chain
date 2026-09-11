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
import { Crosshair, AlertTriangle, ShieldCheck, MapPin, Navigation } from 'lucide-react';

// Custom SVG HTML Icons for Leaflet
const createCustomIcon = (color, label, pulse = false) => {
  return L.divIcon({
    className: 'custom-leaflet-marker',
    html: `
      <div style="position: relative; display: flex; flex-direction: column; align-items: center;">
        ${
          pulse
            ? `<div style="position: absolute; top: 0; width: 36px; height: 36px; border-radius: 50%; background: ${color}; opacity: 0.35; animation: radar-pulse 1.8s infinite;"></div>`
            : ''
        }
        <div style="
          width: 32px; 
          height: 32px; 
          border-radius: 50%; 
          background: #0B0F19; 
          border: 2px solid ${color}; 
          box-shadow: 0 0 14px ${color}; 
          display: flex; 
          align-items: center; 
          justify-content: center;
          color: ${color};
          font-weight: bold;
          font-size: 11px;
          font-family: 'JetBrains Mono', monospace;
          z-index: 2;
        ">
          ${label}
        </div>
        <div style="width: 2px; height: 10px; background: ${color};"></div>
      </div>
    `,
    iconSize: [36, 44],
    iconAnchor: [18, 44],
    popupAnchor: [0, -42],
  });
};

// Custom Truck Marker with dynamic heading rotation and status aura
const createTruckIcon = (heading = 0, isHalted = false, isBypass = false) => {
  const borderColor = isHalted ? '#F43F5E' : isBypass ? '#10B981' : '#00F0FF';
  const shadowColor = isHalted
    ? 'rgba(244, 63, 94, 0.8)'
    : isBypass
    ? 'rgba(16, 185, 129, 0.8)'
    : 'rgba(0, 240, 255, 0.8)';

  return L.divIcon({
    className: 'truck-marker',
    html: `
      <div style="position: relative; display: flex; flex-direction: column; align-items: center;">
        ${
          isHalted
            ? `<div style="position: absolute; -inset: 6px; border-radius: 50%; border: 2px solid #F43F5E; animation: radar-pulse 1.2s infinite;"></div>`
            : ''
        }
        <div style="
          width: 38px;
          height: 38px;
          background: #0B0F19;
          border: 2px solid ${borderColor};
          border-radius: 10px;
          box-shadow: 0 0 16px ${shadowColor};
          display: flex;
          align-items: center;
          justify-content: center;
          transform: rotate(${heading}deg);
          transition: transform 0.25s ease-out;
        ">
          <span style="font-size: 18px; filter: drop-shadow(0 0 2px rgba(255,255,255,0.8));">🚛</span>
        </div>
        <div style="
          margin-top: 3px;
          background: rgba(11, 15, 25, 0.9);
          border: 1px solid ${borderColor};
          border-radius: 4px;
          padding: 1px 4px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 9px;
          font-weight: bold;
          color: ${borderColor};
          white-space: nowrap;
          box-shadow: 0 2px 6px rgba(0,0,0,0.6);
        ">
          ${isHalted ? 'HALTED' : isBypass ? 'BYPASS 101' : 'TRK-8821'}
        </div>
      </div>
    `,
    iconSize: [44, 56],
    iconAnchor: [22, 28],
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

// Auto-fitter to pan/zoom smoothly when route changes
function RouteBoundsFitter({ points }) {
  const map = useMap();
  useEffect(() => {
    if (points && points.length > 1) {
      try {
        const bounds = L.latLngBounds(points);
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
      } catch (err) {
        console.error('Fit bounds error:', err);
      }
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
}) {
  const startIcon = useMemo(() => createCustomIcon('#10B981', 'A', true), []);
  const destIcon = useMemo(() => createCustomIcon('#00F0FF', 'B', true), []);

  // Center around Bhubaneswar & IIT Bhubaneswar
  const defaultCenter = [20.22, 85.76];

  // Active path for the truck animation
  const activePath = useMemo(() => {
    if (disruptionState === 'resolved' && reroutePolyline && reroutePolyline.length > 1) {
      return reroutePolyline;
    }
    return primaryPolyline;
  }, [disruptionState, reroutePolyline, primaryPolyline]);

  // Animated truck state
  const [truckPos, setTruckPos] = useState(null);
  const [truckHeading, setTruckHeading] = useState(0);
  const progressRef = useRef(0.0);
  const animFrameRef = useRef(null);

  // Initialize or reset truck position
  useEffect(() => {
    if (activePath && activePath.length > 0) {
      setTruckPos(activePath[0]);
    }
  }, [activePath]);

  // Smooth GPS animation loop
  useEffect(() => {
    if (!activePath || activePath.length < 2) return;

    let lastTime = performance.now();

    const animateTruck = (currentTime) => {
      const delta = (currentTime - lastTime) / 1000;
      lastTime = currentTime;

      // When Phase 2 disruption is detected, truck stops immediately right before the hazard!
      // Index 3 is Khandagiri Square (where the storm blockade is). We stop at progress ~0.35
      if (disruptionState === 'detected') {
        const haltTarget = 0.34;
        if (progressRef.current < haltTarget) {
          progressRef.current = Math.min(haltTarget, progressRef.current + delta * 0.15);
        } else if (progressRef.current > haltTarget + 0.05) {
          progressRef.current = haltTarget;
        }
      } else {
        // Normal continuous driving speed
        const speed = disruptionState === 'resolved' ? 0.045 : 0.035;
        progressRef.current = (progressRef.current + delta * speed) % 1.0;
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
        setTruckPos([curLat, curLng]);

        const heading = calculateBearing(p1[0], p1[1], p2[0], p2[1]);
        setTruckHeading(heading);
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

  const truckMarkerIcon = useMemo(() => {
    return createTruckIcon(truckHeading, isHalted, isBypass);
  }, [truckHeading, isHalted, isBypass]);

  return (
    <div className="relative w-full h-full min-h-[500px] rounded-2xl overflow-hidden glass-panel border border-cyan-500/20 shadow-[0_0_35px_rgba(0,0,0,0.6)]">
      {/* Top Floating Control Overlay */}
      <div className="absolute top-3 left-3 right-3 z-[400] flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        <div className="flex items-center gap-2 pointer-events-auto bg-dark-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-cyan-500/30 text-xs font-mono">
          <Crosshair className="h-4 w-4 text-cyber-cyan animate-pulse" />
          <span className="text-slate-300">Set Map Point:</span>
          <button
            onClick={() => setSettingPointType(settingPointType === 'start' ? null : 'start')}
            className={`px-2 py-0.5 rounded transition ${
              settingPointType === 'start'
                ? 'bg-emerald-500 text-black font-bold shadow-[0_0_10px_#10B981]'
                : 'bg-dark-800 text-emerald-400 border border-emerald-500/40 hover:bg-emerald-500/20'
            }`}
          >
            Origin (A)
          </button>
          <button
            onClick={() => setSettingPointType(settingPointType === 'dest' ? null : 'dest')}
            className={`px-2 py-0.5 rounded transition ${
              settingPointType === 'dest'
                ? 'bg-cyber-cyan text-black font-bold shadow-[0_0_10px_#00F0FF]'
                : 'bg-dark-800 text-cyber-cyan border border-cyber-cyan/40 hover:bg-cyan-500/20'
            }`}
          >
            Destination (B)
          </button>
        </div>

        {/* Tactical Route Legend */}
        <div className="hidden sm:flex items-center gap-3 pointer-events-auto bg-dark-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-700/50 text-[11px] font-mono">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-4 rounded bg-blue-500 inline-block"></span>
            <span className="text-slate-300">NH-16 Route 99</span>
          </div>
          {disruptionState !== 'idle' && (
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-4 rounded bg-emerald-400 inline-block shadow-[0_0_8px_#10B981]"></span>
              <span className="text-emerald-300">Daya Canal Bypass</span>
            </div>
          )}
          {disruptionState === 'detected' && (
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-rose-500 animate-ping"></span>
              <span className="text-rose-400 font-bold">Khandagiri Blockade</span>
            </div>
          )}
        </div>
      </div>

      {/* React-Leaflet Map Container */}
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

        {/* High-Tech Dark Matter Tiles */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          subdomains="abcd"
          maxZoom={19}
        />

        {/* Start Point Marker (A) */}
        {startPoint && (
          <Marker position={startPoint.coords} icon={startIcon}>
            <Popup>
              <div className="p-1 font-mono text-xs">
                <span className="font-bold text-emerald-400">ORIGIN:</span>
                <p className="text-slate-800 font-semibold">{startPoint.name}</p>
                <p className="text-[10px] text-slate-500">
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
              <div className="p-1 font-mono text-xs">
                <span className="font-bold text-cyan-500">DESTINATION:</span>
                <p className="text-slate-800 font-semibold">{destinationPoint.name}</p>
                <p className="text-[10px] text-slate-500">
                  [{destinationPoint.coords[0].toFixed(4)}, {destinationPoint.coords[1].toFixed(4)}]
                </p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Primary Route Polyline (NH-16 Route 99) */}
        {primaryPolyline && primaryPolyline.length > 1 && (
          <>
            <Polyline
              positions={primaryPolyline}
              pathOptions={{
                color: isHalted ? '#F43F5E' : '#0072FF',
                weight: 8,
                opacity: 0.35,
                lineCap: 'round',
                lineJoin: 'round',
              }}
            />
            <Polyline
              positions={primaryPolyline}
              pathOptions={{
                color: isHalted ? '#F43F5E' : '#00F0FF',
                weight: 3.5,
                opacity: 0.9,
                dashArray: isHalted ? '6, 8' : undefined,
              }}
            />
          </>
        )}

        {/* Autonomous Reroute Polyline (Route 101 Express - Daya Canal Bypass) */}
        {(disruptionState === 'rerouting' || disruptionState === 'resolved') &&
          reroutePolyline &&
          reroutePolyline.length > 1 && (
            <>
              <Polyline
                positions={reroutePolyline}
                pathOptions={{
                  color: '#10B981',
                  weight: 9,
                  opacity: 0.45,
                  lineCap: 'round',
                  lineJoin: 'round',
                }}
              />
              <Polyline
                positions={reroutePolyline}
                pathOptions={{
                  color: '#34D399',
                  weight: 4,
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
                  color: '#F43F5E',
                  fillColor: '#F43F5E',
                  fillOpacity: 0.22,
                  weight: 2,
                  dashArray: '4, 6',
                }}
              />
              <Circle
                center={zone.center}
                radius={zone.radiusMeters * 0.45}
                pathOptions={{
                  color: '#EF4444',
                  fillColor: '#991B1B',
                  fillOpacity: 0.5,
                  weight: 2,
                }}
              >
                <Popup>
                  <div className="font-mono text-xs">
                    <span className="font-bold text-rose-600">DISRUPTION ZONE:</span>
                    <p className="font-semibold text-slate-800">{zone.name}</p>
                    <p className="text-[10px] text-rose-700">{zone.details}</p>
                  </div>
                </Popup>
              </Circle>
            </React.Fragment>
          ))}

        {/* Live Animated Truck Marker */}
        {truckPos && (
          <Marker position={truckPos} icon={truckMarkerIcon}>
            <Popup>
              <div className="font-mono text-xs">
                <span className="font-bold text-cyan-600">CARRIER UNIT TRK-8821</span>
                <p className="text-slate-800">
                  Target: {destinationPoint?.shortName || 'IIT Bhubaneswar'}
                </p>
                <p className="text-slate-600">
                  Status:{' '}
                  {isHalted
                    ? '⚠️ EMERGENCY STOP - NH-16 BLOCKED'
                    : isBypass
                    ? '🚀 NAVIGATING DAYA BYPASS'
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
