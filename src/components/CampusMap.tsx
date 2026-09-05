"use client";

import { useEffect, useRef } from "react";
import type { Map as LeafletMap } from "leaflet";
import "leaflet/dist/leaflet.css";

export type CampusMapPoint = {
  title: string;
  lat: number;
  lng: number;
  mapsUrl?: string;
};

export function CampusMap({ points }: { points: CampusMapPoint[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);

  useEffect(() => {
    if (!containerRef.current || points.length === 0) return;

    let cancelled = false;

    void (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !containerRef.current) return;

      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }

      const map = L.map(containerRef.current, {
        scrollWheelZoom: false,
      });
      mapRef.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      const icon = L.divIcon({
        className: "",
        html: `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="40" viewBox="0 0 28 40" aria-hidden="true">
          <path fill="#e11d48" stroke="#9f1239" stroke-width="1" d="M14 0C6.268 0 0 6.268 0 14c0 10.5 14 26 14 26s14-15.5 14-26C28 6.268 21.732 0 14 0z"/>
          <circle fill="#fff" cx="14" cy="14" r="5.5"/>
        </svg>`,
        iconSize: [28, 40],
        iconAnchor: [14, 40],
        popupAnchor: [0, -36],
      });

      const latLngs = points.map((p) => L.latLng(p.lat, p.lng));
      points.forEach((point) => {
        const popup = point.mapsUrl
          ? `<strong>${point.title}</strong><br/><a href="${point.mapsUrl}" target="_blank" rel="noopener noreferrer">Open in Google Maps</a>`
          : `<strong>${point.title}</strong>`;
        L.marker([point.lat, point.lng], { icon }).addTo(map).bindPopup(popup);
      });

      if (latLngs.length === 1) {
        map.setView(latLngs[0], 15);
      } else {
        map.fitBounds(L.latLngBounds(latLngs), { padding: [48, 48], maxZoom: 12 });
      }

      requestAnimationFrame(() => map.invalidateSize());
    })();

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [points]);

  return (
    <div
      ref={containerRef}
      className="h-[360px] w-full"
      role="img"
      aria-label="Map showing CMUD campus locations"
    />
  );
}
