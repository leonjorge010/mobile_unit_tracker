"use client";

import { useState, useEffect } from "react";
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

export function useEvents() {
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Load selected event from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("selectedEventId");
    if (stored) {
      setSelectedEventId(stored);
    }
  }, []);

  // Fetch active events
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

  return {
    events,
    selectedEvent,
    selectedEventId,
    selectEvent,
    loading,
  };
}