"use client";

import { MapView } from "./map-view";

interface MapWrapperProps {
  className?: string;
}

export function MapWrapper({ className }: MapWrapperProps) {
  return <MapView className={className} />;
}