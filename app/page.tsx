"use client";

import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { AppHeader } from "@/components/app-header";
import { UnitStatus } from "@/components/dashboard/unit-status";
import { IncidentForm } from "@/components/dashboard/incident-form";
import { IncidentList } from "@/components/dashboard/incident-list";

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="h-screen bg-background">
        <AppHeader />
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
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      <AppHeader />
      <main className="flex-1 min-h-0 p-4 flex flex-col gap-4">
        <div className="flex flex-col lg:flex-row gap-4 flex-shrink-0">
          <UnitStatus className="h-[300px] w-full lg:w-1/3" />
          <div className="w-full lg:w-2/3">
            <IncidentForm />
          </div>
        </div>
        <IncidentList />
      </main>
    </div>
  );
}