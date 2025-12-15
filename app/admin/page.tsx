"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
import { AdminHeader } from "@/components/admin-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Settings, Plus, Calendar } from "lucide-react";

interface Event {
  id: string;
  name: string;
  active: boolean;
  createdAt: Date;
}

export default function AdminPage() {
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [newEventName, setNewEventName] = useState("");
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

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
      setShowAddForm(false);
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
    if (e.key === "Escape") {
      setShowAddForm(false);
      setNewEventName("");
    }
  };

  const activeEvents = events.filter((e) => e.active);
  const inactiveEvents = events.filter((e) => !e.active);

  return (
    <div className="min-h-screen bg-background">
      <AdminHeader />

      <main className="container mx-auto px-6 py-8 space-y-8">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
            <p className="text-muted-foreground mt-1">Manage your events, units, and locations</p>
          </div>
          <Button onClick={() => setShowAddForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Event
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Events</CardDescription>
              <CardTitle className="text-3xl">{events.length}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Active Events</CardDescription>
              <CardTitle className="text-3xl text-green-600">{activeEvents.length}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Inactive Events</CardDescription>
              <CardTitle className="text-3xl text-muted-foreground">{inactiveEvents.length}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Add Event Form */}
        {showAddForm && (
          <Card className="border-dashed border-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Create New Event</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input
                  value={newEventName}
                  onChange={(e) => setNewEventName(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Event name..."
                  disabled={adding}
                  autoFocus
                />
                <Button onClick={handleAddEvent} disabled={adding || !newEventName.trim()}>
                  {adding ? "Adding..." : "Create"}
                </Button>
                <Button variant="ghost" onClick={() => { setShowAddForm(false); setNewEventName(""); }}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Events List */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Events
            </CardTitle>
            <CardDescription>Click "Manage" to configure units and locations for each event</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground py-4">Loading...</p>
            ) : events.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">No events yet. Create your first event to get started.</p>
                <Button onClick={() => setShowAddForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Event
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {events.map((event) => (
                  <div
                    key={event.id}
                    className={`flex items-center justify-between p-4 rounded-lg border transition-colors ${
                      event.active 
                        ? "bg-background hover:bg-muted/50" 
                        : "bg-muted/30 opacity-60"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`font-medium ${!event.active && "line-through"}`}>
                        {event.name}
                      </span>
                      <Badge variant={event.active ? "default" : "secondary"}>
                        {event.active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/admin/events/${event.id}`)}
                      >
                        <Settings className="h-4 w-4 mr-2" />
                        Manage
                      </Button>
                      <Switch
                        checked={event.active}
                        onCheckedChange={() => handleToggleEvent(event.id, event.active)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}