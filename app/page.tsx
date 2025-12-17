"use client";

import { useAuth } from "@/lib/auth-context";
import { AppHeader } from "@/components/app-header";
import { LandingPage } from "@/components/landing-page";
import { UnitStatus } from "@/components/dashboard/unit-status";
import { IncidentForm } from "@/components/dashboard/incident-form";
import { IncidentList } from "@/components/dashboard/incident-list";

export default function Home() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) {
    return <LandingPage />;
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