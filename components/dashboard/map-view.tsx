"use client";

import { GoogleMap, useJsApiLoader } from "@react-google-maps/api";

interface MapViewProps {
  className?: string;
}

export function MapView({ className }: MapViewProps) {
  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
  });

  const defaultCenter = { lat: 34.1083, lng: -117.2898 };

  if (!isLoaded) {
    return (
      <div className={className || "h-[500px] w-full rounded-lg border flex items-center justify-center bg-muted"}>
        <p>Loading map...</p>
      </div>
    );
  }

  return (
    <div className={className || "h-[500px] w-full rounded-lg overflow-hidden border"}>
      <GoogleMap
        mapContainerClassName="h-full w-full"
        center={defaultCenter}
        zoom={12}
        options={{
          zoomControl: true,
          mapTypeControl: true,
          streetViewControl: false,
          fullscreenControl: true,
        }}
      />
    </div>
  );
}