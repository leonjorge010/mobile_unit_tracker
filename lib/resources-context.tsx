"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { collection, query, orderBy, where, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useEvents } from "@/lib/events-context";
import { MobileUnit, Location } from "@/lib/types";

interface Incident {
  id: string;
  mobileUnits: string[];
  status: string;
  incidentNumber: string;
}

interface ResourcesContextType {
  mobileUnits: MobileUnit[];
  locations: Location[];
  incidents: Incident[];
  loading: boolean;
}

const ResourcesContext = createContext<ResourcesContextType | null>(null);

export function ResourcesProvider({ children }: { children: ReactNode }) {
  const { selectedEventId } = useEvents();
  const [mobileUnits, setMobileUnits] = useState<MobileUnit[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!selectedEventId) {
      setMobileUnits([]);
      setLocations([]);
      setIncidents([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const unitsQuery = query(
      collection(db, "events", selectedEventId, "mobileUnits"),
      orderBy("name", "asc")
    );

    const locationsQuery = query(
      collection(db, "events", selectedEventId, "locations"),
      orderBy("name", "asc")
    );

    const incidentsQuery = query(
      collection(db, "incidents"),
      where("eventId", "==", selectedEventId),
      where("status", "!=", "Resolved")
    );

    const unsubscribeUnits = onSnapshot(unitsQuery, (snapshot) => {
      const items = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as MobileUnit[];
      setMobileUnits(items);
    });

    const unsubscribeLocations = onSnapshot(locationsQuery, (snapshot) => {
      const items = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Location[];
      setLocations(items);
    });

    const unsubscribeIncidents = onSnapshot(incidentsQuery, (snapshot) => {
      const items = snapshot.docs.map((doc) => ({
        id: doc.id,
        mobileUnits: doc.data().mobileUnits || [],
        status: doc.data().status,
        incidentNumber: doc.data().incidentNumber,
      })) as Incident[];
      setIncidents(items);
      setLoading(false);
    });

    return () => {
      unsubscribeUnits();
      unsubscribeLocations();
      unsubscribeIncidents();
    };
  }, [selectedEventId]);

  return (
    <ResourcesContext.Provider value={{ mobileUnits, locations, incidents, loading }}>
      {children}
    </ResourcesContext.Provider>
  );
}

export function useResources() {
  const context = useContext(ResourcesContext);
  if (!context) {
    throw new Error("useResources must be used within a ResourcesProvider");
  }
  return context;
}