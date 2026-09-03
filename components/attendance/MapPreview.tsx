'use client';

import { useEffect, useRef } from 'react';

interface MapPreviewProps {
  lat: number;
  lng: number;
}

export default function MapPreview({ lat, lng }: MapPreviewProps) {
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mapRef.current) return;
    // Lazy import Leaflet (client-side only)
    import('leaflet').then((L) => {
      import('leaflet/dist/leaflet.css');

      // Fix default icon paths in Next.js
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      const map = L.map(mapRef.current!, {
        center: [lat, lng],
        zoom: 15,
        zoomControl: false,
        attributionControl: false,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
      }).addTo(map);

      L.marker([lat, lng]).addTo(map);

      return () => {
        map.remove();
      };
    });
  }, [lat, lng]);

  return <div ref={mapRef} className="w-full h-full" />;
}
