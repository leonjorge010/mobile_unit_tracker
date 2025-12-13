"use client";

import { useState, useEffect } from "react";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";

interface Event {
  id: string;
  name: string;
  active: boolean;
  createdAt: Date;
}

export default function AdminPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [newEventName, setNewEventName] = useState("");
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    const q = query(collection(db, "events"), orderBy("createdAt", "desc"));

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

  const handleAddEvent = async () => {
    if (!newEventName.trim()) return;
    setAdding(true);
    try {
      await addDoc(collection(db, "events"), {
        name: newEventName.trim(),
        active: true,
        createdAt: serverTimestamp(),
      });
      setNewEventName("");
    } catch (error) {
      console.error("Error adding event:", error);
    } finally {
      setAdding(false);
    }
  };

  const handleToggleEvent = async (id: string, currentActive: boolean) => {
    try {
      await updateDoc(doc(db, "events", id), { active: !currentActive });
    } catch (error) {
      console.error("Error toggling event:", error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddEvent();
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Admin</h1>
        <p className="text-muted-foreground">Manage events and settings</p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Events</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={newEventName}
              onChange={(e) => setNewEventName(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Add new event..."
              disabled={adding}
            />
            <Button onClick={handleAddEvent} disabled={adding || !newEventName.trim()}>
              Add
            </Button>
          </div>

          <div className="space-y-2">
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : events.length === 0 ? (
              <p className="text-sm text-muted-foreground">No events yet</p>
            ) : (
              events.map((event) => (
                <div
                  key={event.id}
                  className={`flex items-center justify-between p-3 rounded-md border ${
                    event.active ? "bg-background" : "bg-muted opacity-60"
                  }`}
                >
                  <span className={event.active ? "" : "line-through"}>
                    {event.name}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {event.active ? "Active" : "Inactive"}
                    </span>
                    <Switch
                      checked={event.active}
                      onCheckedChange={() => handleToggleEvent(event.id, event.active)}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}