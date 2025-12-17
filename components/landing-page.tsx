"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Radio } from "lucide-react";

export function LandingPage() {
  const router = useRouter();

  return (
    <div className="h-screen flex flex-col lg:flex-row">
      {/* Left: Logo */}
      <div className="flex-1 flex items-center justify-center bg-black p-8">
        <Radio className="h-32 w-32 sm:h-48 sm:w-48 lg:h-64 lg:w-64 text-primary-foreground" strokeWidth={1.5} />
      </div>

      {/* Right: Content */}
      <div className="flex-1 flex flex-col justify-center px-8 lg:px-16 py-12">
        <div className="max-w-md">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
            TOTEM
          </h1>
          
          <h2 className="text-2xl sm:text-3xl font-bold mb-8">
            Manage incidents in real-time.
          </h2>

          <div className="space-y-4">
            <Button 
              size="lg" 
              className="w-full"
              onClick={() => router.push("/login")}
            >
              Sign In
            </Button>
          </div>

          <p className="text-xs text-muted-foreground mt-8">
            Internal tool for event operations
          </p>
        </div>
      </div>
    </div>
  );
}