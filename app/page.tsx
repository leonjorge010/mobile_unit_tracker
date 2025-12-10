"use client";

import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

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

  // Not signed in - show landing page
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-100">
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
            <h1 className="text-xl font-bold">Mobile Unit Tracker</h1>
            <Button onClick={() => router.push("/login")}>Sign In</Button>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 py-16 text-center">
          <h2 className="text-4xl font-bold mb-4">Track Your Mobile Units</h2>
          <p className="text-gray-600 mb-8 max-w-md mx-auto">
            Monitor and manage your mobile units in real-time with our easy-to-use tracking system.
          </p>
          <Button size="lg" onClick={() => router.push("/login")}>
            Get Started
          </Button>
        </main>
      </div>
    );
  }

  // Signed in - show dashboard
  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold">Mobile Unit Tracker</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">{user.email}</span>
            <Button variant="outline" onClick={logout}>
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <p>Welcome! You are signed in.</p>
        {/* Your tracker app will go here */}
      </main>
    </div>
  );
}