"use client";

import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { MapWrapper } from "@/components/dashboard/map-wrapper";
import { IncidentForm } from "@/components/dashboard/incident-form";
import { IncidentList } from "@/components/dashboard/incident-list";

export default function Home() {
  const { user, loading, logout } = useAuth();
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
            <span className="text-sm text-muted-foreground">{user.displayName || user.email}</span>
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