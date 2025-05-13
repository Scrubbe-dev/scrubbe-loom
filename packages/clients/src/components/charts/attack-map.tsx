'use client';

import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { useTheme } from 'next-themes';
import { ComponentType } from 'react';

// Dynamically import the Globe component with SSR disabled
const Globe = dynamic(
  //@ts-ignore
  () => import('react-globe').then((mod) => mod.Globe),
  { ssr: false }
);

// Types for GeoIP and Attack Data
interface GeoIP {
  latitude: number;
  longitude: number;
  country?: string;
  city?: string;
}

interface AttackData {
  geoip: GeoIP;
  severity: number;
  timestamp?: string;
  source?: string;
}

interface GlobePoint {
  lat: number;
  lng: number;
  color: string;
  size: number;
  label?: string;
}

interface AttackMapProps {
  data: AttackData[];
  height?: number;
  initialZoom?: number;
  onPointClick?: (attack: AttackData) => void;
}

export function AttackMap({ 
  data, 
  height = 600, 
  initialZoom = 1.5,
  onPointClick 
}: AttackMapProps) {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Refs for required Globe component props
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Validate and convert attack data to points
  const points: GlobePoint[] = (() => {
    try {
      return data.map((attack) => {
        // Validate required coordinates
        if (!attack.geoip?.latitude || !attack.geoip?.longitude) {
          console.warn('Invalid attack data:', attack);
          return null;
        }
        
        // Determine point color based on severity
        const color = attack.severity > 3 ? '#ef4444' : '#f59e0b';
        
        // Create point with additional metadata
        return {
          lat: attack.geoip.latitude,
          lng: attack.geoip.longitude,
          color,
          size: 0.5 + (attack.severity * 0.1),
          label: attack.geoip.city || attack.geoip.country,
        };
      }).filter(Boolean) as GlobePoint[];
    } catch (err) {
      setError('Failed to process attack data');
      console.error(err);
      return [];
    }
  })();

  // Determine initial coordinates
  const initialCoordinates: [number, number] = points.length > 0
    ? [points[0].lat, points[0].lng]
    : [0, 0];

  // Render loading or error states
  if (!mounted) {
    return (
      <div className={`w-full h-[${height}px] flex items-center justify-center bg-muted rounded-lg`}>
        <p>Loading attack visualization...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`w-full h-[${height}px] flex items-center justify-center bg-muted rounded-lg text-red-500`}>
        <p>{error}</p>
      </div>
    );
  }

  // No attack data handling
  if (points.length === 0) {
    return (
      <div className={`w-full h-[${height}px] flex items-center justify-center bg-muted rounded-lg`}>
        <p>No attack data available</p>
      </div>
    );
  }

  return (
    <div className={`w-full h-[${height}px] bg-muted rounded-lg relative`}>
      {/* Tooltip container */}
      <div ref={tooltipRef} className="absolute z-10 pointer-events-none"></div>
      
      <Globe
        canvasElement={canvasRef.current as HTMLCanvasElement}
        tooltipElement={tooltipRef.current as HTMLDivElement || null }
        initialCoordinates={initialCoordinates}
        textures={{
          globeBackgroundTexture: null,
          globeCloudsTexture: null,
          globeTexture: null,
        }}
      />
      
      {/* Hidden canvas element */}
      <canvas ref={canvasRef} className="hidden"></canvas>
    </div>
  );
}