"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface Event {
  id: string;
  name: string;
  active: boolean;
}

interface EventsContextType {
  events: Event[];
  selectedEvent: Event | null;
  selectedEventId: string | null;
  selectEvent: (eventId: string) => void;
  loading: boolean;
}

const EventsContext = createContext<EventsContextType | null>(null);

export function EventsProvider({ children }: { children: ReactNode }) {
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("selectedEventId");
    if (stored) {
      setSelectedEventId(stored);
    }
  }, []);

  useEffect(() => {
    const q = query(
      collection(db, "events"),
      where("active", "==", true),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Event[];
      setEvents(items);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const selectEvent = (eventId: string) => {
    setSelectedEventId(eventId);
    localStorage.setItem("selectedEventId", eventId);
  };

  const selectedEvent = events.find((e) => e.id === selectedEventId) || null;

  return (
    <EventsContext.Provider
      value={{
        events,
        selectedEvent,
        selectedEventId,
        selectEvent,
        loading,
      }}
    >
      {children}
    </EventsContext.Provider>
  );
}

export function useEvents() {
  const context = useContext(EventsContext);
  if (!context) {
    throw new Error("useEvents must be used within an EventsProvider");
  }
  return context;
}