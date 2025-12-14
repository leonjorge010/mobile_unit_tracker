"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { useEvents } from "@/lib/events-context";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ThemeToggle } from "@/components/theme-toggle";
import { MapWrapper } from "@/components/dashboard/map-wrapper";
import { IncidentForm } from "@/components/dashboard/incident-form";
import { IncidentList } from "@/components/dashboard/incident-list";

export default function Home() {
  const { user, loading, logout } = useAuth();
  const { events, selectedEvent, selectEvent, loading: eventsLoading } = useEvents();
  const router = useRouter();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b">
          <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
            <h1 className="text-xl font-bold">TOTEM</h1>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Button onClick={() => router.push("/login")}>Sign In</Button>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 py-16 text-center">
          <h2 className="text-4xl font-bold mb-4">Track Your Mobile Units</h2>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">
            Monitor and manage your mobile units in real-time with our easy-to-use tracking system.
          </p>
          <Button size="lg" onClick={() => router.push("/login")}>
            Get Started
          </Button>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold">TOTEM</h1>
          <div className="flex items-center gap-4">
            <Select
              value={selectedEvent?.id || ""}
              onValueChange={selectEvent}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder={eventsLoading ? "Loading..." : "Select Event"} />
              </SelectTrigger>
              <SelectContent>
                {events.map((event) => (
                  <SelectItem key={event.id} value={event.id}>
                    {event.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-sm text-muted-foreground">{user.displayName || user.email}</span>
            <Link
              href="/admin"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Admin
            </Link>
            <ThemeToggle />
            <Button variant="outline" onClick={logout}>
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="p-4 space-y-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <MapWrapper className="h-[300px] w-full lg:w-1/3 rounded-lg overflow-hidden border" />
          <div className="w-full lg:w-2/3">
            <IncidentForm />
          </div>
        </div>

        <IncidentList />
      </main>
    </div>
  );
}